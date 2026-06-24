/* Cache Manager - Força limpeza total e carregamento do zero */

(() => {
    'use strict';

    const TIMESTAMP = new Date().getTime();

    const clearAllCache = async () => {
        // Limpar Service Worker cache completamente
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            } catch (e) {
                console.warn('Erro ao limpar cache API:', e);
            }
        }

        // Limpar LocalStorage e SessionStorage
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.warn('Erro ao limpar storage:', e);
        }

        // Limpar IndexedDB
        if ('indexedDB' in window) {
            try {
                const dbs = await indexedDB.databases();
                dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
            } catch (e) {
                console.warn('Erro ao limpar IndexedDB:', e);
            }
        }

        // Forçar recarga de todas as imagens com versão
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
            if (img.src && !img.src.includes('data:')) {
                const separator = img.src.includes('?') ? '&' : '?';
                img.src = img.src + separator + 'v=' + TIMESTAMP;
            }
            if (img.style.backgroundImage) {
                img.style.backgroundImage = img.style.backgroundImage.replace(
                    /url\('([^']*)'\)/g,
                    (match, url) => {
                        if (url.includes('?')) {
                            return `url('${url}&v=${TIMESTAMP}')`;
                        } else {
                            return `url('${url}?v=${TIMESTAMP}')`;
                        }
                    }
                );
            }
        });

        // Forçar recarga de CSS com versão
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach((link) => {
            if (link.href && !link.href.includes('fonts.googleapis')) {
                const separator = link.href.includes('?') ? '&' : '?';
                link.href = link.href + separator + 'v=' + TIMESTAMP;
            }
        });

        // Forçar recarga de scripts com versão
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script) => {
            if (script.src && !script.src.includes('cache-manager') && !script.src.includes('cdnjs')) {
                const separator = script.src.includes('?') ? '&' : '?';
                script.src = script.src + separator + 'v=' + TIMESTAMP;
            }
        });

        // Forçar recarga via HTTP headers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => {
                    registration.unregister();
                });
            }).catch(() => {});
        }
    };

    // Executar na primeira disponibilidade
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', clearAllCache);
    } else {
        clearAllCache();
    }

    // Limpar cache a cada visita (sem cache)
    window.addEventListener('beforeunload', () => {
        if ('caches' in window) {
            caches.keys().then((cacheNames) => {
                cacheNames.forEach((cacheName) => {
                    caches.delete(cacheName).catch(() => {});
                });
            }).catch(() => {});
        }
    });
})();
