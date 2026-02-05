
import { conditionExecutor } from '../src/executors/condition.executor';
import { ExecutionContext } from '../src/types';

async function runTest() {
    console.log('🧪 Testing Condition Logic...');

    const testCases = [
        {
            name: 'Boolean True == String "true"',
            input: { isActive: true },
            config: { field: 'isActive', operator: 'equals', value: 'true' },
            expected: true
        },
        {
            name: 'Boolean False == String "false"',
            input: { isActive: false },
            config: { field: 'isActive', operator: 'equals', value: 'false' },
            expected: true
        },
        {
            name: 'String matching (case insensitive)',
            input: { status: 'Active' },
            config: { field: 'status', operator: 'equals', value: 'active' },
            expected: false // equals is strict value check, assume strict case for now unless changed
        },
        {
            name: 'Contains (case insensitive request)',
            input: { email: 'User@Example.com' },
            config: { field: 'email', operator: 'contains', value: 'example' },
            expected: true
        },
        {
            name: 'Greater Than (Numeric String)',
            input: { count: "100" },
            config: { field: 'count', operator: 'greaterThan', value: "50" },
            expected: true
        },
        {
            name: 'Is Empty (Empty Array)',
            input: { items: [] },
            config: { field: 'items', operator: 'isEmpty' },
            expected: true
        },
        {
            name: 'Is Empty (Null)',
            input: { items: null },
            config: { field: 'items', operator: 'isEmpty' },
            expected: true
        }
    ];

    let passed = 0;

    for (const test of testCases) {
        const context: ExecutionContext = {
            workflowId: 'test',
            executionId: 'test',
            previousNodeOutput: test.input,
            data: { config: test.config }
        };

        const result = await conditionExecutor.execute(context);
        const actual = result.outputHandle === 'true';

        if (actual === test.expected) {
            console.log(`✅ ${test.name}: Passed`);
            passed++;
        } else {
            console.error(`❌ ${test.name}: Failed (Expected ${test.expected}, Got ${actual})`);
        }
    }

    console.log(`\nResults: ${passed}/${testCases.length} Passed`);

    if (passed === testCases.length) {
        console.log('🎉 All logic tests passed!');
    } else {
        console.error('⚠️ Some tests failed.');
        process.exit(1);
    }
}

runTest();
