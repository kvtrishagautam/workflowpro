
// Simple get implementation to avoid dependencies
function get(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function processTemplate(template, previousOutput) {
    if (!template) return '';

    // Simulate the regex logic from `discord.executor.ts`
    return template.replace(/\${([^}]+)}|\{\{([^}]+)\}\}/g, (_, path1, path2) => {
        const path = path1 || path2;
        const cleanPath = path.replace('data.', '').trim();
        const value = get(previousOutput, cleanPath);
        console.log(`Debug: Processing ${path} -> ${cleanPath} -> ${value}`);
        return value !== undefined ? value : '';
    });
}

// 1. Test case: Empty object (JS returns undefined for totalBooked)
const outputUndefined = {};
const result1 = processTemplate('This week we have **${data.totalBooked}** booked orders', outputUndefined);
console.log('Result 1 (Undefined):', result1); // Expect: "This week we have **** booked orders"

// 2. Test case: Calculate 0 (JS returns 0 for totalBooked)
const outputZero = { totalBooked: 0, bookedSum: 0 };
const result2 = processTemplate('This week we have **${data.totalBooked}** booked orders', outputZero);
console.log('Result 2 (Zero):', result2); // Expect: "This week we have **0** booked orders"

// 3. Test case: Proper calculation (JS returns 2 for totalBooked)
const outputTwo = { totalBooked: 2, bookedSum: 200 };
const result3 = processTemplate('This week we have **${data.totalBooked}** booked orders', outputTwo);
console.log('Result 3 (Calculate):', result3); // Expect: "This week we have **2** booked orders"
