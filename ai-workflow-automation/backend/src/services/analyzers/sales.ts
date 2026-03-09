export async function runSalesAnalysis(rows: any[]) {
    if (rows.length === 0) return { summaryStats: {}, chartData: {} };

    let totalRevenue = 0;
    let totalItems = 0;
    const categoryTotals: Record<string, number> = {};
    const dateTrends: Record<string, number> = {};
    const regionTotals: Record<string, number> = {};
    const salespersonTotals: Record<string, number> = {};
    const productTotals: Record<string, number> = {};
    let highestSale = 0;
    let lowestSale = Infinity;

    for (const row of rows) {
        const revenueField = Object.keys(row).find(k => /revenue|amount|price|total|sales/i.test(k));
        const dateField = Object.keys(row).find(k => /date|time/i.test(k));
        const categoryField = Object.keys(row).find(k => /category|type/i.test(k));
        const regionField = Object.keys(row).find(k => /region|location|area|territory|city/i.test(k));
        const personField = Object.keys(row).find(k => /salesperson|rep|agent|employee|seller/i.test(k));
        const productField = Object.keys(row).find(k => /product|item|name|sku/i.test(k));

        const amount = revenueField ? Number(row[revenueField]) || 0 : 0;
        totalRevenue += amount;
        totalItems++;
        if (amount > highestSale) highestSale = amount;
        if (amount > 0 && amount < lowestSale) lowestSale = amount;

        if (categoryField && row[categoryField]) {
            const cat = row[categoryField];
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        }

        if (regionField && row[regionField]) {
            const reg = row[regionField];
            regionTotals[reg] = (regionTotals[reg] || 0) + amount;
        }

        if (personField && row[personField]) {
            const sp = row[personField];
            salespersonTotals[sp] = (salespersonTotals[sp] || 0) + amount;
        }

        if (productField && row[productField]) {
            const p = row[productField];
            productTotals[p] = (productTotals[p] || 0) + amount;
        }

        if (dateField && row[dateField] && amount > 0) {
            const dateStr = String(row[dateField]).substring(0, 7); // YYYY-MM
            dateTrends[dateStr] = (dateTrends[dateStr] || 0) + amount;
        }
    }

    const avgSale = totalItems > 0 ? totalRevenue / totalItems : 0;

    // Chart data - all using {name, value} format
    const categoryChart = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const regionChart = Object.entries(regionTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const salespersonChart = Object.entries(salespersonTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const productChart = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const trendChart = Object.entries(dateTrends)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, value]) => ({ name, value }));

    return {
        summaryStats: {
            TotalRevenue: '₹' + totalRevenue.toLocaleString(),
            TotalTransactions: totalItems,
            AverageOrderValue: '₹' + avgSale.toFixed(0),
            HighestSale: '₹' + highestSale.toLocaleString(),
            TopCategory: categoryChart.length > 0 ? categoryChart[0].name : 'N/A',
            TopSalesperson: salespersonChart.length > 0 ? salespersonChart[0].name : 'N/A'
        },
        chartData: {
            'Revenue by Category': categoryChart,
            'Revenue by Region': regionChart,
            'Top Salespersons': salespersonChart,
            'Top Products': productChart,
            'Monthly Revenue Trend': trendChart
        }
    };
}
