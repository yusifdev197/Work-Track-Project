

async function getEmployee() {
    const response = await fetch('/users/employee-api/', {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    return await response.json()
}

async function getTasks() {
    const response = await fetch('/tasks/get_tasks-api/', {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    return await response.json()
}

async function getAttendance() {
    const response = await fetch('/users/attendance-api/', {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    return await response.json()
}

async function getTeamAttendance() {
    const response = await fetch('/users/team_attendance-api/', {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    return await response.json()
}

async function getApplications() {
    const response = await fetch('/users/applications-api/', {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    return await response.json()
}

async function fillDashboard() {
    try {
        const empData = await getEmployee()
        const user    = empData.employee

    
        const hour = new Date().getHours()
        let timeGreet = 'Good morning'
        if (hour >= 12 && hour < 17) timeGreet = 'Good afternoon'
        if (hour >= 17) timeGreet = 'Good evening'

        const name        = user.user.username
        const capitalized = name.charAt(0).toUpperCase() + name.slice(1)

        document.getElementById('greeting').textContent = `${timeGreet}, ${capitalized} 👋`
        document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })

      
        if (user.is_manager) {

            document.getElementById('attend-section').classList.add('d-none')
            document.getElementById('employee-view').classList.add('d-none')
            document.getElementById('manager-view').classList.remove('d-none')

            const tasksData      = await getTasks()
            const teamAttendance = await getTeamAttendance()
            const applications   = await getApplications()

            const todayStr     = new Date().toISOString().split('T')[0]
            const todayRecords = teamAttendance.attendance.filter(r => r.date === todayStr)
            const presentToday = todayRecords.filter(r => r.marked_today)

            const activeTasks = tasksData.tasks.filter(t =>
                t.task_status === 'pending' || t.task_status === 'doing' || t.task_status === 'reviewing'
            )

            document.getElementById('stat-employees').textContent = empData.employees.length
            document.getElementById('stat-present').textContent   = presentToday.length
            document.getElementById('stat-tasks').textContent     = activeTasks.length
            document.getElementById('stat-app').textContent      = applications.length ? applications.length : 0

            // Absent today badges
            const allEmpIds    = empData.employees.map(e => e.user.id)
            const presentIds   = presentToday.map(r => r.user)
            const absentIds    = allEmpIds.filter(id => !presentIds.includes(id))
            const absentContainer = document.getElementById('absent-list')

            if (absentIds.length === 0) {
                absentContainer.innerHTML = '<span class="text-secondary small">Everyone is present ✓</span>'
            } else {
                const empMap = {}
                empData.employees.forEach(e => empMap[e.user.id] = e.user.username)

                absentIds.forEach(function(id) {
                    const badge = document.createElement('span')
                    badge.className   = 'wt-absent-badge'
                    badge.textContent = empMap[id] || 'Employee'
                    absentContainer.appendChild(badge)
                })
            }

        
        } else {

            const tasksData      = await getTasks()
            const attendanceData = await getAttendance()

            const todayStr      = new Date().toISOString().split('T')[0]
            const todayRecord   = attendanceData.attendance.find(r => r.date === todayStr)
            const markedToday   = todayRecord ? todayRecord.marked_today : false

            const attendBtn = document.getElementById('attendance-btn')
            const attendMsg = document.getElementById('attend-msg')

            if (markedToday) {
                attendBtn.textContent = 'Attendance Marked ✓'
                attendBtn.classList.add('wt-btn-attend-done')
                attendBtn.disabled    = true
                attendMsg.textContent = 'Already marked for today.'
            }

            attendBtn.addEventListener('click', async function() {
                try {
                    const djangoTime = new Date().toISOString()

                    if (!todayRecord) {
                        await fetch('/users/create_attendance-api/', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                'marked_today': true,
                                'check_in': djangoTime,
                                'late_arrival': new Date() > (() => { const t = new Date(); t.setHours(9,15,0,0); return t; })()
                            })
                        })
                    } else {
                        await fetch(`/users/update_attendance-api/${todayRecord.id}/`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({'marked_today': true, 'check_in': djangoTime})
                        })
                    }

                    attendBtn.textContent = 'Attendance Marked ✓'
                    attendBtn.classList.add('wt-btn-attend-done')
                    attendBtn.disabled    = true
                    attendMsg.textContent = 'Attendance marked successfully!'
                    attendMsg.style.color = '#4ade80'

                } catch(err) {
                    console.log('attendance failed', err)
                }
            })

            // Task columns
            const tasks    = tasksData.tasks
            const pending  = tasks.filter(t => t.task_status === 'pending')
            const review   = tasks.filter(t => t.task_status === 'reviewing')
            const done     = tasks.filter(t => t.task_status === 'done')

            function renderTaskList(containerId, countId, taskArray) {
                const container  = document.getElementById(containerId)
                const countBadge = document.getElementById(countId)
                countBadge.textContent = taskArray.length
                container.innerHTML    = ''

                taskArray.forEach(function(task) {
                    const card = document.createElement('div')
                    card.className   = 'wt-task-card'
                    card.textContent = task.title
                    container.appendChild(card)
                })
            }

            renderTaskList('list-pending',   'count-pending',   pending)
            renderTaskList('list-review',    'count-review',    review)
            renderTaskList('list-completed', 'count-completed', done)
        }

    } catch(err) {
        console.log('dashboard failed', err)
    }
}

fillDashboard()