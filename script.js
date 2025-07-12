document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const contactBtn = document.getElementById('openContact');
  const overlay = document.getElementById('contactOverlay');
  const closeBtn = document.getElementById('closeOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const circle = document.getElementById('bikerCircle');
  const album = document.querySelector('.photo-album');
  const albumWrapper = document.querySelector('.photo-scroll-wrapper');
  const nameWrapper = document.querySelector('.name-wrapper');

  // === THEME TOGGLE ===
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');

    // Animate toggle
    themeToggle.classList.remove('animate');
    void themeToggle.offsetWidth;
    themeToggle.classList.add('animate');
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

    // === BIKER ANIMATION ===
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

    // === PHOTO ALBUM SCROLL ZOOM ===
    const album = document.querySelector('.photo-album');
    if (album) {
      const albumTop = album.getBoundingClientRect().top + scrollY;
      const zoomStart = albumTop - viewportHeight; // starts before entering view
      const zoomEnd = zoomStart + 300; // 300px scroll distance for zoom

      const zoomProgress = Math.min(Math.max((scrollY - zoomStart) / (zoomEnd - zoomStart), 0), 1);
      const scale = 1.1 - 0.1 * zoomProgress; // from 1.1 to 1.0

      album.style.transform = `translateX(-50%) scale(${scale})`;
    }

    // === STICKY NAME SHRINK ===
    if (nameWrapper) {
      nameWrapper.classList.toggle('name-scrolled', scrollY > 50);
    }
  });

  // === CURSOR ORB ===
  const cursorOrb = document.getElementById('cursorOrb');
  const cursorFlashlight = document.getElementById('cursorFlashlight');

  document.addEventListener('mousemove', (e) => {
    if (cursorOrb && document.body.classList.contains('dark-mode')) {
      cursorOrb.style.left = `${e.clientX - 6}px`;
      cursorOrb.style.top = `${e.clientY - 10}px`;
    }

    if (cursorFlashlight && document.body.classList.contains('dark-mode')) {
      cursorFlashlight.style.left = `${e.clientX - 0}px`; // 0px offset
      cursorFlashlight.style.top = `${e.clientY + 0}px`;
    }
  });

  const flashlight = document.getElementById('cursorFlashlight');

  // Hover effect listener
  document.querySelectorAll('a, .lightbulb-toggle').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (document.body.classList.contains('dark-mode')) {
        flashlight.style.transform = 'translate(-50%, -45%)'; // lower by 5%
      }
    });

    el.addEventListener('mouseleave', () => {
      if (document.body.classList.contains('dark-mode')) {
        flashlight.style.transform = 'translate(-50%, -50%)';
      }
    });
  });
});