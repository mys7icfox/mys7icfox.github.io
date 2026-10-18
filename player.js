/* =========================================================
   mys7icfox · vocaloid mini-player
   Included on every page with: <script src="player.js"></script>

   ADD SONGS HERE — paste the YouTube video ID (the part after
   "watch?v=" in the link). Titles are read from YouTube automatically.
   Videos whose owners block embedding are skipped on their own.
   ========================================================= */
const PLAYLIST = [
  "KushW6zvazM", // DECO*27 - Ghost Rule feat. Hatsune Miku
  "aRXnHW2k07A", // DECO*27 - Hello, SEKAI
  "9fnQklaziX4", // DECO*27 - SToRY
  "C6TAZ8Elbao", // DECO*27 - FUN!!
  // "VIDEO_ID",
];

(function () {
  const KEY = "kitsune-player";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

  const state = Object.assign({ i: 0, t: 0, playing: false, open: false, vol: 60, shuffle: false, list: false }, load());
  if (state.i >= PLAYLIST.length) state.i = 0;
  const titles = {};

  /* ---------- styles ---------- */
  const css = `
  .mp-mod { background:none; border:0; font:inherit; color:var(--muted,#7d7799); cursor:pointer;
    display:inline-flex; align-items:center; gap:6px; max-width:26ch; padding:0; }
  .mp-mod:hover { color:var(--text,#d8d4ea); }
  .mp-mod .n { color:var(--pink,#ff5fa2); }
  .mp-mod .t { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mp-mod.on .n { animation: mp-bounce 1s ease-in-out infinite; }
  @keyframes mp-bounce { 50% { transform: translateY(-2px); } }

  .mp { position:fixed; right:16px; bottom:16px; z-index:40; width:360px; max-width:calc(100vw - 32px);
    background:rgba(18,16,29,.96); border:1px solid var(--border,#2a2540); border-radius:10px;
    box-shadow:0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(95,242,255,.08);
    font-family:var(--mono,monospace); font-size:13px; color:var(--text,#d8d4ea); overflow:hidden; }
  .mp[hidden] { display:none; }
  .mp-bar { display:flex; align-items:center; gap:8px; padding:8px 12px; background:#0b0a12;
    border-bottom:1px solid var(--border,#2a2540); color:var(--muted,#7d7799); font-size:12px; }
  .mp-bar .ttl { flex:1; }
  .mp-bar .ttl b { color:var(--cyan,#5ff2ff); font-weight:500; }
  .mp-x { background:none; border:0; color:var(--muted,#7d7799); cursor:pointer; font:inherit; padding:0 2px; }
  .mp-x:hover { color:var(--pink,#ff5fa2); }
  .mp-video { width:100%; aspect-ratio:16/9; min-height:200px; background:#000; }
  .mp-video iframe { width:100%; height:100%; border:0; display:block; }
  .mp-body { padding:10px 12px 12px; }
  .mp-now { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--green,#8cff9e); }
  .mp-prog { display:flex; align-items:center; gap:8px; margin-top:8px; color:var(--muted,#7d7799); font-size:11px; }
  .mp-track { flex:1; height:4px; background:var(--border,#2a2540); border-radius:2px; cursor:pointer; position:relative; }
  .mp-fill { position:absolute; inset:0 auto 0 0; width:0; background:linear-gradient(90deg,var(--pink,#ff5fa2),var(--cyan,#5ff2ff)); border-radius:2px; }
  .mp-ctl { display:flex; align-items:center; gap:6px; margin-top:10px; }
  .mp-btn { background:none; border:1px solid var(--border,#2a2540); color:var(--text,#d8d4ea); font:inherit;
    min-width:34px; height:30px; border-radius:4px; cursor:pointer; transition:color .2s,border-color .2s; }
  .mp-btn:hover, .mp-btn.on { color:var(--pink,#ff5fa2); border-color:var(--pink,#ff5fa2); }
  .mp-vol { margin-left:auto; display:flex; align-items:center; gap:6px; color:var(--muted,#7d7799); }
  .mp-vol input { width:80px; accent-color:var(--pink,#ff5fa2); }
  .mp-list { list-style:none; margin:10px 0 0; padding:0; max-height:150px; overflow:auto; border-top:1px solid var(--border,#2a2540); }
  .mp-list[hidden] { display:none; }
  .mp-list li { padding:6px 4px; cursor:pointer; color:var(--muted,#7d7799); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-list li:hover { color:var(--text,#d8d4ea); }
  .mp-list li.cur { color:var(--pink,#ff5fa2); }
  .mp-list li.cur::before { content:"▶ "; }
  @media (max-width:640px) { .mp { right:8px; left:8px; bottom:8px; width:auto; max-width:none; } .mp-mod .t { display:none; } }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- bar module ---------- */
  const mod = document.createElement("button");
  mod.type = "button";
  mod.className = "mp-mod";
  mod.title = "vocaloid player";
  mod.innerHTML = '<span class="n">♪</span><span class="t">vocaloid</span>';
  const barRight = document.querySelector(".bar-right");
  if (barRight) barRight.prepend(mod); else document.body.appendChild(mod);

  /* ---------- window ---------- */
  const win = document.createElement("div");
  win.className = "mp";
  win.hidden = true;
  win.innerHTML = `
    <div class="mp-bar"><span class="ttl">ncmpcpp <b>♪ vocaloid</b></span>
      <button class="mp-x" data-a="list" title="playlist">≡</button>
      <button class="mp-x" data-a="close" title="close (stops music)">✕</button></div>
    <div class="mp-video"><div id="mp-yt"></div></div>
    <div class="mp-body">
      <div class="mp-now">loading…</div>
      <div class="mp-prog"><span class="cur">0:00</span><div class="mp-track"><div class="mp-fill"></div></div><span class="dur">0:00</span></div>
      <div class="mp-ctl">
        <button class="mp-btn" data-a="prev" title="previous">⏮</button>
        <button class="mp-btn" data-a="play" title="play / pause">▶</button>
        <button class="mp-btn" data-a="next" title="next">⏭</button>
        <button class="mp-btn" data-a="shuffle" title="shuffle">⤮</button>
        <label class="mp-vol">vol <input type="range" min="0" max="100"></label>
      </div>
      <ul class="mp-list" hidden></ul>
    </div>`;
  document.body.appendChild(win);

  const $ = (s) => win.querySelector(s);
  const nowEl = $(".mp-now"), playBtn = $('[data-a="play"]'), shufBtn = $('[data-a="shuffle"]');
  const fill = $(".mp-fill"), curEl = $(".cur"), durEl = $(".dur"), listEl = $(".mp-list"), vol = $(".mp-vol input");
  vol.value = state.vol;
  shufBtn.classList.toggle("on", state.shuffle);
  listEl.hidden = !state.list;

  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const label = (i) => titles[PLAYLIST[i]] || "track " + (i + 1);

  function renderList() {
    listEl.innerHTML = "";
    PLAYLIST.forEach((id, i) => {
      const li = document.createElement("li");
      li.textContent = label(i);
      if (i === state.i) li.className = "cur";
      li.onclick = () => go(i, true);
      listEl.appendChild(li);
    });
  }
  function renderMod() {
    mod.classList.toggle("on", state.playing);
    mod.querySelector(".t").textContent = state.playing ? label(state.i) : "vocaloid";
  }

  /* ---------- YouTube ---------- */
  let player = null, ready = false, errors = 0;

  function loadApi() {
    if (window.YT && window.YT.Player) return createPlayer();
    window.onYouTubeIframeAPIReady = createPlayer;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }

  function createPlayer() {
    player = new YT.Player("mp-yt", {
      videoId: PLAYLIST[state.i],
      playerVars: { start: Math.floor(state.t), playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          ready = true;
          player.setVolume(+vol.value);
          if (state.playing) player.playVideo();
          updateTitle();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) { state.playing = true; errors = 0; updateTitle(); }
          else if (e.data === YT.PlayerState.PAUSED) state.playing = false;
          else if (e.data === YT.PlayerState.ENDED) return next();
          playBtn.textContent = state.playing ? "⏸" : "▶";
          renderMod(); persist();
        },
        onError: () => {
          // embedding disabled / removed video: skip it (stop if every track fails)
          if (++errors < PLAYLIST.length) next();
          else nowEl.textContent = "no playable tracks — check the PLAYLIST IDs";
        },
      },
    });
  }

  function updateTitle() {
    if (!ready) return;
    const d = player.getVideoData && player.getVideoData();
    if (d && d.title) titles[PLAYLIST[state.i]] = d.title;
    nowEl.textContent = "▶ " + label(state.i);
    renderList(); renderMod();
  }

  function go(i, play) {
    state.i = (i + PLAYLIST.length) % PLAYLIST.length;
    state.t = 0;
    if (ready) play ? player.loadVideoById(PLAYLIST[state.i]) : player.cueVideoById(PLAYLIST[state.i]);
    nowEl.textContent = "loading…";
    renderList(); persist();
  }
  function next() {
    if (state.shuffle && PLAYLIST.length > 1) {
      let j; do { j = Math.floor(Math.random() * PLAYLIST.length); } while (j === state.i);
      go(j, true);
    } else go(state.i + 1, true);
  }

  function persist() {
    if (ready && player.getCurrentTime) state.t = player.getCurrentTime() || 0;
    save(state);
  }

  function openWin() {
    win.hidden = false; state.open = true;
    if (!player) loadApi();
    persist();
  }

  /* ---------- events ---------- */
  mod.onclick = () => (win.hidden ? openWin() : (win.hidden = false));
  win.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (!a) return;
    switch (a.dataset.a) {
      case "play": if (!ready) return; state.playing ? player.pauseVideo() : player.playVideo(); break;
      case "next": next(); break;
      case "prev":
        if (ready && player.getCurrentTime() > 3) player.seekTo(0, true);
        else go(state.i - 1, true);
        break;
      case "shuffle": state.shuffle = !state.shuffle; shufBtn.classList.toggle("on", state.shuffle); persist(); break;
      case "list": state.list = listEl.hidden; listEl.hidden = !listEl.hidden; persist(); break;
      case "close":
        if (ready) player.pauseVideo();
        state.playing = false; state.open = false; win.hidden = true;
        renderMod(); persist();
        break;
    }
  });
  vol.oninput = () => { state.vol = +vol.value; if (ready) player.setVolume(state.vol); persist(); };
  $(".mp-track").onclick = (e) => {
    if (!ready) return;
    const r = e.currentTarget.getBoundingClientRect();
    player.seekTo(((e.clientX - r.left) / r.width) * player.getDuration(), true);
  };

  setInterval(() => {
    if (!ready || !player.getDuration) return;
    const c = player.getCurrentTime() || 0, d = player.getDuration() || 0;
    fill.style.width = d ? (c / d) * 100 + "%" : 0;
    curEl.textContent = fmt(c); durEl.textContent = fmt(d);
    if (state.playing) persist();
  }, 1000);
  window.addEventListener("pagehide", persist);

  renderList(); renderMod();
  // reopen on page change if it was open (resumes where it left off; the
  // browser may require one click on ▶ if it blocks autoplay)
  if (state.open && PLAYLIST.length) openWin();
})();
