if (navigator.userAgent.includes('Firefox')) {
  Object.defineProperty(globalThis, 'crossOriginIsolated', {
    value: true,
    writable: false
  });
}

var _base = self.location.pathname.replace(/[^/]*$/, '');
var _p = _base + ['study', '-core/'].join('');
var _f = ['sj', '.all', '.js'].join('');
var _v = ['lec', '12'].join('');
try {
  importScripts(_p + _f + '?v=' + _v);
} catch (e) {}

var _lw = ['$', 'study', 'path', 'Load', 'Worker'].join('');
var _sw = ['Study', 'path', 'Service', 'Worker'].join('');
var _boot = self[_lw];
if (typeof _boot !== 'function') {
  self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
  });
  self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
  });
  self.addEventListener('fetch', function (event) {
    event.respondWith(fetch(event.request));
  });
} else {
var _exports = _boot();
var _engine = new _exports[_sw]();

var _pref = _base + ['study-', 'path/'].join('');
var _hydrated = false;
var _configPromise = null;
var _pslSeedPromise = null;
var _pslUrl = self.location.origin + '/api/psl';
var _pslKey = 'publicSuffixList';
var _pslDb = String.fromCharCode(36, 115, 116, 117, 100, 121, 112, 97, 116, 104);

function parsePslText(text) {
  return String(text || '')
    .split('\n')
    .map(function (line) {
      var t = line.trim();
      var sp = t.indexOf(' ');
      return sp > -1 ? t.substring(0, sp) : t;
    })
    .filter(function (line) {
      return line && line.indexOf('//') !== 0;
    });
}

function openPslDb() {
  return new Promise(function (resolve, reject) {
    try {
      var req = indexedDB.open(_pslDb, 1);
      req.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains('publicSuffixList')) {
          db.createObjectStore('publicSuffixList');
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error || new Error('idb open failed'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

function idbGet(store, key) {
  return new Promise(function (resolve, reject) {
    var req = store.get(key);
    req.onsuccess = function () {
      resolve(req.result || null);
    };
    req.onerror = function () {
      reject(req.error || new Error('idb get failed'));
    };
  });
}

function idbPut(store, key, value) {
  return new Promise(function (resolve, reject) {
    var req = store.put(value, key);
    req.onsuccess = function () {
      resolve();
    };
    req.onerror = function () {
      reject(req.error || new Error('idb put failed'));
    };
  });
}

async function seedPublicSuffixList() {
  var db;
  try {
    db = await openPslDb();
    var readTx = db.transaction('publicSuffixList', 'readonly');
    var cached = await idbGet(readTx.objectStore('publicSuffixList'), _pslKey);
    if (cached && cached.expiry && Date.now() < cached.expiry && cached.data && cached.data.length) {
      db.close();
      return;
    }
    var resp = await fetch(_pslUrl, { credentials: 'omit', cache: 'force-cache' });
    if (!resp.ok) {
      db.close();
      return;
    }
    var data = parsePslText(await resp.text());
    if (!data.length) {
      db.close();
      return;
    }
    var writeTx = db.transaction('publicSuffixList', 'readwrite');
    await idbPut(writeTx.objectStore('publicSuffixList'), _pslKey, {
      data: data,
      expiry: Date.now() + 36e5,
    });
    await new Promise(function (resolve) {
      writeTx.oncomplete = resolve;
      writeTx.onerror = resolve;
    });
    db.close();
  } catch (e) {}
}

function ensurePublicSuffixList() {
  if (!_pslSeedPromise) {
    _pslSeedPromise = seedPublicSuffixList().finally(function () {
      _pslSeedPromise = null;
    });
  }
  return _pslSeedPromise;
}

self.addEventListener('install', function (event) {
  event.waitUntil(Promise.all([self.skipWaiting(), ensurePublicSuffixList()]));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(Promise.all([self.clients.claim(), ensurePublicSuffixList()]));
});

function isAppShellRequest(request, url) {
  if (url.origin !== self.location.origin) return false;
  var path = url.pathname;
  if (path.indexOf(_pref) === 0) return false;
  if (path === _base || path === _base + 'index.html' || path === _base + 'index.svg' || path === _base + 'new.svg' || path === _base + 'study-sw.js') return true;
  if (path.indexOf(_base + 'assets/') === 0) return true;
  if (path.indexOf(_base + 'study-core/') === 0) {
    if (path.indexOf('.wasm') !== -1) return false;
    return true;
  }
  if (path.indexOf(_base + 'study-bus/') === 0) return true;
  if (path.indexOf(_base + 'study-bridge/') === 0) return true;
  if (path.indexOf(_base + 'study-fetch/') === 0) return true;
  return false;
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function configReady(c) {
  return !!(
    c &&
    c.prefix &&
    c.files &&
    c.files.wasm &&
    c.files.all &&
    c.files.sync
  );
}

async function hydrateFromIdb() {
  if (configReady(_engine.config)) {
    try {
      await _engine.setConfig(_engine.config);
      _hydrated = true;
      return true;
    } catch (e) {}
  }

  var previous = configReady(_engine.config) ? _engine.config : null;
  for (var i = 0; i < 40; i++) {
    try {
      if (!configReady(_engine.config)) {
        _engine.config = undefined;
      }
      await _engine.loadConfig();
      if (configReady(_engine.config)) {
        _hydrated = true;
        return true;
      }
    } catch (e) {}
    await delay(50);
  }
  if (previous) {
    try {
      await _engine.setConfig(previous);
      _hydrated = true;
      return true;
    } catch (e) {}
  }
  return false;
}

async function ensureConfig() {
  if (_hydrated && configReady(_engine.config)) return true;
  if (_configPromise) return _configPromise;

  _configPromise = hydrateFromIdb().finally(function () {
    _configPromise = null;
  });
  return _configPromise;
}

async function applyConfigMessage(data) {
  if (data.config && configReady(data.config)) {
    try {
      await _engine.setConfig(data.config);
      _hydrated = true;
      return;
    } catch (e) {}
  }
  if (configReady(_engine.config)) {
    try {
      await _engine.setConfig(_engine.config);
      _hydrated = true;
      return;
    } catch (e) {}
  }
  await ensureConfig();
}

async function handleRequest(event) {
  var url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return fetch(event.request);
  }

  var ready = await ensureConfig();
  await ensurePublicSuffixList();
  if (!ready || !configReady(_engine.config)) {
    if (url.pathname.indexOf(_pref) === 0) {
      return new Response('Proxy engine not ready', { status: 503, statusText: 'Service Unavailable' });
    }
    try {
      return await fetch(event.request);
    } catch (e) {
      return new Response('Network error', { status: 502 });
    }
  }

  try {
    if (_engine.route(event)) {
      return await _engine.fetch(event);
    }
  } catch (e) {
    if (url.pathname.indexOf(_pref) === 0) {
      return new Response('Proxy fetch failed', { status: 502 });
    }
  }

  try {
    return await fetch(event.request);
  } catch (e) {
    return new Response('Network error', { status: 502 });
  }
}

self.addEventListener('fetch', function (event) {
  try {
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin || url.pathname.indexOf(_pref) !== 0) {
      return;
    }
  } catch (e) {
    return;
  }
  event.respondWith(handleRequest(event));
});

var playgroundData;
self.addEventListener('message', function (msg) {
  var data = msg.data;
  if (!data) return;
  if (data.type === 'playgroundData') {
    playgroundData = data;
  }
  if (data[['study', 'path', '$type'].join('')] === 'loadConfig') {
    var p = applyConfigMessage(data);
    if (typeof msg.waitUntil === 'function') {
      try {
        msg.waitUntil(p);
      } catch (e) {}
    }
  }
});

_engine.addEventListener('request', function (e) {
  if (playgroundData && e.url.href.indexOf(playgroundData.origin) === 0) {
    var headers = {};
    var origin = playgroundData.origin;
    if (e.url.href === origin + '/') {
      headers['content-type'] = 'text/html';
      e.response = new Response(playgroundData.html, { headers: headers });
    } else if (e.url.href === origin + '/style.css') {
      headers['content-type'] = 'text/css';
      e.response = new Response(playgroundData.css, { headers: headers });
    } else if (e.url.href === origin + '/script.js') {
      headers['content-type'] = 'application/javascript';
      e.response = new Response(playgroundData.js, { headers: headers });
    } else {
      e.response = new Response('empty response', { headers: headers });
    }
    e.response.rawHeaders = headers;
    e.response.rawResponse = {
      body: e.response.body,
      headers: headers,
      status: e.response.status,
      statusText: e.response.statusText
    };
    e.response.finalURL = e.url.toString();
  }
});
}
