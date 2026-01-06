import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';

export const emailDiscoveryNode: WorkflowNode = {
    id: 'email-discovery',
    type: 'EMAIL_DISCOVERY',
    name: 'Email Discovery Node',
    description: 'Discovers business emails based on keywords and industry filters using simulated scraping.',
    inputSchema: {
        type: 'object',
        properties: {
            keywords: { type: 'array', items: { type: 'string' } },
            targetDomains: { type: 'array', items: { type: 'string' } },
            industry: { type: 'string', enum: ['education', 'business', 'technology', 'startup', 'ngo', 'corporate'] }
        },
        required: ['keywords']
    },
    outputSchema: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                source_url: { type: 'string' },
                matched_keyword: { type: 'string' },
                confidence_score: { type: 'number' }
            }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('Starting Email Discovery execution...');
            const { keywords, targetDomains, industry } = input;

            if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
                throw new Error('Keywords input is required and must be a non-empty array.');
            }

            // Filter out empty strings
            const validKeywords = keywords.filter(k => k && k.trim().length > 0);
            if (validKeywords.length === 0) {
                throw new Error('Keywords input must contain at least one valid keyword.');
            }

            // Simulation of intelligent scraping logic
            // Simulation of intelligent scraping logic
            console.log(`[EmailDiscovery] Searching for emails with keywords: ${validKeywords.join(', ')}`);
            if (targetDomains) console.log(`[EmailDiscovery] Targeting domains: ${targetDomains.join(', ')}`);
            if (industry) console.log(`[EmailDiscovery] Industry filter: ${industry}`);

            // Mock database of results to simulate "found" emails
            const mockResults = [
                { email: 'contact@techstartups.io', source: 'https://techstartups.io/contact', keyword: 'startup', industry: 'technology' },
                { email: 'admissions@university.edu', source: 'https://university.edu/about', keyword: 'education', industry: 'education' },
                { email: 'sales@enterprisocorp.com', source: 'https://enterprisocorp.com/sales', keyword: 'business', industry: 'corporate' },
                { email: 'info@greenngo.org', source: 'https://greenngo.org/connect', keyword: 'ngo', industry: 'ngo' },
                { email: 'support@edutech.net', source: 'https://edutech.net/support', keyword: 'technology', industry: 'education' }
            ];

            const discoveredEmails = [];

            for (const keyword of validKeywords) {
                // Find matches in our mock data that vaguely align with the request
                const matches = mockResults.filter(r =>
                    (r.keyword === keyword || r.industry === industry) &&
                    (!targetDomains || targetDomains.some((d: string) => r.source.includes(d)))
                );

                for (const match of matches) {
                    discoveredEmails.push({
                        email: match.email,
                        source_url: match.source,
                        matched_keyword: keyword,
                        confidence_score: 0.95 // High confidence for "verified" sources
                    });
                }
            }

            // Deduplicate results
            const uniqueEmails = Array.from(new Map(discoveredEmails.map(item => [item.email, item])).values());

            // If no mock data found, generate a synthetic one for testing flow
            if (uniqueEmails.length === 0) {
                const safeKeyword = validKeywords[0].replace(/[^a-zA-Z0-9]/g, '') || 'demo';
                console.log(`[EmailDiscovery] No specific matches found. Generating synthetic result for keyword: ${safeKeyword}`);
                uniqueEmails.push({
                    email: `info@${safeKeyword}.com`,
                    source_url: `https://www.${safeKeyword}.com/contact`,
                    matched_keyword: validKeywords[0],
                    confidence_score: 0.75
                });
            }


            console.log(`Discovered ${uniqueEmails.length} unique emails.`);

            return {
                status: 'success',
                data: { emails: uniqueEmails }
            };

        } catch (error: any) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
