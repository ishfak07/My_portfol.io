const NAV_BAR = document.getElementById('navBar');
const NAV_LIST = document.getElementById('navList');
const HERO_HEADER = document.getElementById('heroHeader');
const HAMBURGER_BTN = document.getElementById('hamburgerBtn');
const NAV_LINKS = Array.from(document.querySelectorAll('.nav__list-link'));
const SERVICE_BOXES = document.querySelectorAll('.service-card__box');
const ACTIVE_LINK_CLASS = 'active';
const BREAKPOINT = 576;
const THEME_TOGGLE_BTN = document.getElementById('themeToggleBtn');
const BODY = document.body;
const SKILL_ITEMS = document.querySelectorAll('.skill');
const WORKS_FILTER_BTNS = document.querySelectorAll('.works__filter-btn');
const WORK_ITEMS = document.querySelectorAll('.work');
const MODAL = document.getElementById('projectModal');
const MODAL_CLOSE_BTN = document.getElementById('modalCloseBtn');
const MODAL_TITLE = document.getElementById('modalProjectTitle');
const MODAL_DESC = document.getElementById('modalProjectDescription');
const MODAL_TECH = document.getElementById('modalProjectTech');
const MODAL_FEATURES = document.getElementById('modalProjectFeatures');
const MODAL_REPO_LINK = document.getElementById('modalProjectRepoLink');
const BACK_TO_TOP_BTN = document.getElementById('backToTopBtn');
const CURRENT_YEAR_SPAN = document.getElementById('currentYear');
const TYPED_ROLE_PRIMARY = document.getElementById('typedRolePrimary');
const TYPED_ROLE_SECONDARY = document.getElementById('typedRoleSecondary');
const DYNAMIC_TAGLINE = document.getElementById('dynamicTagline');
const EXPERIENCE_TIMELINE = document.getElementById('experienceTimeline');
const EDUCATION_LIST = document.getElementById('educationList');
const CERT_LIST = document.getElementById('certList');
const AWARDS_LIST = document.getElementById('awardsList');
const COPY_EMAIL_BTN = document.getElementById('copyEmailBtn');
const CONTACT_FORM = document.querySelector('.contact__form');
const CONTACT_ERROR = document.getElementById('contactFormError');

// Footer Year
if (CURRENT_YEAR_SPAN) CURRENT_YEAR_SPAN.textContent = new Date().getFullYear();

// Data driven sections
const DATA = window.PORTFOLIO_DATA || {};
function renderExperience(){
  if(!EXPERIENCE_TIMELINE || !DATA.experience) return;
  EXPERIENCE_TIMELINE.innerHTML = DATA.experience.map(exp => `
    <div class="timeline-item">
      <div class="timeline-item__role">${exp.role}</div>
      <div class="timeline-item__company">${exp.company}</div>
      <div class="timeline-item__meta">${exp.start} – ${exp.end} • ${exp.location}</div>
      <ul class="timeline-item__list">
        ${exp.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}
function renderEducation(){
  if(!EDUCATION_LIST || !DATA.education) return;
  EDUCATION_LIST.innerHTML = DATA.education.map(ed => `
    <div class="edu-item">
      <div class="edu-item__program">${ed.program}</div>
      <div class="edu-item__institution">${ed.institution}</div>
      <div class="edu-item__meta">${[ed.focus, ed.start && ed.end ? `${ed.start} – ${ed.end}` : ''].filter(Boolean).join(' • ')}</div>
    </div>
  `).join('');
}
function renderCerts(){
  if(!CERT_LIST || !DATA.certifications) return;
  CERT_LIST.innerHTML = DATA.certifications.map(c => `<li>${c}</li>`).join('');
}
function renderAwards(){
  if(!AWARDS_LIST || !DATA.awards) return;
  AWARDS_LIST.innerHTML = DATA.awards.map(a => `<li>${a}</li>`).join('');
}
renderExperience();
renderEducation();
renderCerts();
renderAwards();

// Utility interactions (print button removed)
COPY_EMAIL_BTN?.addEventListener('click', (e)=>{
  const email = e.currentTarget.getAttribute('data-email');
  if(!email) return;
  navigator.clipboard.writeText(email).then(()=>{
    COPY_EMAIL_BTN.textContent = 'Copied!';
    setTimeout(()=> COPY_EMAIL_BTN.textContent = 'Copy Email', 1800);
  });
});

// Contact form submission (frontend -> API)
if(CONTACT_FORM){
  CONTACT_FORM.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const nameEl = document.getElementById('contactNameTxt');
    const emailEl = document.getElementById('contactEmailTxt');
    const msgEl = document.getElementById('contactDescriptionTxt');
  const honeypotEl = document.getElementById('contactGotcha'); // honeypot (hidden)
    const submitBtn = document.getElementById('contactSubmitBtn');
    const nameVal = nameEl.value.trim();
    const emailVal = emailEl.value.trim();
    const msgVal = msgEl.value.trim();
    if(honeypotEl && honeypotEl.value){
      // bot detected silently succeed
      CONTACT_FORM.reset();
      return;
    }
    if(!nameVal || !emailVal || !msgVal){
      CONTACT_ERROR.textContent = 'Please fill in all required fields.';
      return;
    }
    // rudimentary email check
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)){
      CONTACT_ERROR.textContent = 'Please provide a valid email address.';
      return;
    }
    CONTACT_ERROR.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      const formAction = CONTACT_FORM.getAttribute('action');
      const resp = await fetch(formAction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal })
      });
      const data = await resp.json().catch(()=>({}));
      if(!resp.ok || data.error){
        throw new Error(data.error || 'Form submission failed');
      }
      CONTACT_FORM.reset();
      CONTACT_ERROR.style.color = 'var(--clr-accent)';
      CONTACT_ERROR.textContent = 'Message sent successfully!';
      setTimeout(()=>{CONTACT_ERROR.textContent=''; CONTACT_ERROR.style.color='var(--clr-danger)';}, 4000);
    } catch(err){
      CONTACT_ERROR.textContent = 'Failed to send. Please try again later.';
      console.error('Contact form error:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
    }
  });
}

// Contact portrait animation (only on contact page)
(()=>{
  const photo = document.querySelector('.contact-photo');
  if(!photo || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){
        photo.classList.add('is-visible');
        obs.disconnect();
      }
    });
  }, {threshold:.35});
  obs.observe(photo);
})();

let currentServiceBG = null;
let currentActiveLink = document.querySelector('.nav__list-link.active');

// Multi-page active nav highlight
(function setActiveNav(){
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html');
  NAV_LINKS.forEach(a => {
    const href = a.getAttribute('href');
    if(!href) return;
    if(href === currentFile || (currentFile === '' && href === 'index.html')){
      currentActiveLink?.classList?.remove(ACTIVE_LINK_CLASS);
      a.classList.add(ACTIVE_LINK_CLASS);
      currentActiveLink = a;
    }
  });
})();

// Remove the active state once the breakpoint is reached
const resetActiveState = ()=>{
  if(!NAV_LIST) return;
  NAV_LIST.classList.remove('nav--active');
  if(NAV_LIST.style){
    NAV_LIST.style.height = null;
  }
  document.body.style.overflowY = null;
};

//Add padding to the header to make it visible because navbar has a fixed position.
const addPaddingToHeroHeaderFn = () => {
  if(!NAV_BAR || !HERO_HEADER) return;
  if(NAV_LIST && NAV_LIST.classList.contains('nav--active')) return;
  const NAV_BAR_HEIGHT = NAV_BAR.getBoundingClientRect().height;
  HERO_HEADER.style.paddingTop = (NAV_BAR_HEIGHT / 10) + 'rem';
};
addPaddingToHeroHeaderFn();
window.addEventListener('resize', ()=>{
  addPaddingToHeroHeaderFn();

  // When the navbar is active and the window is being resized, remove the active state once the breakpoint is reached
  if(window.innerWidth >= BREAKPOINT){
    addPaddingToHeroHeaderFn();
    resetActiveState();
  }
});

// As the user scrolls, the active link should change based on the section currently displayed on the screen.
window.addEventListener('scroll', ()=>{
  if(!NAV_BAR) return; // skip if nav not present on this page
  const sections = document.querySelectorAll('#heroHeader, #services, #skills, #works, #contact');
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const NAV_BAR_HEIGHT = NAV_BAR.getBoundingClientRect().height;
    if(window.scrollY >= sectionTop - NAV_BAR_HEIGHT){
      const ID = section.getAttribute('id');
      const LINK = NAV_LINKS.find(link => link.href.includes('#'+ID));
      if(LINK && currentActiveLink !== LINK){
        currentActiveLink?.classList?.remove(ACTIVE_LINK_CLASS);
        LINK.classList.add(ACTIVE_LINK_CLASS);
        currentActiveLink = LINK;
      }
    }
  });
});

// THEME TOGGLE (persists to localStorage)
const THEME_KEY = 'preferred-theme';
const applyTheme = (theme)=>{
  BODY.setAttribute('data-theme', theme);
  if (THEME_TOGGLE_BTN){
    THEME_TOGGLE_BTN.textContent = theme === 'light' ? '🌙' : '☀️';
    THEME_TOGGLE_BTN.setAttribute('aria-label', `Activate ${theme === 'light' ? 'dark' : 'light'} theme`);
  }
};
const savedTheme = localStorage.getItem(THEME_KEY);
if(savedTheme){
  applyTheme(savedTheme);
}
THEME_TOGGLE_BTN?.addEventListener('click', ()=>{
  const current = BODY.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

// Typing Effect for roles (only on pages containing the elements)
if (TYPED_ROLE_PRIMARY && TYPED_ROLE_SECONDARY){
  const rolesPrimary = ['Web', 'Front-End', 'Creative'];
  const rolesSecondary = ['Developer', 'Engineer', 'Designer'];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let secondaryPhase = false;
  (function typeLoop(){
    const primaryWord = rolesPrimary[roleIndex % rolesPrimary.length];
    const secondaryWord = rolesSecondary[roleIndex % rolesSecondary.length];
    const currentWord = secondaryPhase ? secondaryWord : primaryWord;
    const targetEl = secondaryPhase ? TYPED_ROLE_SECONDARY : TYPED_ROLE_PRIMARY;
    if(!targetEl) return;
    if(!isDeleting){
      targetEl.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      if(charIndex === currentWord.length){
        setTimeout(()=>{isDeleting = true;}, 1000);
      }
    } else {
      targetEl.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      if(charIndex === 0){
        isDeleting = false;
        if(secondaryPhase){
          roleIndex++;
        }
        secondaryPhase = !secondaryPhase;
      }
    }
    const speed = isDeleting ? 60 : 120;
    setTimeout(typeLoop, speed);
  })();
}

// Dynamic tagline rotation
const taglines = [
  'As a front-end web developer, my passion lies in creating beautiful and intuitive user experiences.',
  'I craft accessible, performant interfaces with clean semantic code.',
  'I love translating design ideas into delightful real-world interactions.'
];
let taglineIndex = 0;
setInterval(()=>{
  if(!DYNAMIC_TAGLINE) return;
  taglineIndex = (taglineIndex + 1) % taglines.length;
  DYNAMIC_TAGLINE.style.opacity = 0;
  setTimeout(()=>{
    DYNAMIC_TAGLINE.textContent = taglines[taglineIndex];
    DYNAMIC_TAGLINE.style.opacity = 1;
  }, 400);
}, 6000);

// Skill bar animation when visible
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const level = entry.target.getAttribute('data-level');
      const fill = entry.target.querySelector('.skill__bar-fill');
      if(fill){
        requestAnimationFrame(()=>{
          fill.style.width = level + '%';
        });
      }
      skillObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.3});
SKILL_ITEMS.forEach(item => skillObserver.observe(item));

// Project filtering
WORKS_FILTER_BTNS.forEach(btn => {
  btn.addEventListener('click', () => {
    WORKS_FILTER_BTNS.forEach(b => b.classList.remove('works__filter-btn--active'));
    btn.classList.add('works__filter-btn--active');
    const filter = btn.getAttribute('data-filter');
    WORK_ITEMS.forEach(item => {
      const cat = item.getAttribute('data-category');
      if(filter === 'all' || cat === filter){
        item.style.display = '';
        requestAnimationFrame(()=>{item.style.opacity = 1;});
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// Modal logic
let previousActiveElement = null;
const openModal = (title, description, techCSV, featuresCSV, repoUrl) => {
  previousActiveElement = document.activeElement;
  MODAL_TITLE.textContent = title;
  MODAL_DESC.textContent = description;
  MODAL_TECH.innerHTML = '';
  techCSV.split(',').map(t => t.trim()).forEach(t => {
    const span = document.createElement('span');
    span.textContent = t;
    MODAL_TECH.appendChild(span);
  });
  if(MODAL_FEATURES){
    MODAL_FEATURES.innerHTML = '';
    if(featuresCSV){
      featuresCSV.split('|').map(f=>f.trim()).forEach(f=>{
        if(!f) return;
        const li = document.createElement('li');
        li.textContent = f;
        MODAL_FEATURES.appendChild(li);
      });
    }
    MODAL_FEATURES.style.display = MODAL_FEATURES.children.length ? '' : 'none';
  }
  if(MODAL_REPO_LINK){
    if(repoUrl){
      MODAL_REPO_LINK.href = repoUrl;
      MODAL_REPO_LINK.style.display = '';
    } else {
      MODAL_REPO_LINK.style.display = 'none';
    }
  }
  MODAL.classList.add('modal--open');
  MODAL.setAttribute('aria-hidden', 'false');
  MODAL.setAttribute('aria-modal', 'true');
  MODAL_CLOSE_BTN.focus();
  document.body.style.overflow = 'hidden';
};
const closeModal = () => {
  MODAL.classList.remove('modal--open');
  MODAL.setAttribute('aria-hidden', 'true');
  MODAL.setAttribute('aria-modal', 'false');
  document.body.style.overflow = '';
  if(previousActiveElement) previousActiveElement.focus();
};
MODAL_CLOSE_BTN?.addEventListener('click', closeModal);
MODAL?.addEventListener('click', (e)=>{ if(e.target === MODAL) closeModal(); });
window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && MODAL.classList.contains('modal--open')) closeModal(); });
WORK_ITEMS.forEach(item => {
  item.addEventListener('click', ()=>{
    openModal(
      item.getAttribute('data-title'),
      item.getAttribute('data-description'),
      item.getAttribute('data-tech'),
      item.getAttribute('data-features'),
      item.getAttribute('data-url')
    );
  });
  item.setAttribute('tabindex', '0');
  item.addEventListener('keypress', (e)=>{ if(e.key === 'Enter') item.click(); });
});

// Scroll reveal for work items
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.15});
document.querySelectorAll('.work__reveal').forEach(el => revealObserver.observe(el));

// Tilt effect for project cards (progressive enhancement)
const tiltCards = document.querySelectorAll('[data-tilt]');
tiltCards.forEach(card => {
  const strength = 12; // tilt intensity
  let enterTimeout;
  function handleMove(e){
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 - 1
    const y = (e.clientY - rect.top) / rect.height; // 0 - 1
    const rx = (y - .5) * strength;
    const ry = (x - .5) * -strength;
    card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  }
  function reset(){
    card.style.transform = '';
  }
  card.addEventListener('mouseenter', e=>{
    clearTimeout(enterTimeout);
    enterTimeout = setTimeout(()=>card.classList.add('tilt-active'),40);
  });
  card.addEventListener('mousemove', handleMove);
  card.addEventListener('mouseleave', ()=>{reset();card.classList.remove('tilt-active');});
  card.addEventListener('touchmove', e=>{
    if(e.touches && e.touches[0]){
      handleMove(e.touches[0]);
    }
  }, {passive:true});
  card.addEventListener('touchend', reset);
});

// Back to top button
window.addEventListener('scroll', () => {
  if(!BACK_TO_TOP_BTN) return; // guard for pages without the button
  if(window.scrollY > 900){
    BACK_TO_TOP_BTN.classList.add('back-to-top--visible');
  } else {
    BACK_TO_TOP_BTN.classList.remove('back-to-top--visible');
  }
});
BACK_TO_TOP_BTN?.addEventListener('click', ()=>{
  window.scrollTo({top:0, behavior:'smooth'});
});

// Shows & hide navbar on smaller screen
if(HAMBURGER_BTN && NAV_LIST){
  HAMBURGER_BTN.addEventListener('click', ()=>{
    NAV_LIST.classList.toggle('nav--active');
    if (NAV_LIST.classList.contains('nav--active')) {
      document.body.style.overflowY = 'hidden';
      NAV_LIST.style.height = '100vh';
      return;
    }
    NAV_LIST.style.height = 0;
    document.body.style.overflowY = null;
  });
}

// When navbar link is clicked, reset the active state
NAV_LINKS.forEach(link => {
  link.addEventListener('click', ()=>{
    resetActiveState();
    link.blur();
  })
})

// Handles the hover animation on services section
SERVICE_BOXES.forEach(service => {
  const moveBG = (x, y) => {
    Object.assign(currentServiceBG.style, {
      left: x + 'px',
      top: y + 'px',
    })
  }
  service.addEventListener('mouseenter', (e) => {
    if (currentServiceBG === null) {
      currentServiceBG = service.querySelector('.service-card__bg');
    }
    moveBG(e.clientX, e.clientY);
  });
  service.addEventListener('mousemove', (e) => {
    const LEFT = e.clientX - service.getBoundingClientRect().left;
    const TOP = e.clientY - service.getBoundingClientRect().top;
    moveBG(LEFT, TOP);
  });
  service.addEventListener('mouseleave', () => {
    const IMG_POS = service.querySelector('.service-card__illustration')
    const LEFT = IMG_POS.offsetLeft + currentServiceBG.getBoundingClientRect().width;
    const TOP = IMG_POS.offsetTop + currentServiceBG.getBoundingClientRect().height;

    moveBG(LEFT, TOP);
    currentServiceBG = null;
  });
});

// Handles smooth scrolling (only hash links so normal page links navigate)
try {
  new SweetScroll({
    trigger: 'a.nav__list-link[href^="#"]',
    easing: 'easeOutQuint',
    offset: NAV_BAR ? NAV_BAR.getBoundingClientRect().height - 80 : 0
  });
} catch(e) { /* ignore */ }

// Performance: passive event listeners for scroll where possible
try {
  window.addEventListener('scroll', ()=>{}, {passive:true});
} catch (e) {/* ignore */}

// ==========================================
// ENHANCED ANIMATIONS & EFFECTS
// ==========================================

// Particle Background Generator
(function createParticles() {
  const particleBg = document.getElementById('particleBg');
  if (!particleBg) return;
  
  const particleCount = window.innerWidth > 768 ? 50 : 25;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random positioning
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Random animation delay and duration
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
    
    // Random size variation
    const size = Math.random() * 3 + 1;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    particleBg.appendChild(particle);
  }
})();

// Scroll-triggered Animations
(function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        
        // Add specific animation class based on data attribute
        const animationType = entry.target.getAttribute('data-animation');
        if (animationType) {
          entry.target.classList.add(animationType);
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all sections, cards, and elements with animate-on-scroll class
  const elementsToAnimate = document.querySelectorAll(
    '.section, .service-card__box, .work__box, .animate-on-scroll, .about-intro, .timeline-item, .edu-item'
  );
  
  elementsToAnimate.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    
    // Stagger animation delays
    el.style.transitionDelay = (index * 0.1) + 's';
    
    // Assign random animation if not specified
    if (!el.getAttribute('data-animation')) {
      const animations = ['fade-up', 'fade-left', 'fade-right', 'zoom-in'];
      const randomAnimation = animations[index % animations.length];
      el.setAttribute('data-animation', randomAnimation);
    }
    
    observer.observe(el);
  });
})();

// Enhanced Loading Spinner
(function setupLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  
  // Show spinner on page navigation
  window.addEventListener('beforeunload', () => {
    spinner.classList.add('active');
  });
  
  // Hide spinner when page is fully loaded
  window.addEventListener('load', () => {
    spinner.classList.remove('active');
  });
})();

// Add Ripple Effect to All Buttons
(function addRippleEffect() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
})();

// Parallax Effect on Scroll
(function initParallax() {
  const parallaxElements = document.querySelectorAll('.header__right img, .service-card__illustration img');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach((el, index) => {
      const speed = 0.5 + (index * 0.1);
      const yPos = -(scrolled * speed);
      
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.style.transform = `translateY(${yPos}px)`;
      }
    });
  }, { passive: true });
})();

// Mouse Cursor Trail Effect (Optional - for desktop only)
(function initCursorTrail() {
  if (window.innerWidth <= 768) return; // Skip on mobile
  
  const trail = [];
  const trailLength = 10;
  
  for (let i = 0; i < trailLength; i++) {
    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.width = '4px';
    dot.style.height = '4px';
    dot.style.background = 'var(--clr-accent)';
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '9998';
    dot.style.opacity = (trailLength - i) / trailLength;
    dot.style.transition = 'all 0.3s ease';
    document.body.appendChild(dot);
    trail.push(dot);
  }
  
  let mouseX = 0, mouseY = 0;
  let positions = Array(trailLength).fill({ x: 0, y: 0 });
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function updateTrail() {
    positions.unshift({ x: mouseX, y: mouseY });
    positions.pop();
    
    trail.forEach((dot, index) => {
      const pos = positions[index];
      dot.style.left = pos.x + 'px';
      dot.style.top = pos.y + 'px';
    });
    
    requestAnimationFrame(updateTrail);
  }
  
  updateTrail();
})();

// Add Stagger Animation to Navigation Items
(function enhanceNavAnimation() {
  const navItems = document.querySelectorAll('.nav__list-item');
  
  navItems.forEach((item, index) => {
    item.style.animationDelay = (index * 0.1) + 's';
  });
})();

// Enhanced Section Title Animations
(function animateSectionTitles() {
  const titles = document.querySelectorAll('.section__title');
  
  titles.forEach(title => {
    const text = title.textContent;
    title.innerHTML = '';
    
    text.split('').forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.animation = `fadeInUp 0.5s ease ${index * 0.05}s forwards`;
      title.appendChild(span);
    });
  });
})();

// Smooth Reveal for Images
(function initImageReveal() {
  const images = document.querySelectorAll('img');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = '0';
        img.style.transform = 'scale(0.9)';
        img.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        }, 100);
        
        imageObserver.unobserve(img);
      }
    });
  }, { threshold: 0.2 });
  
  images.forEach(img => imageObserver.observe(img));
})();

// Add Shake Animation on Error Messages
(function enhanceErrorMessages() {
  const errorElement = document.getElementById('contactFormError');
  if (!errorElement) return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && errorElement.textContent) {
        errorElement.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
          errorElement.style.animation = '';
        }, 500);
      }
    });
  });
  
  observer.observe(errorElement, { childList: true, characterData: true, subtree: true });
})();

// Shake animation keyframes (add to CSS if not present)
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;

// Inject shake animation if not present
if (!document.querySelector('#shake-animation-style')) {
  const style = document.createElement('style');
  style.id = 'shake-animation-style';
  style.textContent = shakeKeyframes;
  document.head.appendChild(style);
}

// Console Art
console.log('%c' + `
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 M.I.F. Ishfaque Portfolio 🚀    ║
║                                       ║
║   Crafted with ❤️ and ☕            ║
║   Software Engineer | MERN | QA       ║
║                                       ║
╚═══════════════════════════════════════╝
`, 'color: #00FF94; font-family: monospace; font-size: 12px;');

console.log('%c👋 Hey there! Looking for something?', 'color: #00FF94; font-size: 14px; font-weight: bold;');
console.log('%cConnect with me: memberofpfc20@gmail.com', 'color: #64fcd9; font-size: 12px;');

