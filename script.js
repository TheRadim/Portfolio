document.addEventListener('DOMContentLoaded', () => {
  const contactBtn = document.getElementById('openContact');
  const overlay = document.getElementById('contactOverlay');
  const closeBtn = document.getElementById('closeOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const nameWrapper = document.querySelector('.name-wrapper');
  const arrow = document.getElementById('scrollArrow');
  const photoSection = document.getElementById('photos');
  const cursorOrb = document.getElementById('cursorOrb');
  const cursorFlash = document.getElementById('cursorFlashlight');
  const biker = document.getElementById('bikerCircle');

  // Theme from storage
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');

    themeToggle?.classList.remove('animate');
    void themeToggle?.offsetWidth;
    themeToggle?.classList.add('animate');
  }

  themeToggle?.addEventListener('click', toggleTheme);
  themeToggle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Contact overlay
  function closeOverlay() {
    overlay?.classList.add('hidden');
  }

  contactBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    overlay?.classList.remove('hidden');
  });

  closeBtn?.addEventListener('click', closeOverlay);
  overlay?.addEventListener('click', (e) => {
    if (!e.target.closest('.contact-box')) {
      closeOverlay();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });

  // Smooth scroll helper (same feel as in reference)
  function smoothScrollTo(targetY, duration = 900) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const start = performance.now();

    function ease(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      window.scrollTo(0, startY + distance * ease(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Arrow → scroll to PHOTOS (keep the title visible)
  function scrollToPhotoSection() {
    const headerH = (document.querySelector('.sticky-header')?.offsetHeight) || 60;
    const keepTitle = 20;
    const top = (photoSection?.offsetTop || 0) - headerH - keepTitle;
    smoothScrollTo(Math.max(0, top), 900);
  }
  arrow?.addEventListener('click', scrollToPhotoSection);

  // Intercept ALL hash links (footer "TO THE TOP", THE RAD, etc.) and smooth scroll
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const hash = a.getAttribute('href');
    const headerH = (document.querySelector('.sticky-header')?.offsetHeight) || 60;

    // Top shortcuts
    if (hash === '#' || hash === '#top') {
      e.preventDefault();
      smoothScrollTo(0, 900);
      return;
    }

    // Scroll to target id with header offset
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - headerH - 10;
      smoothScrollTo(y, 900);
    }
  });

  // Biker starts inside (3vh from right)
  function placeBikerInitial() {
    if (!biker) return;

    const vh = window.innerHeight;
    const bikerW = 100;
    const mr = Math.max(vh * 0.03, 8);

    biker.style.left = `${window.innerWidth - bikerW - mr}px`;
    biker.style.top = `${Math.max(vh * 0.4, 150)}px`;
    biker.style.opacity = '1';
  }
  placeBikerInitial();
  window.addEventListener('resize', placeBikerInitial);

  // Scroll effects
  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    nameWrapper?.classList.toggle('name-scrolled', y > 50);

    if (biker) {
      const bikerW = 100;
      const mr = Math.max(vh * 0.03, 8);
      const startL = window.innerWidth - bikerW - mr;
      const endL = -bikerW;
      const p = Math.min(y / vh, 1);

      biker.style.left = `${startL + p * (endL - startL)}px`;
      biker.style.top = `${Math.max(vh * 0.4, 150)}px`;
      biker.style.opacity = y > vh ? 0 : 1;
    }
  }

  onScroll();
  document.addEventListener('scroll', onScroll, { passive: true });

  // Fancy cursor in dark mode
  document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('dark-mode')) return;
    if (!cursorOrb || !cursorFlash) return;

    cursorOrb.style.left = `${e.clientX - 6}px`;
    cursorOrb.style.top = `${e.clientY - 10}px`;
    cursorFlash.style.left = `${e.clientX}px`;
    cursorFlash.style.top = `${e.clientY}px`;
  });
});

// ========== TYPEWRITER ==========
document.addEventListener('DOMContentLoaded', () => {
  const node = document.getElementById('typewriterText');
  if (!node) return;

  const phrases =
    [
      'SCROLL DOWN TO SEE MORE…',
      'SCROLL SLOW — STORIES AHEAD',
      'SCROLL DOWN AND RIDE THROUGH MY WORK',
      'CREATIVE RIDES. DIGITAL SIDETRACKS.',
      'CREATIVITY IN MOTION, ONE FRAME AT A TIME',
      'EXPERIENCE THE JOURNEY',
      'FROM STILLS TO MOTION',
      'A CREATIVE JOURNEY ON TWO WHEELS',
      'FOLLOW THE ROAD — EXPLORE THE WORK',
      'WHERE DESIGN MEETS MOTION',
      'EVERY PIXEL TELLS A STORY',
      'CRAFTED ON THE ROAD, SHAPED BY CODE'
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

// ===================================================================
// ======================= PHOTO GALLERY ==============================
// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("gallery");
  if (!gallery) {
    return;
  }

  const CAN_SAMPLE = location.protocol !== "file:";

  const ribbonEl = gallery.querySelector(".project-ribbon");
  const aboutTitle = gallery.querySelector(".about-title");
  const aboutText = gallery.querySelector(".about-text");
  const stageBox = gallery.querySelector("#stageBox");
  const stageImg = gallery.querySelector("#stageImage");
  const stageIndex = gallery.querySelector("#stageIndex");
  const prevBtn = gallery.querySelector(".stage-box .prev");
  const nextBtn = gallery.querySelector(".stage-box .next");
  const stripEl = gallery.querySelector(".strip");
  const mobileList = gallery.querySelector(".mobile-list");

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImage");
  const lbPrev = lb.querySelector(".lb-prev");
  const lbNext = lb.querySelector(".lb-next");
  const lbClose = lb.querySelector(".lb-close");

  let stageCaption = document.getElementById("stageCaption");
  if (!stageCaption) {
    stageCaption = document.createElement("div");
    stageCaption.id = "stageCaption";
    stageCaption.className = "stage-caption";
    stageBox.appendChild(stageCaption);
  }

  // ---------- Projects ----------
  function rangePaths(dir, count, ext, subfolder) {
    return Array.from({ length: count }, (_, i) => `assets/photo/${dir}/${subfolder}/${i + 1}.${ext}`);
  }

  function buildProjects(defs) {
    return defs.map(d => {
      const defExt = d.ext || "webp";
      const defT = d.thumbExt || "webp";

      let images = [];
      let thumbs = [];
      let captions = Array.isArray(d.captions) ? [...d.captions] : [];

      if (Array.isArray(d.sources) && d.sources.length > 0) {
        d.sources.forEach(s => {
          const ext = s.ext || defExt;
          const tExt = s.thumbExt || defT;
          const cnt = s.count || 0;

          images.push(...rangePaths(s.dir, cnt, ext, "full"));
          thumbs.push(...rangePaths(s.dir, cnt, tExt, "thumbs"));
        });
      }
      else {
        const cnt = d.count || 0;
        if (d.dir && cnt > 0) {
          images = rangePaths(d.dir, cnt, defExt, "full");
          thumbs = rangePaths(d.dir, cnt, defT, "thumbs");
        }
      }

      if (captions.length < images.length) {
        captions.length = images.length;
      }

      return {
        id: d.id,
        title: d.title,
        description: d.description || "",
        thumb: thumbs[0] || images[0] || "",
        images,
        thumbs,
        captions
      };
    });
  }

  const projectDefs =
    [
      {
        dir: "1",
        id: "pas-normal",
        title: "PAS NORMAL STUDIOS",
        description:
          "Late-summer roll with the Pas Normal Studios crew in Copenhagen’s late summer. \n\n Snapping fast-paced action and laid-back evening hangs with the Panormal crew. Just good vibes, cool people, and a brand that loves its racers.",
        count: 10,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "2",
        id: "gravity-snowboards",
        title: "GRAVITY SNB",
        description:
          "Prepping boards for winter with Gravity’s tools. \n\nWaxing, tuning, and getting everything sharp and ready. It’s all about that pre-season ritual for the love of snowboarding.",
        count: 9,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "3",
        id: "happy-socks",
        title: "HAPPY SOCKS",
        description:
          "Funky, colorful, and playful vibes shooting for Fizzymag wit Matija Max Vidovic.  \n\nBold color, graphic shapes, a little absurd on purpose.\n\nEven after years, one of my favourite outcomes.",
        count: 9,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "4",
        id: "atelier-pyntet",
        title: "ATELIER PYNTET",
        description:
          "Inspired by coastal nature. \n\nThis project for a small studio between Prague and Copenhagen covers everything from photography to videography and web design. \n\nShot on Danish beaches, it highlights the elegance of jewelry and art pieces like the “Waterdrop” stand, blending natural beauty with minimalist design.",
        count: 16,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "5",
        id: "bikes",
        title: "BIKES",
        description:
          "I love bikes. Riding, racing, and telling the stories around them. \n\nI shoot across disciplines—from gritty race days to clean product work—delivering both speed and detail. \n\nDownhill in Town’s freehub echo in narrow streets, Copenhagen’s Sunshine Crit at city-lap pace, the muddy joy of Jinglecross, and crisp product portraits of Stevens’ chameleon-paint builds.",
        count: 24,
        ext: "webp",
        thumbExt: "webp",
        captions:
          [
            "Downhill in Town",
            "Sunshine Crit",
            "Jinglecross",
            "Sunshine Crit",
            "Stevens Bikes",
            "Downhill in Town",
            "Sunshine Crit",
            "Jinglecross",
            "Stevens Bikes",
            "Sunshine Crit",
            "Downhill in Town",
            "Jinglecross",
            "Stevens Bikes",
            "Jinglecross",
            "Sunshine Crit",
            "Stevens Bikes",
            "Downhill in Town",
            "Jinglecross",
            "Sunshine Crit",
            "Jinglecross",
            "Stevens Bikes",
            "Downhill in Town",
            "Jinglecross",
            "Jinglecross"
          ]
      },
      {
        dir: "6",
        id: "kmen-coffee",
        title: "KMEN COFFEE",
        description:
          "Specialty coffee by friends. Shots of the daily grind at Kemn Coffee, from roasting to brewing. \n\nIt’s all about the aroma, the community, and the love of a good cup shared with friends.",
        count: 8,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "7",
        id: "portraits",
        title: "FACES",
        description:
          "People first.\n\n Portraits, moments and snaps. \n\nSometimes on film, sometimes digital. Always about the person in front of the lens.\n\nSmall gestures say the most.",
        count: 14,
        ext: "webp",
        thumbExt: "webp",
        captions:
          []
      },
      {
        dir: "8",
        id: "urban",
        title: "URBAN",
        description:
          "A minimalist ode to lines, light, and materials. \n\nFrom the clean aesthetics of Danish design to architectural marvels across Europe, these photos celebrate the simplicity of architectural forms. \n\nIt’s all about the vibe of places and spaces.",
        count: 19,
        ext: "webp",
        thumbExt: "webp",
        captions:
          [
            "Denmark",
            "Denmark",
            "Portugal",
            "Denmark",
            "Portugal",
            "Switzerland",
            "Denmark",
            "Portugal",
            "Denmark",
            "Italy",
            "Denmark",
            "Italy",
            "Denmark",
            "Czechia",
            "Denmark",
            "Denmark",
            "Denmark",
            "Denmark",
            "Denmark",
          ]
      },
      {
        dir: "9",
        id: "nature",
        title: "NATURE",
        description:
          "Quiet frames outside. Weather, texture, patience. \n\nLong walks and short shutters.\n\nThis is personal: I love time outdoors, and with a camera in hand. \n\nI collect what I see - thin light, quiet color, space to breathe.",
        count: 24,
        ext: "webp",
        thumbExt: "webp",
        captions:
          [
            "Switzerland",
            "Spain",
            "France",
            "Portugal",
            "Sweden",
            "Czechia",
            "Denmark",
            "Austria",
            "Czechia",
            "Czechia",
            "Portugal",
            "Norway",
            "Czechia",
            "Germany",
            "Austria",
            "Slovenia",
            "Czechia",
            "Austria",
            "Czechia",
            "Slovenia",
            "Austria",
            "Denmark",
            "Germany",
            "Portugal"
          ]
      }
    ];

  const projects = buildProjects(projectDefs);

  // ---------- Utils ----------
  function z2(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  function create(tag, cls) {
    const el = document.createElement(tag);
    if (cls) {
      el.className = cls;
    }
    return el;
  }

  function defaultCaption(proj, idx) {
    return `${proj.title} — ${z2(idx + 1)}/${z2(proj.images.length)}`;
  }

  function getCaption(proj, idx) {
    const base =
      (proj.captions && typeof proj.captions[idx] === "string" && proj.captions[idx].trim())
      || proj.title
      || "";

    return `${base} — ${z2(idx + 1)}/${z2(proj.images.length)}`;
  }

  // Lazy load helper
  const io = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const src = el.getAttribute("data-src");
          if (src) {
            el.src = src;
            el.removeAttribute("data-src");
          }
          io.unobserve(el);
        }
      });
    },
      { rootMargin: "200px 0px 200px 0px", threshold: 0.01 })
    : null;

  function lazySet(img, src) {
    if (io) {
      img.setAttribute("data-src", src);
      io.observe(img);
    }
    else {
      img.src = src;
    }
  }

  // ---------- Stage index pin ----------
  function positionStageOverlays() {
    const cw = stageBox.clientWidth;
    const ch = stageBox.clientHeight;

    const iw = stageImg.naturalWidth || 1;
    const ih = stageImg.naturalHeight || 1;

    const scale = Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    const left = (cw - dw) / 2;
    const top = (ch - dh) / 2;

    // Stage number: top-left inside the image
    stageIndex.style.left = `${Math.round(left) + 8}px`;
    stageIndex.style.top = `${Math.round(top) + 8}px`;

    // Caption: bottom-left inside the image
    stageCaption.style.left = `${Math.round(left) + 8}px`;
    const bottom = Math.round(ch - (top + dh)) + 8;
    stageCaption.style.bottom = `${bottom}px`;

    if (CAN_SAMPLE) {
      updateStageIndexContrast();
    }
    else {
      stageIndex.classList.remove("index--dark");
    }
  }

  function updateStageIndexContrast() {
    if (!CAN_SAMPLE) {
      return;
    }

    try {
      const cw = stageBox.clientWidth;
      const ch = stageBox.clientHeight;

      const iw = stageImg.naturalWidth || 1;
      const ih = stageImg.naturalHeight || 1;

      const scale = Math.min(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const left = (cw - dw) / 2;
      const top = (ch - dh) / 2;

      const sx = Math.max(0, Math.floor(left + 14));
      const sy = Math.max(0, Math.floor(top + 14));
      const sw = 20, sh = 20;

      const canvas = updateStageIndexContrast._c || (updateStageIndexContrast._c = document.createElement("canvas"));
      const ctx = updateStageIndexContrast._x || (updateStageIndexContrast._x = canvas.getContext("2d", { willReadFrequently: true }));

      canvas.width = cw;
      canvas.height = ch;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(stageImg, left, top, dw, dh);

      const data = ctx.getImageData(sx, sy, sw, sh).data;
      let sum = 0, count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        count++;
      }

      const L = sum / count;
      const lightBg = L > 150;
      stageIndex.classList.toggle("index--dark", lightBg);
    }
    catch (_e) {
      stageIndex.classList.remove("index--dark");
    }
  }

  // ---------- Ribbon ----------
  function renderRibbon() {
    ribbonEl.innerHTML = "";

    projects.forEach((p, i) => {
      const item = create("button", "ribbon-item");
      item.type = "button";
      item.setAttribute("role", "listitem");
      item.setAttribute("aria-current", i === activeProject ? "true" : "false");

      const num = create("div", "num");
      num.textContent = z2(i + 1);

      const thumb = create("div", "thumb");
      const img = new Image();
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      lazySet(img, p.thumb);
      thumb.appendChild(img);

      const ov = create("div", "overlay");
      ov.textContent = p.title;
      thumb.appendChild(ov);

      item.appendChild(num);
      item.appendChild(thumb);

      // --- inside renderRibbon(), replace the existing item.addEventListener("click", ...) ---
      item.addEventListener("click", () => {
        const wasActive = (i === activeProject);

        setActiveProject(i, 0, true);

        if (wasActive) {
          if (typeof window.scrollToPhotoSection === "function") {
            window.scrollToPhotoSection();
          }
          else {
            // Fallback: same math as the arrow uses
            const header = document.querySelector(".sticky-header");
            const headerH = header ? header.offsetHeight : 60;
            const keepTitle = 20;
            const photos = document.getElementById("photos");
            const targetY = Math.max(0, (photos ? photos.offsetTop : 0) - headerH - keepTitle);
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }
        else {
          // Preserve your current "scroll to ribbon" behavior when changing projects
          const header = document.querySelector(".sticky-header");
          const headerH = header ? header.offsetHeight : 0;
          const y = ribbonEl.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.max(0, y - headerH), behavior: "smooth" });
        }
      });

      ribbonEl.appendChild(item);
    });
  }

  // ---------- Viewer ----------
  function renderStrip(proj, current) {
    stripEl.innerHTML = "";

    proj.images.forEach((_src, i) => {
      const b = create("button", "strip-thumb");
      b.type = "button";
      b.dataset.num = z2(i + 1);

      const capText = getCaption(proj, i);

      b.setAttribute("aria-label", `${capText}`);
      b.setAttribute("aria-selected", i === current ? "true" : "false");
      b.title = capText;
      b.addEventListener("click", () => setActiveSlide(i, true));

      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = capText;
      lazySet(img, (proj.thumbs && proj.thumbs[i]) ? proj.thumbs[i] : proj.images[i]);

      b.appendChild(img);
      stripEl.appendChild(b);
    });
  }

  // Add near your utils:
  function renderParagraphs(container, text) {
    container.replaceChildren();
    const parts = String(text || "").trim().split(/\n\s*\n/);
    parts.forEach(t => {
      const s = t.trim();
      if (!s) { return; }
      const p = document.createElement("p");
      p.textContent = s;
      container.appendChild(p);
    });
  }

  function updateAbout(proj) {
    aboutTitle.textContent = proj.title;
    renderParagraphs(aboutText, proj.description || "");
  }

  function preloadNeighbors(proj, idx) {
    [idx - 1, idx + 1].forEach(j => {
      if (j >= 0 && j < proj.images.length) {
        const pre = new Image();
        pre.decoding = "async";
        pre.loading = "eager";
        pre.src = proj.images[j];
      }
    });
  }

  function setStage(src, idx) {
    const proj = projects[activeProject];
    const caption = getCaption(proj, idx);

    stageCaption.textContent = caption;
    stageCaption.classList.add("has-caption");

    const preview = (proj.thumbs && proj.thumbs[idx]) ? proj.thumbs[idx] : src;
    stageIndex.textContent = z2(idx + 1);
    stageImg.classList.add("is-preview");
    stageImg.style.opacity = "1";
    stageImg.decoding = "async";
    stageImg.fetchPriority = "high";
    stageImg.alt = caption;
    stageImg.src = preview;

    /* >>> ensure overlays are placed for the preview, not just the full <<< */
    stageImg.addEventListener("load", positionStageOverlays, { once: true });

    const full = new Image();
    full.decoding = "async";
    full.onload = () => {
      stageImg.style.opacity = "0";
      requestAnimationFrame(() => {
        stageImg.src = src;
        stageImg.onload = () => {
          stageImg.classList.remove("is-preview");
          stageImg.style.opacity = "1";
          positionStageOverlays();
        };
      });
    };
    full.src = src;

    preloadNeighbors(proj, idx);
  }

  let activeProject = 0;
  let activeSlide = 0;

  function setActiveProject(index, slide, pushHash) {
    activeProject = index;
    activeSlide = Math.max(0, Math.min(slide, projects[index].images.length - 1));

    gallery.querySelectorAll(".ribbon-item").forEach((it, i) => {
      it.setAttribute("aria-current", i === index ? "true" : "false");
    });

    const proj = projects[index];
    updateAbout(proj);
    renderStrip(proj, activeSlide);
    setStage(proj.images[activeSlide], activeSlide);

    if (pushHash) {
      syncHash();
    }
  }

  function setActiveSlide(slide, pushHash) {
    const proj = projects[activeProject];
    activeSlide = Math.max(0, Math.min(slide, proj.images.length - 1));

    setStage(proj.images[activeSlide], activeSlide);

    stripEl.querySelectorAll(".strip-thumb").forEach((el, i) => {
      el.setAttribute("aria-selected", i === activeSlide ? "true" : "false");
    });

    if (pushHash) {
      syncHash();
    }
  }

  function prev() {
    setActiveSlide(activeSlide - 1, true);
  }

  function next() {
    setActiveSlide(activeSlide + 1, true);
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  stageImg.addEventListener("click", () => openLightbox());
  window.addEventListener("resize", positionStageOverlays);
  window.addEventListener("resize", positionStageOverlays);

  // ---------- Routing ----------
  function syncHash() {
    const proj = projects[activeProject];
    const hash = `#photo/${encodeURIComponent(proj.id)}?i=${activeSlide + 1}`;
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

  // Render mobile list (accordion style)
  function renderMobile() {
    mobileList.innerHTML = "";

    projects.forEach((p, idx) => {
      const item = create("div", "mobile-item");
      item.setAttribute("role", "listitem");
      item.setAttribute("aria-expanded", "false");

      const head = create("div", "mobile-head");
      const num = create("div", "mobile-num");
      const title = create("div", "mobile-title");
      const mth = create("div", "mobile-thumb");
      const chev = create("div", "mobile-chev");

      num.textContent = z2(idx + 1);
      title.textContent = p.title;
      chev.textContent = "›";

      const timg = new Image();
      timg.alt = "";
      timg.decoding = "async";
      timg.loading = "lazy";
      lazySet(timg, p.thumb);
      mth.appendChild(timg);

      head.appendChild(num);
      head.appendChild(title);
      head.appendChild(mth);
      head.appendChild(chev);

      const body = create("div", "mobile-body");
      const about = create("div", "mobile-about");
      renderParagraphs(about, p.description || "");
      body.appendChild(about);

      let built = false;

      function buildBody() {
        if (built) { return; }
        built = true;

        const stage = create("div", "mobile-stage");
        const mp = create("button", "nav prev"); mp.textContent = "‹";
        const mn = create("button", "nav next"); mn.textContent = "›";

        const img = new Image();
        img.alt = "";
        img.decoding = "async";
        img.loading = "eager";
        img.fetchPriority = "high";

        const cap = create("div", "mobile-caption");

        // FULL SIZE from the start (no low-res thumb)
        const first = p.images[0];
        img.style.opacity = "0";
        img.onload = () => {
          img.style.opacity = "1";
        };
        img.src = first;

        stage.appendChild(mp);
        stage.appendChild(img);
        stage.appendChild(mn);
        stage.appendChild(cap);

        const mStrip = create("div", "mobile-strip");
        p.images.forEach((_src, i) => {
          const b = create("button", "strip-thumb");
          b.type = "button";
          b.dataset.num = z2(i + 1);

          const im = new Image();
          im.alt = getCaption(p, i);
          im.decoding = "async";
          im.loading = "lazy";
          lazySet(im, p.thumbs?.[i] || p.images[i]);

          b.appendChild(im);
          b.addEventListener("click", () => mSet(i));
          mStrip.appendChild(b);
        });

        body.appendChild(stage);
        body.appendChild(mStrip);

        let cur = 0;

        function mSet(i) {
          cur = Math.max(0, Math.min(i, p.images.length - 1));

          const caption = getCaption(p, cur);
          cap.textContent = caption;
          cap.classList.add("has-caption");

          const full = p.images[cur];

          if (img.src !== full) {
            img.style.opacity = "0";
            img.onload = () => {
              img.style.opacity = "1";
              img.onload = null;
            };
            img.src = full;
          }

          preloadNeighbors(p, cur);
        }

        mp.addEventListener("click", () => mSet(cur - 1));
        mn.addEventListener("click", () => mSet(cur + 1));

        img.addEventListener("click", () => {
          activeProject = idx;
          activeSlide = cur;
          openLightbox();
        });

        // Initialize
        cap.textContent = getCaption(p, 0);
        cap.classList.add("has-caption");
        mSet(0);
      }

      head.addEventListener("click", () => {
        const open = mobileList.querySelector('.mobile-item[aria-expanded="true"]');
        if (open && open !== item) {
          animateClose(open);
        }
        if (item.getAttribute("aria-expanded") === "true") {
          animateClose(item);
        }
        else {
          buildBody();
          animateOpen(item);
        }
      });

      item.appendChild(head);
      item.appendChild(body);
      mobileList.appendChild(item);
    });
  }

  function animateOpen(item) {
    const body = item.querySelector(".mobile-body");
    item.setAttribute("aria-expanded", "true");
    body.style.maxHeight = "0px";
    const h = body.scrollHeight;
    requestAnimationFrame(() => { body.style.maxHeight = `${h}px`; });
  }

  function animateClose(item) {
    const body = item.querySelector(".mobile-body");
    const h = body.scrollHeight;
    body.style.maxHeight = `${h}px`;
    requestAnimationFrame(() => { body.style.maxHeight = "0px"; });
    item.setAttribute("aria-expanded", "false");
  }

  // ---------- Lightbox ----------
  function openLightbox() {
    const proj = projects[activeProject];
    lb.classList.remove("hidden");
    lb.setAttribute("aria-hidden", "false");
    lbImg.src = proj.images[activeSlide];
    lbImg.alt = getCaption(proj, activeSlide);
    preloadNeighbors(proj, activeSlide);
  }

  function closeLightbox() {
    lb.classList.add("hidden");
    lb.setAttribute("aria-hidden", "true");
  }

  lbPrev.addEventListener("click", () => {
    prev();
    const proj = projects[activeProject];
    lbImg.src = proj.images[activeSlide];
    lbImg.alt = getCaption(proj, activeSlide);
  });
  lbNext.addEventListener("click", () => {
    next();
    const proj = projects[activeProject];
    lbImg.src = proj.images[activeSlide];
    lbImg.alt = getCaption(proj, activeSlide);
  });
  lbClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) {
      closeLightbox();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") { prev(); }
      if (e.key === "ArrowRight") { next(); }
    }
    else {
      if (e.key === "Escape") { closeLightbox(); }
      if (e.key === "ArrowLeft") { lbPrev.click(); }
      if (e.key === "ArrowRight") { lbNext.click(); }
    }
  });

  // ---------- Init ----------
  function boot() {
    renderRibbon();
    renderMobile();
    readHash();
  }

  boot();
});





// ===== VIDEO SECTION (ONE PREVIEW VIDEO, CLICK OPENS VIMEO) =====
document.addEventListener('DOMContentLoaded', () => {
  const lines = document.querySelector('.videos-lines');
  const titleEl = document.querySelector('#videosTitle');
  const bioEl = document.querySelector('#videosBio');

  const video = document.querySelector('#videosPreview');
  const openBtn = document.querySelector('#videosOpen');

  if (!lines || !titleEl || !bioEl || !video || !openBtn) {
    return;
  }

  const rows = Array.from(lines.querySelectorAll('.video-row'));
  const bp1024 = window.matchMedia('(max-width: 1024px)');
  const isTouch = window.matchMedia('(hover: none)').matches;

  function isSmall() {
    return bp1024.matches;
  }

  function sanitizeVimeoPageUrl(url) {
    if (!url) {
      return '';
    }

    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    }
    catch {
      return url;
    }
  }

  function setVideoSrc(src) {
    if (!src) {
      return;
    }

    const current = video.currentSrc || '';
    if (current.includes(src)) {
      return;
    }

    video.pause();

    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }

    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);

    video.load();

    const play = video.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => { });
    }
  }

  function setParagraphs(el, raw) {
    const text = String(raw || '');

    // Support:
    // 1) literal "\n" sequences in attributes
    // 2) real newline characters
    // 3) "|" separators if you ever use them
    const normalized = text
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\|/g, '\n\n');

    const parts = normalized
      .split(/\n\s*\n+/)
      .map(s => s.trim())
      .filter(Boolean);

    el.innerHTML = parts.map(p => {
      const safe = p
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `<p>${safe}</p>`;
    }).join('');
  }

  function setActive(row) {
    rows.forEach(r => {
      r.classList.toggle('is-active', r === row);
    });

    const title = row.getAttribute('data-title') || 'Video';
    const desc = row.getAttribute('data-description') || row.getAttribute('data-bio') || '';
    const preview = row.getAttribute('data-preview') || '';
    const vimeo = sanitizeVimeoPageUrl(row.getAttribute('data-vimeo-url'));

    titleEl.textContent = title;
    setParagraphs(bioEl, desc);

    if (preview) {
      setVideoSrc(preview);
    }

    if (vimeo) {
      openBtn.href = vimeo;
      openBtn.setAttribute('aria-label', `Open “${title}” on Vimeo`);
    }
  }

  function maybeHoverSelect(row) {
    if (isTouch || isSmall()) {
      return;
    }

    setActive(row);
  }

  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      maybeHoverSelect(row);
    });

    row.addEventListener('focus', () => {
      setActive(row);
    });

    row.addEventListener('click', (e) => {
      e.preventDefault();
      setActive(row);
    });
  });

  bp1024.addEventListener('change', () => {
    const active = lines.querySelector('.video-row.is-active') || rows[0];
    if (active) {
      setActive(active);
    }
  });

  const first = lines.querySelector('.video-row.is-active') || rows[0];
  if (first) {
    setActive(first);
  }
});




























// ==================================================
// ================= CODING SECTION =================
// ==================================================

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.coding-list');
  const preview = document.querySelector('.coding-preview');
  const mobile = document.querySelector('.coding-mobile');

  if (!list || !preview || !mobile) {
    return;
  }

  const titleEl = document.getElementById('codingTitle');
  const techEl = document.getElementById('codingTech');
  const descEl = document.getElementById('codingBio');
  const imgEl = document.getElementById('codingImage');

  const projects =
    [
      {
        title: 'Insights',
        tech: 'Angular',
        description: 'Data visualisation platform. Product strategy, UX decisions and feature roadmap leadership.',
        thumb: 'insights.jpg',
        mockup: 'insights.jpg'
      },
      {
        title: 'Simona Černá',
        tech: 'Webflow / HTML / CSS',
        description: 'Personal portfolio for a designer. Focus on elegance, typography and storytelling.',
        thumb: 'simona.jpg',
        mockup: 'simona.jpg'
      },
      {
        title: '3D Tic Tac Toe',
        tech: 'Angular',
        description: 'Browser game experiment. 3D logic implementation and interactive state management.',
        thumb: 'tictactoe.png',
        mockup: 'tictactoe.png'
      },
      {
        title: 'Papp iOS App',
        tech: 'Swift',
        description: 'Native iOS application for mobility data. UX collaboration and product direction.',
        thumb: 'papp-ios.jpg',
        mockup: 'papp-ios.jpg'
      },
      {
        title: 'Pyntet Studio',
        tech: 'HTML / CSS / JavaScript',
        description: 'Simple handcrafted website built from scratch. Clean layout, no frameworks. Just structure, typography and control.',
        thumb: 'pyntet.jpg',
        mockup: 'pyntet.jpg'
      },
      {
        title: 'Jeezis Portal',
        tech: 'Angular',
        description: 'Family gift exchange app. Dynamic wishlists, mission system, authentication.',
        thumb: 'jeezis.jpg',
        mockup: 'jeezis.jpg'
      },
      {
        title: 'Loop24',
        tech: 'HTML / CSS',
        description: 'Minimal event landing page for a 24h cycling race. Fast, simple, focused.',
        thumb: 'loop24.jpg',
        mockup: 'loop24.jpg'
      },
      {
        title: 'Papp Mobility',
        tech: 'WIX Studio',
        description: 'Company website redesign. Structured messaging and product presentation.',
        thumb: 'papp-web.jpg',
        mockup: 'papp-web.jpg'
      },
      {
        title: 'Countdown',
        tech: 'Swift (WIP)',
        description: 'Minimal countdown app currently in development. Clean UI, native animations.',
        thumb: 'countdown.jpg',
        mockup: 'countdown.jpg'
      }
    ];

  function setActive(index) {
    const project = projects[index];

    titleEl.textContent = project.title;
    techEl.textContent = project.tech;
    descEl.textContent = project.description;

    imgEl.src = `assets/coding/projects/${project.mockup}`;
    imgEl.alt = project.title;

    list.querySelectorAll('.coding-item').forEach((el, i) => {
      const active = i === index;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function z2(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  // Desktop list
  projects.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'coding-item';
    btn.type = 'button';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-current', i === 0 ? 'true' : 'false');

    const num = document.createElement('div');
    num.className = 'coding-num';
    num.textContent = z2(i + 1);

    const title = document.createElement('div');
    title.className = 'coding-item-title';
    title.textContent = p.title;

    const thumb = document.createElement('div');
    thumb.className = 'coding-thumb';

    const img = new Image();
    img.src = `assets/coding/thumbs/${p.thumb}`;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    thumb.appendChild(img);

    const chev = document.createElement('div');
    chev.className = 'coding-chev';
    chev.textContent = '›';

    btn.appendChild(num);
    btn.appendChild(title);
    btn.appendChild(thumb);
    btn.appendChild(chev);

    btn.addEventListener('mouseenter', () => setActive(i));
    btn.addEventListener('click', () => setActive(i));

    list.appendChild(btn);
  });

  // Mobile
  // Mobile (PHOTO-mobile accordion behavior: one open at a time + smooth close/open)
  mobile.innerHTML = "";

  projects.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "coding-mobile-item";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-expanded", "false");

    const head = document.createElement("div");
    head.className = "coding-mobile-head";

    const num = document.createElement("div");
    num.className = "coding-mobile-num";
    num.textContent = z2(i + 1);

    const title = document.createElement("div");
    title.className = "coding-mobile-title";
    title.textContent = p.title;

    const thumb = document.createElement("div");
    thumb.className = "coding-mobile-thumb";

    const timg = new Image();
    timg.alt = "";
    timg.decoding = "async";
    timg.loading = "lazy";
    timg.src = `assets/coding/thumbs/${p.thumb}`;
    thumb.appendChild(timg);

    const chev = document.createElement("div");
    chev.className = "coding-mobile-chev";
    chev.textContent = "›";

    head.appendChild(num);
    head.appendChild(title);
    head.appendChild(thumb);
    head.appendChild(chev);

    const body = document.createElement("div");
    body.className = "coding-mobile-body";

    const tech = document.createElement("div");
    tech.className = "coding-mobile-tech";
    tech.textContent = p.tech;

    const img = new Image();
    img.src = `assets/coding/projects/${p.mockup}`;
    img.alt = p.title;
    img.decoding = "async";
    img.loading = "lazy";

    const desc = document.createElement("p");
    desc.textContent = p.description;

    body.appendChild(tech);
    body.appendChild(img);
    body.appendChild(desc);

    item.appendChild(head);
    item.appendChild(body);
    mobile.appendChild(item);

    function animateOpen(target) {
      const b = target.querySelector(".coding-mobile-body");
      target.setAttribute("aria-expanded", "true");
      b.style.maxHeight = "0px";
      const h = b.scrollHeight;
      requestAnimationFrame(() => {
        b.style.maxHeight = `${h}px`;
      });
    }

    function animateClose(target) {
      const b = target.querySelector(".coding-mobile-body");
      const h = b.scrollHeight;
      b.style.maxHeight = `${h}px`;
      requestAnimationFrame(() => {
        b.style.maxHeight = "0px";
      });
      target.setAttribute("aria-expanded", "false");
    }

    head.addEventListener("click", () => {
      const open = mobile.querySelector('.coding-mobile-item[aria-expanded="true"]');

      if (open && open !== item) {
        animateClose(open);
      }

      if (item.getAttribute("aria-expanded") === "true") {
        animateClose(item);
      }
      else {
        animateOpen(item);
      }
    });
  });

  setActive(0);
});