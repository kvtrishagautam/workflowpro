export async function runTasksAnalysis(rows: any[]) {
    if (rows.length === 0) return { summaryStats: {}, chartData: {} };

    let totalTasks = rows.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;

    const ownerStats: Record<string, number> = {};
    const ownerCompleted: Record<string, number> = {};
    const priorityStats: Record<string, number> = {};
    const projectStats: Record<string, number> = {};
    const sprintStats: Record<string, number> = {};
    let totalEstimatedHours = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const row of rows) {
        const statusField = Object.keys(row).find(k => /status|state/i.test(k));
        const ownerField = Object.keys(row).find(k => /owner|assignee|user|assigned/i.test(k));
        const priorityField = Object.keys(row).find(k => /priority|urgency/i.test(k));
        const projectField = Object.keys(row).find(k => /project|module|team|epic/i.test(k));
        const sprintField = Object.keys(row).find(k => /sprint|iteration|phase|milestone/i.test(k));
        const hoursField = Object.keys(row).find(k => /hours|estimate|effort|duration/i.test(k));
        const dateField = Object.keys(row).find(k => /due|deadline|date/i.test(k));

        let isDone = false;
        if (statusField && row[statusField]) {
            const status = String(row[statusField]).toLowerCase();
            if (status.includes('done') || status.includes('complete')) {
                completedCount++;
                isDone = true;
            } else if (status.includes('progress') || status.includes('doing') || status.includes('active')) {
                inProgressCount++;
            } else {
                notStartedCount++;
            }
        }

        if (ownerField && row[ownerField]) {
            const owner = row[ownerField];
            ownerStats[owner] = (ownerStats[owner] || 0) + 1;
            if (isDone) ownerCompleted[owner] = (ownerCompleted[owner] || 0) + 1;
        }

        if (priorityField && row[priorityField]) {
            const pr = row[priorityField];
            priorityStats[pr] = (priorityStats[pr] || 0) + 1;
        }

        if (projectField && row[projectField]) {
            const proj = row[projectField];
            projectStats[proj] = (projectStats[proj] || 0) + 1;
        }

        if (sprintField && row[sprintField]) {
            const sp = row[sprintField];
            sprintStats[sp] = (sprintStats[sp] || 0) + 1;
        }

        if (hoursField && row[hoursField]) {
            totalEstimatedHours += Number(row[hoursField]) || 0;
        }

        // Check overdue
        if (dateField && row[dateField] && !isDone) {
            const dueDate = new Date(row[dateField]);
            if (!isNaN(dueDate.getTime()) && dueDate < now) {
                overdueCount++;
            }
        }
    }

    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    const statusChart = [
        { name: 'Completed', value: completedCount },
        { name: 'In Progress', value: inProgressCount },
        { name: 'Not Started', value: notStartedCount }
    ].filter(s => s.value > 0);

    const ownersChart = Object.entries(ownerStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    // Owner completion rate
    const ownerPerformance = Object.entries(ownerStats)
        .map(([name, total]) => ({
            name,
            value: Math.round(((ownerCompleted[name] || 0) / total) * 100)
        }))
        .sort((a, b) => b.value - a.value);

    const prioritiesChart = Object.entries(priorityStats)
        .map(([name, value]) => ({ name, value }));

    const projectChart = Object.entries(projectStats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    const sprintChart = Object.entries(sprintStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, value]) => ({ name, value }));

    return {
        summaryStats: {
            TotalTasks: totalTasks,
            CompletionRate: completionRate.toFixed(1) + '%',
            Completed: completedCount,
            InProgress: inProgressCount,
            NotStarted: notStartedCount,
            Overdue: overdueCount,
            EstimatedHours: totalEstimatedHours > 0 ? totalEstimatedHours + 'h' : 'N/A'
        },
        chartData: {
            'Status Breakdown': statusChart,
            'Tasks by Owner': ownersChart,
            'Owner Completion Rate %': ownerPerformance,
            'Priority Distribution': prioritiesChart,
            'Tasks by Project': projectChart,
            'Tasks by Sprint': sprintChart
        }
    };
}
