// Public-page analytics only; local previews and management pages are excluded.
const enabled = ["radim-theiner.com", "www.radim-theiner.com"].includes(location.hostname);
const pending = [];
const viewed = new Set();
let ready = false;
let timer;

function count(payload) {
  if (!enabled) return;
  if (!ready) { pending.push(payload); return; }
  try { window.goatcounter.count(payload); } catch { /* Analytics must not interrupt browsing. */ }
}

if (enabled) {
  window.goatcounter = { no_onload: true };
  const script = document.createElement("script");
  script.async = true;
  script.dataset.goatcounter = "https://radim-theiner.goatcounter.com/count";
  script.src = "https://gc.zgo.at/count.js";
  script.onload = () => {
    ready = typeof window.goatcounter?.count === "function";
    if (ready) pending.splice(0).forEach(count);
  };
  document.head.append(script);
  count({ path: "/stories.html", title: "Stories — visual diary" });
}

export function cancelStoryView() { clearTimeout(timer); }

export function trackStoryView(story) {
  cancelStoryView();
  if (!enabled || viewed.has(story.id)) return;
  timer = setTimeout(() => {
    if (document.hidden) return;
    viewed.add(story.id);
    count({ path: `/stories.html#${encodeURIComponent(story.id)}`, title: `Stories — ${story.title}` });
  }, 700);
}
