

async function getUserData() {
    try{
    const respone = await fetch('/users/employee-api/', {
        method: 'GET',
        headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    
    data = await respone.json()
    return data 


    }catch(err){
        console.log('fetch failed', err)
    }
}

async function getTasksData() {
    try{
    const respone = await fetch('/tasks/get_tasks-api/', {
        method: 'GET',
        headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })

    data = await respone.json()
    return data 


    }catch(err){
        console.log('fetch failed', err)
    }
}

async function getAttendacneData() {
    try{
    const respone = await fetch('/users/attendance-api/', {
        method: 'GET',
        headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })

    data = await respone.json()
    return data


    }catch(err){
        console.log('fetch failed', err)
    }
}


async function AddProfileData() {
    const tasks = await getTasksData()
    const user = await getUserData()
    const attendance = await getAttendacneData()
    

    profileAvatar = document.getElementById('profile-avatar')

    profileAvatar.src = user.employee.profile_image
    document.getElementById('profile-name').textContent = user.employee.user.username
    document.getElementById('profile-userid').textContent = user.employee.user.username;
    document.getElementById('profile-joined').textContent = 
    new Date(user.employee.joined_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const skillsContainer = document.getElementById('profile-skills')
    user.employee.skills.split(',').forEach(function(skill) {
        const badge = document.createElement('span')
        badge.className = 'wt-skill-badge wt-skill-badge-lg'
        badge.textContent = skill
        skillsContainer.appendChild(badge)
    });

    const avatarTrigger = document.getElementById('avatar-upload-trigger');
    const avatarInput   = document.getElementById('avatar-file-input');

    avatarTrigger.addEventListener('click', function() {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', async function() {
        const file = this.files[0]
        if(!file) return

        if(file.size > 8 * 1024 * 1024){
            alert('Image must be under 8MB')
            this.value = ''
            return
        }

        const formData = new FormData()
        formData.append('profile_image', file)

        try{
        const respone = await fetch(`/users/update_profile-api/${user.employee.id}`, {
            method: 'PATCH',
            headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')},
            body: formData
        })
        if (respone.ok){
            const data = await respone.json()
            document.getElementById('profile-avatar').src = data.profile_image + '?t' + Date.now()
            document.getElementById('nav-avatar').src = data.profile_image + '?t' + Date.now()
        }
        
    }
    catch(err){
        console.log('fetch failed', err)
    }
    })

    const viewGithub   = document.getElementById('view-github');
    const viewLinkedin = document.getElementById('view-linkedin');
    const inputGithub  = document.getElementById('input-github');
    const inputLinkedin= document.getElementById('input-linkedin');

    function renderSocialLinks() {

    if (user.employee.git_link) {
        viewGithub.href        = user.employee.git_link;
        viewGithub.textContent = user.employee.git_link;
        viewGithub.style.color = '#e2e8f0';
    } else {
        viewGithub.href        = '#';
        viewGithub.textContent = 'Not added yet';
        viewGithub.style.color = '#4a5568';
        viewGithub.removeAttribute('href');
    }

    if (user.employee.linkedin_link) {
        viewLinkedin.href        = user.employee.linkedin_link;
        viewLinkedin.textContent = user.employee.linkedin_link;
        viewLinkedin.style.color = '#e2e8f0';
    } else {
        viewLinkedin.href        = '#';
        viewLinkedin.textContent = 'Not added yet';
        viewLinkedin.style.color = '#4a5568';
        viewLinkedin.removeAttribute('href');
    }
    }

    renderSocialLinks()

    document.getElementById('links-edit-btn').addEventListener('click', function() {
    document.getElementById('links-view-mode').classList.add('d-none');
    document.getElementById('links-edit-mode').classList.remove('d-none');
    this.classList.add('d-none');

    // Pre-fill inputs with saved values
    inputGithub.value   = user.employee.git_link   || '';
    inputLinkedin.value = user.employee.linkedin_link || '';
    });

    // Cancel — switch back to view mode
    document.getElementById('links-cancel-btn').addEventListener('click', function() {
    document.getElementById('links-edit-mode').classList.add('d-none');
    document.getElementById('links-view-mode').classList.remove('d-none');
    document.getElementById('links-edit-btn').classList.remove('d-none');
    });

    // Save — validate + save to localStorage
    document.getElementById('links-save-btn').addEventListener('click', async function() {

    const github   = inputGithub.value.trim();
    const linkedin = inputLinkedin.value.trim();

    // Save
    try{

        const respone = await fetch(`/users/update_links-api/${user.employee.id}`, {
            method : 'PATCH',
            headers : {
                'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({'linkedin_link' : linkedin, 'git_link' : github})

        })


    }catch(err){
        console.log('fetch failed', err)
    }

    // Switch back to view mode
    document.getElementById('links-edit-mode').classList.add('d-none');
    document.getElementById('links-view-mode').classList.remove('d-none');
    document.getElementById('links-edit-btn').classList.remove('d-none');

    // Re-render links
    user.employee.linkedin_link = linkedin
    user.employee.git_link = github
    renderSocialLinks();
    });

    if(!user.employee.is_manager){
        document.getElementById('stat-tasks-done').textContent  = tasks.tasks.filter( t => t.task_status === 'done').length;
        document.getElementById('stat-tasks-doing').textContent = tasks.tasks.filter( t => t.task_status === 'doing').length;
        document.getElementById('stat-failed').textContent      = tasks.tasks.filter( t => t.task_status === 'failed').length;
        const now = new Date()
        const thisMonthRecords  = attendance.attendance.filter(function(r){
            const date = new Date(r.date)
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() 
        })
        
    
        const presentDays = thisMonthRecords.filter(r => r.marked_today === true).length        
        const totalDays   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

        const attRate  = Math.round((presentDays / totalDays) * 100)
        const attColor = attRate >= 80 ? '#4ade80' : attRate >= 60 ? '#fb923c' : '#f87171'

        document.getElementById('stat-attendance-pct').textContent = attRate + '%'
        document.getElementById('stat-attendance-pct').style.color = attColor
        document.getElementById('stat-attendance').style.color     = attColor
        document.getElementById('stat-attendance').textContent     = presentDays + '/' + totalDays

        const bar = document.getElementById('stat-attendance-bar')
        bar.style.width           = attRate + '%'
        bar.style.backgroundColor = attColor
    }else{
        document.getElementById('skill-card').classList.add('d-none')
        document.getElementById('stats-card').classList.add('d-none')
        document.getElementById('link-card').classList.add('d-none')
        document.getElementById('contact-p').classList.add('d-none')
    }


}

AddProfileData()