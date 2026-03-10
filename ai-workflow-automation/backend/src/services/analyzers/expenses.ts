export async function runExpensesAnalysis(rows: any[]) {
    if (rows.length === 0) return { summaryStats: {}, chartData: {} };

    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};
    const monthlyTrends: Record<string, number> = {};
    const departmentTotals: Record<string, number> = {};
    const employeeTotals: Record<string, number> = {};
    const merchantTotals: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};
    let highestExpense = 0;
    let lowestExpense = Infinity;
    let expenseCount = 0;

    for (const row of rows) {
        const amountField = Object.keys(row).find(k => /amount|cost|expense|price|total/i.test(k));
        const categoryField = Object.keys(row).find(k => /category|type/i.test(k));
        const dateField = Object.keys(row).find(k => /date|time/i.test(k));
        const deptField = Object.keys(row).find(k => /department|team|division|group/i.test(k));
        const employeeField = Object.keys(row).find(k => /employee|name|person|submitted|requester/i.test(k));
        const merchantField = Object.keys(row).find(k => /merchant|vendor|supplier|store/i.test(k));
        const paymentField = Object.keys(row).find(k => /payment|method|mode/i.test(k));

        const amount = amountField ? Number(row[amountField]) || 0 : 0;
        totalExpenses += amount;
        if (amount > 0) {
            expenseCount++;
            if (amount > highestExpense) highestExpense = amount;
            if (amount < lowestExpense) lowestExpense = amount;
        }

        if (categoryField && row[categoryField]) {
            const cat = row[categoryField];
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        }

        if (deptField && row[deptField]) {
            const dept = row[deptField];
            departmentTotals[dept] = (departmentTotals[dept] || 0) + amount;
        }

        if (employeeField && row[employeeField]) {
            const emp = row[employeeField];
            employeeTotals[emp] = (employeeTotals[emp] || 0) + amount;
        }

        if (merchantField && row[merchantField]) {
            const m = row[merchantField];
            merchantTotals[m] = (merchantTotals[m] || 0) + amount;
        }

        if (paymentField && row[paymentField]) {
            const p = row[paymentField];
            paymentMethods[p] = (paymentMethods[p] || 0) + amount;
        }

        if (dateField && row[dateField] && amount > 0) {
            const dateStr = String(row[dateField]).substring(0, 7);
            monthlyTrends[dateStr] = (monthlyTrends[dateStr] || 0) + amount;
        }
    }

    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    const categoryChart = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    const departmentChart = Object.entries(departmentTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    const employeeChart = Object.entries(employeeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const merchantChart = Object.entries(merchantTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const paymentChart = Object.entries(paymentMethods)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    const trendChart = Object.entries(monthlyTrends)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, value]) => ({ name, value }));

    return {
        summaryStats: {
            TotalExpenses: '₹' + totalExpenses.toLocaleString(),
            TotalRecords: expenseCount,
            AverageExpense: '₹' + avgExpense.toFixed(0),
            HighestExpense: '₹' + highestExpense.toLocaleString(),
            TopCategory: categoryChart.length > 0 ? categoryChart[0].name : 'N/A',
            TopDepartment: departmentChart.length > 0 ? departmentChart[0].name : 'N/A'
        },
        chartData: {
            'Spending by Category': categoryChart,
            'Spending by Department': departmentChart,
            'Top Spenders': employeeChart,
            'Top Merchants': merchantChart,
            'Payment Methods': paymentChart,
            'Monthly Spending Trend': trendChart
        }
    };
}
