export async function runAttendanceAnalysis(rows: any[]) {
    if (rows.length === 0) return { summaryStats: {}, chartData: {} };

    let totalRecords = rows.length;
    let presentCount = 0;
    let absentCount = 0;

    const departmentPresent: Record<string, number> = {};
    const departmentAbsent: Record<string, number> = {};
    const employeePresent: Record<string, number> = {};
    const employeeTotal: Record<string, number> = {};
    const dailyCounts: Record<string, { present: number; absent: number }> = {};
    let totalHoursWorked = 0;
    let hoursCount = 0;

    for (const row of rows) {
        const statusField = Object.keys(row).find(k => /status|present|attendance/i.test(k));
        const deptField = Object.keys(row).find(k => /department|team|group|division/i.test(k));
        const dateField = Object.keys(row).find(k => /date|day/i.test(k));
        const nameField = Object.keys(row).find(k => /name|employee/i.test(k));
        const hoursField = Object.keys(row).find(k => /hours|worked|duration/i.test(k));

        let isPresent = false;
        if (statusField && row[statusField]) {
            const status = String(row[statusField]).toLowerCase();
            if (status.includes('present') || status === 'p' || status === 'yes' || status === 'true') {
                isPresent = true;
                presentCount++;
            } else {
                absentCount++;
            }
        }

        if (deptField && row[deptField]) {
            const dept = row[deptField];
            if (isPresent) {
                departmentPresent[dept] = (departmentPresent[dept] || 0) + 1;
            } else {
                departmentAbsent[dept] = (departmentAbsent[dept] || 0) + 1;
            }
        }

        if (nameField && row[nameField]) {
            const emp = row[nameField];
            employeeTotal[emp] = (employeeTotal[emp] || 0) + 1;
            if (isPresent) employeePresent[emp] = (employeePresent[emp] || 0) + 1;
        }

        if (dateField && row[dateField]) {
            const dateStr = String(row[dateField]).substring(0, 10);
            if (!dailyCounts[dateStr]) dailyCounts[dateStr] = { present: 0, absent: 0 };
            if (isPresent) dailyCounts[dateStr].present++;
            else dailyCounts[dateStr].absent++;
        }

        if (hoursField && row[hoursField]) {
            const h = Number(row[hoursField]);
            if (!isNaN(h) && h > 0) {
                totalHoursWorked += h;
                hoursCount++;
            }
        }
    }

    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    const avgHours = hoursCount > 0 ? totalHoursWorked / hoursCount : 0;

    // Department attendance comparison
    const allDepts = new Set([...Object.keys(departmentPresent), ...Object.keys(departmentAbsent)]);
    const deptChart = [...allDepts].map(dept => ({
        name: dept,
        value: departmentPresent[dept] || 0
    })).sort((a, b) => b.value - a.value);

    const deptAbsentChart = [...allDepts].map(dept => ({
        name: dept,
        value: departmentAbsent[dept] || 0
    })).sort((a, b) => b.value - a.value);

    // Employee attendance rate
    const empAttendanceRate = Object.entries(employeeTotal)
        .map(([name, total]) => ({
            name,
            value: Math.round(((employeePresent[name] || 0) / total) * 100)
        }))
        .sort((a, b) => b.value - a.value);

    // Daily trend
    const dailyTrend = Object.entries(dailyCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, stats]) => ({ name, value: stats.present }));

    // Present vs Absent overall
    const overallChart = [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount }
    ].filter(s => s.value > 0);

    return {
        summaryStats: {
            TotalRecords: totalRecords,
            AttendanceRate: attendanceRate.toFixed(1) + '%',
            Present: presentCount,
            Absent: absentCount,
            AvgHoursWorked: avgHours > 0 ? avgHours.toFixed(1) + 'h' : 'N/A',
            TotalHoursLogged: totalHoursWorked > 0 ? totalHoursWorked.toFixed(1) + 'h' : 'N/A'
        },
        chartData: {
            'Attendance Overview': overallChart,
            'Present by Department': deptChart,
            'Absent by Department': deptAbsentChart,
            'Employee Attendance Rate %': empAttendanceRate,
            'Daily Attendance Trend': dailyTrend
        }
    };
}
