/* ============================================
   FAIZUL ISHFAQUE — PORTFOLIO JS
   GSAP + Lenis + Heavy Animations
   ============================================ */
(function () {
  'use strict';

  let lenis = null;

  document.addEventListener('DOMContentLoaded', function () {
    // 1) Render data-driven content FIRST (so DOM elements exist)
    renderDataSections();
    setupFooterYear();

    // 2) Setup core libraries
    setupLenis();
    setupGSAP();

    // 3) Setup interactions
    setupNav();
    setupTheme();
    setupHeroCanvas();
    setupDynamicOrbs();
    setupPortraitParallax();
    setupProjectFilters();
    setupProjectModal();
    setupContactForm();
    setupBackToTop();
    setupScrollProgress();
    setupCursor();
    setupMagnetic();
    setupTiltCards();

    // 4) After a tiny delay to let DOM settle, run all scroll animations
    requestAnimationFrame(function () {
      setupHeroAnimations();
      setupScrollAnimations();
      setupCounters();
      setupTypingEffect();
    });

    // 5) Setup preloader (reveals page)
    setupPreloader();
  });

  /* ========== PRELOADER ========== */
  function setupPreloader() {
    var preloader = document.getElementById('preloader');
    var progress = document.getElementById('preloaderProgress');
    if (!preloader) return;

    var count = 0;
    var interval = setInterval(function () {
      count += Math.random() * 15 + 5;
      if (count >= 100) {
        count = 100;
        clearInterval(interval);
        if (progress) progress.style.width = '100%';
        setTimeout(function () {
          preloader.classList.add('done');
          document.body.classList.remove('no-scroll');
          // Refresh ScrollTrigger after preloader hides
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }, 400);
        return;
      }
      if (progress) progress.style.width = count + '%';
    }, 80);

    document.body.classList.add('no-scroll');
  }

  /* ========== LENIS SMOOTH SCROLL ========== */
  function setupLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Smooth anchor scrolling
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target && lenis) lenis.scrollTo(target, { offset: -72 });
      });
    });
  }

  /* ========== GSAP SETUP ========== */
  function setupGSAP() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ========== NAVIGATION ========== */
  function setupNav() {
    var nav = document.getElementById('nav');
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    var navLinks = document.querySelectorAll('.nav__link');
    var mobileLinks = document.querySelectorAll('.nav__mobile-link');

    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });

    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        var target = document.querySelector(link.getAttribute('href'));
        if (target && lenis) lenis.scrollTo(target, { offset: -72 });
        else if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Active link on scroll
    var sections = document.querySelectorAll('.section, .hero');
    var observerNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('data-section') === id);
          });
        }
      });
    }, { threshold: 0.3 });
    sections.forEach(function (s) { observerNav.observe(s); });
  }

  /* ========== THEME ========== */
  function setupTheme() {
    var toggle = document.getElementById('themeToggle');
    var saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  /* ========== HERO CANVAS (PARTICLES) ========== */
  function setupHeroCanvas() {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: -99999, y: -99999 };
    var PARTICLE_COUNT = 120;
    var CONNECTION_DIST = 150;
    var animId;
    var time = 0;

    function resize() {
      var parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    canvas.parentElement.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () {
      mouse.x = -99999;
      mouse.y = -99999;
    });

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    function animate() {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var particleColor = isDark ? '124, 58, 237' : '124, 58, 237';
      var accentColor = isDark ? '6, 182, 212' : '6, 182, 212';

      particles.forEach(function (p, i) {
        // Add wave motion
        var wave = Math.sin(time + p.phase) * 0.5;

        // Move with wave influence
        p.x += p.vx + wave * 0.1;
        p.y += p.vy + Math.cos(time + p.phase) * 0.1;

        // Boundary bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse interaction (attract and repel)
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          var force = (150 - dist) / 150;
          p.x += dx * force * 0.03;
          p.y += dy * force * 0.03;
        }

        // Pulsating opacity
        var pulseOpacity = p.opacity + Math.sin(time * 2 + p.phase) * 0.2;

        // Draw particle with gradient
        var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        var useCyan = Math.sin(time + i * 0.1) > 0.3;
        var color = useCyan ? accentColor : particleColor;
        gradient.addColorStop(0, 'rgba(' + color + ',' + pulseOpacity + ')');
        gradient.addColorStop(1, 'rgba(' + color + ', 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Connect nearby particles with colored lines
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var ddx = p.x - p2.x;
          var ddy = p.y - p2.y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            var lineOpacity = (1 - dd / CONNECTION_DIST) * 0.2;
            var lineGradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            lineGradient.addColorStop(0, 'rgba(' + particleColor + ',' + lineOpacity + ')');
            lineGradient.addColorStop(1, 'rgba(' + accentColor + ',' + lineOpacity + ')');
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(animate);
    }
    animate();
  }

  /* ========== DYNAMIC GRADIENT ORBS ========== */
  function setupDynamicOrbs() {
    var orbs = document.querySelectorAll('.hero__gradient-orb');
    if (orbs.length === 0) return;

    var mouse = { x: 0, y: 0 };
    var targetMouse = { x: 0, y: 0 };

    document.addEventListener('mousemove', function (e) {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = e.clientY / window.innerHeight;
    });

    function animateOrbs() {
      // Smooth mouse following
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      orbs.forEach(function (orb, i) {
        var speed = (i + 1) * 10;
        var xOffset = (mouse.x - 0.5) * speed;
        var yOffset = (mouse.y - 0.5) * speed;

        var currentTransform = orb.style.transform || '';
        var baseTransform = currentTransform.split('translate(')[0];
        orb.style.transform = baseTransform + ' translate(' + xOffset + 'px, ' + yOffset + 'px)';
      });

      requestAnimationFrame(animateOrbs);
    }
    animateOrbs();
  }

  /* ========== PORTRAIT PARALLAX INTERACTION ========== */
  function setupPortraitParallax() {
    var portraitWrap = document.querySelector('.hero__portrait-wrap');
    var portrait = document.querySelector('.hero__portrait');
    if (!portraitWrap || !portrait) return;

    portraitWrap.addEventListener('mousemove', function (e) {
      var rect = portraitWrap.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      var rotateY = x * 15;
      var rotateX = -y * 15;
      var translateZ = 20;

      portrait.style.transform = 'scale(1.05) translateZ(' + translateZ + 'px) rotateY(' + rotateY + 'deg) rotateX(' + rotateX + 'deg)';

      // Move rings in opposite direction
      var rings = portraitWrap.querySelectorAll('.hero__portrait-ring');
      rings.forEach(function (ring, i) {
        var multiplier = (i + 1) * 0.5;
        ring.style.transform = 'translate(' + (-x * 10 * multiplier) + 'px, ' + (-y * 10 * multiplier) + 'px) rotate(' + (i === 0 ? '0deg' : '0deg') + ')';
      });
    });

    portraitWrap.addEventListener('mouseleave', function () {
      portrait.style.transform = '';
      var rings = portraitWrap.querySelectorAll('.hero__portrait-ring');
      rings.forEach(function (ring) {
        ring.style.transform = '';
      });
    });
  }

  /* ========== HERO ANIMATIONS (GSAP) ========== */
  function setupHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    var tl = gsap.timeline({ delay: 1.5 });

    tl.to('.hero__text', {
      opacity: 1, duration: 0.01
    })
      .from('.hero__greeting', {
        opacity: 0, x: -50, rotateY: -15, z: -50, duration: 0.7, ease: 'power3.out'
      })
      .from('.hero__name-line', {
        opacity: 0, y: 80, rotateX: -30, z: -100, duration: 1, ease: 'power3.out', stagger: 0.2
      }, '-=0.3')
      .from('.hero__role', {
        opacity: 0, y: 30, z: -40, duration: 0.6, ease: 'power2.out'
      }, '-=0.4')
      .from('.hero__desc', {
        opacity: 0, y: 30, z: -30, duration: 0.6, ease: 'power2.out'
      }, '-=0.3')
      .from('.hero__actions .btn', {
        opacity: 0, y: 30, z: -50, rotateX: -10, duration: 0.6, ease: 'power2.out', stagger: 0.12
      }, '-=0.3')
      .from('.hero__socials .hero__social', {
        opacity: 0, y: 20, scale: 0.6, z: -30, duration: 0.5, ease: 'back.out(2)', stagger: 0.1
      }, '-=0.3')
      .from('.hero__portrait-wrap', {
        opacity: 0, scale: 0.6, rotateY: 30, z: -150, duration: 1, ease: 'power3.out'
      }, '-=0.9')
      .from('.hero__stat', {
        opacity: 0, scale: 0.3, y: 40, z: -60, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.15
      }, '-=0.5')
      .from('.hero__scroll', {
        opacity: 0, y: 30, duration: 0.5, ease: 'power2.out'
      }, '-=0.3');
  }

  /* ========== SCROLL ANIMATIONS ========== */
  function setupScrollAnimations() {
    // Use IntersectionObserver for .anim-item elements
    var animItems = document.querySelectorAll('.anim-item');
    if (animItems.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animItems.forEach(function (item, i) {
      // Add stagger delay
      item.style.transitionDelay = (i % 5) * 0.12 + 's';
      observer.observe(item);
    });

    // GSAP ScrollTrigger for section headers with 3D depth
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll('.section__header').forEach(function (header) {
      gsap.from(header.querySelector('.section__number'), {
        scrollTrigger: {
          trigger: header, start: 'top 80%', toggleActions: 'play none none none'
        },
        opacity: 0, x: -50, z: -40, rotateY: -20, duration: 0.8, ease: 'power3.out'
      });
      gsap.from(header.querySelector('.section__title'), {
        scrollTrigger: {
          trigger: header, start: 'top 80%', toggleActions: 'play none none none'
        },
        opacity: 0, y: 50, z: -60, rotateX: -15, duration: 0.9, ease: 'power3.out', delay: 0.15
      });
      gsap.from(header.querySelector('.section__line'), {
        scrollTrigger: {
          trigger: header, start: 'top 80%', toggleActions: 'play none none none'
        },
        scaleX: 0, z: -20, duration: 0.7, ease: 'power3.out', delay: 0.3
      });
    });

    // Animate timeline items with 3D depth
    document.querySelectorAll('.timeline__item').forEach(function (item, i) {
      gsap.to(item, {
        scrollTrigger: {
          trigger: item, start: 'top 85%', toggleActions: 'play none none none'
        },
        opacity: 1, x: 0, z: 0, rotateY: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.12
      });
    });

    // 3D Parallax on sections    
    document.querySelectorAll('.section').forEach(function (section) {
      gsap.fromTo(section,
        { z: -30, rotateX: 2 },
        {
          z: 0, rotateX: 0,
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 30%',
            scrub: 1
          },
          ease: 'none'
        }
      );
    });

    // Parallax on gradient orbs
    gsap.to('.hero__gradient-orb--1', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      y: -150, z: -50, ease: 'none'
    });
    gsap.to('.hero__gradient-orb--2', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      y: -100, z: -30, ease: 'none'
    });
  }

  /* ========== TYPING EFFECT ========== */
  function setupTypingEffect() {
    var el = document.getElementById('heroRole');
    if (!el) return;
    var roles = [
      'Software Engineer',
      'Full Stack Developer',
      'UI/UX Enthusiast',
      'MERN Stack Developer',
      'Quality Engineer',
      'ERP Developer'
    ];
    var roleIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typingSpeed = 100;

    function type() {
      var current = roles[roleIndex];
      if (isDeleting) {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;
      } else {
        el.textContent = current.substring(0, charIndex + 1);
        charIndex++;
      }

      if (!isDeleting && charIndex === current.length) {
        setTimeout(function () { isDeleting = true; type(); }, 2000);
        return;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }

      var speed = isDeleting ? typingSpeed / 2 : typingSpeed;
      setTimeout(type, speed);
    }

    // Start typing after hero animation completes
    setTimeout(type, 3500);
  }

  /* ========== COUNTERS ========== */
  function setupCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          animateCounter(el, 0, target, 1500);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { observer.observe(c); });
  }

  function animateCounter(el, start, end, duration) {
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      el.textContent = Math.floor(eased * (end - start) + start);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = end + '+';
    }
    requestAnimationFrame(step);
  }

  /* ========== PROJECT FILTERS ========== */
  function setupProjectFilters() {
    var filters = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.project-card');

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        filters.forEach(function (f) { f.classList.remove('active'); });
        btn.classList.add('active');

        cards.forEach(function (card) {
          var cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.classList.remove('hidden');
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(function () { card.classList.add('hidden'); }, 300);
          }
        });
      });
    });
  }

  /* ========== PROJECT MODAL ========== */
  function setupProjectModal() {
    var modal = document.getElementById('projectModal');
    var backdrop = document.getElementById('modalBackdrop');
    var closeBtn = document.getElementById('modalClose');
    var titleEl = document.getElementById('modalTitle');
    var descEl = document.getElementById('modalDesc');
    var featuresEl = document.getElementById('modalFeatures');
    var techEl = document.getElementById('modalTech');
    var repoEl = document.getElementById('modalRepo');

    document.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var title = card.getAttribute('data-title');
        var desc = card.getAttribute('data-description');
        var features = (card.getAttribute('data-features') || '').split('|');
        var tech = (card.getAttribute('data-tech') || '').split(',');
        var url = card.getAttribute('data-url');

        titleEl.textContent = title;
        descEl.textContent = desc;
        featuresEl.innerHTML = features.map(function (f) { return '<li>' + f.trim() + '</li>'; }).join('');
        techEl.innerHTML = tech.map(function (t) { return '<span>' + t.trim() + '</span>'; }).join('');
        repoEl.href = url || '#';

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  }

  /* ========== CONTACT FORM ========== */
  function setupContactForm() {
    var form = document.getElementById('contactForm');
    var errorEl = document.getElementById('contactFormError');
    var submitBtn = document.getElementById('contactSubmitBtn');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameVal = document.getElementById('contactName').value.trim();
      var emailVal = document.getElementById('contactEmail').value.trim();
      var messageVal = document.getElementById('contactMessage').value.trim();

      if (!nameVal || !emailVal || !messageVal) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.style.color = 'var(--accent-3)';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.color = 'var(--accent-3)';
        return;
      }

      errorEl.textContent = '';
      var btnText = submitBtn.querySelector('.btn__text');
      var originalText = btnText.textContent;
      btnText.textContent = 'Sending...';
      submitBtn.disabled = true;

      var formAction = form.getAttribute('action');
      fetch(formAction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          message: messageVal
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Form submission failed');
          }
          btnText.textContent = 'Sent Successfully!';
          errorEl.textContent = 'Message sent! I\'ll get back to you soon.';
          errorEl.style.color = 'var(--accent-4)';
          form.reset();
          setTimeout(function () {
            btnText.textContent = originalText;
            submitBtn.disabled = false;
            errorEl.textContent = '';
          }, 4000);
        });
      }).catch(function (err) {
        console.error('Contact form error:', err);
        errorEl.textContent = 'Failed to send. Please try again later.';
        errorEl.style.color = 'var(--accent-3)';
        btnText.textContent = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  /* ========== BACK TO TOP ========== */
  function setupBackToTop() {
    var btn = document.getElementById('backToTop');
    var resumeBtn = document.getElementById('floatingResume');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
        if (resumeBtn) resumeBtn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
        if (resumeBtn) resumeBtn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ========== SCROLL PROGRESS ========== */
  function setupScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ========== CUSTOM CURSOR ========== */
  function setupCursor() {
    var cursor = document.getElementById('cursor');
    var follower = document.getElementById('cursorFollower');
    if (!cursor || !follower) return;

    // Check for hover capability
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var cx = 0, cy = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', function (e) {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
    });

    function animateFollower() {
      fx += (cx - fx) * 0.12;
      fy += (cy - fy) * 0.12;
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover states
    var hoverTargets = document.querySelectorAll('a, button, .project-card, .service-card, .gallery-item, .filter-btn, .tech-tag, .floating-resume');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('hover');
        follower.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
      });
    });
  }

  /* ========== MAGNETIC BUTTONS ========== */
  function setupMagnetic() {
    var magneticEls = document.querySelectorAll('.magnetic');
    magneticEls.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + x * 0.2 + 'px,' + y * 0.2 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform 0.4s ease';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }

  /* ========== 3D TILT CARDS ========== */
  function setupTiltCards() {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    var cards = document.querySelectorAll('.tilt-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = (y - centerY) / centerY * -10;
        var rotateY = (x - centerX) / centerX * 10;

        card.style.transform = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(20px) translateY(-8px)';

        // Move glow to cursor position
        var glowEl = card.querySelector('.service-card__glow');
        if (glowEl) {
          glowEl.style.background = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(var(--accent-rgb), 0.15), transparent 70%)';
          glowEl.style.opacity = '1';
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        setTimeout(function () { card.style.transition = ''; }, 600);

        var glowEl = card.querySelector('.service-card__glow');
        if (glowEl) glowEl.style.opacity = '0';
      });
    });
  }

  /* ========== RENDER DATA SECTIONS ========== */
  function renderDataSections() {
    var data = window.PORTFOLIO_DATA;
    if (!data) return;

    // Experience Timeline
    var expTimeline = document.getElementById('experienceTimeline');
    if (expTimeline && data.experience) {
      expTimeline.innerHTML = data.experience.map(function (item) {
        var highlights = '';
        if (item.highlights && item.highlights.length) {
          highlights = '<ul class="timeline__highlights">' +
            item.highlights.map(function (h) { return '<li>' + h + '</li>'; }).join('') +
            '</ul>';
        }
        return '<div class="timeline__item">' +
          '<div class="timeline__dot"></div>' +
          '<div class="timeline__date">' + item.start + ' — ' + item.end + '</div>' +
          '<div class="timeline__title">' + item.role + '</div>' +
          '<div class="timeline__sub">' + item.company + ' · ' + item.location + '</div>' +
          highlights +
          '</div>';
      }).join('');
    }

    // Education Timeline
    var eduTimeline = document.getElementById('educationTimeline');
    if (eduTimeline && data.education) {
      eduTimeline.innerHTML = data.education.map(function (item) {
        var dateStr = item.start && item.end ? item.start + ' — ' + item.end : (item.start || '');
        return '<div class="timeline__item">' +
          '<div class="timeline__dot"></div>' +
          (dateStr ? '<div class="timeline__date">' + dateStr + '</div>' : '') +
          '<div class="timeline__title">' + item.program + '</div>' +
          '<div class="timeline__sub">' + item.institution + (item.focus ? ' · ' + item.focus : '') + '</div>' +
          '</div>';
      }).join('');
    }

    // Awards
    var awardsList = document.getElementById('awardsList');
    if (awardsList && data.awards) {
      awardsList.innerHTML = data.awards.map(function (a) {
        return '<div class="award-item anim-item">' +
          '<div class="award-icon">🏆</div>' +
          '<div class="award-text">' + a + '</div>' +
          '</div>';
      }).join('');
    }

    // Certifications tags
    var certTags = document.getElementById('certTags');
    if (certTags && data.certifications) {
      certTags.innerHTML = data.certifications.map(function (c) {
        return '<span class="cert-tag anim-item">' + c + '</span>';
      }).join('');
    }

    // Certificate gallery
    var certGallery = document.getElementById('certificateGallery');
    if (certGallery && data.certificateImages) {
      certGallery.innerHTML = data.certificateImages.map(function (img) {
        return '<a class="gallery-item anim-item glightbox" href="' + img.src + '" data-glightbox="title: ' + img.caption + '">' +
          '<img src="' + img.src + '" alt="' + img.caption + '" loading="lazy"/>' +
          '<div class="gallery-item__caption">' + img.caption + '</div>' +
          '</a>';
      }).join('');
    }

    // Gallery
    var galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid && data.gallery) {
      galleryGrid.innerHTML = data.gallery.map(function (img) {
        return '<a class="gallery-item anim-item glightbox" href="' + img.src + '" data-glightbox="title: ' + img.caption + '">' +
          '<img src="' + img.src + '" alt="' + img.caption + '" loading="lazy"/>' +
          '<div class="gallery-item__caption">' + img.caption + '</div>' +
          '</a>';
      }).join('');
    }

    // Init GLightbox
    if (typeof GLightbox !== 'undefined') {
      GLightbox({ selector: '.glightbox' });
    }
  }

  /* ========== FOOTER YEAR ========== */
  function setupFooterYear() {
    var el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
  }

})();
