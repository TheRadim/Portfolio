document.addEventListener('DOMContentLoaded', () => {
  // === ELEMENTS ===
  const contactBtn = document.getElementById('openContact');
  const overlay = document.getElementById('contactOverlay');
  const closeBtn = document.getElementById('closeOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const circle = document.getElementById('bikerCircle');
  const album = document.querySelector('.photo-album');
  const albumWrapper = document.querySelector('.photo-scroll-wrapper');
  const nameWrapper = document.querySelector('.name-wrapper');
  const arrow = document.getElementById('scrollArrow');
  const photoSection = document.getElementById('photos');
  const cursorOrb = document.getElementById('cursorOrb');
  const cursorFlashlight = document.getElementById('cursorFlashlight');
  const flashlight = document.getElementById('cursorFlashlight');
  const scrollImage = document.getElementById('scrollImage');
  const scrollObject = document.getElementById('scrollObject');

  // === SCROLL TO PHOTO SECTION ===

  function scrollToPhotoSection() {
    const fixedHeaderHeight = 40;
    const targetY = photoSection.offsetTop - fixedHeaderHeight;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 2000;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function smoothScroll(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * easedProgress);
      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }

    requestAnimationFrame(smoothScroll);
  }

  // === THEME TOGGLE ===
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    updateScrollImage(); // make sure image is correct on load
  }

  // Function to switch scroll image based on theme
  function updateScrollImage() {
    const scrollImage = document.getElementById('scrollImage');
    if (!scrollImage) return;

    scrollImage.src = document.body.classList.contains('dark-mode')
      ? 'assets/camera-dark.svg'
      : 'assets/camera.svg';
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    );

    // Animation reset (already in your code)
    themeToggle.classList.remove('animate');
    void themeToggle.offsetWidth;
    themeToggle.classList.add('animate');

    updateScrollImage(); // 🔁 update image when theme changes
  });

  // === CONTACT OVERLAY ===
  const closeOverlay = () => overlay.classList.add('hidden');

  contactBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    overlay.classList.remove('hidden');
  });

  closeBtn?.addEventListener('click', closeOverlay);

  overlay?.addEventListener('click', (e) => {
    if (!e.target.closest('.contact-box')) closeOverlay();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
  });

  // === SCROLL EVENTS ===
  document.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const containerWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Biker animation
    const progress = Math.min(scrollY / viewportHeight, 1);
    const startLeft = containerWidth;
    const endLeft = -100;
    const currentLeft = startLeft + progress * (endLeft - startLeft);
    const minTop = 150;
    const topOffset = Math.max(viewportHeight * 0.4, minTop);

    if (circle) {
      circle.style.left = `${currentLeft}px`;
      circle.style.top = `${topOffset}px`;
      circle.style.opacity = scrollY > viewportHeight ? 0 : 1;
    }

    // Photo album zoom effect
    if (album) {
      const albumTop = album.getBoundingClientRect().top + scrollY;
      const zoomStart = albumTop - viewportHeight;
      const zoomEnd = zoomStart + 300;
      const zoomProgress = Math.min(Math.max((scrollY - zoomStart) / (zoomEnd - zoomStart), 0), 1);
      const scale = 1.1 - 0.1 * zoomProgress;
      album.style.transform = `translateX(-50%) scale(${scale})`;
    }

    // Sticky name shrink
    if (nameWrapper) {
      nameWrapper.classList.toggle('name-scrolled', scrollY > 50);
    }
  });

  // === CURSOR ORB ===
  document.addEventListener('mousemove', (e) => {
    if (cursorOrb && document.body.classList.contains('dark-mode')) {
      cursorOrb.style.left = `${e.clientX - 6}px`;
      cursorOrb.style.top = `${e.clientY - 10}px`;
    }

    if (cursorFlashlight && document.body.classList.contains('dark-mode')) {
      cursorFlashlight.style.left = `${e.clientX}px`;
      cursorFlashlight.style.top = `${e.clientY}px`;
    }
  });

  // Hover effects for flashlight cursor
  document.querySelectorAll('a, .lightbulb-toggle').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (document.body.classList.contains('dark-mode')) {
        flashlight.style.transform = 'translate(-50%, -45%)';
      }
    });

    el.addEventListener('mouseleave', () => {
      if (document.body.classList.contains('dark-mode')) {
        flashlight.style.transform = 'translate(-50%, -50%)';
      }
    });
  });
});

// === TYPEWRITER EFFECT ===
document.addEventListener("DOMContentLoaded", () => {
  const typewriter = document.getElementById("typewriterText");

  if (!typewriter) {
    console.error("Typewriter element not found.");
    return;
  }

  const phrases = [
    "SCROLL DOWN TO SEE MORE…",
    "SCROLL SLOW — STORIES AHEAD",
    "SCROLL DOWN AND RIDE THROUGH MY WORK",
    "CREATIVE RIDES. DIGITAL SIDETRACKS.",
    "CREATIVITY IN MOTION, ONE FRAME AT A TIME",
    "EXPERIENCE THE JOURNEY",
    "FROM STILLS TO MOTION",
    "A CREATIVE JOURNEY ON TWO WHEELS",
    "FOLLOW THE ROAD — EXPLORE THE WORK",
    "ROLL DOWN INTO THE JOURNEY —",
    "WHERE DESIGN MEETS MOTION",
    "EVERY PIXEL TELLS A STORY",
    "CRAFTED ON THE ROAD, SHAPED BY CODE"
  ];

  let index = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isPaused = true;

  const typingSpeed = 90;
  const deletingSpeed = 30;
  const pauseBeforeDelete = 2500;
  const pauseBeforeNext = 800;

  function typeLoop() {
    if (isPaused) return;

    const currentPhrase = phrases[index];

    if (isDeleting) {
      if (charIndex > 0) {
        charIndex--;
        typewriter.textContent = currentPhrase.substring(0, charIndex);
        setTimeout(typeLoop, deletingSpeed);
      } else {
        isDeleting = false;
        index = (index + 1) % phrases.length;
        isPaused = true;
        setTimeout(() => {
          isPaused = false;
          typeLoop();
        }, pauseBeforeNext);
      }
    } else {
      if (charIndex < currentPhrase.length) {
        typewriter.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        setTimeout(typeLoop, typingSpeed);
      } else {
        isDeleting = true;
        isPaused = true;
        setTimeout(() => {
          isPaused = false;
          typeLoop();
        }, pauseBeforeDelete);
      }
    }
  }

  setTimeout(() => {
    isPaused = false;
    typeLoop();
  }, 1000);
});