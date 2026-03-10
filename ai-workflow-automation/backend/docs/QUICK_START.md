# Quick Start Guide: Real Email Scraping

## Problem Solved ✅
Your email discovery node was returning **mock/fake emails** like `contact@techstartups.io` and `info@greenngo.org`. 

Now it scrapes **real, valid email addresses** from actual websites!

## What Changed

### Before (Mock Data)
```json
{
  "emails": [
    {
      "email": "contact@techstartups.io",  // ❌ Fake email
      "source_url": "https://techstartups.io/contact",
      "confidence_score": 0.95
    }
  ]
}
```

### After (Real Scraping)
```json
{
  "emails": [
    {
      "email": "adinquiries@condenast.com",  // ✅ Real email!
      "source_url": "https://arstechnica.com/contact-us/",
      "confidence_score": 0.85
    }
  ]
}
```

## How to Use

### Method 1: Scrape Specific URLs (Recommended)
```json
{
  "type": "EMAIL_DISCOVERY",
  "input": {
    "urls": [
      "https://www.company.com/contact",
      "https://www.company.com/about",
      "https://www.company.com/team"
    ],
    "maxEmails": 20
  }
}
```

### Method 2: Use Keywords + Industry
```json
{
  "type": "EMAIL_DISCOVERY",
  "input": {
    "keywords": ["technology", "startup"],
    "industry": "technology",
    "maxEmails": 10
  }
}
```

### Method 3: Combine Both
```json
{
  "type": "EMAIL_DISCOVERY",
  "input": {
    "urls": ["https://www.example.com/contact"],
    "keywords": ["technology"],
    "industry": "technology",
    "targetDomains": ["example.com"],
    "maxEmails": 15
  }
}
```

## Testing Your Setup

### 1. Run the Test Script
```bash
cd backend
npm run build
node dist/scripts/test-real-scraping.js
```

### 2. Check Results
View the log file:
```
backend/dist/scripts/real-email-test.txt
```

### 3. Test Full Workflow
```bash
# Make sure backend is running
npm run dev

# In another terminal, run the debug workflow
node dist/scripts/debug-workflow.js
```

## Common URLs to Scrape

### Technology Companies
- `https://techcrunch.com/contact/`
- `https://arstechnica.com/contact-us/`
- `https://www.wired.com/about/contact/`

### Startups
- `https://www.ycombinator.com/contact`
- `https://www.producthunt.com/contact`

### Education
- `https://www.edutopia.org/contact`
- `https://www.chronicle.com/page/contact-us`

### Business
- `https://www.forbes.com/fdc/contact.html`
- `https://www.inc.com/contact`

## Email Validation

The scraper automatically filters out:
- ❌ Example emails (example.com, test.com)
- ❌ No-reply addresses (noreply@, donotreply@)
- ❌ Error tracking (sentry.io)
- ❌ Invalid formats (multiple @ symbols)
- ❌ Too long emails (>100 characters)

## Integration with Frontend

Update your workflow in the frontend to use real URLs:

```typescript
const workflow = {
  nodes: [
    {
      id: 'discovery-1',
      type: 'EMAIL_DISCOVERY',
      data: {
        urls: [
          'https://www.targetcompany.com/contact',
          'https://www.targetcompany.com/about'
        ],
        maxEmails: 50
      }
    },
    {
      id: 'sending-1',
      type: 'EMAIL_SENDING',
      data: {
        subject: 'Your Subject',
        body: '<p>Your email body</p>'
      }
    }
  ],
  edges: [
    { source: 'discovery-1', target: 'sending-1' }
  ]
};
```

## Troubleshooting

### "No emails found"
**Possible causes:**
1. URL doesn't have visible emails in HTML
2. Site uses JavaScript to render emails
3. Site is blocking automated requests

**Solutions:**
- Try different URLs (contact pages, about pages, team pages)
- Use multiple URLs to increase chances
- Check if the site is accessible in a browser

### "Request timeout"
**Cause:** Site is slow or blocking requests

**Solution:**
- Try again later
- Use different URLs
- The timeout is 10 seconds per URL

### "Invalid emails returned"
**Cause:** Site has example/placeholder emails

**Solution:**
- The scraper already filters most invalid patterns
- You can add more patterns to `INVALID_PATTERNS` in `emailDiscovery.ts`

## Best Practices

### ✅ DO
- Use contact pages, about pages, team pages
- Scrape multiple URLs for better results
- Set reasonable `maxEmails` limits (10-50)
- Respect rate limits (don't scrape too many URLs at once)
- Use scraped emails ethically and legally

### ❌ DON'T
- Scrape hundreds of URLs in one request
- Use scraped emails for spam
- Ignore robots.txt and terms of service
- Scrape personal/private information
- Violate GDPR or CAN-SPAM regulations

## Next Steps

1. **Test the scraper** with real URLs
2. **Update your workflows** to use real URLs instead of keywords
3. **Integrate with frontend** to allow users to input URLs
4. **Add email verification** (future enhancement)
5. **Implement rate limiting** (future enhancement)

## Support

For more details, see:
- Full documentation: `backend/docs/EMAIL_DISCOVERY.md`
- Source code: `backend/src/nodes/emailDiscovery.ts`
- Test script: `backend/scripts/test-real-scraping.ts`

---

**🎉 You now have real email scraping working!**

The emails you discover will be actual, valid email addresses from real websites, not mock data.
