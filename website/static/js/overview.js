

async function getEmp() {
    const response = await fetch('/users/employee-api/', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    const data = await response.json()
    return data
}

async function getTasks() {
    const response = await fetch('/tasks/get_tasks-api/', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    const data = await response.json()
    return data
}

async function getTeamAttendance() {
    const response = await fetch('/users/team_attendance-api/', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    const data = await response.json()
    return data
}

function formatTime(isoString) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

async function addOverViewData() {

    const empData        = await getEmp()
    const tasksData      = await getTasks()
    const teamAttendance = await getTeamAttendance()

    const allRecords = teamAttendance.attendance
    const employees  = empData.employees
    const todayStr   = new Date().toISOString().split('T')[0]

    const todayRecords  = allRecords.filter(r => r.date === todayStr)
    const presentToday  = todayRecords.filter(r => r.marked_today).map(r => r.user)
    const failedTasks   = tasksData.tasks.filter(t => t.task_status === 'failed')

    // Summary cards
    document.getElementById('ov-total').textContent   = employees.length
    document.getElementById('ov-present').textContent = presentToday.length
    document.getElementById('ov-failed').textContent  = failedTasks.length
    document.getElementById('ov-week').textContent    = tasksData.tasks_last_week.length
    document.getElementById('ov-month').textContent   = tasksData.tasks_this_month.length

    
    const now        = new Date()
    const totalDays  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()


    const tableData = employees.map(function(emp) {

        const empAttendance = allRecords.filter(r => {
            const date = new Date(r.data)
            return r.user = emp.user.id && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })

        const presentDays    = empAttendance.filter(r => r.marked_today).length
        const attendancePct  = Math.round((presentDays / totalDays) * 100)

        const empTasksMonth  = tasksData.tasks_this_month.filter(t => t.assigned_to.id === emp.user.id)
        const empTasksWeek   = tasksData.tasks_last_week.filter(t => t.assigned_to.id === emp.user.id)
        const empFailed      = tasksData.tasks.filter(t => t.assigned_to.id === emp.user.id && t.task_status === 'failed')

        const todayRecord    = todayRecords.find(r => r.user === emp.user.id)
        const presentNow     = todayRecord ? todayRecord.marked_today : false
        const checkinTime    = todayRecord && todayRecord.check_in ? formatTime(todayRecord.check_in) : null

        const taskRate       = Math.min(Math.round((empTasksMonth.length / 30) * 100), 100)
        const perfScore      = Math.round((attendancePct * 0.5) + (taskRate * 0.5))

        return {
            name:             emp.user.username,
            user_id:          emp.user.id,
            present_today:    presentNow,
            checkin_today:    checkinTime,
            tasks_done_week:  empTasksWeek.length,
            tasks_done_month: empTasksMonth.length,
            failed_tasks:     empFailed.length,
            attendance_percent: attendancePct,
            perf_score:       perfScore
        }
    })

    
    function renderTable(employees) {
        const tbody = document.getElementById('overview-tbody')
        tbody.innerHTML = ''

        employees.forEach(function(emp) {

            let perfColor = '#4ade80'
            if (emp.perf_score < 70) perfColor = '#fb923c'
            if (emp.perf_score < 50) perfColor = '#f87171'

            const statusHTML = emp.present_today
                ? `<span class="wt-status-present">● Present</span>`
                : `<span class="wt-status-absent">● Absent</span>`

            const checkinHTML = emp.checkin_today
                ? `<span class="wt-checkin-time">${emp.checkin_today}</span>`
                : `<span class="text-secondary">—</span>`

            const failedHTML = emp.failed_tasks > 0
                ? `<span style="color:#f87171; font-weight:600;">${emp.failed_tasks}</span>`
                : `<span class="text-secondary">0</span>`

            let attColor = '#4ade80'
            if (emp.attendance_percent < 80) attColor = '#fb923c'
            if (emp.attendance_percent < 60) attColor = '#f87171'

            const row = `
                <tr class="wt-table-row">
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="wt-table-avatar">${emp.name.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="text-white" style="font-size:13.5px; font-weight:500;">${emp.name}</div>
                                <div class="text-secondary" style="font-size:11px;">#${emp.user_id}</div>
                            </div>
                        </div>
                    </td>
                    <td>${statusHTML}</td>
                    <td>${checkinHTML}</td>
                    <td><span class="text-white" style="font-size:13px;">${emp.tasks_done_week}</span></td>
                    <td><span class="text-white" style="font-size:13px;">${emp.tasks_done_month}</span></td>
                    <td>${failedHTML}</td>
                    <td><span style="color:${attColor}; font-size:13px; font-weight:600;">${emp.attendance_percent}%</span></td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="wt-perf-bar-wrap">
                                <div class="wt-perf-bar-fill" style="width:${emp.perf_score}%; background-color:${perfColor};"></div>
                            </div>
                            <span style="color:${perfColor}; font-size:12px; font-weight:600; min-width:32px;">${emp.perf_score}%</span>
                        </div>
                    </td>
                </tr>
            `
            tbody.insertAdjacentHTML('beforeend', row)
        })
    }

    renderTable(tableData)

   
    document.getElementById('overview-search').addEventListener('input', function() {
        const query    = this.value.toLowerCase().trim()
        const filtered = tableData.filter(emp => emp.name.toLowerCase().includes(query))
        renderTable(filtered)
    })
}

addOverViewData()