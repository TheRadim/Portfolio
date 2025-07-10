
document.addEventListener('DOMContentLoaded', () => {
  const contactBtn = document.getElementById('openContact');
  const overlay = document.getElementById('contactOverlay');
  const closeBtn = document.getElementById('closeOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const circle = document.getElementById('bikerCircle');

  // Load saved theme
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');

    // Restart animation
    themeToggle.classList.remove('animate');
    void themeToggle.offsetWidth; // reflow trick
    themeToggle.classList.add('animate');
  });

  // Contact overlay logic
  const closeOverlay = () => overlay.classList.add('hidden');

  contactBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    overlay.classList.remove('hidden');
  });

  overlay?.addEventListener('click', (e) => {
    if (!e.target.closest('.contact-box')) closeOverlay();
  });

  closeBtn?.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
  });

// Circle scroll animation
const intro = document.querySelector('.intro-section');
const photos = document.getElementById('photos');

document.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const introBottom = intro?.offsetTop + intro?.offsetHeight;
  const maxScroll = window.innerHeight;
  const containerWidth = window.innerWidth;

  // Animate within first screen height only
  if (scrollTop < maxScroll) {
    const progress = Math.min(scrollTop / maxScroll, 1);

    const startLeft = containerWidth;
    const endLeft = -100;
    const currentLeft = startLeft + progress * (endLeft - startLeft);

    if (circle) {
      circle.style.left = `${currentLeft}px`;
      circle.style.opacity = 1;
    }
  } else {
    if (circle) {
      circle.style.opacity = 0;
    }
  }
});

});
