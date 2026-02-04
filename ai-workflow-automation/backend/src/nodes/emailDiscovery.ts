import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as https from 'https';
import * as http from 'http';
import { DiscoveredEmail } from '../models/DiscoveredEmail.model';

/**
 * Email Discovery Node - Scrapes real email addresses from web pages
 * 
 * This node can:
 * 1. Scrape emails from specific URLs
 * 2. Search for emails based on keywords (using search engines)
 * 3. Filter by domain and industry
 */

// Email regex pattern - matches most valid email formats
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

// Common email patterns to avoid (spam traps, examples, etc.)
// Note: Gmail, Yahoo, Outlook etc. are VALID and should NOT be filtered
const INVALID_PATTERNS = [
    'example.com',
    'test.com',
    'sample.com',
    'domain.com',
    'yoursite.com',
    'yourdomain.com',
    'sentry.io', // Error tracking
    'localhost',
    'noreply@',
    'no-reply@',
    'donotreply@',
    'mailer-daemon@',
    'postmaster@'
];

/**
 * Fetches HTML content from a URL
 */
const fetchURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => resolve(data));
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
};

/**
 * Extracts valid email addresses from HTML content
 */
const extractEmails = (html: string, sourceUrl: string): Array<{ email: string, source_url: string, confidence_score: number }> => {
    const emails: Set<string> = new Set();
    const matches = html.match(EMAIL_REGEX) || [];

    for (const email of matches) {
        const lowerEmail = email.toLowerCase();

        // Skip invalid patterns
        const isInvalid = INVALID_PATTERNS.some(pattern => lowerEmail.includes(pattern));
        if (isInvalid) continue;

        // Skip very long emails (likely not real)
        if (email.length > 100) continue;

        // Skip emails with multiple @ symbols
        if ((email.match(/@/g) || []).length !== 1) continue;

        emails.add(lowerEmail);
    }

    return Array.from(emails).map(email => ({
        email,
        source_url: sourceUrl,
        confidence_score: 0.85
    }));
};

/**
 * Searches for pages related to keywords (simplified version)
 * In production, you'd integrate with Google Custom Search API or similar
 */
const searchForPages = async (keywords: string[], industry?: string): Promise<string[]> => {
    // Updated with working URLs that have publicly accessible contact information
    const commonDomains: Record<string, string[]> = {
        'technology': [
            'https://www.github.com/contact',
            'https://about.gitlab.com/company/contact/',
            'https://www.mozilla.org/en-US/contact/'
        ],
        'education': [
            'https://www.khanacademy.org/about/contact',
            'https://www.coursera.org/about/contact',
            'https://www.edx.org/contact-us'
        ],
        'business': [
            'https://www.shopify.com/contact',
            'https://stripe.com/contact',
            'https://www.salesforce.com/company/contact-us/'
        ],
        'startup': [
            'https://www.producthunt.com/contact',
            'https://angel.co/help/contact'
        ],
        'opensource': [
            'https://www.apache.org/foundation/contact.html',
            'https://www.linuxfoundation.org/about/contact'
        ],
        'default': [
            // Fallback URLs with public contact pages
            'https://www.w3.org/Consortium/contact',
            'https://www.ietf.org/contact/'
        ]
    };

    const urls: string[] = [];

    // Add industry-specific URLs
    if (industry && commonDomains[industry]) {
        urls.push(...commonDomains[industry]);
    }

    // Add keyword-based URLs
    for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (commonDomains[lowerKeyword]) {
            urls.push(...commonDomains[lowerKeyword]);
        }
    }

    // If no URLs found, add default fallback URLs
    if (urls.length === 0 && commonDomains['default']) {
        urls.push(...commonDomains['default']);
    }

    // Remove duplicates
    return Array.from(new Set(urls));
};

export const emailDiscoveryNode: WorkflowNode = {
    id: 'email-discovery',
    type: 'EMAIL_DISCOVERY',
    name: 'Email Discovery Node',
    description: 'Discovers real business emails by scraping web pages based on URLs, keywords, and industry filters.',
    inputSchema: {
        type: 'object',
        properties: {
            keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords to search for relevant pages'
            },
            targetDomains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter results to specific domains'
            },
            industry: {
                type: 'string',
                enum: ['education', 'business', 'technology', 'startup', 'ngo', 'corporate'],
                description: 'Industry filter for targeted scraping'
            },
            maxEmails: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 50)'
            }
        },
        required: []
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
            console.log('[EmailDiscovery] Starting keyword-based email discovery...');
            console.log('[EmailDiscovery] Input received:', JSON.stringify(input, null, 2));

            const keywords = (input.keywords as string[] | undefined) || [];
            const targetDomains = input.targetDomains as string[] | undefined;
            const industry = input.industry as string | undefined;
            const maxEmails = (input.maxEmails as number | undefined) || 50;

            const discoveredEmails: Array<{
                email: string;
                source_url: string;
                matched_keyword?: string;
                confidence_score: number;
            }> = [];

            // Check if we have keywords or industry
            if (keywords.length === 0 && !industry) {
                console.log('[EmailDiscovery] No keywords or industry provided.');
                return {
                    status: 'success',
                    data: {
                        emails: [],
                        message: 'Please provide keywords or select an industry to discover emails.'
                    }
                };
            }

            // Search for relevant pages based on keywords/industry
            console.log(`[EmailDiscovery] Searching for pages with keywords: ${keywords.join(', ')}, industry: ${industry || 'none'}`);
            const urlsToScrape = await searchForPages(keywords, industry);

            if (urlsToScrape.length === 0) {
                console.log('[EmailDiscovery] No pages found to scrape.');
                return {
                    status: 'success',
                    data: {
                        emails: [],
                        message: 'No relevant pages found for the given keywords/industry.'
                    }
                };
            }

            console.log(`[EmailDiscovery] Scraping ${urlsToScrape.length} pages...`);

            // Scrape each URL with error handling
            let successfulScrapes = 0;
            let failedScrapes = 0;

            for (const url of urlsToScrape) {
                try {
                    console.log(`[EmailDiscovery] Fetching: ${url}`);
                    const html = await fetchURL(url);
                    const emails = extractEmails(html, url);

                    if (emails.length > 0) {
                        console.log(`[EmailDiscovery] ✓ Found ${emails.length} emails from ${url}`);
                        successfulScrapes++;

                        // Add matched keyword if available
                        for (const emailData of emails) {
                            const matchedKeyword = keywords.find((k: string) =>
                                html.toLowerCase().includes(k.toLowerCase())
                            );

                            discoveredEmails.push({
                                ...emailData,
                                matched_keyword: matchedKeyword || industry || 'industry_search'
                            });
                        }
                    } else {
                        console.log(`[EmailDiscovery] ⚠ No emails found on ${url}`);
                    }
                } catch (error: any) {
                    failedScrapes++;
                    console.error(`[EmailDiscovery] ✗ Failed to scrape ${url}: ${error.message}`);
                    // Continue with other URLs
                }
            }

            console.log(`[EmailDiscovery] Scraping complete: ${successfulScrapes} successful, ${failedScrapes} failed`);

            // Filter by target domains if specified
            let filteredEmails = discoveredEmails;
            if (targetDomains && targetDomains.length > 0) {
                filteredEmails = discoveredEmails.filter(item =>
                    targetDomains.some(domain => item.email.includes(domain))
                );
                console.log(`[EmailDiscovery] Filtered to ${filteredEmails.length} emails matching target domains`);
            }

            // Deduplicate by email address
            const uniqueEmails = Array.from(
                new Map(filteredEmails.map(item => [item.email, item])).values()
            );

            // Limit results
            const limitedEmails = uniqueEmails.slice(0, maxEmails);

            console.log(`[EmailDiscovery] Discovered ${limitedEmails.length} unique valid emails`);

            // Save discovered emails to MongoDB
            try {
                const savedEmails = await Promise.all(
                    limitedEmails.map(async (emailData) => {
                        const discoveredEmail = new DiscoveredEmail({
                            email: emailData.email,
                            source_url: emailData.source_url,
                            matched_keyword: emailData.matched_keyword,
                            industry: industry,
                            confidence_score: emailData.confidence_score,
                            status: 'pending'
                        });
                        return await discoveredEmail.save();
                    })
                );
                console.log(`[EmailDiscovery] Saved ${savedEmails.length} emails to database`);
            } catch (dbError: any) {
                console.error('[EmailDiscovery] Failed to save to database:', dbError.message);
                // Continue execution even if database save fails
            }

            return {
                status: 'success',
                data: {
                    emails: limitedEmails,
                    totalScraped: discoveredEmails.length,
                    uniqueCount: uniqueEmails.length,
                    returnedCount: limitedEmails.length
                }
            };

        } catch (error: any) {
            console.error('[EmailDiscovery] Error:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
