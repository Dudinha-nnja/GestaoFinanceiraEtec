// =============================================
// SERVICE WORKER — ETEC Cursos PWA
// =============================================
// Versão do cache — mude este número sempre que
// atualizar arquivos para forçar o novo cache
const CACHE_NAME = "etec-v1"

// Arquivos que ficam disponíveis offline
const ARQUIVOS_CACHE = [
  "/",
  "/sistema",
  "/static/css/main.css",
  "/static/js/main.js",
  "/static/js/colaboradores.js",
  "/static/img/desenho.png",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap"
]

// ── Instala o service worker e faz cache dos arquivos ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Fazendo cache dos arquivos...")
      return cache.addAll(ARQUIVOS_CACHE)
    })
  )
  // Ativa imediatamente sem esperar fechar abas antigas
  self.skipWaiting()
})

// ── Ativa e limpa caches antigos ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => {
            console.log("[SW] Removendo cache antigo:", nome)
            return caches.delete(nome)
          })
      )
    })
  )
  self.clients.claim()
})

// ── Estratégia: Network First com fallback para cache ──
// Para APIs (dados em tempo real) → sempre tenta a rede
// Para arquivos estáticos → usa cache se offline
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Requisições de API: sempre vai na rede, sem cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ erro: "Sem conexão. Verifique sua internet." }),
          { headers: { "Content-Type": "application/json" } }
        )
      })
    )
    return
  }

  // Arquivos estáticos e páginas: cache primeiro, rede como fallback
  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) {
        return respostaCache
      }
      return fetch(event.request).then((respostaRede) => {
        // Salva no cache para próxima vez
        if (respostaRede && respostaRede.status === 200) {
          const clone = respostaRede.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return respostaRede
      })
    })
  )
})