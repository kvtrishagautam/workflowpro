# OpenAI Node Configuration Guide

## Overview

The OpenAI node allows you to integrate GPT models into your workflows for AI-powered analysis, generation, and processing.

---

## Configuration Fields

### 1. **System Prompt** (Optional but Recommended)

**Purpose**: Defines the AI's role, behavior, and personality

**When to use**: Always use this to get consistent, quality responses

**Examples**:

```
You are a professional business analyst assistant.
Analyze customer inquiries and provide clear, actionable insights.
Always structure your response with numbered points.
```

```
You are a helpful customer support agent.
Be friendly, empathetic, and provide solutions in simple language.
```

```
You are a technical documentation expert.
Explain concepts clearly with examples and best practices.
```

### 2. **User Prompt** (Required)

**Purpose**: The actual instruction/question for the AI, including data from previous nodes

**When to use**: This is where you put your actual request with dynamic data

**Variable Syntax**: Use `{{nodeName.field}}` or `{{body.field}}` to insert data

**Examples**:

#### Business Analysis
```
Analyze this business inquiry and provide:
1. Summary of the request
2. Urgency assessment (Low/Medium/High)
3. Recommended next action

Customer Details:
- Name: {{body.name}}
- Company: {{body.company}}
- Email: {{body.email}}

Message: {{body.message}}
```

#### Email Summarization
```
Summarize this email in 3 bullet points:

From: {{body.sender}}
Subject: {{body.subject}}
Body: {{body.content}}
```

#### Content Generation
```
Write a professional response email to:

Customer: {{body.name}}
Their inquiry: {{body.message}}
Tone: Friendly and helpful
```

#### Sentiment Analysis
```
Analyze the sentiment of this customer feedback:

Feedback: {{body.feedback}}

Provide:
1. Overall sentiment (Positive/Neutral/Negative)
2. Key concerns or praises
3. Recommended action
```

---

## Model Selection

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| `gpt-4` | Complex reasoning, accuracy | Slower | Higher |
| `gpt-4-turbo` | Balanced performance | Fast | Medium |
| `gpt-3.5-turbo` | Quick tasks, simple queries | Fastest | Lowest |

**Recommendation**: Start with `gpt-3.5-turbo` for testing, upgrade to `gpt-4` if you need better quality.

---

## Temperature Setting

Controls creativity/randomness of responses:

- **0.0 - 0.3**: Focused, deterministic, consistent
  - Use for: Data analysis, technical tasks, factual responses

- **0.4 - 0.7**: Balanced (default: 0.7)
  - Use for: Business analysis, customer support, general tasks

- **0.8 - 1.0**: Creative, varied, diverse
  - Use for: Content generation, brainstorming, marketing copy

---

## Complete Example: Customer Inquiry Analysis

### System Prompt
```
You are a professional business analyst assistant specializing in B2B sales.
Analyze customer inquiries to help sales teams prioritize and respond effectively.
Always provide structured responses with clear action items.
```

### User Prompt
```
Analyze this business inquiry:

Customer Information:
- Name: {{body.name}}
- Company: {{body.company}}
- Email: {{body.email}}
- Phone: {{body.phone}}

Inquiry Details:
- Category: {{body.category}}
- Budget Range: {{body.budget}}
- Stated Urgency: {{body.urgency}}
- Message: {{body.message}}

Please provide:
1. **Summary**: 1-2 sentences about the request
2. **Lead Quality**: Score from 1-10 with reasoning
3. **Urgency Level**: Low/Medium/High based on context
4. **Next Steps**: Recommended actions for the sales team
5. **Key Points**: Any important details to note
```

### Output Example
The AI will return structured analysis that you can use in the next node (Set, Email, WhatsApp, etc.):

```
{{openai.response}} will contain:

1. **Summary**: Enterprise client seeking workflow automation for 200+ employees
   across 5 departments with immediate implementation needs.

2. **Lead Quality**: 9/10 - Large budget, clear pain point, decision-making authority

3. **Urgency Level**: High - Requesting demo next week, evaluating multiple vendors

4. **Next Steps**:
   - Schedule demo within 24 hours
   - Prepare case studies for similar-sized organizations
   - Have technical team ready for Q&A
   - Offer personalized pricing proposal

5. **Key Points**:
   - Budget exceeds $50,000
   - Evaluation phase active
   - Multiple stakeholders involved
   - Time-sensitive decision
```

---

## Tips for Better Results

### ✅ DO:
- Be specific in your instructions
- Use structured formats (numbered lists, bullet points)
- Include relevant context from previous nodes
- Test with simulation mode first (no API key needed)
- Use system prompt to maintain consistency

### ❌ DON'T:
- Write overly long prompts (keep under 500 words)
- Mix multiple unrelated tasks in one prompt
- Forget to include the data you need to analyze
- Use variables that might be undefined

---

## Accessing OpenAI Output in Next Nodes

After the OpenAI node runs, the response is available as:

```
{{openai.response}}
```

**Usage Examples**:

### In Set Node (Format Message)
```
🤖 AI Analysis:
{{openai.response}}

Customer: {{body.name}}
Received: {{body.timestamp}}
```

### In Email Node
```
Subject: Analysis Complete for {{body.name}}

{{openai.response}}

---
Automated by Workflow System
```

### In WhatsApp/Telegram
```
📊 NEW LEAD ANALYSIS

{{openai.response}}

Contact: {{body.name}}
📧 {{body.email}}
📱 {{body.phone}}
```

---

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)
6. Paste it in the **Credentials** tab in the workflow editor

⚠️ **Important**: Keep your API key secure. Never share it or commit it to version control.

---

## Cost Management

OpenAI charges per token (roughly 1 token = 4 characters):

- **gpt-3.5-turbo**: ~$0.002 per 1K tokens
- **gpt-4**: ~$0.03 per 1K tokens

**Example Cost**:
- 100 customer inquiries/day
- 500 tokens per request (prompt + response)
- Using gpt-3.5-turbo: ~$3/month
- Using gpt-4: ~$45/month

💡 **Tip**: Use gpt-3.5-turbo for simple tasks, reserve gpt-4 for complex analysis.

---

## Troubleshooting

### Error: "OpenAI request failed"
- Check your API key is valid
- Ensure you have credits in your OpenAI account
- Verify the prompt isn't too long (max ~4000 tokens for gpt-3.5-turbo)

### Response is too generic
- Add more specific instructions in system prompt
- Include more context in user prompt
- Lower temperature for more focused responses

### Variables not working
- Ensure previous nodes have run successfully
- Check variable syntax: `{{body.field}}` not `{body.field}`
- Verify the field exists in previous node output

---

## Testing Without API Key

You can test your workflow without an OpenAI API key!

The system will run in **simulation mode**:
- All nodes execute as normal
- OpenAI returns: `"This is a simulated response..."`
- You can verify data flow and connections
- Add API key later to get real AI responses

---

## Need Help?

Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete workflow setup instructions.
