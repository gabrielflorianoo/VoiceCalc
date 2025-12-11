const CACHE_NAME = 'voicecalc-pro-v1.1.0';

const urlsToCache = [
    '/',
    'index.html',
    'icons/calculator128.png',
    'icons/calculator512.png',
];

// --- 1. Evento INSTALL (Instalação e Caching) ---
self.addEventListener('install', (event) => {
    console.log('SW: Instalando Service Worker...');
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(async (cache) => {
                console.log('SW: Cacheando shell do aplicativo.');
                // Ignora falhas de cache para garantir a instalação.
                try {
                    return await cache.addAll(urlsToCache);
                } catch (err) {
                    console.error(
                        'SW: Falha ao adicionar recursos ao cache, mas continuando.',
                        err,
                    );
                }
            })
            // Força o novo Service Worker a ativar imediatamente (útil no primeiro acesso)
            .then(() => self.skipWaiting()),
    );
});

// --- 2. Evento ACTIVATE (Limpeza de Caches Antigos) ---
self.addEventListener('activate', (event) => {
    console.log('SW: Ativando Service Worker e limpando caches antigos...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            // Deleta qualquer cache que não esteja na lista de permissões
                            console.log(
                                'SW: Deletando cache antigo:',
                                cacheName,
                            );
                            return caches.delete(cacheName);
                        }
                    }),
                );
            })
            .then(() => self.clients.claim()), // Assume o controle da página
    );
});

// --- 3. Evento FETCH (Estratégia de Cache) ---
self.addEventListener('fetch', (event) => {
    // Apenas intercepta requisições HTTP(S) (evita extensões, etc.)
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                // Cache-First: Se a resposta estiver no cache, retorne-a.
                if (response) {
                    return response;
                }

                // Caso contrário, faça a requisição de rede e adicione ao cache se bem-sucedida.
                return fetch(event.request).then((response) => {
                    // Verifica se a resposta é válida
                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type !== 'basic'
                    ) {
                        return response;
                    }

                    // Clona a resposta (pois a original é consumida)
                    const responseToCache = response.clone();

                    // Cacheia a nova resposta (opcional: apenas para recursos dinâmicos)
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            }),
        );
    }
});
