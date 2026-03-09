import * as fs from 'fs';
import csvParser from 'csv-parser';

export interface PersonalizationVariables {
    [key: string]: string;
}

export interface PersonalizationData {
    email: string;
    variables: PersonalizationVariables;
}

class TemplateEngine {
    /**
     * Replace {{variable}} placeholders in template
     */
    personalize(template: string, variables: PersonalizationVariables): string {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }

        // Remove any remaining placeholders
        result = result.replace(/{{.*?}}/g, '');

        return result;
    }

    /**
     * Parse CSV file and return personalization data
     */
    async parseCSV(filePath: string): Promise<PersonalizationData[]> {
        return new Promise((resolve, reject) => {
            const results: PersonalizationData[] = [];

            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row: any) => {
                    const { email, ...variables } = row;

                    if (email) {
                        results.push({
                            email,
                            variables,
                        });
                    }
                })
                .on('end', () => {
                    console.log(`[TemplateEngine] Parsed ${results.length} records from CSV`);
                    resolve(results);
                })
                .on('error', (error: any) => {
                    console.error('[TemplateEngine] Error parsing CSV:', error);
                    reject(error);
                });
        });
    }
}

export const templateEngine = new TemplateEngine();
