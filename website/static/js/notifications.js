// notifications.js — only loaded on the notifications page

let allNotifications = [];
let activeFilter = 'all';



function getToken() {
  return localStorage.getItem('access_token');
}

async function fetchNotifications() {
  const res = await fetch('/tasks/notifications-api/', {
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
  if (!res.ok) throw new Error('Fetch failed');
  const data = await res.json();
  return data.notifications;
}

async function markOneRead(id) {
  await fetch(`/tasks/mark_one_read_notifications-api/${id}/`, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
}

async function markAllRead() {
  await fetch('/tasks/mark_all_read_notifications-api/', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
}



function relativeTime(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function syncDot() {
  const hasUnread = allNotifications.some(n => !n.is_read);
  const dot = document.getElementById('notif-dot');
  if (hasUnread) {
    localStorage.setItem('has_unread', 'true');
    dot.classList.remove('d-none');
  } else {
    localStorage.removeItem('has_unread');
    dot.classList.add('d-none');
  }
}



function renderList(notifications) {
  const list    = document.getElementById('notif-list');
  const empty   = document.getElementById('notif-empty');
  const loading = document.getElementById('notif-loading');

  loading.classList.add('d-none');

  if (!notifications.length) {
    list.classList.add('d-none');
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');
  list.classList.remove('d-none');

  list.innerHTML = notifications.map(n => `
    <div class="wt-notif-item ${n.is_read ? '' : 'wt-notif-item-unread'}" data-id="${n.id}">
      <div class="wt-notif-dot-wrap">
        <span class="wt-notif-dot ${n.is_read ? 'wt-notif-dot-read' : ''}"></span>
      </div>
      <div class="wt-notif-body">
        <p class="wt-notif-msg">${n.message}</p>
        <span class="wt-notif-time">${relativeTime(n.created_at)}</span>
      </div>
      ${!n.is_read ? `
        <button class="wt-notif-read-btn" data-id="${n.id}" title="Mark as read">✓</button>
      ` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.wt-notif-read-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      await markOneRead(id);
      const notif = allNotifications.find(n => n.id === id);
      if (notif) notif.is_read = true;
      updateUnreadCount();
      syncDot();
      applyFilter();
    });
  });
}

function updateUnreadCount() {
  const count = allNotifications.filter(n => !n.is_read).length;
  document.getElementById('notif-unread-count').textContent = count;
}

function applyFilter() {
  const filtered = {
    all:    allNotifications,
    unread: allNotifications.filter(n => !n.is_read),
    read:   allNotifications.filter(n =>  n.is_read),
  }[activeFilter] || allNotifications;
  renderList(filtered);
}



document.querySelectorAll('.wt-notif-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.wt-notif-tab').forEach(t => t.classList.remove('wt-notif-tab-active'));
    tab.classList.add('wt-notif-tab-active');
    activeFilter = tab.dataset.filter;
    applyFilter();
  });
});

document.getElementById('mark-all-btn').addEventListener('click', async () => {
  await markAllRead();
  allNotifications.forEach(n => n.is_read = true);
  updateUnreadCount();
  syncDot();
  applyFilter();
});



async function init() {
  try {
    allNotifications = await fetchNotifications();
    updateUnreadCount();
    syncDot();
    applyFilter();
  } catch (err) {
    document.getElementById('notif-loading').innerHTML = `
      <p style="color:#f87171; font-size:13px; margin:0;">Failed to load notifications — ${err}</p>
    `;
  }
}

init();
setInterval(init, 30000);