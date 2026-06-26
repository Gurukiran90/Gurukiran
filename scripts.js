// Existing functionality kept (Explore button hover animation)
(() => {
  const btn = document.querySelector('.trending-btn');
  if (btn) {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });
  }
})();

// Scroll reveal animations (performance-optimized)
(() => {
  const elements = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!elements.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => io.observe(el));
})();

// Contact form: inline validation + EmailJS integration (no alert())
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const subjectEl = document.getElementById('subject');
  const messageEl = document.getElementById('message');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');

  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const submitText = document.getElementById('submitText');

  const toast = document.getElementById('formToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  const EMAILJS_SERVICE_ID = 'service_lioyygz';
  const EMAILJS_TEMPLATE_ID = 'template_j70xxpn';
  const EMAILJS_PUBLIC_KEY = 'ZI8xucvtjoyGYORxL';

  const setFieldInvalid = (el, errorEl, message) => {
    el.classList.toggle('is-invalid', true);
    if (errorEl) errorEl.textContent = message || '';
  };

  const clearFieldInvalid = (el, errorEl) => {
    el.classList.toggle('is-invalid', false);
    if (errorEl) errorEl.textContent = '';
  };

  const isValidEmail = (value) => {
    // Practical RFC5322-ish check for UI validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  };

  const showToast = (type, title, message) => {
    if (!toast) return;

    toast.classList.remove('success', 'error');
    toast.classList.add(type);

    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;

    toast.classList.add('is-visible');

    // Auto-hide
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 4200);
  };

  const setSending = (isSending) => {
    if (!submitBtn) return;
    submitBtn.disabled = !!isSending;

    if (spinner) spinner.classList.toggle('is-visible', !!isSending);
    if (submitText) submitText.textContent = isSending ? 'Sending...' : 'Send Message';
  };

  const validate = () => {
    let ok = true;

    // Name required
    const nameVal = (nameEl?.value || '').trim();
    if (!nameVal || nameVal.length < 2) {
      ok = false;
      setFieldInvalid(nameEl, nameError, 'Name is required.');
    } else {
      clearFieldInvalid(nameEl, nameError);
    }

    // Email required + format
    const emailVal = (emailEl?.value || '').trim();
    if (!emailVal) {
      ok = false;
      setFieldInvalid(emailEl, emailError, 'Email is required.');
    } else if (!isValidEmail(emailVal)) {
      ok = false;
      setFieldInvalid(emailEl, emailError, 'Enter a valid email address.');
    } else {
      clearFieldInvalid(emailEl, emailError);
    }

    // Message required + min length
    const messageVal = (messageEl?.value || '').trim();
    if (!messageVal) {
      ok = false;
      setFieldInvalid(messageEl, messageError, 'Message is required.');
    } else if (messageVal.length < 10) {
      ok = false;
      setFieldInvalid(messageEl, messageError, 'Message must be at least 10 characters.');
    } else {
      clearFieldInvalid(messageEl, messageError);
    }

    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear previous toast
    if (toast) toast.classList.remove('is-visible');

    if (!validate()) {
      showToast('error', 'Fix the form', 'Please correct the highlighted fields and try again.');
      return;
    }

    setSending(true);

    try {
      // Safety: ensure EmailJS is available
      if (!window.emailjs) {
        throw new Error('EmailJS SDK not loaded');
      }

      // Initialize (safe to call multiple times)
      window.emailjs.init(EMAILJS_PUBLIC_KEY);

      const templateParams = {
        name: (nameEl?.value || '').trim(),
        email: (emailEl?.value || '').trim(),
        subject: (subjectEl?.value || '').trim(),
        message: (messageEl?.value || '').trim(),
      };

      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      showToast('success', 'Sent!', 'Your message has been delivered successfully.');
      form.reset();

      // Clear invalid states after reset
      [nameEl, emailEl, messageEl].forEach((el) => el?.classList.remove('is-invalid'));
      if (nameError) nameError.textContent = '';
      if (emailError) emailError.textContent = '';
      if (messageError) messageError.textContent = '';
    } catch (err) {
      showToast('error', 'Not sent', 'Something went wrong. Please try again later.');
      // Keep form values so user can retry
    } finally {
      setSending(false);
    }
  });
})();

