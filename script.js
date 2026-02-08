// ========== CORE UI ==========
document.addEventListener("DOMContentLoaded", () => {
  const contactBtn = document.getElementById("openContact");
  const overlay = document.getElementById("contactOverlay");
  const closeBtn = document.getElementById("closeOverlay");
  const themeToggle = document.getElementById("themeToggle");
  const nameWrapper = document.querySelector(".name-wrapper");
  const arrow = document.getElementById("scrollArrow");
  const photoSection = document.getElementById("photos");
  const cursorOrb = document.getElementById("cursorOrb");
  const cursorFlashlight = document.getElementById("cursorFlashlight");
  const flashlight = document.getElementById("cursorFlashlight");
  const biker = document.getElementById("bikerCircle");

  // Theme from storage
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  // Theme toggle
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );

    themeToggle.classList.remove("animate");
    void themeToggle.offsetWidth;
    themeToggle.classList.add("animate");
  }

  themeToggle?.addEventListener("click", toggleTheme);
  themeToggle?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Contact overlay
  function closeOverlay() {
    overlay.classList.add("hidden");
  }

  contactBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    overlay.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", closeOverlay);

  overlay?.addEventListener("click", (e) => {
    if (!e.target.closest(".contact-box")) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeOverlay();
    }
  });

  // Scroll to PHOTO section
  function scrollToPhotoSection() {
    const fixedHeaderHeight = 40;
    const targetY = photoSection.offsetTop - fixedHeaderHeight;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 900;
    const startTime = performance.now();

    function ease(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * ease(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  arrow?.addEventListener("click", scrollToPhotoSection);

  // Biker + sticky name
  document.addEventListener("scroll", () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    if (nameWrapper) {
      nameWrapper.classList.toggle("name-scrolled", y > 50);
    }

    if (biker) {
      const startLeft = window.innerWidth;
      const endLeft = -100;
      const p = Math.min(y / vh, 1);
      biker.style.left = `${startLeft + p * (endLeft - startLeft)}px`;
      biker.style.top = `${Math.max(vh * 0.4, 150)}px`;
      biker.style.opacity = y > vh ? 0 : 1;
    }
  });

  // Fancy cursor in dark mode
  document.addEventListener("mousemove", (e) => {
    if (document.body.classList.contains("dark-mode")) {
      cursorOrb.style.left = `${e.clientX - 6}px`;
      cursorOrb.style.top = `${e.clientY - 10}px`;

      cursorFlashlight.style.left = `${e.clientX}px`;
      cursorFlashlight.style.top = `${e.clientY}px`;
    }
  });

  document.querySelectorAll("a, .lightbulb-toggle").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (document.body.classList.contains("dark-mode")) {
        flashlight.style.transform = "translate(-50%, -45%)";
      }
    });
    el.addEventListener("mouseleave", () => {
      if (document.body.classList.contains("dark-mode")) {
        flashlight.style.transform = "translate(-50%, -50%)";
      }
    });
  });
});

// ========== TYPEWRITER ==========
document.addEventListener("DOMContentLoaded", () => {
  const node = document.getElementById("typewriterText");
  if (!node) {
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
    "WHERE DESIGN MEETS MOTION",
    "EVERY PIXEL TELLS A STORY",
    "CRAFTED ON THE ROAD, SHAPED BY CODE"
  ];

  let phrase = 0;
  let i = 0;
  let deleting = false;

  const speed = 90;
  const del = 30;
  const pause = 2500;

  function loop() {
    const text = phrases[phrase];

    if (deleting) {
      if (i > 0) {
        i--;
        node.textContent = text.substring(0, i);
        setTimeout(loop, del);
      }
      else {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        setTimeout(loop, 600);
      }
    }
    else {
      if (i < text.length) {
        i++;
        node.textContent = text.substring(0, i);
        setTimeout(loop, speed);
      }
      else {
        deleting = true;
        setTimeout(loop, pause);
      }
    }
  }

  setTimeout(loop, 800);
});

// ========== PHOTO GALLERY ==========
document.addEventListener("DOMContentLoaded", () => {
  const galleryEl = document.getElementById("gallery");
  const listEl = document.querySelector(".project-list");
  const stageImg = document.getElementById("stageImage");
  const stripEl = document.querySelector(".viewer-strip");
  const prevBtn = document.querySelector(".viewer-stage .prev");
  const nextBtn = document.querySelector(".viewer-stage .next");
  const descBlock = document.querySelector(".desc-block");
  const descTitle = document.querySelector(".desc-title");
  const descText = document.querySelector(".desc-text");

  if (!galleryEl) {
    return;
  }

  // Data (replace with real assets)
  const projects = [
    {
      id: "bo-kanda-lita-baehre",
      title: "BO KANDA LITA BAEHRE",
      year: 2025,
      thumb: "assets/photo.jpeg",
      images: Array.from({ length: 9 }, () => "assets/photo.jpeg"),
      description: "Sample project description."
    },
    {
      id: "spring-lines",
      title: "SPRING LINES",
      year: 2024,
      thumb: "assets/photo.jpeg",
      images: Array.from({ length: 8 }, () => "assets/photo.jpeg"),
      description: ""
    },
    {
      id: "berlin-halfmarathon",
      title: "BERLIN HALFMARATHON",
      year: 2024,
      thumb: "assets/photo.jpeg",
      images: Array.from({ length: 10 }, () => "assets/photo.jpeg"),
      description: "Road energy. Street lungs."
    },
    {
      id: "alina-run-sire",
      title: "ALINA . RUN / SIRE",
      year: 2023,
      thumb: "assets/photo.jpeg",
      images: Array.from({ length: 7 }, () => "assets/photo.jpeg"),
      description: ""
    }
  ];

  // State
  let activeProjectIndex = 0;
  let activeSlideIndex = 0;

  // Helpers
  function create(tag, cls) {
    const el = document.createElement(tag);
    if (cls) {
      el.className = cls;
    }
    return el;
  }

  function formatNum(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  // Renderers
  function renderProjectList() {
    listEl.innerHTML = "";

    projects.forEach((p, idx) => {
      const row = create("div", "project-row");
      row.setAttribute("role", "listitem");
      row.dataset.index = String(idx);

      const num = create("div", "num");
      num.textContent = formatNum(idx + 1);

      const title = create("div", "title");
      title.textContent = p.title;

      const thumb = create("div", "thumb");
      const img = create("img");
      img.loading = "lazy";
      img.alt = "";
      img.src = p.thumb;
      thumb.appendChild(img);

      const chev = create("div", "chev");
      chev.textContent = "→";

      row.appendChild(num);
      row.appendChild(title);
      row.appendChild(thumb);
      row.appendChild(chev);

      row.addEventListener("click", () => {
        setActiveProject(idx, 0, true);
        if (window.matchMedia("(max-width: 1024px)").matches) {
          row.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });

      listEl.appendChild(row);
    });
  }

  function renderStrip(project, current) {
    stripEl.innerHTML = "";
    project.images.forEach((src, i) => {
      const b = create("button", "strip-thumb");
      b.type = "button";
      b.setAttribute("aria-label", `Image ${i + 1} of ${project.images.length}`);
      b.setAttribute("aria-selected", i === current ? "true" : "false");

      const thumb = create("img");
      thumb.alt = "";
      thumb.decoding = "async";
      thumb.loading = "lazy";
      thumb.src = src;

      b.appendChild(thumb);
      b.addEventListener("click", () => setActiveSlide(i, true));
      stripEl.appendChild(b);
    });
  }

  function updateDesc(project) {
    if (project.description && project.description.trim().length > 0) {
      descBlock.hidden = false;
      descTitle.textContent = `${project.title} — BY RADIM THEINER`;
      descText.textContent = project.description;
    }
    else {
      descBlock.hidden = true;
    }
  }

  function setStageImage(src) {
    stageImg.style.opacity = "0";
    const img = new Image();
    img.onload = () => {
      stageImg.src = src;
      stageImg.style.opacity = "1";
    };
    img.src = src;
  }

  function setActiveProject(index, slide = 0, push = false) {
    activeProjectIndex = index;
    activeSlideIndex = Math.max(0, Math.min(slide, projects[index].images.length - 1));

    document.querySelectorAll(".project-row").forEach((row, i) => {
      if (i === index) {
        row.setAttribute("aria-current", "true");
      }
      else {
        row.removeAttribute("aria-current");
      }
    });

    const project = projects[index];
    renderStrip(project, activeSlideIndex);
    updateDesc(project);
    setStageImage(project.images[activeSlideIndex]);

    if (push) {
      syncHash();
    }
  }

  function setActiveSlide(slide, push = false) {
    const project = projects[activeProjectIndex];
    activeSlideIndex = Math.max(0, Math.min(slide, project.images.length - 1));
    setStageImage(project.images[activeSlideIndex]);

    document.querySelectorAll(".strip-thumb").forEach((el, i) => {
      el.setAttribute("aria-selected", i === activeSlideIndex ? "true" : "false");
    });

    if (push) {
      syncHash();
    }
  }

  // Routing
  function syncHash() {
    const proj = projects[activeProjectIndex];
    const slideParam = `?i=${activeSlideIndex + 1}`;
    const hash = `#photo/${encodeURIComponent(proj.id)}${slideParam}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  function readHash() {
    const m = location.hash.match(/^#photo\/([^?]+)(?:\?i=(\d+))?/i);
    if (m) {
      const slug = decodeURIComponent(m[1]);
      const idx = projects.findIndex(p => p.id === slug);
      const slide = Math.max(1, Number(m[2] || 1)) - 1;

      if (idx >= 0) {
        setActiveProject(idx, slide, false);
        return;
      }
    }
    setActiveProject(0, 0, true);
  }

  window.addEventListener("hashchange", readHash);

  // Keyboard nav
  function prev() {
    setActiveSlide(activeSlideIndex - 1, true);
  }
  function next() {
    setActiveSlide(activeSlideIndex + 1, true);
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { prev(); }
    if (e.key === "ArrowRight") { next(); }
  });

  // Init
  renderProjectList();
  readHash();
});