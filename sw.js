/* Beaver Planner service worker: the app shell works offline. The build writes VERSION, FILES and RELEASE; a new build
   means a new VERSION. Beaver Reader, Focus and Cook share this origin, so only caches starting "planner-" are ever touched.
   A new worker waits until the page lets it take over (register-sw.js: the toast, or the next load when nothing is
   open that a reload would interrupt); asked 'release' on a port, it answers with its name for the toast.
   Reminders that ring while the page is hidden show a notification (core/alarms.js); a tap on it brings the app to the
   front (or opens it), and its Done / 5 more min buttons are handed to ONE open tab of the app at a time (the focused
   one, else a visible one, else the first) as { type: 'ring-action', id, action, at (the ring's time), sent }, with a
   port for its ack. That tab answers that ring (once) and tells the other tabs. With no ack in 2.5 s (a frozen or
   unloading tab) the next tab is asked (two at most; a tab drops a message older than 1.5 s, so it is never answered
   twice), and when none takes it, or no window is open, the app is opened with the answer in the address
   (?ring=<id>&action=<action>&at=<ms>, core/alarms.js applies it on start), so a snooze is not lost and the ring is not
   called missed. */
const VERSION = 'planner-shell-2c0df1c9a12d';                     // planner-shell-<hash of every shell file>
const FONTS = 'planner-cjk-fonts-1';               // the big pixel CJK fonts: filled when first used, kept across versions
const FILES = ["./","assets/index-CGLC6L9U.js","assets/index-_IaB7Cqd.css","assets/silkscreen-latin-CtPo2yA5.woff2","assets/silkscreen-latin-ext-2T9bWrxp.woff2","icons/apple-touch-icon.png","icons/favicon-32.png","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","robots.txt"];                           // the shell (everything but the CJK fonts)
const RELEASE = "v0.1.1 · Clear Print";                       // this version's name, "v0.2 · Name" (releases.js releaseLabel)

const isFont = url => url.pathname.includes('/fonts/fusion-pixel/');
const ACK_WAIT = 2500, TRIES = 2;                  // core/alarms.js drops a ring-action older than 1.5 s

// hand a ring-action to one tab; true when it acks in time
function ask(win, msg) {
  return new Promise(res => {
    let ch = null, timer = null;
    const end = ok => { if (timer !== null) clearTimeout(timer); timer = null; try { ch.port1.close(); } catch (err) { /* gone */ } res(ok); };
    try { ch = new MessageChannel(); } catch (err) { res(false); return; }
    ch.port1.onmessage = e => end(!!(e.data && e.data.type === 'ring-ack' && e.data.ok));
    timer = setTimeout(() => end(false), ACK_WAIT);
    try { win.postMessage({ ...msg, sent: Date.now() }, [ch.port2]); } catch (err) { end(false); }
  });
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const shell = await caches.open(VERSION);
    await shell.addAll(FILES.map(f => new Request(f, { cache: 'reload' })));
    if (!self.registration.active) await self.skipWaiting();
  })());
});

// old versions go (after the install above has taken what it needs), but only ours: planner-... caches that are not the
// current shell or font cache
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.map(k => (k.startsWith('planner-') && k !== VERSION && k !== FONTS ? caches.delete(k) : null))))
    .then(() => self.clients.claim())
));
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();                        // the toast's Reload
  if (e.data === 'release' && e.ports && e.ports[0]) e.ports[0].postMessage(RELEASE);   // the page asks which version this is
});

// run work after the response is sent without the worker being stopped under it
function keepAlive(e) {
  let done; const pending = [];
  e.waitUntil(new Promise(r => { done = r; }));
  return { add: p => { pending.push(Promise.resolve(p).catch(() => {})); }, finish: () => { Promise.all(pending).then(done, done); } };
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (isFont(url)) {
    const k = keepAlive(e);
    e.respondWith((async () => {
      try {
        const cache = await caches.open(FONTS);
        const hit = await cache.match(req);
        if (hit) return hit;
        const r = await fetch(req);                                // the first time it is used
        if (r.ok) k.add(cache.put(req, r.clone()));
        return r;
      } finally { k.finish(); }
    })());
    return;
  }
  // the shell from this worker's own cache only (the other apps keep theirs on the same origin)
  e.respondWith(caches.open(VERSION).then(shell => shell.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || fetch(req).catch(() =>
    req.mode === 'navigate' ? shell.match('index.html') : Response.error()))));
});

// a reminder's notification: its buttons go to the page (which answers the ring); a tap on the notification itself
// brings the app forward, or opens it
self.addEventListener('notificationclick', e => {
  const n = e.notification, action = e.action || '', id = (n.data && n.data.id) || n.tag;
  const at = n.data && Number.isFinite(n.data.at) ? n.data.at : undefined;
  n.close();
  e.waitUntil((async () => {
    const scope = self.registration.scope;
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = wins.filter(w => w.url.startsWith(scope));
    // one tab at a time answers (two hidden tabs each applying a snooze would snooze it twice); it tells the others
    if (mine.length && action) {
      const rank = w => (w.focused ? 0 : w.visibilityState === 'visible' ? 1 : 2);
      const order = mine.map((w, i) => [w, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([w]) => w);
      const msg = at === undefined ? { type: 'ring-action', id, action } : { type: 'ring-action', id, action, at };
      for (const w of order.slice(0, TRIES)) if (await ask(w, msg)) return;
    } else if (mine.length) { try { await mine[0].focus(); } catch (err) { /* not allowed: it stays where it is */ } return; }
    const url = action ? `${scope}?ring=${encodeURIComponent(id)}&action=${encodeURIComponent(action)}${at === undefined ? '' : '&at=' + at}` : scope;
    try { await self.clients.openWindow(url); } catch (err) { /* nothing to open */ }
  })());
});
