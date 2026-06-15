    async function getUser(){
        const response = await fetch('/users/employee-api/', {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        })
        const data = await response.json()
        return data.employee
    }

    const user = getUser()

    let tasksData = null;;
    let currentUser = null
    let currentDetailTask = null

    async function AddTaskData(){

        currentUser = await getUser()

        const response = await fetch('/tasks/get_tasks-api/',{
            method : 'GET',
            headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        })
        tasksData = await response.json()
        
        const EMPLOYEE_COLUMNS = [
                { id: "pending",   label: "Pending"       },
                { id: "doing",     label: "Doing"         },
                { id: "reviewing", label: "Reviewing"     },
                { id: "done",      label: "Done"          },
                { id: "failed",    label: "Failed/Missed" }
            ];
        

        function getPriorityClass(priority){
            if(priority === 'high') return 'wt-priority-high'
            if(priority === 'medium') return 'wt-priority-medium'
            return 'wt-priority-low'
        }

        function getPriorityDot(priority){
            const colors = {
                high:   '#f87171',
                medium: '#fb923c',
                low:    '#4ade80'
        };
        const color = colors[priority] || '#94a3b8';
        return `<span class="wt-dot" style="background:${color}"></span>${priority}`;
        }

        function buildEmployeeKanban(){
            document.getElementById('tasks-subtitle').textContent = 
                'Your assigned tasks - Drags card to update status'
            
            const wrapper = document.getElementById('employee-tasks')

        
            EMPLOYEE_COLUMNS.forEach(function(col){

                const colTasks = tasksData.tasks.filter(function(task){
                    return task.task_status === col.id
                });
                
                const cardsHTML = colTasks.map(function(task){
                    return `
                        <div
                            class="wt-task-card wt-draggable"
                            draggable="true"
                            data-id="${task.id}"
                            data-status="${task.task_status}"
                            onclick="openTaskDetail(${task.id})"
                            >
                            <div class="wt-task-title">${task.title}</div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="wt-task-date">📅 ${task.due_date}</span>
                                <span class="wt-priority-dot ${getPriorityClass(task.priority)}">
                                ${getPriorityDot(task.priority)}
                                </span>
                            </div>
                            </div>
                        `;
                    }).join('');
                    
                const isFailed = col.id === 'failed'

                const columnHTML = `
                    <div
                        class="wt-kanban-col ${isFailed ? 'wt-col-failed' : ''}"
                        id="col-${col.id}"
                        data-status="${col.id}"
                        >
                        <!--
                        Column header — title + count badge
                        -->
                        <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="wt-col-title">${col.label}</span>
                        <span class="wt-col-count" id="count-${col.id}">${colTasks.length}</span>
                        </div>

                        <!--
                        wt-col-body = scrollable area inside the column
                        data-status = used by drop handler to know which column this is
                        -->
                        <div
                        class="wt-col-body"
                        id="body-${col.id}"
                        data-status="${col.id}"
                        >
                        ${cardsHTML}
                        </div>
                    </div>
                    `;

                    wrapper.insertAdjacentHTML('beforeend', columnHTML)
            })
        }

        async function buildMangerKanban(){
            document.getElementById('tasks-subtitle').textContent = 
            'All team tasks assign and monitor'

            document.getElementById('assign-task-btn').classList.remove('d-none')

            document.getElementById('employee-tasks').classList.add('d-none')
            document.getElementById('manager-tasks').classList.remove('d-none')

            const kanban = document.getElementById('manager-kanban')
            const filterSelect = document.getElementById('employee-filter')

            async function getEmps() {
                const response = await fetch('/users/employee-api/', {
                    method : 'GET',
                    headers : {'Authorization' : 'Bearer ' + localStorage.getItem('access_token')}
                })

                const data = await response.json()

                return data
                
            }

            const empData =  await getEmps()
            const employees = empData.employees

            employees.forEach(function(emp){

                const filterOpt = document.createElement('option');
                filterOpt.value = emp.user.id
                filterOpt.textContent = emp.user.username
                filterSelect.appendChild(filterOpt)

                const assignOpt = document.createElement('option')
                assignOpt.value = emp.user.id
                assignOpt.textContent = emp.user.username
                document.getElementById('task-assignee').appendChild(assignOpt)

                
                

                const tasks = tasksData.tasks.filter(function(task){
                    return task.assigned_to.id === emp.user.id
                })

                const tasksHTML = tasks.map(function(task){

                    const statusColors = {
                        pending:   '#fb923c',
                        doing:     '#60a5fa',
                        reviewing: '#c084fc',
                        done:      '#4ade80',
                        failed:    '#f87171'
                    }
                    const statusColor = statusColors[task.task_status] || "#94a3b8"

                    return `
                    <div class="wt-task-card mb-2", onclick="openTaskDetail(${task.id})">
                    <div class="wt-task-title mb-2">${task.title}</div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="wt-task-date">📅 ${task.due_date}</span>
                        <span style="color:${statusColor}; font-size:12px; font-weight:500;">
                        ${task.task_status}
                        </span>
                    </div>
                    <div class="mt-2">
                        <span class="wt-priority-dot ${getPriorityClass(task.priority)}">
                        ${getPriorityDot(task.priority)}
                        </span>
                    </div>
                    </div>
                `;
                }).join('');

                const columnHTML = `
                    <div class="wt-kanban-col wt-manager-col" data-employee="${emp.user.id}">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="wt-col-title">${emp.user.username}</span>
                    <span class="wt-col-count">${tasks.length}</span>
                    </div>
                    <div class="wt-col-body">
                    ${tasksHTML}
                    </div>
                </div>
                `;

                kanban.insertAdjacentHTML('beforeend', columnHTML)


            })

            filterSelect.addEventListener('change', function(){
                const selected = filterSelect.value
                
                const allCols = kanban.querySelectorAll('.wt-manager-col')

                allCols.forEach(function(col){
                    if(selected === 'all'){
                        col.style.display = ''
                    }else{
                        if(col.dataset.employee === selected){
                            col.style.display = ''
                        }else{
                            col.style.display = 'none'
                        }
                    }

                })

            })


            document.getElementById('assign-task-submit').addEventListener('click', async function(){
                const title = document.getElementById('task-title').value.trim()
                const desc = document.getElementById('task-desc').value.trim()
                const assignee = document.getElementById('task-assignee').value
                const dueDate = document.getElementById('task-due').value
                const link = document.getElementById('task-link').value.trim()
                
                

                const priorityEl = document.querySelector('input[name="priority"]:checked')
                const priority = priorityEl ? priorityEl.value : '';

                const errorBox = document.getElementById('task-error')

                if (!title || !assignee || !dueDate || !priority || !link){
                    errorBox.classList.remove('d-none')
                    return
                }
                errorBox.classList.add('d-none')

                
                const response = await fetch('/tasks/create_tasks-api/', {
                    method : 'POST',
                    headers: {
                        'Authorization' : 'Bearer ' + localStorage.getItem('access_token'), 
                        'Content-Type' : 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        description: desc,
                        project_link: link,
                        priority: priority,
                        assigned_to_id: assignee,
                        due_date: dueDate
                    })
                })

                if(response.ok){
                    bootstrap.Modal.getInstance(
                        document.getElementById('assignTaskModal')
                    ).hide()

                    location.reload()
                }
            })

            document.getElementById('assign-task-btn').addEventListener('click', function(){
                bootstrap.Modal.getOrCreateInstance(
                    document.getElementById('assignTaskModal')
                ).show()
            })
        }

        if(currentUser.is_manager){
            buildMangerKanban()
        }else{
            buildEmployeeKanban()
        }    
}

function openTaskDetail(taskId){
    if(!tasksData) return
    const task = tasksData.tasks.find(task => task.id === taskId)
    if(!task) return

    currentDetailTask = task

    // ---- Fill modal fields ----

    // Priority badge
    const priorityColors = { high: '#f87171', medium: '#fb923c', low: '#4ade80' };
    const pBadge = document.getElementById('detail-priority-badge');
    pBadge.textContent = task.priority.toUpperCase();
    pBadge.style.color = priorityColors[task.priority] || '#94a3b8';
    pBadge.style.borderColor = priorityColors[task.priority] || '#94a3b8';

    // Status badge
    const statusColors = {
        pending: '#fb923c', doing: '#60a5fa', reviewing: '#c084fc',
        done: '#4ade80', failed: '#f87171'
    };
    const sBadge = document.getElementById('detail-status-badge');
    sBadge.textContent = task.task_status.toUpperCase();
    sBadge.style.color = statusColors[task.task_status] || '#94a3b8';
    sBadge.style.borderColor = statusColors[task.task_status] || '#94a3b8';

    // Text fields
    document.getElementById('detail-title').textContent       = task.title;
    document.getElementById('detail-description').textContent = task.description || 'No description provided.';
    document.getElementById('detail-due').textContent         = task.due_date;
    document.getElementById('detail-assigned-by').textContent = task.assigned_by ? task.assigned_by.username :  '—';
    document.getElementById('detail-assigned-to').textContent = task.assigned_to ? task.assigned_to.username :  '—';
    document.getElementById('detail-created').textContent     = new Date(task.created_at).toLocaleDateString().split('T')  || '—';

    // Project link — show section only if link exists
    const linkSection = document.getElementById('detail-link-section');
    const linkDisplay = document.getElementById('detail-project-link-display');

    if (task.project_link) {
        linkSection.classList.remove('d-none');
        linkDisplay.href        = task.project_link;
        linkDisplay.textContent = task.project_link;
    } else {
        linkSection.classList.add('d-none');
    }

    // Show correct action section
    const empActions = document.getElementById('detail-employee-actions');
    const mgrActions = document.getElementById('detail-manager-actions');

    if(currentUser.is_manager){
        empActions.classList.add('d-none');
        mgrActions.classList.remove('d-none');

        document.querySelectorAll('.wt-mgr-status-btn').forEach(btn => btn.classList.add('d-none'))

        if (task.task_status === 'reviewing'){
            document.querySelectorAll('.wt-mgr-status-btn').forEach(btn => btn.classList.remove('d-none'))}
        
        
        if (task.task_status === 'done' || task.task_status === 'failed'){
            document.getElementById('detail-edit-due').closest('.row').classList.add('d-none')
            document.getElementById('detail-save-btn').classList.add('d-none')
        }else{
            document.getElementById('detail-edit-due').closest('.row').classList.remove('d-none')
            document.getElementById('detail-save-btn').classList.remove('d-none')
        }

            
        // Pre-fill edit fields with current values
        document.getElementById('detail-edit-due').value      = task.due_date;
        document.getElementById('detail-edit-priority').value = task.priority;
        document.getElementById('detail-save-msg').classList.add('d-none');

    }else {
        mgrActions.classList.add('d-none');
        empActions.classList.remove('d-none');

        document.querySelectorAll('.wt-status-btn').forEach(b => b.classList.add('d-none'))

        if(task.task_status === 'pending'){
            document.querySelector('.wt-status-btn[data-status="doing"]').classList.remove('d-none')
        }else if(task.task_status === 'doing'){
            document.querySelector('.wt-status-btn[data-status="reviewing"]').classList.remove('d-none')
        } 
    }

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById('taskDetailModal')
    ).show()

}

function updateColCount(status) {
    const colBody  = document.getElementById('body-' + status)
    const countEl  = document.getElementById('count-' + status)
    if (colBody && countEl) {
        countEl.textContent = colBody.querySelectorAll('.wt-draggable').length
    }
}

// ---- Employee status update buttons ----
document.querySelectorAll('.wt-status-btn').forEach( async function(btn) {
  btn.addEventListener('click', async function() {

    if (!currentDetailTask) return;

    const newStatus = btn.dataset.status;

    // Update in TASKS_DATA
    currentDetailTask.task_status = newStatus;

    // Highlight clicked button
    document.querySelectorAll('.wt-status-btn').forEach(async function(b) {
      b.classList.remove('wt-status-btn-active');
    });
    btn.classList.add('wt-status-btn-active');

    // Update status badge in modal
    const statusColors = {
      pending: '#fb923c', doing: '#60a5fa', reviewing: '#c084fc',
      done: '#4ade80', failed: '#f87171'
    };
    const sBadge = document.getElementById('detail-status-badge');
    sBadge.textContent   = newStatus.toUpperCase();
    sBadge.style.color   = statusColors[newStatus];
    sBadge.style.borderColor = statusColors[newStatus];

    // Move the card to the correct column on the board
    // Find card by data-id, move it to the new column body
    const card = document.querySelector(`.wt-draggable[data-id="${currentDetailTask.id}"]`);
    const newColBody = document.getElementById('body-' + newStatus);

    if (card && newColBody) {
      const oldStatus = card.dataset.status;
      card.dataset.status = newStatus;
      newColBody.appendChild(card);
      updateColCount(oldStatus);
      updateColCount(newStatus);
    
      try{
        const response = await fetch(`/tasks/update_task-api/${currentDetailTask.id}`, {
            method : 'PATCH',
            headers : {
                'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({'task_status': newStatus})
        })
        if(response.ok){
            location.reload()
        }
    }
    catch(err){
        console.log('fetch failed', err)
        }

    }
  });
});


const saveBtn = document.getElementById('detail-save-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', async function() {

    if (!currentDetailTask) return;

    const newDue      = document.getElementById('detail-edit-due').value;
    const newPriority = document.getElementById('detail-edit-priority').value;

    // Update the task object
    currentDetailTask.due_date = newDue;
    currentDetailTask.priority = newPriority;

    // Update displayed values in modal
    document.getElementById('detail-due').textContent = newDue;

    const priorityColors = { high: '#f87171', medium: '#fb923c', low: '#4ade80' };
    const pBadge = document.getElementById('detail-priority-badge');
    pBadge.textContent    = newPriority.toUpperCase();
    pBadge.style.color    = priorityColors[newPriority];
    pBadge.style.borderColor = priorityColors[newPriority];

    try{
        const response = await fetch(`/tasks/update_task-api/${currentDetailTask.id}`, {
            method : 'PATCH',
            headers : {
                'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({'priority': newPriority, 'due_date' : newDue})
        })
        if(response.ok){
            location.reload()
        }
    }
    catch(err){
        console.log('fectch failed', err)
    }

    // Show saved confirmation
    document.getElementById('detail-save-msg').classList.remove('d-none');
  });
}
      
document.querySelectorAll('.wt-mgr-status-btn').forEach(function(btn){
    btn.addEventListener('click', async function(){
        if(!currentDetailTask) return
        const newStatus = btn.dataset.status
        const response = await fetch(`/tasks/update_task-api/${currentDetailTask.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'task_status': newStatus})
        })
        if(response.ok){
            location.reload()
        }
    })
})
AddTaskData()