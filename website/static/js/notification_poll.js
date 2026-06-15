let  lastSeenId = null


async function pollNotifications() {
    const token = localStorage.getItem('access_token')
    if(!token) return

    const res = await fetch('/tasks/notifications-api', {
        method: 'GET',
        headers : {'Authorization': 'Bearer ' + token}
    })
    const data = await res.json()
    const notifications = data.notifications
    
    if(!notifications.length) return

    if(lastSeenId == null){
        const lasted = notifications[0]
        lastSeenId = lasted.id
        return
    }

    const newOnes = notifications.filter(n => n.id > lastSeenId && !n.is_read);
    if (newOnes.length) {
        newOnes.forEach(n => showToast(n.type, 'New Notification', n.message));
        lastSeenId = newOnes[0].id;
        localStorage.setItem('has_unread', 'true');
    }
    if(localStorage.getItem('has_unread') === 'true'){
        document.getElementById('notif-dot').classList.remove('d-none')
    }
}

pollNotifications()
setInterval(pollNotifications, 20000)