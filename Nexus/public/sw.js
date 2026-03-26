const CACHE_NAME = 'nexus-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST logout, API calls, etc.)
  if (event.request.method !== 'GET') return;

  // Skip API routes, auth routes, and Supabase calls entirely
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  // For page navigation: network-first, with a nice offline fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus - Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;text-align:center;padding:2rem}.card{max-width:400px}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.5rem;font-weight:700;margin-bottom:.5rem}p{color:#94a3b8;line-height:1.6;margin-bottom:1.5rem}button{background:#0ea5e9;color:#fff;border:none;padding:.75rem 2rem;border-radius:.75rem;font-weight:600;cursor:pointer;font-size:1rem;transition:background .2s}button:hover{background:#38bdf8}</style></head><body><div class="card"><div class="icon">📡</div><h1>You\'re Offline</h1><p>Nexus can\'t reach the server right now. Please check your internet connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    })
  );
});
