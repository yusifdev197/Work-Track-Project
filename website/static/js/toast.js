(function () {
  const container = document.getElementById('wt-toast-container');
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  window.showToast = function (type, title, message = '', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `wt-toast wt-toast-${type}`;
    toast.innerHTML = `
      <div class="wt-toast-icon wt-toast-icon-${type}">${icons[type] || 'ℹ'}</div>
      <div class="wt-toast-content">
        <p class="wt-toast-title">${title}</p>
        ${message ? `<p class="wt-toast-msg">${message}</p>` : ''}
      </div>
      <button class="wt-toast-close" aria-label="Dismiss">×</button>
      <div class="wt-toast-bar wt-toast-bar-${type}" style="animation-duration:${duration}ms;"></div>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('wt-toast-show')));
    const dismiss = () => {
      toast.classList.add('wt-toast-hide');
      setTimeout(() => toast.remove(), 350);
    };
    toast.querySelector('.wt-toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };

  // restore dot on every page load if unread notifications exist
  if (localStorage.getItem('has_unread') === 'true') {
    document.getElementById('notif-dot').classList.remove('d-none');
  }
})();


// ── Notification polling — runs on every page via base.html ───────────────

let lastSeenId = parseInt(localStorage.getItem('last_seen_id')) || null

async function pollNotifications() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const res = await fetch('/tasks/notifications-api/', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;

    const data = await res.json();
    const notifications = data.notifications;
    if (!notifications.length) return;

    // first run — just set baseline, don't toast old ones
    if (lastSeenId === null) {
      lastSeenId = notifications[0].id;
      localStorage.setItem('last_seen_id', lastSeenId)
      return;
    }

    const newOnes = notifications.filter(n => n.id > lastSeenId && !n.is_read);
    if (newOnes.length) {
      newOnes.forEach(n => showToast(n.type || 'info', 'New Notification', n.message));
      lastSeenId = newOnes[0].id;
      localStorage.setItem('last_seen_id', lastSeenId)
      localStorage.setItem('has_unread', 'true');
      document.getElementById('notif-dot').classList.remove('d-none');
    }
  } catch (err) {
    console.error('Notification poll error:', err);
  }
}

pollNotifications();
setInterval(pollNotifications, 30000);