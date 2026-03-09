import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';

interface DataCleanerConfig {
    rows: any[];
    removeEmptyRows?: boolean;
    fillMissingValuesWith?: string;
    trimStrings?: boolean;
    convertToNumbers?: boolean;
    normalizeCase?: boolean;
    normalizeDates?: boolean;
    removeOutliers?: boolean;
    outlierThreshold?: number; // std deviations (default: 3)
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

/** Title-case a string: "MARKETING" → "Marketing", "cloud infrastructure" → "Cloud Infrastructure" */
function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/** Detect if a column name looks like a text/label field (not numeric, not a date, not an ID) */
function isTextField(key: string): boolean {
    return /name|employee|department|category|merchant|method|status|type|region|city|owner|assignee|priority|project|sprint|label|team|division|vendor|supplier|store/i.test(key);
}

/**
 * Attempt to parse and normalize date strings into YYYY-MM-DD.
 * Handles: MM/DD/YYYY, DD-MM-YYYY, YYYY/MM/DD, epoch numbers, ISO strings
 */
function normalizeDate(value: string): string {
    // Already YYYY-MM-DD  
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value;

    // MM/DD/YYYY  e.g. 01/25/2026
    let m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;

    // DD-MM-YYYY  e.g. 25-01-2026
    m = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;

    // YYYY/MM/DD  e.g. 2026/01/25
    m = value.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;

    // Try native Date parse as last resort
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(0, 10);
    }

    return value; // return unchanged if we can't parse
}

/** Detect if a column is a date field by its key name */
function isDateField(key: string): boolean {
    return /date|time|day|month|created|updated|due|deadline/i.test(key);
}

/**
 * Outlier detection using Z-score (standard deviations from mean).
 * Returns a Set of row indices to remove.
 */
function detectOutlierIndices(rows: any[], threshold: number): Set<number> {
    // Find all numeric columns
    const numericCols: Record<string, number[]> = {};

    for (const row of rows) {
        for (const [key, val] of Object.entries(row)) {
            if (typeof val === 'number' && !isNaN(val) && val > 0) {
                if (!numericCols[key]) numericCols[key] = [];
                numericCols[key].push(val);
            }
        }
    }

    const outlierIndices = new Set<number>();

    for (const [col, values] of Object.entries(numericCols)) {
        if (values.length < 4) continue; // need enough data to compute stats

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) continue; // all same value, no outliers

        rows.forEach((row, idx) => {
            const val = row[col];
            if (typeof val === 'number' && !isNaN(val)) {
                const zScore = Math.abs((val - mean) / stdDev);
                if (zScore > threshold) {
                    outlierIndices.add(idx);
                }
            }
        });
    }

    return outlierIndices;
}

// ── NODE ─────────────────────────────────────────────────────────────────────

export const dataCleanerNode: WorkflowNode = {
    id: 'dataCleaner',
    type: 'dataCleaner',
    name: 'Data Cleaner',
    description: 'Cleans and standardizes tabular data — removes blanks, normalizes case, dates & outliers',
    inputSchema: {
        type: 'object',
        properties: {
            rows: { type: 'array', description: 'Array of data objects to clean' }
        },
        required: ['rows']
    },
    outputSchema: {
        type: 'object',
        properties: {
            rows: { type: 'array' }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            const config = {
                removeEmptyRows: true,
                trimStrings: true,
                convertToNumbers: true,
                normalizeCase: true,       // NEW: title-case text fields
                normalizeDates: true,       // NEW: standardize date formats
                removeOutliers: true,       // NEW: Z-score outlier removal
                outlierThreshold: 3,        // NEW: 3 std deviations default
                ...input
            } as DataCleanerConfig;

            if (!config.rows || !Array.isArray(config.rows)) {
                return { status: 'error', error: 'Input must contain a "rows" array.' };
            }

            const originalCount = config.rows.length;
            let cleanedRows = [...config.rows];

            // ── STEP 1: Remove entirely empty rows ──────────────────────────
            if (config.removeEmptyRows) {
                cleanedRows = cleanedRows.filter(row =>
                    Object.values(row).some(val =>
                        val !== null && val !== undefined && String(val).trim() !== ''
                    )
                );
            }

            // ── STEP 2: Per-field cleaning ───────────────────────────────────
            cleanedRows = cleanedRows.map(row => {
                const cleanedRow: any = {};

                for (const [key, value] of Object.entries(row)) {
                    const cleanedKey = config.trimStrings ? key.trim() : key;
                    let cleanedValue: any = value;

                    if (typeof cleanedValue === 'string') {
                        // Trim whitespace
                        if (config.trimStrings) {
                            cleanedValue = cleanedValue.trim();
                        }

                        // Normalize date fields
                        if (config.normalizeDates && isDateField(cleanedKey) && cleanedValue !== '') {
                            cleanedValue = normalizeDate(cleanedValue);
                        }

                        // Convert to number if numeric-looking
                        if (
                            config.convertToNumbers &&
                            cleanedValue !== '' &&
                            !isDateField(cleanedKey) &&
                            !isNaN(Number(cleanedValue))
                        ) {
                            cleanedValue = Number(cleanedValue);
                        }

                        // Title-case categorical/text fields (after numeric check so numbers aren't cased)
                        if (
                            config.normalizeCase &&
                            typeof cleanedValue === 'string' &&
                            cleanedValue !== '' &&
                            isTextField(cleanedKey)
                        ) {
                            cleanedValue = toTitleCase(cleanedValue);
                        }
                    }

                    // Fill missing values
                    const isEmpty =
                        cleanedValue === undefined ||
                        cleanedValue === null ||
                        (typeof cleanedValue === 'string' && cleanedValue.trim() === '');

                    if (isEmpty && config.fillMissingValuesWith !== undefined) {
                        cleanedValue = config.fillMissingValuesWith;
                    }

                    cleanedRow[cleanedKey] = cleanedValue;
                }

                return cleanedRow;
            });

            // ── STEP 3: Z-score outlier removal ─────────────────────────────
            let outlierCount = 0;
            let outlierDetails: string[] = [];

            if (config.removeOutliers) {
                const threshold = config.outlierThreshold ?? 3;
                const outlierIndices = detectOutlierIndices(cleanedRows, threshold);
                outlierCount = outlierIndices.size;

                if (outlierCount > 0) {
                    outlierDetails = [...outlierIndices].map(i => {
                        const row = cleanedRows[i];
                        const idKey = Object.keys(row).find(k => /id|report|task/i.test(k));
                        return idKey ? `${row[idKey]}` : `row ${i + 1}`;
                    });
                }

                cleanedRows = cleanedRows.filter((_, idx) => !outlierIndices.has(idx));
            }

            const cleanedCount = cleanedRows.length;
            const removedCount = originalCount - cleanedCount;

            console.log(`[DataCleaner] ${originalCount} → ${cleanedCount} rows (removed ${removedCount}: ${outlierCount} outliers)`);

            return {
                status: 'success',
                data: {
                    rows: cleanedRows,
                    cleaningReport: {
                        originalCount,
                        cleanedCount,
                        removedEmpty: originalCount - (originalCount - (removedCount - outlierCount)) - outlierCount,
                        outlierCount,
                        outliersRemoved: outlierDetails,
                        operations: [
                            config.removeEmptyRows ? '✅ Empty rows removed' : null,
                            config.trimStrings ? '✅ Whitespace trimmed' : null,
                            config.convertToNumbers ? '✅ Strings converted to numbers' : null,
                            config.normalizeCase ? '✅ Text fields title-cased (MARKETING → Marketing)' : null,
                            config.normalizeDates ? '✅ Date formats normalized to YYYY-MM-DD' : null,
                            config.removeOutliers ? `✅ Outliers removed: ${outlierCount} rows (Z-score > ${config.outlierThreshold})` : null,
                        ].filter(Boolean)
                    }
                }
            };
        } catch (error: any) {
            console.error('[DataCleanerNode] Error:', error);
            return {
                status: 'error',
                error: error.message || 'Failed to clean data'
            };
        }
    }
};

export default dataCleanerNode;
