import * as fs from 'fs';
import * as path from 'path';

/**
 * Test All Analysis Workflows via API
 * Sends each CSV dataset through: csvRead → dataCleaner → analysisEngine → mongoDbStorage → dashboardPortal
 * 
 * Prerequisites: Backend must be running on port 5000 (npm run dev)
 */

const API_URL = 'http://localhost:5000/api/workflows/execute';

interface WorkflowTest {
    name: string;
    csvFile: string;
    categories: string[];
}

const tests: WorkflowTest[] = [
    { name: 'Sales Analytics', csvFile: 'sales-data.csv', categories: ['Sales'] },
    { name: 'Task Management', csvFile: 'tasks-data.csv', categories: ['Tasks'] },
    { name: 'Attendance Tracking', csvFile: 'attendance-data.csv', categories: ['Attendance'] },
    { name: 'Expense Analysis', csvFile: 'expenses-data.csv', categories: ['Expenses'] },
];

function buildWorkflowPayload(csvData: string, categories: string[]) {
    return {
        nodes: [
            {
                id: 'csv-1',
                type: 'csvRead',
                input: { csvData, delimiter: ',' }
            },
            {
                id: 'cleaner-1',
                type: 'dataCleaner',
                input: {}              // rows come from csvRead output via pipeline merge
            },
            {
                id: 'analysis-1',
                type: 'analysisEngine',
                input: { categories }   // rows come from dataCleaner output via pipeline merge
            },
            {
                id: 'storage-1',
                type: 'mongoDbStorage',
                input: {}              // allResults, summaryStats, chartData come from analysisEngine via merge
            },
            {
                id: 'dashboard-1',
                type: 'dashboardPortal',
                input: {}              // datasetId, category come from upstream merge
            }
        ],
        edges: [
            { source: 'csv-1', target: 'cleaner-1' },
            { source: 'cleaner-1', target: 'analysis-1' },
            { source: 'analysis-1', target: 'storage-1' },
            { source: 'storage-1', target: 'dashboard-1' }
        ]
    };
}

async function runTest(test: WorkflowTest) {
    const csvPath = path.join(__dirname, '..', 'test-data', test.csvFile);
    const csvData = fs.readFileSync(csvPath, 'utf-8');

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${test.name.toUpperCase()}`);
    console.log(`  File: ${test.csvFile} | Categories: ${test.categories.join(', ')}`);
    console.log(`${'═'.repeat(60)}`);

    const payload = buildWorkflowPayload(csvData, test.categories);

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
        console.log(`  ❌ FAILED (HTTP ${response.status})`);
        console.log(`  Error: ${result.error || JSON.stringify(result)}`);
        return false;
    }

    // Parse results
    const nodeResults = result.results || [];
    for (const nr of nodeResults) {
        const icon = nr.result?.status === 'success' ? '✅' : '❌';
        const nodeType = nr.nodeType;
        let detail = '';

        if (nodeType === 'csvRead' && nr.result?.data) {
            detail = `${nr.result.data.totalRows} rows parsed`;
        } else if (nodeType === 'dataCleaner' && nr.result?.data) {
            const report = nr.result.data.cleaningReport;
            detail = report
                ? `${report.originalCount}→${report.cleanedCount} rows (removed ${report.removedCount})`
                : `${nr.result.data.rows?.length || '?'} clean rows`;
        } else if (nodeType === 'analysisEngine' && nr.result?.data) {
            detail = `category=${nr.result.data.category}, stats=${Object.keys(nr.result.data.summaryStats || {}).length} metrics`;
        } else if (nodeType === 'mongoDbStorage' && nr.result?.data) {
            detail = nr.result.data.message || `docId=${nr.result.data.documentId}`;
        } else if (nodeType === 'dashboardPortal' && nr.result?.data) {
            detail = `url=${nr.result.data.dashboardUrl || 'generated'}`;
        }

        console.log(`  ${icon} ${nodeType}: ${detail}`);
    }

    return true;
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     ANALYSIS WORKFLOW TEST — ALL 4 CATEGORIES            ║');
    console.log('║  csvRead → dataCleaner → analysisEngine → mongoDB → dash ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const ok = await runTest(test);
            ok ? passed++ : failed++;
        } catch (err: any) {
            console.log(`\n  ❌ ${test.name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed out of ${tests.length}`);
    console.log(`${'─'.repeat(60)}`);

    process.exit(failed > 0 ? 1 : 0);
}

main();
