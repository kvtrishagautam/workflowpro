# Email Discovery Node

## Overview
The Email Discovery Node scrapes **real, valid email addresses** from web pages using:
- **Direct URL scraping** — provide your own URLs
- **DuckDuckGo search** — free, no API key needed
- **Industry-specific curated URLs** — fallback for 7 industries

All scraping is done with **robots.txt compliance**, **rate limiting**, and **retry logic**.

## Features

### 1. Direct URL Scraping
```json
{
  "urls": [
    "https://www.company.com/contact",
    "https://www.company.com/about"
  ]
}
```

### 2. DuckDuckGo Keyword Search (Free)
```json
{
  "keywords": ["fintech", "startup"],
  "industry": "technology",
  "maxEmails": 20
}
```

### 3. Domain Filtering
```json
{
  "urls": ["https://www.company.com/contact"],
  "targetDomains": ["company.com"]
}
```

### 4. Combined Mode
```json
{
  "urls": ["https://custom-site.com/team"],
  "keywords": ["SaaS", "cloud"],
  "industry": "technology",
  "targetDomains": ["company.com"],
  "maxEmails": 30
}
```

## How It Works

### Email Extraction
- Regex pattern finds emails in raw HTML
- **Validates** every email against:
  - Domain legitimacy (valid TLDs only)
  - False-positive patterns (`photo@2x.png`, `style@1.0`, etc.)
  - Minimum local-part length (3+ chars with at least one letter)
  - Invalid domains (example.com, test.com, localhost, etc.)

### Confidence Scoring (Dynamic)
Unlike the old hardcoded `0.85`, scores are now **calculated dynamically**:

| Signal | Effect |
|--------|--------|
| Near "contact", "email", "mailto:" text | +0.15 |
| Found via `mailto:` link | +0.15 |
| Source URL is a contact/about page | +0.10 |
| Professional format (`first.last@`) | +0.10 |
| Free email provider (gmail, yahoo) | -0.05 |
| Generic local part (info@, admin@) | -0.05 |

Base score: `0.50`, range: `0.10 – 1.00`

### robots.txt Compliance
- Checks `robots.txt` before scraping any URL
- Skips disallowed paths, logs warnings
- Caches results for 5 minutes per host

### Rate Limiting & Retries
- **1.5 second delay** between requests
- **2 retries** with exponential backoff (1s, 2s)
- **15 second timeout** per URL
- **HTTP redirects** followed (301, 302, 303, 307, 308, up to 5 hops)

## Input Schema

```typescript
{
  urls?: string[];           // Direct URLs to scrape
  keywords?: string[];       // DuckDuckGo search keywords
  targetDomains?: string[];  // Filter emails to specific domains
  industry?: string;         // 'education' | 'business' | 'technology' | 'startup' | 'ngo' | 'corporate' | 'opensource'
  maxEmails?: number;        // Max emails to return (default: 50)
}
```

## Output Schema

```typescript
{
  emails: Array<{
    email: string;
    source_url: string;
    matched_keyword?: string;
    confidence_score: number; // 0.10 – 1.00
  }>;
  totalScraped: number;
  uniqueCount: number;
  returnedCount: number;
  scrapeStats: {
    successful: number;
    failed: number;
    blockedByRobots: number;
    totalUrls: number;
  };
  warnings?: string[];       // Errors, skipped URLs, DB issues
}
```

## Supported Industries (Fallback URLs)

| Industry | Curated Sources |
|----------|----------------|
| technology | GitLab, Mozilla, Apache |
| education | Khan Academy, edX |
| business | Shopify, Salesforce |
| startup | Product Hunt, Y Combinator |
| ngo | Red Cross, UNICEF, Amnesty |
| corporate | IBM, Microsoft, Oracle |
| opensource | Apache, Linux Foundation |

## Integration with Email Sending Node

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "EMAIL_DISCOVERY",
      "input": {
        "keywords": ["technology"],
        "industry": "technology",
        "maxEmails": 10
      }
    },
    {
      "id": "2",
      "type": "EMAIL_SENDING",
      "input": {
        "subject": "Hello from Workflow Pro",
        "body": "<h1>Hi!</h1><p>This is an automated email.</p>"
      }
    }
  ],
  "edges": [
    { "source": "1", "target": "2", "id": "e1-2" }
  ]
}
```

## Security & Ethics

- ✅ Respects `robots.txt` automatically
- ✅ Rate-limited (1.5s between requests)
- ✅ Only scrapes publicly available HTML
- ✅ Filters out noreply/donotreply/postmaster addresses
- ⚠️ Always comply with GDPR, CAN-SPAM regulations
- ⚠️ Provide unsubscribe mechanisms when emailing

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No emails found | Check if the site renders emails via JavaScript (not supported) |
| All URLs blocked | Check `robots.txt` for those domains |
| Timeout errors | Site may be slow; retries happen automatically |
| DB save warnings | Check MongoDB connection; emails are still returned even if DB fails |
