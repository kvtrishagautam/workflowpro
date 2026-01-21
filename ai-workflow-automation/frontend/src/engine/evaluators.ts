export function evaluateCondition(rule: any, data: any): boolean {
    const left = data[rule.field];
    const right = rule.value;

    switch (rule.operator) {
        case '>':
            return left > right;
        case '<':
            return left < right;
        case '==':
            return left === right;
        case 'contains':
            return left?.toString().includes(right?.toString());
        default:
            return false;
    }
}
