import { WheelNavigator, nearestTimelineIndex } from "./navigation.mjs";
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const base = window.STORIES_CONFIG.apiBase.replace(/\/$/, "");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let stories = [], current = -1, selectedMedia = 0, mediaRevision = 0;
  let requested = -1, transitionVersion = 0, hoveredIndex = -1;
  const wheel = new WheelNavigator();
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const mediaURL = (path) => new URL(path, base ? new URL(base + "/", location.href) : location.href).href;
  function showMessage(title, text, retry = false) {
    $("storyMessage").replaceChildren();
    const h = document.createElement("h1"); h.textContent = title;
    const p = document.createElement("p"); p.textContent = text;
    $("storyMessage").append(h, p);
    if (retry) { const b = document.createElement("button"); b.textContent = "Try again"; b.onclick = load; $("storyMessage").append(b); }
    $("storyMessage").hidden = false;
  }
  function emphasize(index) {
    [...$("timeline").children].forEach((b, i) => {
      if (index >= 0 && Math.abs(index - i) <= 2) b.dataset.distance = Math.abs(index - i);
      else delete b.dataset.distance;
    });
  }
  function buildTimeline() {
    $("timeline").replaceChildren();
    stories.forEach((story, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "timeline-stop";
      b.setAttribute("aria-label", `${story.title}, ${story.date}`);
      const label = document.createElement("span"); label.className = "timeline-label"; label.textContent = story.title;
      b.append(label); b.onclick = () => selectStory(i);
      b.onfocus = () => emphasize(i);
      b.onblur = () => { if (hoveredIndex < 0) emphasize(-1); };
      b.onkeydown = (e) => {
        const next = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? stories.length - 1 : null;
        if (next !== null) { e.preventDefault(); $("timeline").children[Math.max(0, Math.min(stories.length - 1, next))].focus(); }
      };
      $("timeline").append(b);
    });
    $("timeline").onpointermove = (event) => {
      const rows = [...$("timeline").children].map((b) => b.getBoundingClientRect());
      hoveredIndex = nearestTimelineIndex(event.clientY, rows);
      emphasize(hoveredIndex);
    };
    $("timeline").onpointerleave = () => { hoveredIndex = -1; emphasize(-1); };
    $("timeline").hidden = false;
  }
  async function showMedia(index) {
    const media = stories[current].media; selectedMedia = (index + media.length) % media.length;
    const item = media[selectedMedia], revision = ++mediaRevision;
    const oldVideo = $("storyStage").querySelector("video"); if (oldVideo) oldVideo.pause();
    const node = document.createElement(item.type === "video" ? "video" : "img");
    if (item.type === "video") {
      node.muted = true; node.loop = true; node.playsInline = true; node.preload = "metadata";
      node.autoplay = !reduced.matches; node.poster = mediaURL(item.thumb);
      node.setAttribute("aria-label", `${stories[current].title}, video ${selectedMedia + 1}`);
    } else { node.alt = `${stories[current].title} — photograph ${selectedMedia + 1}`; node.decoding = "async"; }
    node.src = mediaURL(item.src);
    node.onerror = () => { if (revision !== mediaRevision) return; const p = document.createElement("p"); p.className = "media-error"; p.textContent = "This photo or video could not load. Try another thumbnail."; $("storyStage").replaceChildren(p); };
    $("storyStage").replaceChildren(node);
    $("motionToggle").hidden = item.type !== "video";
    $("motionToggle").textContent = reduced.matches ? "Play video" : "Pause video";
    if (item.type === "video" && !reduced.matches) node.play().catch(() => { if (revision === mediaRevision) $("motionToggle").textContent = "Play video"; });
    [...$("storyThumbnails").children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === selectedMedia)));
    $("mediaCount").textContent = `${String(selectedMedia + 1).padStart(2, "0")} / ${String(media.length).padStart(2, "0")}`;
  }
  async function selectStory(index, updateHistory = true) {
    if (index < 0 || index >= stories.length || (index === requested && current >= 0)) return;
    requested = index;
    wheel.setIndex(index, stories.length);
    const version = ++transitionVersion;
    [...$("timeline").children].forEach((b, i) => b.setAttribute("aria-current", String(i === index)));
    {
      const first = stories[index].media[0];
      const preload = new Image(); preload.src = mediaURL(first.type === "video" ? first.thumb : first.src);
      await Promise.race([preload.decode().catch(() => {}), delay(200)]);
      if (version !== transitionVersion) return;
      if (current >= 0) { $("storyLayout").classList.add("is-changing"); await delay(reduced.matches ? 0 : 80); }
      if (version !== transitionVersion) return;
      current = index; const story = stories[index];
      $("storyTitle").textContent = story.title;
      $("storyDate").dateTime = story.date;
      $("storyDate").textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(story.date + "T12:00:00Z"));
      $("storyCopy").replaceChildren();
      story.text.split(/\n\s*\n/).filter(Boolean).forEach((text) => { const p = document.createElement("p"); p.textContent = text; $("storyCopy").append(p); });
      $("storyThumbnails").replaceChildren();
      story.media.forEach((m, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "story-thumbnail";
        b.setAttribute("aria-label", `${m.type === "video" ? "Video" : "Photo"} ${i + 1}`);
        const img = document.createElement("img"); img.src = mediaURL(m.thumb); img.alt = ""; img.loading = "lazy"; b.append(img);
        if (m.type === "video") { const label = document.createElement("span"); label.className = "video-label"; label.textContent = "VIDEO"; b.append(label); }
        b.onclick = () => showMedia(i); $("storyThumbnails").append(b);
      });
      await showMedia(0);
      [...$("timeline").children].forEach((b, i) => { b.setAttribute("aria-current", String(i === index)); });
      const stop = $("timeline").children[index];
      const stopTop = stop.offsetTop, nav = $("timeline");
      if (stopTop < nav.scrollTop || stopTop > nav.scrollTop + nav.clientHeight - 24) nav.scrollTop = stopTop - nav.clientHeight / 2;
      $("previousStory").disabled = index === 0; $("nextStory").disabled = index === stories.length - 1;
      $("storyCount").textContent = `${String(index + 1).padStart(2,"0")} / ${String(stories.length).padStart(2,"0")}`;
      $("storyAnnouncement").textContent = `${story.title}. Story ${index + 1} of ${stories.length}.`;
      document.title = `${story.title} — Stories by Radim Theiner`;
      if (updateHistory) history.replaceState(null, "", `#${encodeURIComponent(story.id)}`);
      $("storyMessage").hidden = true; $("storyLayout").hidden = false; $("storyPagination").hidden = false;
      requestAnimationFrame(() => { if (version === transitionVersion) $("storyLayout").classList.remove("is-changing"); });
    }
  }
  async function load() {
    if (!base) { showMessage("The in-between.", "A visual diary of everyday moments. The first stories are on their way."); return; }
    try {
      const response = await fetch(`${base}/stories`, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("load");
      stories = (await response.json()).stories.filter((s) => Array.isArray(s.media) && s.media.length);
      if (!stories.length) { showMessage("The in-between.", "A visual diary of everyday moments. The first stories are on their way."); return; }
      buildTimeline(); let id = ""; try { id = decodeURIComponent(location.hash.slice(1)); } catch {}
      await selectStory(Math.max(0, stories.findIndex((s) => s.id === id)));
    } catch { showMessage("A little pause.", "The diary couldn’t load right now. Please try again in a moment.", true); }
  }
  $("previousStory").onclick = () => selectStory(requested - 1);
  $("nextStory").onclick = () => selectStory(requested + 1);
  $("storyStage").onkeydown = (e) => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); showMedia(selectedMedia + (e.key === "ArrowRight" ? 1 : -1)); } };
  $("motionToggle").onclick = () => { const v = $("storyStage").querySelector("video"); if (!v) return; if (v.paused) { v.play().then(() => $("motionToggle").textContent = "Pause video").catch(() => {}); } else { v.pause(); $("motionToggle").textContent = "Play video"; } };
  let touchStart = null;
  $("storyStage").addEventListener("touchstart", (e) => { touchStart = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  $("storyStage").addEventListener("touchend", (e) => { if (!touchStart) return; const dx = e.changedTouches[0].clientX - touchStart[0], dy = e.changedTouches[0].clientY - touchStart[1]; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showMedia(selectedMedia + (dx < 0 ? 1 : -1)); touchStart = null; }, { passive: true });
  window.addEventListener("wheel", (e) => {
    if (current < 0 || e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.target.closest(".story-thumbnails")) return;
    const copy = e.target.closest(".story-copy");
    if (copy && copy.scrollHeight > copy.clientHeight + 2) return;
    const bottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;
    if ((e.deltaY > 0 && !bottom) || (e.deltaY < 0 && window.scrollY > 3)) return;
    e.preventDefault();
    const distance = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    const next = wheel.consume(distance, performance.now());
    if (next !== requested) selectStory(next);
  }, { passive: false });
  window.addEventListener("hashchange", () => { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } selectStory(stories.findIndex((s) => s.id === id), false); });
  document.addEventListener("visibilitychange", () => { const v = $("storyStage").querySelector("video"); if (v && document.hidden) { v.pause(); $("motionToggle").textContent = "Play video"; } });
  load();
})();
