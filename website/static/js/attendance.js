// ================================================
// attendance.js — Employee + Manager views
// ================================================

const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
]

// ================================================
// SHARED HELPERS
// ================================================

async function getUser(){
    const response = await fetch('/users/employee-api/', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    const data = await response.json()
    return data.employee
}

async function getAttendance(){
    try{
        const response = await fetch('/users/attendance-api/', {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        })
        const data = await response.json()
        return data
    }
    catch(err){
        console.log('fetch failed', err)
    }
}

async function getTeamAttendance(){
    try{
        const response = await fetch('/users/team_attendance-api/', {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        })
        const data = await response.json()
        return data
    }
    catch(err){
        console.log('fetch failed', err)
    }
}

async function getEmployees(){
    const response = await fetch('/users/employee-api/', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    const data = await response.json()
    return data.employees
}

function liveClock(){
    const now = new Date()
    document.getElementById('live-clock').textContent =
        now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
}

function getCurrentTime(){
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    return h + ':' + m
}

function calcWorkingHour(checkin, checkout){
    const diff = new Date(checkout) - new Date(checkin)
    if(diff <= 0) return '-'
    const hours = Math.floor(diff / 1000 / 60 / 60)
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    return hours + 'h ' + minutes + 'm'
}

function isLateArrival(checkinTime){
    const checkin = new Date(checkinTime)
    const threshold = new Date(checkin)
    threshold.setHours(9, 15, 0, 0)
    return checkin > threshold
}

function formatTime(isoString){
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}


// ================================================
// EMPLOYEE VIEW
// ================================================

async function initEmployeeView(){

    document.getElementById('att-today-date').textContent =
        new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
        })

    liveClock()
    setInterval(liveClock, 1000)

    const data = await getAttendance()
    let todayAttendance = data.attendance.length > 0
        ? data.attendance[data.attendance.length - 1]
        : null

    let attendanceId = todayAttendance ? todayAttendance.id : null

    const checkinBtn  = document.getElementById('checkin-btn')
    const checkoutBtn = document.getElementById('checkout-btn')
    const todayTimes  = document.getElementById('today-times')

    // Restore state if already checked in today
    if(todayAttendance && todayAttendance.marked_today){
        restoreCheckingState(todayAttendance.check_in, todayAttendance.check_out)
    }

    function restoreCheckingState(checkin, checkout){
        checkinBtn.textContent = 'Checked In ✓'
        checkinBtn.disabled    = true
        checkinBtn.classList.add('wt-btn-checked-in')
        checkoutBtn.disabled   = false
        todayTimes.classList.remove('d-none')

        document.getElementById('display-checkin').textContent = formatTime(checkin)

        if(checkout){
            document.getElementById('display-checkout').textContent = formatTime(checkout)
            document.getElementById('display-checkout').className = 'wt-time-value wt-time-green'
            document.getElementById('display-hours').textContent = calcWorkingHour(checkin, checkout)
            document.getElementById('display-hours').className = 'wt-time-value wt-time-green'
            checkoutBtn.textContent = 'Checked Out ✓'
            checkoutBtn.disabled    = true
            checkoutBtn.classList.add('wt-btn-checked-out')
        }

        if(isLateArrival(checkin)){
            document.getElementById('late-warning').classList.remove('d-none')
        }
    }

    // Check in
    checkinBtn.addEventListener('click', async function(){
        const djangoTime = new Date().toISOString()
        try{
            if(!todayAttendance){
                const response = await fetch('/users/create_attendance-api/', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'marked_today': true,
                        'check_in': djangoTime,
                        'late_arrival': isLateArrival(djangoTime)
                    })
                })
                const newRecord = await response.json()
                attendanceId    = newRecord.id
                todayAttendance = newRecord
            } else {
                await fetch(`/users/update_attendance-api/${attendanceId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'marked_today': true,
                        'check_in': djangoTime,
                        'late_arrival': isLateArrival(djangoTime)
                    })
                })
            }

            restoreCheckingState(djangoTime, null)

        }
        catch(err){
            console.log('fetch failed', err)
        }
    })

    // Check out
    checkoutBtn.addEventListener('click', async function(){
        const djangoTime = new Date().toISOString()
        try{
            await fetch(`/users/update_attendance-api/${attendanceId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'check_out': djangoTime,
                    'late_arrival': isLateArrival(todayAttendance.check_in)
                })
            })

            document.getElementById('display-checkout').textContent = formatTime(djangoTime)
            document.getElementById('display-checkout').className = 'wt-time-value wt-time-green'

            const hours = calcWorkingHour(todayAttendance.check_in, djangoTime)
            document.getElementById('display-hours').textContent = hours
            document.getElementById('display-hours').className = 'wt-time-value wt-time-green'

            checkoutBtn.textContent = 'Checked Out ✓'
            checkoutBtn.disabled    = true
            checkoutBtn.classList.add('wt-btn-checked-out')

        }
        catch(err){
            console.log('fetch failed', err)
        }
    })

    // Monthly summary
    function buildSummary(records){

        const now = new Date()
        const thisMonthRecords  = records.filter(function(r){
            const date = new Date(r.date)
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() 
        })

        const presentDays = thisMonthRecords.filter(r => r.marked_today === true).length
        const lateDays    = thisMonthRecords.filter(r => r.late_arrival === true).length
        const totalDays   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const absentDays  = records.filter(r => r.was_absent === true).length
        const rate        = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

        document.getElementById('summary-present').textContent = presentDays + ' days'
        document.getElementById('summary-absent').textContent  = absentDays  + ' days'
        document.getElementById('summary-late').textContent    = lateDays    + ' days'
        document.getElementById('summary-rate').textContent    = rate        + '%'

        const bar = document.getElementById('summary-bar')
        bar.style.width           = rate + '%'
        bar.style.backgroundColor = rate >= 80 ? '#4ade80' : rate >= 60 ? '#fb923c' : '#f87171'
    }

    buildSummary(data.attendance)

    // Calendar
    const recordMap = {}
    data.attendance.forEach(function(r){
        recordMap[r.date] = r
    })

    const now = new Date()
    let displayMonth = now.getMonth()
    let displayYear  = now.getFullYear()

    function buildCalendar(month, year){
        const grid  = document.getElementById('cal-grid')
        const label = document.getElementById('cal-month-label')
        label.textContent = MONTH_NAMES[month] + ' ' + year
        grid.innerHTML    = ''

        const firstDay      = new Date(year, month, 1).getDay()
        const daysInMonth   = new Date(year, month + 1, 0).getDate()
        const todayDate     = new Date()
        const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year

        for(let i = 0; i < firstDay; i++){
            const empty = document.createElement('div')
            empty.className = 'wt-cal-cell wt-cal-empty'
            grid.appendChild(empty)
        }

        for(let day = 1; day <= daysInMonth; day++){
            const mm      = String(month + 1).padStart(2, '0')
            const dd      = String(day).padStart(2, '0')
            const dateStr = year + '-' + mm + '-' + dd

            const cell = document.createElement('div')
            cell.className  = 'wt-cal-cell'
            cell.textContent = day

            const record = recordMap[dateStr]

            if(isCurrentMonth && day === todayDate.getDate()){
                cell.classList.add('wt-cal-today')
            } else if(record && record.marked_today){
                if(record.late_arrival){
                    cell.classList.add('wt-cal-late')
                    cell.title = 'Late arrival — ' + formatTime(record.check_in)
                } else {
                    cell.classList.add('wt-cal-present')
                    cell.title = 'Present — ' + formatTime(record.check_in)
                }
            }

            grid.appendChild(cell)
        }
    }

    buildCalendar(displayMonth, displayYear)

    document.getElementById('prev-month').addEventListener('click', function(){
        displayMonth--
        if(displayMonth < 0){ displayMonth = 11; displayYear-- }
        buildCalendar(displayMonth, displayYear)
    })

    document.getElementById('next-month').addEventListener('click', function(){
        displayMonth++
        if(displayMonth > 11){ displayMonth = 0; displayYear++ }
        buildCalendar(displayMonth, displayYear)
    })
}


// ================================================
// MANAGER VIEW
// ================================================

async function initManagerView(){

    const teamData  = await getTeamAttendance()
    const employees = await getEmployees()
    const allRecords = teamData.attendance

    const todayStr = new Date().toISOString().split('T')[0]

    // Build employee name map: user id → username
    const empMap = {}
    employees.forEach(function(emp){
        empMap[emp.user.id] = emp.user.username
    })

    // TODAY — present and absent
    const todayRecords = allRecords.filter(r => r.date === todayStr)
    const presentList  = document.getElementById('present-today-list')
    const absentList   = document.getElementById('absent-today-list')

    // Get all employee ids
    const allEmpIds    = employees.map(e => e.user.id)
    const presentToday = todayRecords.filter(r => r.marked_today).map(r => r.user)
    const absentToday  = allEmpIds.filter(id => !presentToday.includes(id))

    presentToday.forEach(function(userId){
        const badge = document.createElement('span')
        badge.className   = 'wt-today-badge wt-today-badge-present'
        badge.textContent = empMap[userId] || 'Employee'
        presentList.appendChild(badge)
    })

    absentToday.forEach(function(userId){
        const badge = document.createElement('span')
        badge.className   = 'wt-today-badge wt-today-badge-absent'
        badge.textContent = empMap[userId] || 'Employee'
        absentList.appendChild(badge)
    })

    if(presentList.children.length === 0){
        presentList.innerHTML = '<span class="text-secondary small">None yet</span>'
    }
    if(absentList.children.length === 0){
        absentList.innerHTML = '<span class="text-secondary small">Everyone marked ✓</span>'
    }

    // Fill employee filter dropdown
    const filterEmployee = document.getElementById('filter-employee')
    employees.forEach(function(emp){
        const opt = document.createElement('option')
        opt.value       = emp.user.id
        opt.textContent = emp.user.username
        filterEmployee.appendChild(opt)
    })

    // Render table
    function renderTable(records){
        const tbody   = document.getElementById('attendance-tbody')
        const emptyEl = document.getElementById('att-empty')
        tbody.innerHTML = ''

        if(records.length === 0){
            emptyEl.classList.remove('d-none')
            return
        }

        emptyEl.classList.add('d-none')

        records.forEach(function(r, index){
            const empName    = empMap[r.user] || 'Employee'
            const statusHTML = r.marked_today
                ? `<span class="wt-status-present">● Present</span>`
                : `<span class="wt-status-absent">● Absent</span>`

            const row = `
                <tr class="wt-table-row">
                    <td class="text-secondary">${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="wt-table-avatar">${empName.charAt(0).toUpperCase()}</div>
                            <span class="text-white" style="font-size:13.5px;">${empName}</span>
                        </div>
                    </td>
                    <td class="text-secondary">${r.date}</td>
                    <td>${statusHTML}</td>
                </tr>
            `
            tbody.insertAdjacentHTML('beforeend', row)
        })
    }

    renderTable(allRecords)

    // Filters
    function applyFilters(){
        const empVal  = filterEmployee.value
        const dateVal = document.getElementById('filter-date').value
        let filtered  = allRecords

        if(empVal !== 'all'){
            filtered = filtered.filter(r => String(r.user) === String(empVal))
        }
        if(dateVal){
            filtered = filtered.filter(r => r.date === dateVal)
        }

        renderTable(filtered)
    }

    filterEmployee.addEventListener('change', applyFilters)
    document.getElementById('filter-date').addEventListener('change', applyFilters)
    document.getElementById('clear-filters').addEventListener('click', function(){
        filterEmployee.value = 'all'
        document.getElementById('filter-date').value = ''
        renderTable(allRecords)
    })

    // Export CSV
    document.getElementById('export-csv').addEventListener('click', function(){
        let csv = 'Employee,Date,Status,Check-in,Check-out\n'
        allRecords.forEach(function(r){
            const name    = empMap[r.user] || 'Employee'
            const status  = r.marked_today ? 'Present' : 'Absent'
            const checkin  = r.check_in  ? formatTime(r.check_in)  : '-'
            const checkout = r.check_out ? formatTime(r.check_out) : '-'
            csv += `${name},${r.date},${status},${checkin},${checkout}\n`
        })

        const blob = new Blob([csv], {type: 'text/csv'})
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = 'worktrack-attendance.csv'
        a.click()
        URL.revokeObjectURL(url)
    })
}


// ================================================
// INIT — decide which view to show
// ================================================

async function init(){
    const user = await getUser()

    if(user.is_manager){
        document.getElementById('manager-attendance').classList.remove('d-none')
        await initManagerView()
    } else {
        document.getElementById('employee-attendance').classList.remove('d-none')
        await initEmployeeView()
    }
}

init()