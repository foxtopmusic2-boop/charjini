/**
 * Charjini Landing Page - Interactive Controller & Secure Owner-Only Download Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminSecurity();
  initDownloadManager();
  initSimulator();
  initQrCode();
  initSmoothScroll();
});

/* ==========================================================
   ADMIN SECURITY & ACCESS CONTROL (OWNER ONLY)
   ========================================================== */
function initAdminSecurity() {
  const config = window.CHARJINI_CONFIG || { adminPin: 'charjini2026' };
  const SESSION_KEY = 'charjini_admin_session';
  const PIN_KEY = 'charjini_custom_pin';

  // Elements
  const adminTopBar = document.getElementById('adminTopBar');
  const btnFooterAdminLock = document.getElementById('btnFooterAdminLock');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const btnCloseLoginModal = document.getElementById('btnCloseLoginModal');
  const btnCancelLogin = document.getElementById('btnCancelLogin');
  const btnSubmitLogin = document.getElementById('btnSubmitLogin');
  const adminPinInput = document.getElementById('adminPinInput');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  // Change PIN modal
  const changePinModal = document.getElementById('changePinModal');
  const btnChangePasswordAdmin = document.getElementById('btnChangePasswordAdmin');
  const btnClosePinModal = document.getElementById('btnClosePinModal');
  const btnCancelPinChange = document.getElementById('btnCancelPinChange');
  const btnSaveNewPin = document.getElementById('btnSaveNewPin');
  const newPinInput = document.getElementById('newPinInput');

  function getExpectedPin() {
    return localStorage.getItem(PIN_KEY) || config.adminPin || 'charjini2026';
  }

  function isAdminAuthenticated() {
    return localStorage.getItem(SESSION_KEY) === 'authenticated';
  }

  function activateAdminMode() {
    document.body.classList.add('is-admin');
    if (adminTopBar) adminTopBar.classList.remove('hidden');
  }

  function deactivateAdminMode() {
    document.body.classList.remove('is-admin');
    if (adminTopBar) adminTopBar.classList.add('hidden');
    localStorage.removeItem(SESSION_KEY);
  }

  function openLoginModal() {
    if (isAdminAuthenticated()) {
      activateAdminMode();
      showToast('👑 أنت مسجل بالفعل كمدير للنظام.');
      return;
    }
    if (adminPinInput) adminPinInput.value = '';
    if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
    if (adminLoginModal) {
      adminLoginModal.classList.remove('hidden');
      adminLoginModal.setAttribute('aria-hidden', 'false');
      setTimeout(() => adminPinInput && adminPinInput.focus(), 150);
    }
  }

  function closeLoginModal() {
    if (adminLoginModal) {
      adminLoginModal.classList.add('hidden');
      adminLoginModal.setAttribute('aria-hidden', 'true');
    }
  }

  function attemptLogin() {
    const entered = adminPinInput ? adminPinInput.value.trim() : '';
    const expected = getExpectedPin();

    if (entered && entered === expected) {
      localStorage.setItem(SESSION_KEY, 'authenticated');
      activateAdminMode();
      closeLoginModal();
      showToast('✓ مرحباً بك! تم تفعيل وضع المدير بنجاح.');
    } else {
      if (loginErrorMsg) loginErrorMsg.classList.remove('hidden');
      if (adminPinInput) {
        adminPinInput.value = '';
        adminPinInput.focus();
      }
    }
  }

  // Event Listeners for Login
  if (btnFooterAdminLock) {
    btnFooterAdminLock.addEventListener('click', openLoginModal);
  }

  if (btnCloseLoginModal) btnCloseLoginModal.addEventListener('click', closeLoginModal);
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLoginModal);
  if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', attemptLogin);

  if (adminPinInput) {
    adminPinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  if (adminLoginModal) {
    adminLoginModal.addEventListener('click', (e) => {
      if (e.target === adminLoginModal) closeLoginModal();
    });
  }

  // Logout
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      deactivateAdminMode();
      showToast('تم تسجيل الخروج من وضع المدير بنجاح.');
    });
  }

  // Change PIN
  if (btnChangePasswordAdmin) {
    btnChangePasswordAdmin.addEventListener('click', () => {
      if (newPinInput) newPinInput.value = '';
      if (changePinModal) {
        changePinModal.classList.remove('hidden');
        changePinModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => newPinInput && newPinInput.focus(), 150);
      }
    });
  }

  if (btnClosePinModal) btnClosePinModal.addEventListener('click', () => changePinModal.classList.add('hidden'));
  if (btnCancelPinChange) btnCancelPinChange.addEventListener('click', () => changePinModal.classList.add('hidden'));

  if (btnSaveNewPin) {
    btnSaveNewPin.addEventListener('click', () => {
      const p = newPinInput ? newPinInput.value.trim() : '';
      if (p.length >= 4) {
        localStorage.setItem(PIN_KEY, p);
        changePinModal.classList.add('hidden');
        showToast('✓ تم تغيير رمز مرور المدير بنجاح!');
      } else {
        alert('يرجى إدخال رمز مرور مكون من 4 خانات على الأقل.');
      }
    });
  }

  // Check on load: if user has active session OR opened with ?admin query param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('admin') || urlParams.has('manage')) {
    if (isAdminAuthenticated()) {
      activateAdminMode();
    } else {
      openLoginModal();
    }
  } else if (isAdminAuthenticated()) {
    activateAdminMode();
  }
}

/* ==========================================================
   DOWNLOAD LINK MANAGER (Allows owner to customize download URL)
   ========================================================== */
function initDownloadManager() {
  const config = window.CHARJINI_CONFIG || { downloadUrl: 'charjini.apk', downloadFileName: 'charjini.apk' };
  const STORAGE_KEY = 'charjini_custom_download_url';

  // Elements
  const linkModal = document.getElementById('linkModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const customUrlInput = document.getElementById('customUrlInput');
  const activeLinkDisplay = document.getElementById('activeLinkDisplay');
  const btnSaveLink = document.getElementById('btnSaveLink');
  const btnResetLink = document.getElementById('btnResetLink');
  const btnTestLink = document.getElementById('btnTestLink');

  // Modal Triggers (Admin Only)
  const triggers = [
    document.getElementById('btnOpenLinkModalNav'),
    document.getElementById('btnOpenLinkModalHero'),
    document.getElementById('btnOpenLinkModalBanner'),
    document.getElementById('btnOpenLinkModalAdmin')
  ];

  // Get current active URL
  function getActiveUrl() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved && saved.trim()) ? saved.trim() : config.downloadUrl;
  }

  // Apply URL to all download buttons
  function applyDownloadUrl() {
    const activeUrl = getActiveUrl();
    const downloadButtons = document.querySelectorAll('.download-action-target');
    const isExternal = activeUrl.startsWith('http://') || activeUrl.startsWith('https://');

    downloadButtons.forEach(btn => {
      btn.href = activeUrl;
      if (isExternal) {
        btn.target = '_blank';
        btn.removeAttribute('download');
      } else {
        btn.removeAttribute('target');
        btn.setAttribute('download', config.downloadFileName || 'charjini.apk');
      }
    });

    if (activeLinkDisplay) {
      activeLinkDisplay.textContent = activeUrl;
    }

    // Refresh QR Code
    updateQrCode(activeUrl);
  }

  // Open modal (Protected: only for Admin)
  function openModal() {
    const isLogged = localStorage.getItem('charjini_admin_session') === 'authenticated';
    if (!isLogged) {
      // Trigger login prompt instead
      const lockBtn = document.getElementById('btnFooterAdminLock');
      if (lockBtn) lockBtn.click();
      return;
    }

    const activeUrl = getActiveUrl();
    customUrlInput.value = (activeUrl !== config.downloadUrl) ? activeUrl : '';
    linkModal.classList.remove('hidden');
    linkModal.setAttribute('aria-hidden', 'false');
    customUrlInput.focus();
  }

  // Close modal
  function closeModal() {
    linkModal.classList.add('hidden');
    linkModal.setAttribute('aria-hidden', 'true');
  }

  // Event Listeners
  triggers.forEach(btn => {
    if (btn) btn.addEventListener('click', openModal);
  });

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

  if (linkModal) {
    linkModal.addEventListener('click', (e) => {
      if (e.target === linkModal) closeModal();
    });
  }

  // Save new URL
  if (btnSaveLink) {
    btnSaveLink.addEventListener('click', () => {
      const val = customUrlInput.value.trim();
      if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        showToast('✓ تم حفظ وتطبيق رابط التحميل الجديد بنجاح على جميع أزرار الموقع!');
      } else {
        localStorage.removeItem(STORAGE_KEY);
        showToast('✓ تم ضبط التحميل على رابط GitHub Release الافتراضي.');
      }
      applyDownloadUrl();
      closeModal();
    });
  }

  // Reset to default
  if (btnResetLink) {
    btnResetLink.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      customUrlInput.value = '';
      applyDownloadUrl();
      showToast('✓ تمت استعادة الرابط الافتراضي.');
      closeModal();
    });
  }

  // Test link
  if (btnTestLink) {
    btnTestLink.addEventListener('click', () => {
      const val = customUrlInput.value.trim() || config.downloadUrl;
      window.open(val, '_blank');
    });
  }

  // Initial apply
  applyDownloadUrl();
}

/* ==========================================================
   INTERACTIVE SIMULATOR
   ========================================================== */
function initSimulator() {
  const simBtns = document.querySelectorAll('.sim-btn');
  const simPinInput = document.getElementById('simPinInput');
  const simResultUssd = document.getElementById('simResultUssd');

  if (!simPinInput || !simResultUssd) return;

  const ussdPrefixes = {
    ooredoo: '*101*',
    telecom: '*123*',
    orange: '*100*'
  };

  let currentOp = 'ooredoo';

  function updateSimulator() {
    const rawPin = simPinInput.value.replace(/[^0-9]/g, '');
    const prefix = ussdPrefixes[currentOp] || '*101*';
    simResultUssd.textContent = `${prefix}${rawPin || 'XXXXXXXXXXXXXX'}#`;
  }

  simBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      simBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOp = btn.getAttribute('data-sim-op') || 'ooredoo';
      updateSimulator();
    });
  });

  simPinInput.addEventListener('input', updateSimulator);
  updateSimulator();
}

/* ==========================================================
   DYNAMIC QR CODE
   ========================================================== */
function updateQrCode(targetUrl) {
  const qrImg = document.getElementById('downloadQrImg');
  if (!qrImg) return;

  let fullUrl = targetUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    fullUrl = origin + path + targetUrl;
  }

  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(fullUrl)}`;
}

function initQrCode() {
  const config = window.CHARJINI_CONFIG || { downloadUrl: 'charjini.apk' };
  const saved = localStorage.getItem('charjini_custom_download_url');
  updateQrCode((saved && saved.trim()) ? saved.trim() : config.downloadUrl);
}

/* ==========================================================
   TOAST NOTIFICATION
   ========================================================== */
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

/* ==========================================================
   SMOOTH SCROLL
   ========================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
