console.log('detail loaded')

async function addApplicationData(){
  
  const selectedPk = parseInt(localStorage.getItem('selected_app'))

  if(!selectedPk){
    window.location.href = '/applications'
    return
  }

  try{
    
    const response = await fetch(`/users/application_detail-api/${selectedPk}`, {
      headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    })
    
    const data = await response.json()

    document.getElementById('detail-name').textContent = data.first_name + ' ' + data.last_name
    document.getElementById('detail-email').textContent = data.email
    document.getElementById('detail-email-2').textContent = data.email
    document.getElementById('detail-phone').textContent = data.phone
    document.getElementById('detail-date').textContent = data.applied_at
    document.getElementById('detail-about').textContent = data.about

    const skillsContainer = document.getElementById('detail-skills')
    data.skills.split(',').forEach(function(skill) {
        const badge = document.createElement('span')
        badge.className = 'wt-skill-badge'
        badge.textContent = skill
        skillsContainer.appendChild(badge)
    });

    const projectLink = document.getElementById('detail-project-link');
    projectLink.href = data.project_link
    projectLink.textContent = data.project_link 

    const cvLink = document.getElementById('detail-cv')
    cvLink.href = data.cv
    cvLink.textContent = '⬇ ' +data.cv

    // approve button
    document.getElementById('approve-btn').addEventListener('click', async function(){
      try{

        const create_emp_response = await fetch(`/users/create_employee-api/${selectedPk}`, {
          method : 'POST',
          headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        }) 
      
        if(create_emp_response.ok){
          document.getElementById('detail-content').classList.add('d-none')
          document.getElementById('action-result').classList.remove('d-none')
          document.getElementById('action-icon').style.color = '#4ade80'
          document.getElementById('action-icon').textContent = '✓'
          document.getElementById('action-result').style.borderColor = '#166534'
          document.getElementById('action-result').style.backgroundColor = '#0d2b1a'
          document.getElementById('action-title').textContent =
            data.first_name + ' has been approved! '
          document.getElementById('action-msg').textContent = 
            'An account has been created and login credentials have been send to ' + data.email
          localStorage.removeItem('selected_app')
        }
        else{
          console.log('fetch failed')
        }
      }

      catch(err){
        console.log('fetch failed', err)
      }
    })

    // reject button 
    document.getElementById('reject-btn').addEventListener('click', async function(){
      try{

        const create_emp_response = await fetch(`/users/delete_application-api/${selectedPk}`, {
          method: 'DELETE',
          headers : {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
        }) 

        if(create_emp_response.ok){
          document.getElementById('detail-content').classList.add('d-none')
          document.getElementById('action-result').classList.remove('d-none')
          document.getElementById('action-icon').style.color = '#f87171'
          document.getElementById('action-icon').textContent = '✗'
          document.getElementById('action-result').style.borderColor = '#991b1b'
          document.getElementById('action-result').style.backgroundColor = '#2a0f0f'
          document.getElementById('action-title').textContent =
            data.first_name + '\'s application has been rejected '
          document.getElementById('action-msg').textContent = 
            'A rejection email has been sent to ' + data.email
          localStorage.removeItem('selected_app')
          
        }
        else{
          console.log('fetch failed')
        }
      }

      catch(err){
        console.log('fetch failed', err)
      }
    })
  }
  catch(err){
    console.log('fetch failed', err)
  }


}


addApplicationData()
localStorage.removeItem('selected_app')