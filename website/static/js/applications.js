async function addApplications(){
    try{
        const response = await fetch('/users/applications-api',{
            headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        })
        
        const data = await response.json()

        const list = document.getElementById('applications-list');
        const emptyState = document.getElementById('empty-state')
        const pendingCount = document.getElementById('pending-count')

        pendingCount.textContent = data.length + ' Pending'

        list.innerHTML = ''

        if (data.length === 0){
            emptyState.classList.remove('d-none')
            return
        }

        emptyState.classList.add('d-none')

        data.forEach(application => {
            const skillBadges = application.skills.split(',').map(function(skill) {
                return `<span class="wt-skill-badge">${skill}</span>`;
            }).join('').trim();
            
            const cardHTML = `
                <div class="wt-app-card" id="app-card-${application.id}">

                <div class="d-flex justify-content-between align-items-start gap-3">

                <!-- Left side — applicant info -->
                <div class="flex-grow-1">

                    <!-- Name + applied date -->
                    <div class="d-flex align-items-center gap-3 mb-1">
                    <h6 class="text-white mb-0 fw-semibold">
                        ${application.first_name} ${application.last_name}
                    </h6>
                    <span class="wt-applied-date">Applied ${application.applied_at}</span>
                    </div>

                    <!-- Email -->
                    <p class="text-secondary small mb-2">${application.email}</p>

                    <!-- Skills -->
                    <div class="d-flex flex-wrap gap-1">
                    ${skillBadges}
                    </div>

                </div>

                <!-- Right side — Check Out button -->
                <!--
                    data-id="${application.id}" stores the applicant id on the button
                    applications.js reads this when button is clicked
                    to know which applicant to show
                -->
                <button
                    class="btn wt-btn-checkout flex-shrink-0"
                    data-id="${application.id}"
                    onclick="goToDetail(${application.id})"
                >
                    Check Out →
                </button>

                </div>
            </div>
            `
            list.insertAdjacentHTML('beforeend', cardHTML)

        });



    }
    catch(err){
        console.log('fetch failed', err)
    }
}

function goToDetail(appId){
    localStorage.setItem('selected_app', appId)
    window.location.href = '/application-detail'
}

addApplications()