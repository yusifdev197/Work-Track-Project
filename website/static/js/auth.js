// ── Token refresh ──────────────────────────────────────────────────────────

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    localStorage.clear();
    window.location.href = '/users/login/';
    return null;
  }

  const res = await fetch('/users/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });

  if (!res.ok) {
    localStorage.clear();
    window.location.href = '/users/login/';
    return null;
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
}

// use this everywhere instead of raw fetch — auto refreshes if 401
window.apiFetch = async function(url, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': 'Bearer ' + token, ...options.headers }
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    return fetch(url, {
      ...options,
      headers: { 'Authorization': 'Bearer ' + newToken, ...options.headers }
    });
  }

  return res;
};

// ── Auth check ─────────────────────────────────────────────────────────────

function checkAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/users/login/';
  }
}

// ── Navbar + manager toggle ────────────────────────────────────────────────
async function checkManagerOrEmployee() {
  try {
    const response = await apiFetch('/users/employee-api/');
    if (!response) return;
    const data = await response.json();
    const avatar = document.getElementById('nav-avatar');
    avatar.src = data.employee.profile_image;

    if (data.employee.is_manager) {
      document.getElementById('nav-overview').classList.remove('d-none');
      document.getElementById('nav-applications').classList.remove('d-none');
      const attendSection = document.getElementById('attend-section');
      const employeeView = document.getElementById('employee-view');
      const managerView = document.getElementById('manager-view');
      if (attendSection) attendSection.style.display = 'none';
      if (employeeView) employeeView.style.display = 'none';
      if (managerView) managerView.classList.remove('d-none');
      document.body.style.visibility = 'visible';
    } else {
      if (document.body.dataset.managerOnly === 'true') {
        window.location.href = '/';
        return;
      }
      document.body.style.visibility = 'visible';
    }
  } catch (err) {
    console.log('fetch failed', err);
    document.body.style.visibility = 'visible';
  }
}

// ── Logout modal ───────────────────────────────────────────────────────────

const modalHTML = `
  <div class="modal fade" id="logoutModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content wt-modal">
        <div class="modal-body text-center py-4 px-4">
          <div class="wt-modal-icon mb-3"><span>↩</span></div>
          <h6 class="text-white mb-2">Logout of WorkTrack?</h6>
          <p class="text-secondary small mb-4">You will need to log in again to access your account.</p>
          <div class="d-flex gap-2">
            <button type="button" class="btn wt-modal-btn-cancel w-100" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn wt-modal-btn-logout w-100" id="confirm-logout">Yes, Logout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('logoutModal')).show();
    document.getElementById('confirm-logout').addEventListener('click', () => {
      localStorage.clear();  // clears everything including last_seen_id and has_unread
      window.location.href = '/users/login/';
    });
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

checkAuth();
checkManagerOrEmployee();