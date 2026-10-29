/**
 * Charjini Landing Page - Interactive Controller & Download Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  initDownloadManager();
  initSimulator();
  initQrCode();
  initSmoothScroll();
});

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
  const toast = document.getElementById('toastNotification');

  // Modal Triggers
  const triggers = [
    document.getElementById('btnOpenLinkModalNav'),
    document.getElementById('btnOpenLinkModalHero'),
    document.getElementById('btnOpenLinkModalBanner'),
    document.getElementById('btnOpenLinkModalFooter')
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
      activeLinkDisplay.textContent = activeUrl + (activeUrl === config.downloadUrl ? ' (الافتراضي المباشر)' : ' (مخصص من قبلك)');
    }

    // Refresh QR Code
    updateQrCode(activeUrl);
  }

  // Open modal
  function openModal() {
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

  // Show Toast
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
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
        showToast('✓ تم حفظ رابط التحميل المخصص بنجاح وتطبيقه على كافة الأزرار!');
      } else {
        localStorage.removeItem(STORAGE_KEY);
        showToast('✓ تم ضبط التحميل على ملف charjini.apk الافتراضي المباشر.');
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
      showToast('✓ تمت استعادة رابط التحميل الافتراضي (charjini.apk).');
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

  // Resolve absolute URL
  let fullUrl = targetUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    // Relative link to APK in current host
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    fullUrl = origin + path + targetUrl;
  }

  // Use reliable QR Server API
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(fullUrl)}`;
}

function initQrCode() {
  const config = window.CHARJINI_CONFIG || { downloadUrl: 'charjini.apk' };
  const saved = localStorage.getItem('charjini_custom_download_url');
  updateQrCode((saved && saved.trim()) ? saved.trim() : config.downloadUrl);
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
