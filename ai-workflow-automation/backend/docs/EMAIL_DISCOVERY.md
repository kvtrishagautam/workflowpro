# Email Discovery Node - Real Email Scraping

## Overview
The Email Discovery Node has been upgraded to scrape **real, valid email addresses** from web pages instead of returning mock data.

## Features

### 1. **Direct URL Scraping**
Provide specific URLs to scrape for email addresses:
```json
{
  "urls": [
    "https://www.example.com/contact",
    "https://www.company.com/about"
  ]
}
```

### 2. **Keyword-Based Discovery**
Search for emails using keywords and industry filters:
```json
{
  "keywords": ["technology", "startup"],
  "industry": "technology",
  "maxEmails": 20
}
```

### 3. **Domain Filtering**
Filter results to specific domains:
```json
{
  "urls": ["https://www.example.com/contact"],
  "targetDomains": ["example.com"]
}
```

## How It Works

### Email Extraction
- Uses regex pattern to find email addresses in HTML content
- Validates email format (must have exactly one @ symbol)
- Filters out common invalid patterns:
  - Example domains (example.com, test.com, sample.com)
  - No-reply addresses (noreply@, no-reply@, donotreply@)
  - Error tracking services (sentry.io)
  - W3C examples (w3.org)
  - Localhost addresses

### Confidence Scoring
All scraped emails receive a confidence score of **0.85** (85% confidence)

### Deduplication
- Automatically removes duplicate email addresses
- Case-insensitive matching (converts all to lowercase)

## Input Schema

```typescript
{
  urls?: string[];              // Direct URLs to scrape
  keywords?: string[];          // Keywords for searching
  targetDomains?: string[];     // Filter by specific domains
  industry?: string;            // Industry filter: 'education', 'business', 'technology', 'startup', 'ngo', 'corporate'
  maxEmails?: number;           // Maximum emails to return (default: 50)
}
```

## Output Schema

```typescript
{
  emails: Array<{
    email: string;              // The email address
    source_url: string;         // URL where it was found
    matched_keyword?: string;   // Keyword that matched (or 'direct_url')
    confidence_score: number;   // Confidence score (0.85)
  }>;
  totalScraped: number;         // Total emails found before filtering
  uniqueCount: number;          // Unique emails after deduplication
  returnedCount: number;        // Final count after maxEmails limit
}
```

## Example Usage

### Example 1: Scrape Specific Contact Pages
```json
{
  "urls": [
    "https://www.ycombinator.com/contact",
    "https://arstechnica.com/contact-us/",
    "https://www.wired.com/about/contact/"
  ],
  "maxEmails": 10
}
```

### Example 2: Find Technology Company Emails
```json
{
  "keywords": ["technology", "startup"],
  "industry": "technology",
  "maxEmails": 20
}
```

### Example 3: Scrape with Domain Filter
```json
{
  "urls": [
    "https://www.company.com/contact",
    "https://www.company.com/about"
  ],
  "targetDomains": ["company.com"],
  "maxEmails": 5
}
```

## Built-in Industry URLs

When using keywords and industry filters, the node automatically searches these curated URLs:

### Technology
- TechCrunch contact page
- Wired contact page
- Ars Technica contact page

### Education
- Edutopia contact page
- Chronicle of Higher Education contact page

### Business
- Forbes contact page
- Inc. contact page

### Startup
- Y Combinator contact page
- TechCrunch contact page

## Testing

Run the test script to verify email scraping:
```bash
npm run build
node dist/scripts/test-real-scraping.js
```

Check the results in: `dist/scripts/real-email-test.txt`

## Integration with Email Sending Node

The Email Discovery Node output is designed to work seamlessly with the Email Sending Node:

```javascript
// Workflow example
{
  nodes: [
    {
      id: '1',
      type: 'EMAIL_DISCOVERY',
      input: {
        keywords: ['technology'],
        industry: 'technology',
        maxEmails: 10
      }
    },
    {
      id: '2',
      type: 'EMAIL_SENDING',
      input: {
        subject: 'Hello from Workflow Pro',
        body: '<h1>Hi!</h1><p>This is an automated email.</p>'
      }
    }
  ],
  edges: [
    { source: '1', target: '2', id: 'e1-2' }
  ]
}
```

The `emails` array from the discovery node is automatically passed to the sending node.

## Limitations & Future Enhancements

### Current Limitations
1. Only scrapes emails visible in HTML (not JavaScript-rendered content)
2. Limited to HTTP/HTTPS protocols
3. 10-second timeout per URL
4. No authentication support for protected pages

### Planned Enhancements
1. **JavaScript Rendering**: Use headless browser for dynamic content
2. **Search API Integration**: Integrate with Google Custom Search API
3. **Email Verification**: Verify email deliverability using SMTP
4. **Rate Limiting**: Add configurable delays between requests
5. **Proxy Support**: Rotate IP addresses to avoid blocking
6. **Advanced Filtering**: Filter by email patterns (e.g., only @company.com emails)

## Troubleshooting

### No Emails Found
- **Check URL accessibility**: Ensure URLs are publicly accessible
- **Verify HTML content**: Some sites use JavaScript to render emails
- **Check filters**: Domain filters might be too restrictive

### Invalid Emails
- The node automatically filters common invalid patterns
- If you're still getting invalid emails, check the `INVALID_PATTERNS` array in the source code

### Timeout Errors
- Default timeout is 10 seconds per URL
- Some sites may be slow or blocking automated requests
- Consider using fewer URLs or implementing retry logic

## Security & Ethics

### Best Practices
1. **Respect robots.txt**: Check site's robots.txt before scraping
2. **Rate Limiting**: Don't overwhelm servers with requests
3. **Privacy**: Only use emails for legitimate business purposes
4. **Compliance**: Follow GDPR, CAN-SPAM, and other regulations
5. **Opt-out**: Provide clear unsubscribe mechanisms

### Legal Considerations
- Scraping publicly available emails is generally legal
- Using scraped emails for spam is illegal in most jurisdictions
- Always comply with local data protection laws
- Consider using opt-in methods instead of scraping

## API Reference

### fetchURL(url: string): Promise<string>
Fetches HTML content from a URL with a 10-second timeout.

### extractEmails(html: string, sourceUrl: string): Array<EmailData>
Extracts and validates email addresses from HTML content.

### searchForPages(keywords: string[], industry?: string): Promise<string[]>
Returns curated URLs based on keywords and industry.

## Support

For issues or feature requests, please check the project documentation or contact the development team.
