"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailDiscoveryNode = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
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
const INVALID_PATTERNS = [
    'example.com',
    'test.com',
    'sample.com',
    'domain.com',
    'email.com',
    'yoursite.com',
    'yourdomain.com',
    'sentry.io', // Error tracking
    'w3.org', // W3C examples
    'localhost',
    'noreply@',
    'no-reply@',
    'donotreply@',
    'mailer-daemon@'
];
/**
 * Fetches HTML content from a URL
 */
const fetchURL = (url) => {
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
const extractEmails = (html, sourceUrl) => {
    const emails = new Set();
    const matches = html.match(EMAIL_REGEX) || [];
    for (const email of matches) {
        const lowerEmail = email.toLowerCase();
        // Skip invalid patterns
        const isInvalid = INVALID_PATTERNS.some(pattern => lowerEmail.includes(pattern));
        if (isInvalid)
            continue;
        // Skip very long emails (likely not real)
        if (email.length > 100)
            continue;
        // Skip emails with multiple @ symbols
        if ((email.match(/@/g) || []).length !== 1)
            continue;
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
const searchForPages = async (keywords, industry) => {
    // For now, we'll use common contact page patterns
    // In production, integrate with search APIs
    const commonDomains = {
        'technology': [
            'https://techcrunch.com/contact/',
            'https://www.wired.com/about/contact/',
            'https://arstechnica.com/contact-us/'
        ],
        'education': [
            'https://www.edutopia.org/contact',
            'https://www.chronicle.com/page/contact-us'
        ],
        'business': [
            'https://www.forbes.com/fdc/contact.html',
            'https://www.inc.com/contact'
        ],
        'startup': [
            'https://www.ycombinator.com/contact',
            'https://techcrunch.com/contact/'
        ]
    };
    const urls = [];
    // Add industry-specific URLs
    if (industry && commonDomains[industry]) {
        urls.push(...commonDomains[industry]);
    }
    // Add keyword-based URLs
    for (const keyword of keywords) {
        if (commonDomains[keyword.toLowerCase()]) {
            urls.push(...commonDomains[keyword.toLowerCase()]);
        }
    }
    // Remove duplicates
    return Array.from(new Set(urls));
};
exports.emailDiscoveryNode = {
    id: 'email-discovery',
    type: 'EMAIL_DISCOVERY',
    name: 'Email Discovery Node',
    description: 'Discovers real business emails by scraping web pages based on URLs, keywords, and industry filters.',
    inputSchema: {
        type: 'object',
        properties: {
            urls: {
                type: 'array',
                items: { type: 'string' },
                description: 'Direct URLs to scrape for emails'
            },
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
    execute: async (input) => {
        try {
            console.log('[EmailDiscovery] Starting real email scraping...');
            const urls = input.urls || [];
            const keywords = input.keywords || [];
            const targetDomains = input.targetDomains;
            const industry = input.industry;
            const maxEmails = input.maxEmails || 50;
            const discoveredEmails = [];
            // Collect URLs to scrape
            let urlsToScrape = [...urls];
            // If keywords provided, search for relevant pages
            if (keywords.length > 0) {
                console.log(`[EmailDiscovery] Searching for pages with keywords: ${keywords.join(', ')}`);
                const searchUrls = await searchForPages(keywords, industry);
                urlsToScrape.push(...searchUrls);
            }
            // Remove duplicates
            urlsToScrape = Array.from(new Set(urlsToScrape));
            if (urlsToScrape.length === 0) {
                console.log('[EmailDiscovery] No URLs to scrape. Please provide URLs or keywords.');
                return {
                    status: 'success',
                    data: {
                        emails: [],
                        message: 'No URLs to scrape. Please provide direct URLs or keywords.'
                    }
                };
            }
            console.log(`[EmailDiscovery] Scraping ${urlsToScrape.length} URLs...`);
            // Scrape each URL
            for (const url of urlsToScrape) {
                try {
                    console.log(`[EmailDiscovery] Fetching: ${url}`);
                    const html = await fetchURL(url);
                    const emails = extractEmails(html, url);
                    console.log(`[EmailDiscovery] Found ${emails.length} emails from ${url}`);
                    // Add matched keyword if available
                    for (const emailData of emails) {
                        const matchedKeyword = keywords.find((k) => html.toLowerCase().includes(k.toLowerCase()));
                        discoveredEmails.push({
                            ...emailData,
                            matched_keyword: matchedKeyword || 'direct_url'
                        });
                    }
                }
                catch (error) {
                    console.error(`[EmailDiscovery] Failed to scrape ${url}: ${error.message}`);
                    // Continue with other URLs
                }
            }
            // Filter by target domains if specified
            let filteredEmails = discoveredEmails;
            if (targetDomains && targetDomains.length > 0) {
                filteredEmails = discoveredEmails.filter(item => targetDomains.some(domain => item.email.includes(domain)));
                console.log(`[EmailDiscovery] Filtered to ${filteredEmails.length} emails matching target domains`);
            }
            // Deduplicate by email address
            const uniqueEmails = Array.from(new Map(filteredEmails.map(item => [item.email, item])).values());
            // Limit results
            const limitedEmails = uniqueEmails.slice(0, maxEmails);
            console.log(`[EmailDiscovery] Discovered ${limitedEmails.length} unique valid emails`);
            return {
                status: 'success',
                data: {
                    emails: limitedEmails,
                    totalScraped: discoveredEmails.length,
                    uniqueCount: uniqueEmails.length,
                    returnedCount: limitedEmails.length
                }
            };
        }
        catch (error) {
            console.error('[EmailDiscovery] Error:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
