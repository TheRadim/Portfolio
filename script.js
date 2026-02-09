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

  // ---------- Projects (thumb = first full image: 1.jpeg) ----------
  // Folder layout per project:
  // assets/photo/{dir}/full/1.jpeg, 2.jpeg, 3.jpeg, ... (up to count)
  // No separate thumbs folder needed.

  function rangePaths(dir, count, ext) {
    return Array.from({ length: count }, (_, i) =>
      `assets/photo/${dir}/full/${i + 1}.${ext}`
    );
  }

  function buildProjects(defs) {
    return defs.map(d => {
      const ext = d.ext || "jpeg";
      const imgs = d.files?.length
        ? d.files.map(n => `assets/photo/${d.dir}/full/${n}.${ext}`)
        : rangePaths(d.dir, d.count || 0, ext);

      return {
        id: d.id,
        title: d.title,
        description: d.description || "",
        thumb: `assets/photo/${d.dir}/full/1.${ext}`, // thumb = first image
        images: imgs
      };
    });
  }

  const projectDefs =
    [
      {
        dir: "1",
        id: "pas-normal",
        title: "PAS NORMAL STUDIOS",
        description: "Team ride around Copenhagen in late-summer light, plus a panel with racers and brand designers on their bond with Pas Normal.",
        count: 10,
        ext: "jpeg"
      },
      {
        dir: "2",
        id: "gravity-snowboards",
        title: "GRAVITY SNB",
        description: "Pre-season product work—tuning kits, edge and base prep—because snowboarding is a lifelong habit.",
        count: 8,
        ext: "jpeg"
      },
      {
        dir: "3",
        id: "happy-socks",
        title: "HAPPY SOCKS",
        description: "University editorial with Matija Max Vidović. Playful, a bit absurd—still one of my favorite series.",
        count: 9,
        ext: "jpeg"
      },
      {
        dir: "4",
        id: "studio-pyntet",
        title: "STUDIO PYNTET",
        description: "Close to my heart: full visuals—photo, video, and website—for a jewelry brand between Prague and Copenhagen.",
        count: 16,
        ext: "jpeg"
      },
      {
        dir: "5",
        id: "downhill-in-town",
        title: "DOWNHILL IN TOWN",
        description: "Urban DH—sunny day, fast lines, and some properly bonkers bikes.",
        count: 12,
        ext: "jpeg"
      },
      {
        dir: "6",
        id: "stevens-bikes",
        title: "STEVENS BIKES",
        description: "A chance to shoot new Stevens cuties—yes, with that chameleon paint.",
        count: 9,
        ext: "jpeg"
      },
      {
        dir: "7",
        id: "sunshine-criterium",
        title: "SUNSHINE CRIT",
        description: "Fixed-gear crit meets running in Copenhagen. Favorite race; all vibes, all heart.",
        count: 15,
        ext: "jpeg"
      },
      {
        dir: "8",
        id: "kmen-coffee",
        title: "KMEN COFFEE",
        description: "Specialty coffee by special people—also good friends. Beans, steam, community.",
        count: 8,
        ext: "jpeg"
      },
      {
        dir: "9",
        id: "dirty-series-jinglecross",
        title: "DIRTY SERIES",
        description: "Mud, bells, pre-Christmas cross. A beautiful mess.",
        count: 11,
        ext: "jpeg"
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

  // ---------- Stage index pin ----------
  function positionStageIndex() {
    const cw = stageBox.clientWidth;
    const ch = stageBox.clientHeight;

    const iw = stageImg.naturalWidth || 1;
    const ih = stageImg.naturalHeight || 1;

    const scale = Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    const left = (cw - dw) / 2;
    const top = (ch - dh) / 2;

    stageIndex.style.left = `${Math.round(left) + 8}px`;
    stageIndex.style.top = `${Math.round(top) + 8}px`;

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
      img.src = p.thumb;
      img.alt = "";
      thumb.appendChild(img);

      const ov = create("div", "overlay");
      ov.textContent = p.title;
      thumb.appendChild(ov);

      item.appendChild(num);
      item.appendChild(thumb);

      item.addEventListener("click", () => {
        setActiveProject(i, 0, true);

        const header = document.querySelector(".sticky-header");
        const headerH = header ? header.offsetHeight : 0;

        const y = ribbonEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, y - headerH), behavior: "smooth" });
      });

      ribbonEl.appendChild(item);
    });
  }

  // ---------- Viewer ----------
  function renderStrip(proj, current) {
    stripEl.innerHTML = "";

    proj.images.forEach((src, i) => {
      const b = create("button", "strip-thumb");
      b.type = "button";
      b.dataset.num = z2(i + 1);
      b.setAttribute("aria-label", `Image ${i + 1} of ${proj.images.length}`);
      b.setAttribute("aria-selected", i === current ? "true" : "false");
      b.addEventListener("click", () => setActiveSlide(i, true));

      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.src = src;
      img.alt = "";

      b.appendChild(img);
      stripEl.appendChild(b);
    });
  }

  function updateAbout(proj) {
    aboutTitle.textContent = proj.title;
    aboutText.textContent = proj.description || "";
  }

  function setStage(src, idx) {
    stageIndex.textContent = z2(idx + 1);
    stageImg.style.opacity = "0";

    const img = new Image();
    if (CAN_SAMPLE) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      stageImg.src = src;
      stageImg.style.opacity = "1";
      positionStageIndex();
    };
    img.src = src;
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
  window.addEventListener("resize", positionStageIndex);

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

  // ---------- Mobile accordion ----------
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
      timg.src = p.thumb; timg.alt = "";
      mth.appendChild(timg);

      head.appendChild(num);
      head.appendChild(title);
      head.appendChild(mth);
      head.appendChild(chev);

      const body = create("div", "mobile-body");
      const about = create("div", "mobile-about");
      about.textContent = p.description || "";
      body.appendChild(about);

      const stage = create("div", "mobile-stage");
      const mp = create("button", "nav prev"); mp.textContent = "‹";
      const mn = create("button", "nav next"); mn.textContent = "›";
      const img = new Image(); img.alt = ""; img.src = p.images[0];

      stage.appendChild(mp);
      stage.appendChild(img);
      stage.appendChild(mn);

      const mStrip = create("div", "mobile-strip");
      p.images.forEach((src, i) => {
        const b = create("button", "strip-thumb");
        b.type = "button";
        b.dataset.num = z2(i + 1);
        const im = new Image();
        im.src = src; im.alt = "";
        b.appendChild(im);
        b.addEventListener("click", () => mSet(i));
        mStrip.appendChild(b);
      });

      body.appendChild(stage);
      body.appendChild(mStrip);

      let cur = 0;
      function mSet(i) {
        cur = Math.max(0, Math.min(i, p.images.length - 1));
        img.src = p.images[cur];
      }
      mp.addEventListener("click", () => mSet(cur - 1));
      mn.addEventListener("click", () => mSet(cur + 1));
      img.addEventListener("click", () => {
        activeProject = idx;
        activeSlide = cur;
        openLightbox();
      });

      head.addEventListener("click", () => {
        const open = mobileList.querySelector('.mobile-item[aria-expanded="true"]');
        if (open && open !== item) { animateClose(open); }
        if (item.getAttribute("aria-expanded") === "true") { animateClose(item); }
        else { animateOpen(item); }
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
  }

  function closeLightbox() {
    lb.classList.add("hidden");
    lb.setAttribute("aria-hidden", "true");
  }

  lbPrev.addEventListener("click", () => {
    prev();
    lbImg.src = projects[activeProject].images[activeSlide];
  });
  lbNext.addEventListener("click", () => {
    next();
    lbImg.src = projects[activeProject].images[activeSlide];
  });
  lbClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) { closeLightbox(); }
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