# Standardized Node Outputs

## Overview
All nodes now output their main result through a consistent `{{output}}` variable, making workflows more reusable and easier to configure.

## Changes Made

### Before (Inconsistent)
Each node had its own output variable structure:
- HTTP: `{{http.body}}` or `{{http.response}}`
- OpenAI: `{{openai.response}}`
- Google Sheets: `{{googleSheets.values}}` (read) or `{{googleSheets.updatedRows}}` (append)
- Telegram: `{{telegram.status}}`
- Filter: `{{items}}`

This made it hard to:
- Chain nodes generically
- Set conditions without knowing specific node structure
- Reuse workflows with different node types

### After (Standardized)
Every node now provides:
1. **`{{output}}`** - The main result (standardized access point)
2. **`{{nodeType.details}}`** - Detailed information (original structure preserved)

## Node-by-Node Output Reference

### 1. HTTP Request Node
```javascript
{
  output: { ... },              // ← The response body/data
  http: {
    statusCode: 200,
    headers: { ... },
    body: { ... },
    response: { ... }
  }
}
```
**Use `{{output}}` for:** API response data
**Use `{{http.statusCode}}` for:** HTTP status code

---

### 2. OpenAI/Gemini AI Node
```javascript
{
  output: "AI generated text...",  // ← The AI response text
  openai: {
    status: 'success',
    response: "AI generated text...",
    usage: { ... },
    timestamp: 1234567890
  }
}
```
**Use `{{output}}` for:** AI response text
**Use `{{openai.usage}}` for:** Token usage stats

---

### 3. Google Sheets Node

**Read Operation:**
```javascript
{
  output: [                     // ← Array of rows
    ["Name", "Email", "Phone"],
    ["John", "john@example.com", "123-456"]
  ],
  googleSheets: {
    status: 'success',
    operation: 'read',
    values: [...],
    rowCount: 2
  }
}
```

**Append Operation:**
```javascript
{
  output: {                     // ← Success status and count
    success: true,
    rowsAdded: 1
  },
  googleSheets: {
    status: 'success',
    operation: 'append',
    updatedRows: 1,
    updatedRange: "Sheet1!A2:C2"
  }
}
```
**Use `{{output}}` for:** Row data (read) or success info (append)
**Use `{{googleSheets.updatedRange}}` for:** Updated cell range

---

### 4. Telegram Node
```javascript
{
  output: {                     // ← Send status
    success: true,
    status: 'sent'
  },
  telegram: {
    status: 'sent',
    message: "...",
    chatId: "1256665208",
    timestamp: 1234567890
  }
}
```
**Use `{{output.success}}` for:** Conditions (if message sent successfully)
**Use `{{telegram.chatId}}` for:** Chat ID details

---

### 5. Filter Node

**Array Filtering:**
```javascript
{
  output: [                     // ← Filtered items array
    { id: 1, name: "Item 1" },
    { id: 3, name: "Item 3" }
  ],
  items: [...]                  // Same as output
}
```

**Single Item:**
```javascript
{
  output: { id: 1, name: "..." },  // ← The data itself if it passes
  // ... other fields from data
}
```
**Use `{{output}}` for:** Filtered results
**Use `{{output.length}}` for:** Count of filtered items

---

### 6. Set Node
```javascript
{
  output: {                     // ← Fields that were set
    message: "Hello {{name}}",
    timestamp: "2026-03-09"
  },
  message: "Hello John",        // Also available at root level
  timestamp: "2026-03-09",
  // ... other existing fields
}
```
**Use `{{output.message}}` or `{{message}}`** for: Accessing set values

---

### 7. Webhook Node (Trigger)
```javascript
{
  output: {                     // ← The webhook payload
    name: "John",
    email: "john@example.com",
    // ... all webhook data
  },
  name: "John",                 // Also available at root level
  email: "john@example.com"
}
```
**Use `{{output}}` for:** The entire webhook payload
**Use `{{output.name}}` or `{{name}}`** for: Individual fields

---

### 8. JavaScript Node
```javascript
{
  output: { ... },              // ← Whatever the code returns
  // ... result of code execution
}
```
**Use `{{output}}` for:** Result of JavaScript code

---

### 9. Schedule Node (Trigger)
Handled by workflow runner - trigger data available directly

---

## Using Standardized Outputs

### Example 1: Generic Condition
**Before:** Had to know specific node type
```javascript
// Only works after HTTP node
openai.response.includes("HIGH")
```

**After:** Works with any node
```javascript
// Works after HTTP, OpenAI, Filter, etc.
output.includes("HIGH")
```

### Example 2: Chaining Nodes
**Scenario:** HTTP → OpenAI → IF → Telegram

**HTTP Node** returns:
```javascript
{ output: { articles: [...] } }
```

**OpenAI Node** receives and can use:
```
User Prompt: "Analyze these articles: {{output.articles}}"
```

**OpenAI Node** outputs:
```javascript
{ output: "Importance Level: HIGH..." }
```

**IF Node** condition:
```javascript
output.includes("HIGH")  // Simple and works!
```

**Telegram Node** message:
```
Message: "AI Analysis: {{output}}"
```

### Example 3: Filtering and Counting
**Filter Node** outputs array, then use:
```javascript
// Condition: Check if any items passed filter
output.length > 0

// Access filtered data
output[0].name
```

## Benefits

1. **Easier to Set Conditions**
   - Always use `{{output}}` regardless of node type
   - No need to remember node-specific field names

2. **More Reusable Workflows**
   - Swap HTTP with another data source - conditions still work
   - Replace OpenAI with Gemini - downstream nodes unchanged

3. **Simpler Learning Curve**
   - New users only need to learn `{{output}}`
   - Advanced users can still access detailed `{{nodeType.*}}` fields

4. **Better Variable References**
   - `{{output}}` is intuitive and consistent
   - Detailed data still available when needed

## Backward Compatibility

All original field names are preserved:
- `{{http.response}}` still works
- `{{openai.response}}` still works
- `{{googleSheets.values}}` still works

Existing workflows continue to function unchanged. The `{{output}}` field is an addition, not a replacement.

## Implementation Details

**File Modified:** `ai-workflow-automation/frontend/src/engine/executeNode.ts`

All node execution functions updated to include:
```javascript
return {
  ...data,
  output: mainResult,      // ← New standardized field
  [nodeType]: { ... }      // ← Original detailed structure
};
```

## Next Steps

1. Update existing workflows to use `{{output}}` for simpler syntax
2. Create new workflows using standardized outputs
3. Test conditional nodes with generic `output` references
4. Update documentation and examples to show `{{output}}` usage
