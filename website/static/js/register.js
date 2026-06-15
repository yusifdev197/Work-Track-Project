// ================================================
// register.js — Application form logic
// ================================================


const registerForm = document.getElementById('register-form');

if (registerForm) {

  registerForm.addEventListener('submit', async function(e) {

    // Stop page from refreshing on submit
    e.preventDefault();

    // Get all field values
    // .trim() removes accidental spaces before/after the text
    const firstName    = document.getElementById('first-name').value.trim();
    const lastName     = document.getElementById('last-name').value.trim();
    const email        = document.getElementById('email').value.trim();
    const phone        = document.getElementById('phone').value.trim();
    const skills       = document.getElementById('skills').value.trim();
    const project_link = document.getElementById('project-links').value.trim();
    const about        = document.getElementById('about').value.trim();
    const cvFile       = document.getElementById('cv').files[0]; // files[0] = first uploaded file

    const errorBox = document.getElementById('register-error');

    // Basic validation — check required fields are not empty
    // Every field marked with * in the form is required
    if (!firstName || !lastName || !email || !phone || !skills || !about || !cvFile) {
      errorBox.classList.remove('d-none');
      errorBox.textContent = 'Please fill in all required fields.';
      return; // stop here, don't continue
    }

    const data = new FormData()
    data.append('first_name', firstName)
    data.append('last_name', lastName)
    data.append('email', email)
    data.append('phone', phone)
    data.append('skills', skills)
    data.append('cv', cvFile)
    data.append('project_link', project_link)
    data.append('about', about)



    // Simple email format check
    // .includes('@') = email must have an @ symbol
    if (!email.includes('@')) {
      errorBox.classList.remove('d-none');
      errorBox.textContent = 'Please enter a valid email address.';
      return;
    }

    try{
        const response = await fetch('/users/create_application-api/', {
          method:'POST',
          body : data
    })

		const result = await response.json()
    

		if (response.ok){
			document.getElementById('success-email').textContent = email;
   		document.getElementById('register-success').classList.remove('d-none');

		}

		else{
			const message = Object.values(result).flat().join('')
			errorBox.classList.remove('d-none')
			errorBox.textContent = message
      return;
		}
    }

    catch(err){ 
		errorBox.classList.remove('d-none')
		errorBox.textContent = 'Something went wrong, try again'
    return
	 }

    // All good — hide error if it was showing
    errorBox.classList.add('d-none');

    // Hide the form
    registerForm.classList.add('d-none');

    // Hide the "already have account" link
    const loginLinkRow = document.getElementById('login-link-row');
    if (loginLinkRow) loginLinkRow.classList.add('d-none');

    

    // Show success message
    // Put the email they entered inside the success message
   
    // NOTE: In the real app, before showing success we would:
    // 1. Create a FormData object with all fields including the CV file
    // 2. POST it to /applications/ endpoint
    // 3. Only show success if the server responds with 201 Created
    // For now we just simulate success immediately
  });
}