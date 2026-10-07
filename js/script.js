/**
 * CRC MBSTU - Frontend JavaScript
 * Come for Road Child (CRC), MBSTU
 * Vanilla JS with fetch() API communication
 */

// ==========================================
// 0. Base Path Detection (GitHub Pages vs Local)
// ==========================================

// Automatically resolves correct base path:
//   GitHub Pages: /CRC_MBSTU
//   Local Express: (empty string)
const BASE_PATH = (function() {
  const host = window.location.hostname;
  if (host.includes('github.io')) {
    // Extract the repo name from pathname, e.g. /CRC_MBSTU/
    const parts = window.location.pathname.split('/');
    return '/' + (parts[1] || 'CRC_MBSTU');
  }
  return '';
})();

// ==========================================
// 1. Storage & Authentication Helpers
// ==========================================

const TOKEN_KEY = 'crc_token';
const USER_KEY = 'crc_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getToken();
}

// Redirect guards for Member and Admin protected pages
function checkPageAuth(requiredRole) {
  const user = getUser();
  const token = getToken();

  if (!token || !user) {
    window.location.href = BASE_PATH + '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If admin is trying to access member page or member trying to access admin page
    if (user.role === 'admin') {
      window.location.href = BASE_PATH + '/admin/dashboard.html';
    } else {
      window.location.href = BASE_PATH + '/member/dashboard.html';
    }
    return false;
  }

  return true;
}

// ==========================================
// 2. Generic API Fetch Client
// ==========================================

async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ==========================================
// 3. UI Alert & Notification Helpers
// ==========================================

function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <div>${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ==========================================
// 4. Dynamic Navbar & Session State
// ==========================================

function initNavbarAuth() {
  const authNav = document.getElementById('navbar-auth-links');
  if (!authNav) return;

  const user = getUser();
  if (user && isAuthenticated()) {
    const dashboardLink = user.role === 'admin' ? (BASE_PATH + '/admin/dashboard.html') : (BASE_PATH + '/member/dashboard.html');
    authNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link text-warning fw-semibold" href="${dashboardLink}">
          <i class="bi bi-speedometer2"></i> Dashboard (${user.name.split(' ')[0]})
        </a>
      </li>
      <li class="nav-item ms-lg-2">
        <button id="btn-logout" class="btn btn-outline-light btn-sm mt-1 mt-lg-0">
          <i class="bi bi-box-arrow-right"></i> Logout
        </button>
      </li>
    `;

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  } else {
    authNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="${BASE_PATH}/login.html"><i class="bi bi-box-arrow-in-right"></i> Login</a>
      </li>
      <li class="nav-item ms-lg-2">
        <a class="btn btn-nav-auth" href="${BASE_PATH}/register.html">Join CRC</a>
      </li>
    `;
  }
}

async function handleLogout(e) {
  if (e) e.preventDefault();
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    // Ignore error on logout
  }
  clearSession();
  window.location.href = BASE_PATH + '/login.html';
}

// ==========================================
// 5. Auth Pages (Login & Register)
// ==========================================

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // If already logged in, redirect to dashboard
  const user = getUser();
  if (user && isAuthenticated()) {
    window.location.href = user.role === 'admin' ? (BASE_PATH + '/admin/dashboard.html') : (BASE_PATH + '/member/dashboard.html');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = 'login-alert';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showAlert(alertBox, 'Please enter both email and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success) {
        setSession(res.token, res.user);
        showAlert(alertBox, 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = res.redirectUrl || (res.user.role === 'admin' ? (BASE_PATH + '/admin/dashboard.html') : (BASE_PATH + '/member/dashboard.html'));
        }, 800);
      }
    } catch (error) {
      showAlert(alertBox, error.message || 'Login failed. Please check credentials.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Login';
    }
  });
}

function initRegisterPage() {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = 'register-alert';
    const name = document.getElementById('name').value.trim();
    const student_id = document.getElementById('student_id').value.trim();
    const department = document.getElementById('department').value.trim();
    const batch = document.getElementById('batch').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const submitBtn = regForm.querySelector('button[type="submit"]');

    if (!name || !student_id || !email || !password) {
      showAlert(alertBox, 'Please fill in all required fields.');
      return;
    }

    if (password !== confirm_password) {
      showAlert(alertBox, 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showAlert(alertBox, 'Password must be at least 6 characters long.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';

      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, student_id, department, batch, email, password })
      });

      if (res.success) {
        regForm.reset();
        showAlert(alertBox, 'Registration submitted successfully! Your account is pending admin approval. You can login after approval.', 'success');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Registered';
      }
    } catch (error) {
      showAlert(alertBox, error.message || 'Registration failed.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-person-plus me-1"></i> Register as Member';
    }
  });
}

// ==========================================
// 6. Public Pages Data Loaders
// ==========================================

// Homepage previews & stats
async function initHomePage() {
  const activitiesContainer = document.getElementById('home-activities-container');
  const committeeContainer = document.getElementById('home-committee-container');
  const galleryContainer = document.getElementById('home-gallery-container');

  // Load upcoming activities preview (3 items)
  if (activitiesContainer) {
    try {
      const res = await apiFetch('/api/activities?limit=3');
      if (res.success && res.data.length > 0) {
        activitiesContainer.innerHTML = res.data.map(act => renderActivityCard(act)).join('');
      } else {
        activitiesContainer.innerHTML = '<div class="col-12 text-center text-muted">No upcoming activities found.</div>';
      }
    } catch (e) {
      activitiesContainer.innerHTML = '<div class="col-12 text-center text-muted">Failed to load activities.</div>';
    }
  }

  // Load committee preview (4 items)
  if (committeeContainer) {
    try {
      const res = await apiFetch('/api/committee');
      if (res.success && res.data.length > 0) {
        committeeContainer.innerHTML = res.data.slice(0, 4).map(c => renderCommitteeCard(c)).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Load gallery preview (6 items)
  if (galleryContainer) {
    try {
      const res = await apiFetch('/api/gallery?limit=6');
      if (res.success && res.data.length > 0) {
        galleryContainer.innerHTML = res.data.map(g => renderGalleryItem(g)).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Activities list page
async function initActivitiesPage() {
  const container = document.getElementById('activities-grid');
  if (!container) return;

  const loadActivities = async (status = '') => {
    try {
      container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Loading activities...</p></div>';
      const endpoint = status ? `/api/activities?status=${status}` : '/api/activities';
      const res = await apiFetch(endpoint);

      if (res.success && res.data.length > 0) {
        container.innerHTML = res.data.map(act => renderActivityCard(act)).join('');
      } else {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No activities found under this category.</div>';
      }
    } catch (err) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-danger">Error loading activities: ${err.message}</div>`;
    }
  };

  // Filter buttons
  const filterBtns = document.querySelectorAll('.activity-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active', 'btn-primary-crc'));
      filterBtns.forEach(b => b.classList.add('btn-outline-primary-crc'));
      btn.classList.remove('btn-outline-primary-crc');
      btn.classList.add('active', 'btn-primary-crc');
      const status = btn.getAttribute('data-status');
      loadActivities(status);
    });
  });

  loadActivities();
}

function renderActivityCard(act) {
  const imgPath = act.image ? `${BASE_PATH}/uploads/activities/${act.image}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect fill="%231E3A5F" width="100%" height="100%"/><text fill="%23FFFFFF" x="50%" y="50%" text-anchor="middle">CRC MBSTU</text></svg>';
  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card card-crc">
        <img src="${imgPath}" class="card-img-top" alt="${act.title}" onerror="this.src='${BASE_PATH}/uploads/activities/winter-drive.jpg'">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge-status ${act.status}">${act.status}</span>
            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${formatDate(act.date)}</small>
          </div>
          <h5 class="card-title">${act.title}</h5>
          <div class="activity-meta">
            <span><i class="bi bi-geo-alt-fill"></i> ${act.location || 'MBSTU Campus & Tangail'}</span>
          </div>
          <p class="card-text text-muted small flex-grow-1">
            ${act.description ? (act.description.length > 105 ? act.description.substring(0, 105) + '...' : act.description) : 'No description available.'}
          </p>
          <div class="mt-3 pt-2 border-top">
            <a href="${BASE_PATH}/activity-details.html?id=${act.id}" class="btn btn-primary-crc w-100">
              <i class="bi bi-info-circle me-1"></i> View Details
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Activity details page
async function initActivityDetailsPage() {
  const container = document.getElementById('activity-details-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('id');

  if (!activityId) {
    container.innerHTML = '<div class="alert alert-danger">No activity ID specified in the URL.</div>';
    return;
  }

  try {
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Loading activity details...</p></div>';
    const res = await apiFetch(`/api/activities/${activityId}`);

    if (res.success && res.data) {
      const act = res.data;
      const imgPath = act.image ? `${BASE_PATH}/uploads/activities/${act.image}` : '${BASE_PATH}/uploads/activities/winter-drive.jpg';
      const user = getUser();

      let joinBtnHtml = '';
      if (!user) {
        joinBtnHtml = `
          <div class="alert alert-info d-flex justify-content-between align-items-center mb-0">
            <span>Want to participate as a volunteer in this activity?</span>
            <a href="${BASE_PATH}/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}" class="btn btn-sm btn-primary-crc">
              <i class="bi bi-box-arrow-in-right me-1"></i> Login to Join
            </a>
          </div>
        `;
      } else if (user.role === 'admin') {
        joinBtnHtml = `
          <div class="alert alert-secondary mb-0">
            <i class="bi bi-shield-lock me-1"></i> You are logged in as Administrator. To manage this activity, visit the <a href="${BASE_PATH}/admin/activities.html" class="fw-bold">Admin Activities Portal</a>.
          </div>
        `;
      } else if (act.isJoined) {
        joinBtnHtml = `
          <div class="alert alert-success d-flex align-items-center mb-0">
            <i class="bi bi-check-circle-fill fs-4 me-2"></i>
            <div><strong>You have already joined this activity!</strong> Check your schedule in <a href="${BASE_PATH}/member/my-activities.html">My Activities</a>.</div>
          </div>
        `;
      } else if (act.status === 'completed') {
        joinBtnHtml = `
          <div class="alert alert-secondary mb-0">
            <i class="bi bi-info-circle me-1"></i> This activity has already concluded. Registrations are closed.
          </div>
        `;
      } else {
        joinBtnHtml = `
          <button id="btn-join-activity" class="btn btn-secondary-crc btn-lg px-4">
            <i class="bi bi-person-plus-fill me-1"></i> Join Activity
          </button>
        `;
      }

      container.innerHTML = `
        <div class="card card-crc p-0 overflow-hidden shadow-sm">
          <div class="row g-0">
            <div class="col-lg-6">
              <img src="${imgPath}" class="img-fluid w-100 h-100" style="object-fit: cover; min-height: 340px;" alt="${act.title}" onerror="this.src='${BASE_PATH}/uploads/activities/winter-drive.jpg'">
            </div>
            <div class="col-lg-6 p-4 p-md-5 d-flex flex-direction-column justify-content-between">
              <div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="badge-status ${act.status} px-3 py-1 fs-6">${act.status}</span>
                  <span class="text-muted small"><i class="bi bi-people-fill text-success me-1"></i> ${act.participantsCount || 0} Registered</span>
                </div>
                <h2 class="mb-3">${act.title}</h2>
                <div class="activity-meta fs-6 mb-4">
                  <div class="mb-2"><i class="bi bi-calendar-event me-2"></i> <strong>Date:</strong> ${formatDate(act.date)}</div>
                  <div class="mb-2"><i class="bi bi-geo-alt-fill me-2"></i> <strong>Location:</strong> ${act.location || 'MBSTU Campus & Tangail'}</div>
                </div>
                <h5 class="mt-4 mb-2">About This Activity</h5>
                <p class="text-secondary leading-relaxed mb-4">${act.description || 'Join Come for Road Child (CRC), MBSTU in making a positive difference in the lives of underprivileged street children.'}</p>
              </div>
              <div class="pt-3 border-top" id="join-action-area">
                <div id="join-alert"></div>
                ${joinBtnHtml}
              </div>
            </div>
          </div>
        </div>
      `;

      const joinBtn = document.getElementById('btn-join-activity');
      if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
          try {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Joining...';

            const joinRes = await apiFetch(`/api/activities/${activityId}/join`, {
              method: 'POST'
            });

            if (joinRes.success) {
              showAlert('join-alert', 'You have successfully joined this activity!', 'success');
              document.getElementById('join-action-area').innerHTML = `
                <div class="alert alert-success d-flex align-items-center mb-0">
                  <i class="bi bi-check-circle-fill fs-4 me-2"></i>
                  <div><strong>Success! You have joined this activity.</strong> View all your participations in <a href="${BASE_PATH}/member/my-activities.html">My Activities</a>.</div>
                </div>
              `;
            }
          } catch (err) {
            showAlert('join-alert', err.message || 'Failed to join activity.');
            joinBtn.disabled = false;
            joinBtn.innerHTML = '<i class="bi bi-person-plus-fill me-1"></i> Join Activity';
          }
        });
      }
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error loading activity: ${err.message}</div>`;
  }
}

// Committee page
async function initCommitteePage() {
  const container = document.getElementById('committee-grid');
  if (!container) return;

  try {
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Loading committee members...</p></div>';
    const res = await apiFetch('/api/committee');

    if (res.success && res.data.length > 0) {
      container.innerHTML = res.data.map(c => renderCommitteeCard(c)).join('');
    } else {
      container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No committee members found.</div>';
    }
  } catch (err) {
    container.innerHTML = `<div class="col-12 text-center py-5 text-danger">Error loading committee: ${err.message}</div>`;
  }
}

function renderCommitteeCard(c) {
  const photoPath = c.photo ? `${BASE_PATH}/uploads/committee/${c.photo}` : '${BASE_PATH}/uploads/committee/president.jpg';
  return `
    <div class="col-sm-6 col-md-6 col-lg-3 mb-4">
      <div class="committee-card">
        <img src="${photoPath}" class="committee-avatar" alt="${c.name}" onerror="this.src='${BASE_PATH}/uploads/committee/president.jpg'">
        <h5 class="mb-1">${c.name}</h5>
        <div class="committee-position">${c.position}</div>
        <div class="committee-details">
          <div><i class="bi bi-mortarboard-fill me-1"></i>${c.department || 'MBSTU'}</div>
          <div><i class="bi bi-card-text me-1"></i>ID: ${c.student_id || 'N/A'} (${c.batch || 'Batch'})</div>
        </div>
      </div>
    </div>
  `;
}

// Gallery page
async function initGalleryPage() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  try {
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Loading gallery photos...</p></div>';
    const res = await apiFetch('/api/gallery');

    if (res.success && res.data.length > 0) {
      container.innerHTML = res.data.map(g => renderGalleryItem(g)).join('');
    } else {
      container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No images found in the gallery yet.</div>';
    }
  } catch (err) {
    container.innerHTML = `<div class="col-12 text-center py-5 text-danger">Error loading gallery: ${err.message}</div>`;
  }
}

function renderGalleryItem(g) {
  const imgPath = g.image ? `${BASE_PATH}/uploads/gallery/${g.image}` : '${BASE_PATH}/uploads/gallery/gallery-1.jpg';
  return `
    <div class="col-sm-6 col-md-4 mb-4">
      <div class="gallery-item">
        <img src="${imgPath}" alt="${g.title}" onerror="this.src='${BASE_PATH}/uploads/gallery/gallery-1.jpg'">
        <div class="gallery-overlay">
          <p class="gallery-title">${g.title || 'CRC MBSTU Activity'}</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 7. Member Dashboard & My Activities
// ==========================================

async function initMemberDashboard() {
  if (!checkPageAuth('member')) return;

  const user = getUser();
  const welcomeElem = document.getElementById('member-welcome-name');
  if (welcomeElem && user) {
    welcomeElem.textContent = user.name;
  }

  // Populate user badge in sidebar
  const sidebarName = document.getElementById('sidebar-member-name');
  if (sidebarName && user) {
    sidebarName.textContent = user.name;
  }

  try {
    const res = await apiFetch('/api/members/member-stats');
    if (res.success && res.data) {
      const { totalActivities, joinedActivities, upcomingActivities } = res.data;

      const totalElem = document.getElementById('stat-total-activities');
      if (totalElem) totalElem.textContent = totalActivities;

      const joinedElem = document.getElementById('stat-joined-activities');
      if (joinedElem) joinedElem.textContent = joinedActivities;

      const upcomingContainer = document.getElementById('member-upcoming-activities');
      if (upcomingContainer) {
        if (upcomingActivities && upcomingActivities.length > 0) {
          upcomingContainer.innerHTML = upcomingActivities.map(act => `
            <div class="col-md-6 mb-3">
              <div class="card card-crc p-3 h-100">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge-status ${act.status}">${act.status}</span>
                  <small class="text-muted"><i class="bi bi-calendar-event me-1"></i>${formatDate(act.date)}</small>
                </div>
                <h6 class="fw-bold mb-1">${act.title}</h6>
                <small class="text-muted mb-3"><i class="bi bi-geo-alt me-1"></i>${act.location || 'MBSTU'}</small>
                <div class="mt-auto pt-2">
                  <a href="${BASE_PATH}/activity-details.html?id=${act.id}" class="btn btn-sm btn-outline-primary-crc w-100">View & Join</a>
                </div>
              </div>
            </div>
          `).join('');
        } else {
          upcomingContainer.innerHTML = '<div class="col-12 text-muted">No upcoming activities scheduled at this time.</div>';
        }
      }
    }
  } catch (err) {
    console.error('Failed to load member stats:', err);
  }

  // Attach logout handler
  const logoutBtn = document.getElementById('btn-member-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

async function initMyActivitiesPage() {
  if (!checkPageAuth('member')) return;

  const container = document.getElementById('my-activities-container');
  if (!container) return;

  try {
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Loading your joined activities...</p></div>';
    const res = await apiFetch('/api/activities/my-registered');

    if (res.success && res.data.length > 0) {
      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Activity Title</th>
                <th>Event Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Joined On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map((act, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="fw-semibold">${act.title}</td>
                  <td>${formatDate(act.date)}</td>
                  <td>${act.location || 'MBSTU'}</td>
                  <td><span class="badge-status ${act.status}">${act.status}</span></td>
                  <td><small class="text-muted">${formatDate(act.registered_at)}</small></td>
                  <td>
                    <a href="${BASE_PATH}/activity-details.html?id=${act.id}" class="btn btn-sm btn-primary-crc">
                      <i class="bi bi-info-circle"></i> Details
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="text-center py-5 bg-white rounded-3 border p-5">
          <i class="bi bi-calendar-x fs-1 text-muted"></i>
          <h5 class="mt-3">You have not joined any activities yet</h5>
          <p class="text-muted">Explore our upcoming humanitarian drives and volunteer programs!</p>
          <a href="${BASE_PATH}/activities.html" class="btn btn-primary-crc">
            <i class="bi bi-compass me-1"></i> Browse Activities
          </a>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }

  const logoutBtn = document.getElementById('btn-member-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// ==========================================
// 8. Admin Management Pages
// ==========================================

async function initAdminDashboard() {
  if (!checkPageAuth('admin')) return;

  try {
    const res = await apiFetch('/api/members/admin-stats');
    if (res.success && res.data) {
      const stats = res.data;
      document.getElementById('stat-active-members').textContent = stats.activeMembers;
      document.getElementById('stat-pending-members').textContent = stats.pendingMembers;
      document.getElementById('stat-total-activities').textContent = stats.totalActivities;
      document.getElementById('stat-total-committee').textContent = stats.totalCommittee;
      document.getElementById('stat-total-gallery').textContent = stats.totalGallery;

      // Render recent pending registrations
      const pendingList = document.getElementById('recent-pending-list');
      if (pendingList) {
        if (stats.recentPending && stats.recentPending.length > 0) {
          pendingList.innerHTML = stats.recentPending.map(m => `
            <tr>
              <td><strong>${m.name}</strong></td>
              <td>${m.student_id}</td>
              <td>${m.department || 'N/A'}</td>
              <td>${m.email}</td>
              <td><span class="badge-status pending">Pending</span></td>
              <td>
                <button class="btn btn-sm btn-success btn-approve-member" data-id="${m.id}" title="Approve">
                  <i class="bi bi-check-lg"></i> Approve
                </button>
              </td>
            </tr>
          `).join('');

          // Attach quick approve handlers
          document.querySelectorAll('.btn-approve-member').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Approve this member registration?')) {
                await apiFetch(`/api/members/${id}/approve`, { method: 'PUT' });
                initAdminDashboard();
              }
            });
          });
        } else {
          pendingList.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No pending member registrations.</td></tr>';
        }
      }

      // Render upcoming activities
      const upcomingList = document.getElementById('admin-upcoming-activities');
      if (upcomingList) {
        if (stats.upcomingActivities && stats.upcomingActivities.length > 0) {
          upcomingList.innerHTML = stats.upcomingActivities.map(a => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-0 fw-semibold">${a.title}</h6>
                <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${a.location || 'MBSTU'}</small>
              </div>
              <span class="badge bg-primary rounded-pill">${formatDate(a.date)}</span>
            </li>
          `).join('');
        } else {
          upcomingList.innerHTML = '<li class="list-group-item text-center text-muted">No upcoming activities.</li>';
        }
      }
    }
  } catch (err) {
    console.error('Admin dashboard error:', err);
  }

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Admin Members Page
async function initAdminMembersPage() {
  if (!checkPageAuth('admin')) return;

  const tableBody = document.getElementById('admin-members-tbody');
  const filterSelect = document.getElementById('member-status-filter');
  const searchInput = document.getElementById('member-search-input');

  const loadMembers = async () => {
    try {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
      const status = filterSelect ? filterSelect.value : '';
      const search = searchInput ? searchInput.value.trim() : '';

      let url = '/api/members?';
      if (status) url += `status=${status}&`;
      if (search) url += `search=${encodeURIComponent(search)}`;

      const res = await apiFetch(url);
      if (res.success && res.data.length > 0) {
        tableBody.innerHTML = res.data.map((m, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="fw-semibold">${m.name}</td>
            <td>${m.student_id}</td>
            <td>${m.department || 'N/A'}</td>
            <td>${m.batch || 'N/A'}</td>
            <td>${m.email}</td>
            <td><span class="badge-status ${m.status}">${m.status}</span></td>
            <td>
              <div class="btn-group btn-group-sm">
                ${m.status !== 'active' ? `
                  <button class="btn btn-outline-success btn-action-approve" data-id="${m.id}" title="Approve">
                    <i class="bi bi-check-lg"></i>
                  </button>
                ` : ''}
                ${m.status !== 'rejected' ? `
                  <button class="btn btn-outline-danger btn-action-reject" data-id="${m.id}" title="Reject">
                    <i class="bi bi-x-lg"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('');

        // Attach action handlers
        document.querySelectorAll('.btn-action-approve').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Approve this member?')) {
              await apiFetch(`/api/members/${id}/approve`, { method: 'PUT' });
              loadMembers();
            }
          });
        });

        document.querySelectorAll('.btn-action-reject').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Reject this member?')) {
              await apiFetch(`/api/members/${id}/reject`, { method: 'PUT' });
              loadMembers();
            }
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No members found matching filter.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${err.message}</td></tr>`;
    }
  };

  if (filterSelect) filterSelect.addEventListener('change', loadMembers);
  if (searchInput) searchInput.addEventListener('input', loadMembers);

  loadMembers();

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Admin Activities Page
async function initAdminActivitiesPage() {
  if (!checkPageAuth('admin')) return;

  const tableBody = document.getElementById('admin-activities-tbody');
  const form = document.getElementById('activityForm');
  const modalElem = document.getElementById('activityModal');
  const modal = modalElem ? new bootstrap.Modal(modalElem) : null;
  const modalTitle = document.getElementById('activityModalLabel');

  const loadActivities = async () => {
    try {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
      const res = await apiFetch('/api/activities');

      if (res.success && res.data.length > 0) {
        tableBody.innerHTML = res.data.map((act, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="fw-semibold">${act.title}</td>
            <td>${formatDate(act.date)}</td>
            <td>${act.location || 'MBSTU'}</td>
            <td><span class="badge-status ${act.status}">${act.status}</span></td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-edit-activity" data-id="${act.id}" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-delete-activity" data-id="${act.id}" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        // Edit button listener
        document.querySelectorAll('.btn-edit-activity').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const item = res.data.find(a => a.id == id);
            if (item) {
              document.getElementById('activity_id').value = item.id;
              document.getElementById('activity_title').value = item.title;
              document.getElementById('activity_date').value = item.date.split('T')[0];
              document.getElementById('activity_location').value = item.location || '';
              document.getElementById('activity_status').value = item.status;
              document.getElementById('activity_description').value = item.description || '';
              modalTitle.textContent = 'Edit Activity';
              modal.show();
            }
          });
        });

        // Delete button listener
        document.querySelectorAll('.btn-delete-activity').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this activity?')) {
              await apiFetch(`/api/activities/${id}`, { method: 'DELETE' });
              loadActivities();
            }
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No activities found.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${err.message}</td></tr>`;
    }
  };

  // Add new activity button triggers blank modal
  const addBtn = document.getElementById('btn-add-activity');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('activity_id').value = '';
      modalTitle.textContent = 'Add New Activity';
      modal.show();
    });
  }

  // Handle submit form (Add or Edit)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('activity_id').value;
      const formData = new FormData(form);

      try {
        if (id) {
          // Edit
          await apiFetch(`/api/activities/${id}`, {
            method: 'PUT',
            body: formData
          });
        } else {
          // Add
          await apiFetch('/api/activities', {
            method: 'POST',
            body: formData
          });
        }
        modal.hide();
        loadActivities();
      } catch (err) {
        alert(err.message || 'Operation failed');
      }
    });
  }

  loadActivities();

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Admin Committee Page
async function initAdminCommitteePage() {
  if (!checkPageAuth('admin')) return;

  const tableBody = document.getElementById('admin-committee-tbody');
  const form = document.getElementById('committeeForm');
  const modalElem = document.getElementById('committeeModal');
  const modal = modalElem ? new bootstrap.Modal(modalElem) : null;
  const modalTitle = document.getElementById('committeeModalLabel');

  const loadCommittee = async () => {
    try {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
      const res = await apiFetch('/api/committee');

      if (res.success && res.data.length > 0) {
        tableBody.innerHTML = res.data.map((c, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="fw-semibold">${c.name}</td>
            <td><span class="badge bg-secondary">${c.position}</span></td>
            <td>${c.department || 'N/A'}</td>
            <td>${c.student_id || 'N/A'}</td>
            <td>${c.batch || 'N/A'}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-edit-committee" data-id="${c.id}" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-delete-committee" data-id="${c.id}" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        document.querySelectorAll('.btn-edit-committee').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = res.data.find(c => c.id == id);
            if (item) {
              document.getElementById('committee_id').value = item.id;
              document.getElementById('committee_name').value = item.name;
              document.getElementById('committee_position').value = item.position;
              document.getElementById('committee_department').value = item.department || '';
              document.getElementById('committee_student_id').value = item.student_id || '';
              document.getElementById('committee_batch').value = item.batch || '';
              modalTitle.textContent = 'Edit Committee Member';
              modal.show();
            }
          });
        });

        document.querySelectorAll('.btn-delete-committee').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Delete this committee member?')) {
              await apiFetch(`/api/committee/${id}`, { method: 'DELETE' });
              loadCommittee();
            }
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No committee members found.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${err.message}</td></tr>`;
    }
  };

  const addBtn = document.getElementById('btn-add-committee');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('committee_id').value = '';
      modalTitle.textContent = 'Add Committee Member';
      modal.show();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('committee_id').value;
      const formData = new FormData(form);

      try {
        if (id) {
          await apiFetch(`/api/committee/${id}`, { method: 'PUT', body: formData });
        } else {
          await apiFetch('/api/committee', { method: 'POST', body: formData });
        }
        modal.hide();
        loadCommittee();
      } catch (err) {
        alert(err.message || 'Operation failed');
      }
    });
  }

  loadCommittee();

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Admin Gallery Page
async function initAdminGalleryPage() {
  if (!checkPageAuth('admin')) return;

  const container = document.getElementById('admin-gallery-grid');
  const form = document.getElementById('galleryForm');
  const modalElem = document.getElementById('galleryModal');
  const modal = modalElem ? new bootstrap.Modal(modalElem) : null;

  const loadGallery = async () => {
    try {
      container.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</div>';
      const res = await apiFetch('/api/gallery');

      if (res.success && res.data.length > 0) {
        container.innerHTML = res.data.map(g => `
          <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card card-crc h-100 shadow-sm">
              <img src="/uploads/gallery/${g.image}" class="card-img-top" style="height: 180px; object-fit: cover;" alt="${g.title}" onerror="this.src='${BASE_PATH}/uploads/gallery/gallery-1.jpg'">
              <div class="card-body p-3 d-flex flex-column justify-content-between">
                <h6 class="card-title text-truncate mb-2" title="${g.title}">${g.title || 'Untitled'}</h6>
                <button class="btn btn-outline-danger btn-sm w-100 btn-delete-gallery" data-id="${g.id}">
                  <i class="bi bi-trash me-1"></i> Delete Image
                </button>
              </div>
            </div>
          </div>
        `).join('');

        document.querySelectorAll('.btn-delete-gallery').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Delete this image from gallery?')) {
              await apiFetch(`/api/gallery/${id}`, { method: 'DELETE' });
              loadGallery();
            }
          });
        });
      } else {
        container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No images found in the gallery.</div>';
      }
    } catch (err) {
      container.innerHTML = `<div class="col-12 text-center py-4 text-danger">${err.message}</div>`;
    }
  };

  const uploadBtn = document.getElementById('btn-upload-gallery');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      form.reset();
      modal.show();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        await apiFetch('/api/gallery', { method: 'POST', body: formData });
        modal.hide();
        loadGallery();
      } catch (err) {
        alert(err.message || 'Upload failed');
      }
    });
  }

  loadGallery();

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// ==========================================
// 9. Master DOMContentLoaded Router
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();

  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('index.html') || path === '/' || path.endsWith('/crc-mbstu/')) {
    initHomePage();
  } else if (path.endsWith('activities.html') && !path.includes('/admin/')) {
    initActivitiesPage();
  } else if (path.endsWith('activity-details.html')) {
    initActivityDetailsPage();
  } else if (path.endsWith('committee.html') && !path.includes('/admin/')) {
    initCommitteePage();
  } else if (path.endsWith('gallery.html') && !path.includes('/admin/')) {
    initGalleryPage();
  } else if (path.endsWith('login.html')) {
    initLoginPage();
  } else if (path.endsWith('register.html')) {
    initRegisterPage();
  } else if (path.includes('/member/dashboard.html')) {
    initMemberDashboard();
  } else if (path.includes('/member/my-activities.html')) {
    initMyActivitiesPage();
  } else if (path.includes('/admin/dashboard.html')) {
    initAdminDashboard();
  } else if (path.includes('/admin/members.html')) {
    initAdminMembersPage();
  } else if (path.includes('/admin/activities.html')) {
    initAdminActivitiesPage();
  } else if (path.includes('/admin/committee.html')) {
    initAdminCommitteePage();
  } else if (path.includes('/admin/gallery.html')) {
    initAdminGalleryPage();
  }
});
