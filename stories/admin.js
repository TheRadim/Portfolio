(() => {
  "use strict";
  const $ = (id) => document.getElementById(id), base = window.STORIES_CONFIG.apiBase.replace(/\/$/, "");
  let token = "", files = [], previewURLs = [], busy = false, jobId = null;
  function message(text) { $("adminMessage").textContent = text; }
  async function api(path, method = "GET", data) {
    const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { "Content-Type": "application/json" } : {}) }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(30000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { if (response.status === 401 && path !== "/login") lock(); throw new Error(body.error || "Something went wrong. Please try again."); }
    return body;
  }
  function lock() { token = ""; $("loginPanel").hidden = false; $("adminPanel").hidden = true; $("password").value = ""; }
  $("loginForm").onsubmit = async (e) => {
    e.preventDefault(); message("");
    if (!base) { message("The diary service hasn’t been connected yet."); return; }
    const button = e.currentTarget.querySelector("button"); button.disabled = true;
    try { const result = await api("/login", "POST", { password: $("password").value }); token = result.token; $("password").value = ""; $("loginPanel").hidden = true; $("adminPanel").hidden = false; if (document.body.dataset.mode === "delete") await loadDeleteList(); }
    catch (error) { message(error.message); } finally { button.disabled = false; }
  };
  $("logout").onclick = async () => { if (busy) return; try { await api("/logout", "POST"); } catch {} lock(); message(""); };
  async function loadDeleteList() {
    const { stories } = await api("/stories"); $("deleteList").replaceChildren();
    if (!stories.length) { const p = document.createElement("li"); p.textContent = "No stories yet."; $("deleteList").append(p); }
    stories.forEach((story) => {
      const li = document.createElement("li"), title = document.createElement("span"), button = document.createElement("button");
      title.textContent = story.title; button.type = "button"; button.textContent = "Delete"; button.setAttribute("aria-label", `Delete ${story.title}`);
      button.onclick = async () => {
        if (!confirm(`Permanently delete “${story.title}” and all its photos and videos? This cannot be undone.`)) return;
        button.disabled = true; message("");
        try { await api(`/stories/${story.id}`, "DELETE"); await loadDeleteList(); message("Story deleted."); }
        catch (error) { message(error.message); button.disabled = false; }
      };
      li.append(title, button); $("deleteList").append(li);
    });
  }
  if (document.body.dataset.mode !== "add") return;
  $("eventDate").value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);
  function renderFiles() {
    previewURLs.forEach(URL.revokeObjectURL); previewURLs = []; $("uploadPreview").replaceChildren();
    files.forEach((file, i) => {
      const li = document.createElement("li"), visual = document.createElement(file.type.startsWith("video/") ? "video" : "img");
      const url = URL.createObjectURL(file); previewURLs.push(url); visual.src = url;
      if (visual.tagName === "VIDEO") { visual.muted = true; visual.preload = "metadata"; } else visual.alt = "";
      const name = document.createElement("span"); name.className = "file-name"; name.textContent = `${i + 1}. ${file.name}`;
      li.append(visual, name);
      for (const [label, action, disabled] of [["Earlier", () => { [files[i-1],files[i]] = [files[i],files[i-1]]; }, i === 0], ["Later", () => { [files[i+1],files[i]] = [files[i],files[i+1]]; }, i === files.length-1], ["Remove", () => files.splice(i,1), false]]) {
        const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.disabled = disabled; b.setAttribute("aria-label", `${label}: ${file.name}`); b.onclick = () => { action(); renderFiles(); }; li.append(b);
      }
      $("uploadPreview").append(li);
    });
    $("mediaFiles").required = files.length === 0;
  }
  function addFiles(incoming) { files.push(...incoming); renderFiles(); }
  $("mediaFiles").onchange = (e) => addFiles([...e.target.files]);
  const zone = document.querySelector(".upload-zone");
  zone.ondragover = (e) => { e.preventDefault(); if (!busy) zone.classList.add("is-over"); };
  zone.ondragleave = () => zone.classList.remove("is-over");
  zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove("is-over"); if (!busy) addFiles([...e.dataTransfer.files]); };
  function upload(url, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); xhr.open("PUT", url); xhr.timeout = 15 * 60 * 1000;
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Couldn’t upload ${file.name}. Please try again.`));
      xhr.onerror = xhr.ontimeout = () => reject(new Error("The upload was interrupted. Please check your connection and try again."));
      xhr.send(file);
    });
  }
  function setBusy(value) { busy = value; $("logout").disabled = value; $("uploadForm").querySelectorAll("input,textarea,button").forEach((el) => el.disabled = value); if (!value) renderFiles(); }
  $("uploadForm").onsubmit = async (e) => {
    e.preventDefault(); if (busy) return; message("");
    if (!files.length || files.length > 20) { message("Choose between 1 and 20 photos or videos."); return; }
    if (files.some((f) => f.size > 100 * 1024 * 1024) || files.reduce((sum,f) => sum + f.size,0) > 500 * 1024 * 1024) { message("Please keep each file under 100 MB and the total under 500 MB."); return; }
    setBusy(true); $("uploadProgress").hidden = false; $("progressBar").value = 0;
    let submitted = false;
    try {
      $("progressText").textContent = "Preparing your story…";
      const job = await api("/uploads", "POST", { title: $("eventTitle").value, date: $("eventDate").value, text: $("eventText").value, files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })) });
      jobId = job.id;
      for (let i=0; i<files.length; i++) {
        $("progressText").textContent = `Uploading ${i + 1} of ${files.length}…`;
        await upload(job.uploads[i], files[i], (fraction) => $("progressBar").value = ((i + fraction) / files.length) * 80);
      }
      await api(`/uploads/${jobId}/publish`, "POST");
      submitted = true;
      $("progressText").textContent = "All uploaded. Making the photos and videos ready for your diary…";
      const deadline = Date.now() + 20 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
        const status = await api(`/uploads/${jobId}`);
        if (status.status === "failed") throw new Error(status.error || "We couldn’t prepare this story. Please try again.");
        if (status.status === "published") { $("progressBar").value = 100; $("uploadForm").hidden = true; $("successPanel").hidden = false; $("viewStory").href = `/stories.html#${encodeURIComponent(jobId)}`; jobId = null; return; }
        $("progressBar").value = 80 + 19 * (status.completed || 0) / files.length;
      }
      throw new Error("This story is taking longer than expected. Check the diary before uploading it again.");
    } catch (error) {
      if (jobId && !submitted) { try { await api(`/uploads/${jobId}`, "DELETE"); jobId = null; } catch {} }
      message(error.message);
    }
    finally { setBusy(false); }
  };
  $("addAnother").onclick = () => { files = []; renderFiles(); $("uploadForm").reset(); $("eventDate").value = new Date().toISOString().slice(0,10); $("uploadForm").hidden = false; $("successPanel").hidden = true; $("uploadProgress").hidden = true; message(""); };
  window.addEventListener("beforeunload", (e) => { if (busy) { e.preventDefault(); e.returnValue = ""; } });
})();
