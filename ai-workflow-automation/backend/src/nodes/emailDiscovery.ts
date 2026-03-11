import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as https from 'https';
import * as http from 'http';
import { DiscoveredEmail } from '../models/DiscoveredEmail.model';
import { URL } from 'url';

/**
 * Email Discovery Node - Scrapes real email addresses from web pages
 * 
 * This node can:
 * 1. Scrape emails from specific user-provided URLs
 * 2. Search for emails via DuckDuckGo HTML search (free, no API key)
 * 3. Filter by domain and industry
 * 4. Validate emails and score confidence dynamically
 * 5. Respect robots.txt and rate-limit requests
 */

// ─── Email Regex ───────────────────────────────────────────────────────────────
// Matches most valid email formats in HTML content
const EMAIL_REGEX = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// ─── Invalid Patterns ──────────────────────────────────────────────────────────
// Common email patterns to skip (spam traps, placeholders, generated strings)
const INVALID_PATTERNS = [
    'example.com',
    'test.com',
    'sample.com',
    'domain.com',
    'yoursite.com',
    'yourdomain.com',
    'sentry.io',
    'localhost',
    'noreply@',
    'no-reply@',
    'donotreply@',
    'mailer-daemon@',
    'postmaster@',
    'wixpress.com',
    'sentry-next.wixpress.com',
];

// ─── False-Positive Patterns ───────────────────────────────────────────────────
// Regex patterns that look like emails but aren't real addresses
const FALSE_POSITIVE_PATTERNS = [
    /^\d+@\d+/,                     // 123@456 — numeric garbage
    /^[a-f0-9]{32,}@/i,            // MD5 hash before @
    /@\d+x\./i,                     // photo@2x.png
    /^(style|font|image|icon|bg|background|color|border|padding|margin|width|height|display|align|valign)@/i,
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|map)$/i,  // file extensions
    /^[0-9.]+@[0-9.]+$/,           // all numeric like version@1.0
    /^(null|undefined|true|false|none|nan)@/i,
    /^.{0,2}@/,                    // single/two char local part (unlikely real)
];

// ─── Valid TLDs ────────────────────────────────────────────────────────────────
const VALID_TLDS = new Set([
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'io', 'co', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'in', 'jp',
    'info', 'biz', 'name', 'mobi', 'pro', 'aero', 'coop', 'museum',
    'travel', 'jobs', 'tel', 'asia', 'cat', 'post',
    'ai', 'app', 'dev', 'tech', 'xyz', 'online', 'site', 'store',
    'cloud', 'digital', 'agency', 'studio', 'design', 'media',
    'email', 'group', 'team', 'work', 'company', 'business',
    'ac', 'ad', 'ae', 'af', 'ag', 'al', 'am', 'ao', 'aq', 'ar', 'as', 'at',
    'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj',
    'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bw', 'by', 'bz', 'cc', 'cd', 'cf',
    'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'cr', 'cu', 'cv', 'cw', 'cx',
    'cy', 'cz', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg', 'er', 'es',
    'et', 'eu', 'fi', 'fj', 'fk', 'fm', 'fo', 'ga', 'gd', 'ge', 'gf', 'gg',
    'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw',
    'gy', 'hk', 'hm', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'iq',
    'ir', 'is', 'it', 'je', 'jm', 'jo', 'ke', 'kg', 'kh', 'ki', 'km', 'kn',
    'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls',
    'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mg', 'mh', 'mk', 'ml',
    'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mx',
    'my', 'mz', 'na', 'nc', 'ne', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr',
    'nu', 'nz', 'om', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn',
    'pr', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'ru', 'rw', 'sa',
    'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn',
    'so', 'sr', 'ss', 'st', 'su', 'sv', 'sx', 'sy', 'sz', 'tc', 'td', 'tf',
    'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tr', 'tt', 'tv', 'tw',
    'tz', 'ua', 'ug', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu',
    'wf', 'ws', 'ye', 'yt', 'za', 'zm', 'zw',
]);

// ─── Sub-pages to crawl (only the 4 highest-yield ones) ─────────────────────
const CONTACT_SUBPAGES = [
    '/contact', '/contact-us', '/about', '/team',
];

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const RATE_LIMIT_MS = 800; // 0.8s between requests
const REQUEST_TIMEOUT_MS = 10000; // 10s timeout (not 15)
const MAX_RETRIES = 1; // Only 1 retry (not 2) — sub-pages shouldn't burn time
const MAX_REDIRECTS = 5;
const MAX_URLS_TO_SCRAPE = 60; // Hard cap on total URLs to prevent runaway scraping

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── robots.txt Cache ──────────────────────────────────────────────────────────
const robotsTxtCache: Map<string, { allowed: boolean; checkedAt: number }> = new Map();
const ROBOTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a URL is allowed by the site's robots.txt
 */
const isAllowedByRobotsTxt = async (targetUrl: string): Promise<boolean> => {
    try {
        const parsed = new URL(targetUrl);
        const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
        const cacheKey = parsed.host;

        // Check cache first
        const cached = robotsTxtCache.get(cacheKey);
        if (cached && Date.now() - cached.checkedAt < ROBOTS_CACHE_TTL) {
            return cached.allowed;
        }

        const robotsTxt = await fetchURL(robotsUrl, false); // Don't check robots for robots.txt itself
        const lines = robotsTxt.toLowerCase().split('\n');

        let inUserAgentBlock = false;
        let isDisallowed = false;
        const path = parsed.pathname;

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (line.startsWith('user-agent:')) {
                const agent = line.split(':')[1]?.trim();
                inUserAgentBlock = agent === '*';
            } else if (inUserAgentBlock && line.startsWith('disallow:')) {
                const disallowedPath = line.split(':').slice(1).join(':').trim();
                if (disallowedPath === '/' || (disallowedPath && path.startsWith(disallowedPath))) {
                    isDisallowed = true;
                    break;
                }
            } else if (inUserAgentBlock && line.startsWith('allow:')) {
                const allowedPath = line.split(':').slice(1).join(':').trim();
                if (allowedPath && path.startsWith(allowedPath)) {
                    isDisallowed = false;
                }
            }
        }

        const allowed = !isDisallowed;
        robotsTxtCache.set(cacheKey, { allowed, checkedAt: Date.now() });
        return allowed;
    } catch {
        // If we can't fetch robots.txt, assume allowed
        robotsTxtCache.set(new URL(targetUrl).host, { allowed: true, checkedAt: Date.now() });
        return true;
    }
};

/**
 * Fetches HTML content from a URL with redirect following and retries
 */
const fetchURL = (url: string, checkRobots: boolean = true, redirectCount: number = 0): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        if (redirectCount > MAX_REDIRECTS) {
            reject(new Error(`Too many redirects (max ${MAX_REDIRECTS})`));
            return;
        }

        // Check robots.txt before scraping
        if (checkRobots) {
            const allowed = await isAllowedByRobotsTxt(url);
            if (!allowed) {
                reject(new Error(`Blocked by robots.txt: ${url}`));
                return;
            }
        }

        const client = url.startsWith('https') ? https : http;

        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: REQUEST_TIMEOUT_MS
        }, (response) => {
            // Follow redirects (301, 302, 303, 307, 308)
            if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
                const location = response.headers.location;
                if (location) {
                    const redirectUrl = location.startsWith('http') ? location : new URL(location, url).toString();
                    console.log(`[EmailDiscovery] ↪ Redirect ${response.statusCode}: ${url} → ${redirectUrl}`);
                    fetchURL(redirectUrl, checkRobots, redirectCount + 1).then(resolve).catch(reject);
                    return;
                }
            }

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
 * Fetch with retries and exponential backoff
 */
const fetchWithRetry = async (url: string, retries: number = MAX_RETRIES): Promise<string> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetchURL(url);
        } catch (error: any) {
            if (error.message?.includes('robots.txt')) {
                throw error; // Don't retry robots.txt blocks
            }
            // Don't retry 4xx errors — the page simply doesn't exist
            if (error.message?.match(/HTTP (4\d\d)/)) {
                throw error;
            }
            if (attempt === retries) throw error;
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s...
            console.log(`[EmailDiscovery] ⏳ Retry ${attempt + 1}/${retries} for ${url} in ${delay}ms`);
            await sleep(delay);
        }
    }
    throw new Error('Should not reach here');
};

/**
 * Validates whether a string is a real email address (not a false positive)
 */
const isValidEmail = (email: string): boolean => {
    const lower = email.toLowerCase();

    // Check against invalid domain patterns 
    if (INVALID_PATTERNS.some(p => lower.includes(p))) return false;

    // Must have exactly one @
    if ((email.match(/@/g) || []).length !== 1) return false;

    // Max length check
    if (email.length > 100 || email.length < 6) return false;

    // Check false-positive patterns
    if (FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(lower))) return false;

    // Validate TLD
    const tld = lower.split('.').pop();
    if (!tld || !VALID_TLDS.has(tld)) return false;

    // Local part must be at least 3 chars and contain at least one letter
    const localPart = lower.split('@')[0];
    if (localPart.length < 3) return false;
    if (!/[a-zA-Z]/.test(localPart)) return false;

    // Domain part must have at least one dot
    const domainPart = lower.split('@')[1];
    if (!domainPart || !domainPart.includes('.')) return false;

    return true;
};

/**
 * Calculate a dynamic confidence score based on context
 */
const calculateConfidence = (email: string, html: string, sourceUrl: string): number => {
    let score = 0.5; // base score

    const lower = email.toLowerCase();
    const lowerHtml = html.toLowerCase();

    // Boost: email found near "contact", "email", "reach", "mailto:" keywords
    const emailIndex = lowerHtml.indexOf(lower);
    if (emailIndex >= 0) {
        const surrounding = lowerHtml.substring(Math.max(0, emailIndex - 200), emailIndex + lower.length + 200);
        if (/contact|email|reach|get in touch|write to|send.*mail/i.test(surrounding)) score += 0.15;
        if (/mailto:/i.test(surrounding)) score += 0.15;
        if (/href.*mailto/i.test(surrounding)) score += 0.1;
    }

    // Boost: source URL is a contact page
    if (/contact|about|team|staff|people|directory/i.test(sourceUrl)) score += 0.1;

    // Boost: professional-looking local part (first.last, first_last, etc.)
    const localPart = lower.split('@')[0];
    if (/^[a-z]+[._][a-z]+$/.test(localPart)) score += 0.1;

    // Penalize: free email providers (slightly less trustworthy for B2B)
    if (/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com/.test(lower)) score -= 0.05;

    // Penalize: very generic local parts
    if (/^(info|admin|support|webmaster|sales|marketing|hello|hi|contact)@/.test(lower)) score -= 0.05;

    // Cap between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, Math.round(score * 100) / 100));
};

/**
 * Extracts valid email addresses from HTML content with validation and scoring
 */
const extractEmails = (html: string, sourceUrl: string): Array<{ email: string; source_url: string; confidence_score: number }> => {
    const emails: Set<string> = new Set();
    const matches = html.match(EMAIL_REGEX) || [];

    for (const email of matches) {
        const lowerEmail = email.toLowerCase();

        // Full validation
        if (!isValidEmail(lowerEmail)) continue;

        emails.add(lowerEmail);
    }

    return Array.from(emails).map(email => ({
        email,
        source_url: sourceUrl,
        confidence_score: calculateConfidence(email, html, sourceUrl),
    }));
};

/**
 * Search DuckDuckGo HTML version (free, no API key needed)
 * Returns a list of URLs from search results
 */
const searchDuckDuckGo = async (query: string): Promise<string[]> => {
    try {
        const encodedQuery = encodeURIComponent(query);
        // DuckDuckGo HTML-only search endpoint
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

        console.log(`[EmailDiscovery] 🔍 DuckDuckGo search: "${query}"`);
        const html = await fetchURL(searchUrl, false); // Don't check robots for search engine

        const urls: string[] = [];
        let match;

        // Strategy 1: encoded redirect URLs (most common DDG format)
        const urlRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=(https?[^&"]+)/g;
        while ((match = urlRegex.exec(html)) !== null) {
            try {
                const decodedUrl = decodeURIComponent(match[1]);
                if (!decodedUrl.includes('duckduckgo.com')) urls.push(decodedUrl);
            } catch { continue; }
        }

        // Strategy 2: result__a class links
        const directUrlRegex = /class="result__a"[^>]*href="(https?:\/\/[^"]+)"/g;
        while ((match = directUrlRegex.exec(html)) !== null) {
            if (!match[1].includes('duckduckgo.com')) urls.push(match[1]);
        }

        // Strategy 3: any absolute https link in result snippets
        const anyUrlRegex = /class="result__snippet"[^>]*>.*?<a[^>]*href="(https?:\/\/[^"]+)"/g;
        while ((match = anyUrlRegex.exec(html)) !== null) {
            if (!match[1].includes('duckduckgo.com')) urls.push(match[1]);
        }

        // Strategy 4: broad fallback — any https URL that isn't DDG/ads
        if (urls.length < 5) {
            const broadRegex = /href="(https?:\/\/(?!duckduckgo\.com|improving\.duckduckgo|duck\.co)[^"]{15,})"/g;
            while ((match = broadRegex.exec(html)) !== null) {
                urls.push(match[1]);
            }
        }

        // Deduplicate
        const unique = Array.from(new Set(urls));
        console.log(`[EmailDiscovery] 🔍 Found ${unique.length} search results`);
        return unique.slice(0, 20); // Top 20 results (up from 10)
    } catch (error: any) {
        console.error(`[EmailDiscovery] ✗ DuckDuckGo search failed: ${error.message}`);
        return [];
    }
};

/**
 * Search for pages related to keywords using DuckDuckGo + curated fallback URLs
 */
const searchForPages = async (keywords: string[], industry?: string): Promise<string[]> => {
    const urls: string[] = [];

    // ── 1. Multiple DuckDuckGo search queries for broader coverage ─────────────
    const queries: string[] = [];

    if (keywords.length > 0) {
        queries.push(`${keywords.join(' ')} contact email ${industry || ''}`.trim());
        queries.push(`${keywords.join(' ')} team staff directory email`);
        if (industry) {
            queries.push(`${industry} ${keywords[0]} email address contact page`);
        }
    } else if (industry) {
        queries.push(`${industry} companies contact email`);
        queries.push(`${industry} organizations staff directory email`);
        queries.push(`${industry} team members email address`);
    }

    // Run searches with rate limiting
    for (let i = 0; i < queries.length; i++) {
        if (i > 0) await sleep(RATE_LIMIT_MS * 2); // extra delay between searches
        const searchResults = await searchDuckDuckGo(queries[i]);
        urls.push(...searchResults);
    }

    // ── 2. Extensive curated industry URLs ──────────────────────────────────────
    const commonDomains: Record<string, string[]> = {
        'technology': [
            'https://about.gitlab.com/company/contact/',
            'https://www.mozilla.org/en-US/contact/',
            'https://www.apache.org/foundation/contact.html',
            'https://www.linuxfoundation.org/about/contact',
            'https://www.python.org/community/',
            'https://www.rust-lang.org/governance',
            'https://nodejs.org/en/about/get-involved',
            'https://www.djangoproject.com/contact/',
            'https://www.drupal.org/about/contact',
            'https://wordpress.org/about/contact/',
            'https://www.elastic.co/about/contact',
            'https://www.redhat.com/en/about/contact',
            'https://www.suse.com/contact/',
            'https://www.canonical.com/contact-us',
            'https://www.jetbrains.com/company/contacts/',
        ],
        'education': [
            'https://www.khanacademy.org/about/contact',
            'https://www.edx.org/contact-us',
            'https://www.coursera.org/about/contact',
            'https://ocw.mit.edu/contact/',
            'https://www.harvard.edu/contact',
            'https://www.stanford.edu/contact/',
            'https://www.ox.ac.uk/contact-us',
            'https://www.cam.ac.uk/about-the-university/contact-the-university',
            'https://www.yale.edu/contact-us',
            'https://www.columbia.edu/content/contact-columbia',
            'https://www.princeton.edu/meet-princeton/contact-us',
            'https://www.uchicago.edu/about/contact/',
            'https://www.caltech.edu/about/contact-us',
        ],
        'business': [
            'https://www.shopify.com/contact',
            'https://www.salesforce.com/company/contact-us/',
            'https://www.hubspot.com/company/contact',
            'https://www.zoho.com/contactus.html',
            'https://www.freshworks.com/company/contact/',
            'https://www.zendesk.com/company/contact/',
            'https://www.intercom.com/company',
            'https://www.mailchimp.com/contact/',
            'https://www.atlassian.com/company/contact',
            'https://www.asana.com/company',
            'https://www.slack.com/contact',
            'https://www.notion.so/about',
        ],
        'startup': [
            'https://www.producthunt.com/contact',
            'https://www.ycombinator.com/contact',
            'https://www.techstars.com/contact',
            'https://www.500.co/contact',
            'https://www.crunchbase.com/contact-us',
            'https://www.seedinvest.com/contact',
            'https://angel.co/about',
            'https://www.startupgrind.com/about/',
            'https://www.plugandplaytechcenter.com/contact/',
            'https://masschallenge.org/contact',
        ],
        'ngo': [
            'https://www.redcross.org/contact-us.html',
            'https://www.unicef.org/contact-us',
            'https://www.amnesty.org/en/contact/',
            'https://www.oxfam.org/en/contact-us',
            'https://www.savethechildren.org/us/about-us/contact-us',
            'https://www.greenpeace.org/international/explore/about/contacts/',
            'https://www.wwf.org/about/leadership',
            'https://www.doctorswithoutborders.org/contact-us',
            'https://www.habitat.org/about/contact',
            'https://www.wfp.org/contact',
            'https://www.care.org/contact/',
            'https://www.mercy.org.au/contact',
        ],
        'corporate': [
            'https://www.ibm.com/contact/us/en/',
            'https://www.microsoft.com/en-us/contactus/',
            'https://www.oracle.com/corporate/contact/',
            'https://www.cisco.com/c/en/us/about/contact-cisco.html',
            'https://www.dell.com/support/contents/en-us/article/contact-information',
            'https://www.hp.com/us-en/contact-hp.html',
            'https://www.intel.com/content/www/us/en/support/contact-intel.html',
            'https://www.accenture.com/us-en/about/contact-us',
            'https://www.deloitte.com/global/en/about/contact-us.html',
            'https://www.pwc.com/gx/en/about/contact-us.html',
            'https://www.ey.com/en_gl/contact-us',
            'https://www.kpmg.com/xx/en/home/misc/contact.html',
        ],
        'opensource': [
            'https://www.apache.org/foundation/contact.html',
            'https://www.linuxfoundation.org/about/contact',
            'https://www.fsf.org/about/contact/',
            'https://www.gnome.org/contact/',
            'https://kde.org/community/whatiskde/contact/',
            'https://www.freebsd.org/mailto/',
            'https://www.openbsd.org/mail.html',
            'https://www.eclipse.org/org/foundation/contact.php',
            'https://www.cncf.io/about/contact/',
            'https://opensourcedesign.net/contact/',
        ],
    };

    // Always add industry-specific curated URLs
    if (industry && commonDomains[industry]) {
        urls.push(...commonDomains[industry]);
    }

    // Match keywords to known industries
    for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (commonDomains[lowerKeyword]) {
            urls.push(...commonDomains[lowerKeyword]);
        }
    }

    // If we still have very few URLs, add some general high-yield pages
    if (urls.length < 10) {
        urls.push(
            'https://www.w3.org/Consortium/contact',
            'https://www.ietf.org/contact/',
            'https://www.ieee.org/about/contact.html',
            'https://www.acm.org/about-acm/contact-us',
            'https://www.mozilla.org/en-US/contact/',
            'https://www.fsf.org/about/contact/',
            'https://www.python.org/community/',
            'https://www.djangoproject.com/contact/',
            'https://www.linuxfoundation.org/about/contact',
            'https://www.apache.org/foundation/contact.html',
        );
    }

    // Remove duplicates
    return Array.from(new Set(urls));
};

// ── Main Node Definition ───────────────────────────────────────────────────────

export const emailDiscoveryNode: WorkflowNode = {
    id: 'email-discovery',
    type: 'EMAIL_DISCOVERY',
    name: 'Email Discovery Node',
    description: 'Discovers real business emails by scraping web pages, DuckDuckGo search, and direct URL scraping with robots.txt compliance and rate limiting.',
    inputSchema: {
        type: 'object',
        properties: {
            urls: {
                type: 'array',
                items: { type: 'string' },
                description: 'Direct URLs to scrape for email addresses'
            },
            keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords to search for relevant pages via DuckDuckGo'
            },
            targetDomains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter results to specific email domains'
            },
            industry: {
                type: 'string',
                enum: ['education', 'business', 'technology', 'startup', 'ngo', 'corporate', 'opensource'],
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
        type: 'object',
        properties: {
            emails: {
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
            totalScraped: { type: 'number' },
            uniqueCount: { type: 'number' },
            returnedCount: { type: 'number' },
            scrapeStats: {
                type: 'object',
                properties: {
                    successful: { type: 'number' },
                    failed: { type: 'number' },
                    blockedByRobots: { type: 'number' },
                }
            },
            warnings: { type: 'array', items: { type: 'string' } },
        }
    },

    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('[EmailDiscovery] Starting email discovery...');
            console.log('[EmailDiscovery] Input:', JSON.stringify(input, null, 2));

            const urls = (input.urls as string[] | undefined) || [];
            const keywords = (input.keywords as string[] | undefined) || [];
            const targetDomains = input.targetDomains as string[] | undefined;
            const industry = input.industry as string | undefined;
            const maxEmails = (input.maxEmails as number | undefined) || 50;
            const workflowRunId = input.workflowRunId as string | undefined;

            const warnings: string[] = [];
            const discoveredEmails: Array<{
                email: string;
                source_url: string;
                matched_keyword?: string;
                confidence_score: number;
            }> = [];

            // ── Determine URLs to Scrape ───────────────────────────────────────
            let urlsToScrape: string[] = [];

            // (FIX #1) Handle direct URL input
            if (urls.length > 0) {
                console.log(`[EmailDiscovery] 📌 User provided ${urls.length} direct URL(s)`);
                urlsToScrape.push(...urls);
            }

            // Keyword / industry search
            if (keywords.length > 0 || industry) {
                console.log(`[EmailDiscovery] 🔍 Searching by keywords: [${keywords.join(', ')}], industry: ${industry || 'none'}`);
                const searchUrls = await searchForPages(keywords, industry);
                urlsToScrape.push(...searchUrls);
            }

            // Deduplicate URLs
            urlsToScrape = Array.from(new Set(urlsToScrape));

            if (urlsToScrape.length === 0) {
                console.log('[EmailDiscovery] No URLs to scrape. Provide urls, keywords, or industry.');
                return {
                    status: 'success',
                    data: {
                        emails: [],
                        totalScraped: 0,
                        uniqueCount: 0,
                        returnedCount: 0,
                        message: 'Please provide urls, keywords, or select an industry to discover emails.',
                        warnings: ['No input provided — supply at least one of: urls, keywords, industry'],
                    }
                };
            }

            // ── Expand URLs with sub-page crawling (limited) ────────────────
            // Only add sub-pages for hosts that DON'T already have a specific path
            const expandedUrls: string[] = [...urlsToScrape];
            const scrapedHosts = new Set<string>();

            for (const url of urlsToScrape) {
                try {
                    const parsed = new URL(url);
                    if (!scrapedHosts.has(parsed.host)) {
                        scrapedHosts.add(parsed.host);
                        const base = `${parsed.protocol}//${parsed.host}`;
                        for (const subPage of CONTACT_SUBPAGES) {
                            const subUrl = `${base}${subPage}`;
                            // Don't add if we already have this URL
                            if (!urlsToScrape.includes(subUrl)) {
                                expandedUrls.push(subUrl);
                            }
                        }
                    }
                } catch { /* ignore bad URLs */ }
            }

            // Deduplicate and CAP total URLs
            urlsToScrape = Array.from(new Set(expandedUrls)).slice(0, MAX_URLS_TO_SCRAPE);
            console.log(`[EmailDiscovery] 🌐 Scraping ${urlsToScrape.length} URL(s) (capped at ${MAX_URLS_TO_SCRAPE})...`);

            // ── Scrape Each URL ────────────────────────────────────────────────
            let successfulScrapes = 0;
            let failedScrapes = 0;
            let blockedByRobots = 0;
            let consecutiveFailures = 0;
            const MAX_CONSECUTIVE_FAILURES = 8; // Skip remaining sub-pages of a dead host

            // Stop early once we have enough emails
            const earlyStopThreshold = maxEmails * 2;

            for (let i = 0; i < urlsToScrape.length; i++) {
                // Early stop if we already have plenty
                if (discoveredEmails.length >= earlyStopThreshold) {
                    console.log(`[EmailDiscovery] 🎯 Reached ${discoveredEmails.length} emails (target: ${maxEmails}), stopping early.`);
                    break;
                }

                // If too many consecutive failures, skip ahead
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    console.log(`[EmailDiscovery] ⏩ ${consecutiveFailures} consecutive failures, skipping to next host...`);
                    // Find next URL with a different host
                    const currentHost = new URL(urlsToScrape[i]).host;
                    while (i < urlsToScrape.length) {
                        try {
                            if (new URL(urlsToScrape[i]).host !== currentHost) break;
                        } catch { }
                        i++;
                    }
                    consecutiveFailures = 0;
                    if (i >= urlsToScrape.length) break;
                }

                const url = urlsToScrape[i];

                // Rate limiting between requests
                if (i > 0) {
                    await sleep(RATE_LIMIT_MS);
                }

                try {
                    console.log(`[EmailDiscovery] [${i + 1}/${urlsToScrape.length}] Fetching: ${url}`);
                    const html = await fetchWithRetry(url);
                    const emails = extractEmails(html, url);

                    if (emails.length > 0) {
                        console.log(`[EmailDiscovery]   ✓ Found ${emails.length} email(s)`);
                        successfulScrapes++;
                        consecutiveFailures = 0;

                        for (const emailData of emails) {
                            const matchedKeyword = keywords.find((k: string) =>
                                html.toLowerCase().includes(k.toLowerCase())
                            );

                            discoveredEmails.push({
                                ...emailData,
                                matched_keyword: matchedKeyword || industry || 'direct_url',
                            });
                        }
                    } else {
                        console.log(`[EmailDiscovery]   ⚠ No emails found on page`);
                        consecutiveFailures++;
                    }
                } catch (error: any) {
                    consecutiveFailures++;
                    if (error.message?.includes('robots.txt')) {
                        blockedByRobots++;
                        if (blockedByRobots <= 3) {
                            console.log(`[EmailDiscovery]   🚫 Blocked by robots.txt: ${url}`);
                        }
                        warnings.push(`Skipped ${url} — blocked by robots.txt`);
                    } else {
                        failedScrapes++;
                        if (failedScrapes <= 5) {
                            console.error(`[EmailDiscovery]   ✗ Failed: ${error.message}`);
                        }
                        warnings.push(`Failed to scrape ${url}: ${error.message}`);
                    }
                }
            }

            console.log(`[EmailDiscovery] Scraping complete: ${successfulScrapes} ok, ${failedScrapes} failed, ${blockedByRobots} blocked`);

            // ── Filter by Target Domains ───────────────────────────────────────
            let filteredEmails = discoveredEmails;
            if (targetDomains && targetDomains.length > 0) {
                filteredEmails = discoveredEmails.filter(item =>
                    targetDomains.some(domain => item.email.endsWith(`@${domain}`) || item.email.includes(`.${domain}`))
                );
                console.log(`[EmailDiscovery] Filtered to ${filteredEmails.length} email(s) matching target domains`);
            }

            // ── Deduplicate ────────────────────────────────────────────────────
            const uniqueEmails = Array.from(
                new Map(filteredEmails.map(item => [item.email, item])).values()
            );

            // Sort by confidence score (highest first)
            uniqueEmails.sort((a, b) => b.confidence_score - a.confidence_score);

            // Limit results
            const limitedEmails = uniqueEmails.slice(0, maxEmails);

            console.log(`[EmailDiscovery] ✅ Discovered ${limitedEmails.length} unique valid email(s)`);

            // ── Save to MongoDB ────────────────────────────────────────────────
            let dbSaveCount = 0;
            let dbSkipCount = 0;
            let dbErrors: string[] = [];
            try {
                const savedEmails = await Promise.all(
                    limitedEmails.map(async (emailData) => {
                        try {
                            // Use findOneAndUpdate with upsert to avoid duplicate emails
                            const result = await DiscoveredEmail.findOneAndUpdate(
                                { email: emailData.email },
                                {
                                    $setOnInsert: {
                                        email: emailData.email,
                                        source_url: emailData.source_url,
                                        matched_keyword: emailData.matched_keyword,
                                        industry: industry,
                                        confidence_score: emailData.confidence_score,
                                        status: 'pending',
                                        workflowRunId: workflowRunId || null,
                                    }
                                },
                                { upsert: true, new: true, includeResultMetadata: true }
                            );
                            if (result.lastErrorObject?.updatedExisting) {
                                dbSkipCount++;
                                console.log(`[EmailDiscovery] Skipped duplicate: ${emailData.email}`);
                            } else {
                                dbSaveCount++;
                            }
                        } catch (dbErr: any) {
                            dbErrors.push(`Failed to save ${emailData.email}: ${dbErr.message}`);
                        }
                    })
                );
                console.log(`[EmailDiscovery] Saved ${dbSaveCount} new, skipped ${dbSkipCount} duplicates (of ${limitedEmails.length} total)`);
                if (dbErrors.length > 0) {
                    warnings.push(...dbErrors);
                }
            } catch (dbError: any) {
                const msg = `Database save failed: ${dbError.message}`;
                console.error(`[EmailDiscovery] ${msg}`);
                warnings.push(msg);
            }

            console.log(`[EmailDiscovery] ━━━ Output Summary ━━━`);
            console.log(`[EmailDiscovery] Returning ${limitedEmails.length} emails to pipeline`);
            limitedEmails.forEach((e, i) => console.log(`[EmailDiscovery]   ${i + 1}. ${e.email} (confidence: ${e.confidence_score})`));

            return {
                status: 'success',
                data: {
                    emails: limitedEmails,
                    totalScraped: discoveredEmails.length,
                    uniqueCount: uniqueEmails.length,
                    returnedCount: limitedEmails.length,
                    scrapeStats: {
                        successful: successfulScrapes,
                        failed: failedScrapes,
                        blockedByRobots: blockedByRobots,
                        totalUrls: urlsToScrape.length,
                    },
                    warnings: warnings.length > 0 ? warnings : undefined,
                }
            };

        } catch (error: any) {
            console.error('[EmailDiscovery] Fatal error:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
