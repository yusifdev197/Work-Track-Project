console.log('login.js Loaded')

const loginForm = document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const errorBox = document.getElementById('login-error')

    const userName = document.getElementById('username').value
    const password = document.getElementById('password').value

    try{
        const response = await fetch('/users/login-api/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'username': userName, password})
        })

        const result = await response.json()
        if (response.ok){
            localStorage.setItem('access_token', result.access)
            localStorage.setItem('refresh_token', result.refresh)
            window.location.href = '/'
        }
        else{
            const message = Object.values(result).flat().join('')
            errorBox.classList.remove('d-none')
            errorBox.textContent = message
        }
    }
    catch(err){
        errorBox.classList.remove('d-none')
        errorBox.textContent = 'Something went wrong, try again'
    }

})