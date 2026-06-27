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

// Mobile nav, active indicator, scroll progress, and counters
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('navMenu');
  const body = document.body;

  if (toggle && navLinks) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navLinks.classList.toggle('is-open', open);
      if (open) body.style.overflow = 'hidden';
      else body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      const open = !navLinks.classList.contains('is-open');
      setOpen(open);
    });

    navLinks.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 820) setOpen(false);
    });
  }

  // Active nav link highlighting + scroll progress
  const progressBar = document.getElementById('scrollProgressBar');
  const links = Array.from(document.querySelectorAll('.nav-link[data-nav]'));
  const sections = links
    .map((l) => document.getElementById(l.getAttribute('href')?.replace('#', '')))
    .filter(Boolean);

  const sectionById = new Map();
  links.forEach((l) => {
    const id = l.getAttribute('href')?.replace('#', '') || '';
    if (id) sectionById.set(id, l);
  });

  const setActive = () => {
    const headerH = document.querySelector('.site-header')?.offsetHeight || 76;
    let activeId = 'home';

    for (const [id] of sectionById) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top - headerH <= 40) activeId = id;
    }

    links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${activeId}`));
  };

  const setProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight <= 0 ? 0 : (scrollTop / scrollHeight) * 100;
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  window.addEventListener('scroll', () => {
    setActive();
    setProgress();
  }, { passive: true });

  setActive();
  setProgress();

  // Animated counters
  const counterEls = Array.from(document.querySelectorAll('[data-counter][data-target]'));
  if (counterEls.length) {
    const animateCounter = (el) => {
      const target = Number(el.getAttribute('data-target')) || 0;
      const duration = 950;
      const start = performance.now();
      const from = 0;

      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const val = Math.round(from + (target - from) * (t * (2 - t)));
        el.textContent = String(val);
        if (t < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.25 });

    counterEls.forEach((el) => io.observe(el));
  }

  // Skill progress animation
  const skillCards = Array.from(document.querySelectorAll('.skill-card[data-percent]'));
  if (skillCards.length) {
    const setSkill = (card) => {
      const percent = Number(card.getAttribute('data-percent')) || 0;
      const bar = card.querySelector('[data-bar]');
      const pctText = card.querySelector('[data-percent]');

      if (pctText) pctText.textContent = String(percent);
      if (bar) bar.style.width = `${percent}%`;

      // accessibility aria update
      const progress = card.querySelector('.progress[role="progressbar"]');
      if (progress) {
        progress.setAttribute('aria-valuenow', String(percent));
      }
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setSkill(entry.target);
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.25 });

    skillCards.forEach((c) => io.observe(c));
  }
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

  const EMAILJS_SERVICE_ID = 'service_fqtcfif';
  const EMAILJS_TEMPLATE_ID = 'template_8h6eisc';
  const EMAILJS_PUBLIC_KEY = '5vQmQM2YZlqwi71UI';

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

      // Initialize EmailJS (Browser v4)
      // IMPORTANT: Only initialize if not already initialized to avoid duplicate init issues.
      if (!window.emailjs.__isInitialized) {
        window.emailjs.__isInitialized = true;
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        console.log("EmailJS Version:", window.emailjs?.version);
      }


      const templateParams = {
        name: (nameEl?.value || '').trim(),
        email: (emailEl?.value || '').trim(),
        subject: (subjectEl?.value || '').trim(),
        message: (messageEl?.value || '').trim(),
      };
      console.log("Service:", EMAILJS_SERVICE_ID);
      console.log("Template:", EMAILJS_TEMPLATE_ID);
      console.log("Public:", EMAILJS_PUBLIC_KEY);
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      showToast('success', 'Sent!', 'Your message has been delivered successfully.');
      form.reset();

      //  Clear invalid states after reset
      [nameEl, emailEl, messageEl].forEach((el) => el?.classList.remove('is-invalid'));
      if (nameError) nameError.textContent = '';
      if (emailError) emailError.textContent = '';
      if (messageError) messageError.textContent = '';
    } catch (err) {
      // Detailed logging for debugging EmailJS "Account not found"
      console.error('EMAILJS ERROR (raw):', err);
      console.error('EMAILJS ERROR (text):', err?.text);
      console.error('EMAILJS ERROR (message):', err?.message);
      console.error('EMAILJS ERROR (status):', err?.status);
      console.error('EMAILJS ERROR (code):', err?.code);
      console.error('EMAILJS ERROR (details):', err?.details);

      // If EmailJS returns nested error structures, surface them.
      const apiErrorText =
        err?.text ||
        err?.message ||
        err?.details?.message ||
        err?.response?.text ||
        JSON.stringify(err);

      // Show the real error in console and toast
      showToast('error', 'EmailJS failed', apiErrorText);
    } finally {
      setSending(false);
    }

  });
})();

