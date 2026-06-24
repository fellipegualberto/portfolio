/* =========================================================
   PORTFÓLIO JORNALÍSTICO — script.js (desktop + mobile)
   ========================================================= */

(() => {
    'use strict';

    const prefersReduced = false;
    const mqMobile = window.matchMedia('(max-width: 768px)');
    const isMobile = () => mqMobile.matches;
    const isTouch  = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const lerp = (a, b, n) => (1 - n) * a + n * b;

    /* ---------- Menu Hambúrguer Mobile ---------- */
    const menuToggle = document.querySelector('.menu-toggle');
    const navContent = document.querySelector('.nav-content');
    const body       = document.body;

    const closeMenu = () => {
        if (!navContent) return;
        navContent.classList.remove('active');
        menuToggle?.classList.remove('open');
        body.classList.remove('nav-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        if (!navContent) return;
        navContent.classList.add('active');
        menuToggle?.classList.add('open');
        body.classList.add('nav-open');
        menuToggle?.setAttribute('aria-expanded', 'true');
    };

    if (menuToggle && navContent) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');

        menuToggle.addEventListener('click', () => {
            if (navContent.classList.contains('active')) closeMenu();
            else openMenu();
        });

        navContent.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navContent.classList.contains('active')) closeMenu();
        });

        mqMobile.addEventListener('change', (e) => {
            if (!e.matches) closeMenu();
        });
    }

    /* ---------- Smooth scroll com offset ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = isMobile() ? 76 : 96;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
    });

    /* ---------- Efeito Magnético com inércia (desktop only) ---------- */
    document.querySelectorAll('.magnetic').forEach((el) => {
        if (prefersReduced || isTouch()) return;
        if (el.closest('.nav-wrapper') && !el.closest('.nav-curriculo')) return;

        const state = { tx: 0, ty: 0, x: 0, y: 0, active: false, raf: null };
        const STRENGTH = 0.18;
        const EASE = 0.18;

        const tick = () => {
            state.x = lerp(state.x, state.tx, EASE);
            state.y = lerp(state.y, state.ty, EASE);
            el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
            if (state.active || Math.abs(state.x - state.tx) > 0.05 || Math.abs(state.y - state.ty) > 0.05) {
                state.raf = requestAnimationFrame(tick);
            } else {
                state.raf = null;
                el.style.transform = '';
            }
        };

        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            state.tx = (e.clientX - r.left - r.width / 2) * STRENGTH;
            state.ty = (e.clientY - r.top  - r.height / 2) * STRENGTH;
            state.active = true;
            if (!state.raf) state.raf = requestAnimationFrame(tick);
        }, { passive: true });

        el.addEventListener('mouseleave', () => {
            state.tx = 0; state.ty = 0; state.active = false;
            if (!state.raf) state.raf = requestAnimationFrame(tick);
        }, { passive: true });
    });

    /* ---------- Reveal no scroll ---------- */
    const reveals = document.querySelectorAll('.reveal');
    const isCurriculoPage = window.location.pathname.endsWith('curriculo.html') || window.location.href.includes('curriculo.html');

    if (isCurriculoPage) {
        reveals.forEach((el) => el.classList.add('visible'));
    } else if (reveals.length) {
        const io = new IntersectionObserver((entries, obs) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            }
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        reveals.forEach((el) => io.observe(el));
    }

    /* ---------- Carrosséis (modo adaptativo) ---------- */
    const carousels = document.querySelectorAll('.carousel-wrapper');

    carousels.forEach((wrapper) => {
        const track     = wrapper.querySelector('.carousel-track');
        const container = wrapper.querySelector('.carousel-container');
        const btnPrev   = wrapper.querySelector('.btn-prev');
        const btnNext   = wrapper.querySelector('.btn-next');
        if (!track || !container) return;

        const originalHTML = track.innerHTML;
        let mode = null; 
        let cleanupFns = [];

        const teardown = () => {
            cleanupFns.forEach(fn => { try { fn(); } catch(_){} });
            cleanupFns = [];
            track.style.transform = '';
            track.innerHTML = originalHTML;
            wrapper.classList.remove('is-mobile', 'carousel-mobile', 'carousel-desktop');
        };

        /* ---------- MODO MOBILE: scroll suave nativo ---------- */
        const setupMobile = () => {
            wrapper.classList.add('carousel-mobile', 'is-mobile');

            container.style.overflowX = 'auto';
            container.style.scrollSnapType = 'none';
            container.style.webkitOverflowScrolling = 'touch';
            container.style.scrollBehavior = 'smooth';
            track.style.display = 'flex';
            track.style.transform = 'none';
            
            track.querySelectorAll(':scope > *').forEach(child => {
                child.style.scrollSnapAlign = 'none';
                child.style.scrollSnapStop = 'normal';
                child.style.flex = '0 0 auto';
            });

            const getScrollAmount = () => {
                const card = track.querySelector('.editorial-card');
                return card ? card.offsetWidth + 18 : window.innerWidth * 0.8;
            };

            const onWheelMobile = (e) => {
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    e.preventDefault();
                }
            };
            container.addEventListener('wheel', onWheelMobile, { passive: false });

            let mobileAutoTimer = null;
            let isMobileInteracting = false;
            
            const scrollMobileNext = () => {
                const amount = getScrollAmount();
                const maxScroll = container.scrollWidth - container.clientWidth;
                const nextPosition = container.scrollLeft + amount;
                
                if (nextPosition >= maxScroll - 16) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: amount, behavior: 'smooth' });
                }
            };
            
            const stopMobileAuto = () => {
                if (mobileAutoTimer) {
                    clearTimeout(mobileAutoTimer);
                    mobileAutoTimer = null;
                }
            };
            
            const startMobileAuto = () => {
                stopMobileAuto();
                mobileAutoTimer = window.setTimeout(() => {
                    if (!isMobileInteracting) {
                        scrollMobileNext();
                    }
                    startMobileAuto();
                }, 4000);
            };
            
            const pauseMobileAuto = () => {
                isMobileInteracting = true;
                stopMobileAuto();
            };
            
            const resumeMobileAuto = () => {
                isMobileInteracting = false;
                startMobileAuto();
            };

            container.addEventListener('touchstart', pauseMobileAuto, { passive: true });
            container.addEventListener('touchend', resumeMobileAuto, { passive: true });
            container.addEventListener('mousedown', pauseMobileAuto, { passive: true });
            container.addEventListener('mouseup', resumeMobileAuto, { passive: true });
            startMobileAuto();

            /* Delegação de eventos para os botões no Mobile */
            let mobileBtnHandlers = [];
            if (btnPrev && btnNext) {
                const nextClick = () => {
                    pauseMobileAuto();
                    container.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
                    setTimeout(resumeMobileAuto, 100);
                };
                const prevClick = () => {
                    pauseMobileAuto();
                    container.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
                    setTimeout(resumeMobileAuto, 100);
                };

                btnNext.addEventListener('click', nextClick);
                btnPrev.addEventListener('click', prevClick);

                mobileBtnHandlers = [
                    () => btnNext.removeEventListener('click', nextClick),
                    () => btnPrev.removeEventListener('click', prevClick)
                ];
            }

            cleanupFns.push(() => {
                container.style.overflowX = '';
                container.style.scrollSnapType = '';
                container.style.webkitOverflowScrolling = '';
                container.style.scrollBehavior = '';
                track.style.display = '';
                track.querySelectorAll(':scope > *').forEach(child => {
                    child.style.scrollSnapAlign = '';
                    child.style.scrollSnapStop = '';
                    child.style.flex = '';
                });
                container.removeEventListener('wheel', onWheelMobile);
                container.removeEventListener('touchstart', pauseMobileAuto, { passive: true });
                container.removeEventListener('touchend', resumeMobileAuto, { passive: true });
                container.removeEventListener('mousedown', pauseMobileAuto, { passive: true });
                container.removeEventListener('mouseup', resumeMobileAuto, { passive: true });
                stopMobileAuto();
                mobileBtnHandlers.forEach(fn => fn());
            });
        };

        /* ---------- MODO DESKTOP: rAF + transform com auto-scroll ---------- */
        const setupDesktop = () => {
            wrapper.classList.add('carousel-desktop');
            track.innerHTML += track.innerHTML;

            const AUTO_PX_S       = 30;
            const HOVER_PX_S      = 140;
            const HOVER_DELAY_MS  = 260;
            const CLICK_STEP      = 300;
            const CLICK_EASE      = 0.10;
            const DRAG_FACTOR     = 1.2;

            let currentScroll   = 0;
            let halfWidth       = track.scrollWidth / 2;
            let isDown          = false;
            let isHovering      = false;
            let isHoverScroll   = false;
            let scrollDirection = 0;
            let hoverTimeout    = null;
            let startX = 0;
            let scrollAtDown = 0;
            let clickOffset = 0;
            let lastTs = 0;
            let rafId  = null;
            let isVisible = true;

            const recalc = () => { halfWidth = track.scrollWidth / 2; };
            window.addEventListener('load', recalc);
            window.addEventListener('resize', recalc, { passive: true });

            const wrap = (v) => {
                if (v >= halfWidth) return v - halfWidth;
                if (v < 0)          return v + halfWidth;
                return v;
            };

            const loop = (ts) => {
                const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
                lastTs = ts;

                if (!isDown) {
                    if (Math.abs(clickOffset) > 0.5) {
                        const step = clickOffset * CLICK_EASE;
                        currentScroll += step;
                        clickOffset   -= step;
                    } else if (clickOffset !== 0) {
                        currentScroll += clickOffset;
                        clickOffset = 0;
                    } else if (isHoverScroll) {
                        currentScroll += scrollDirection * HOVER_PX_S * dt;
                    } else if (!isHovering) {
                        currentScroll += AUTO_PX_S * dt;
                    }
                }

                currentScroll = wrap(currentScroll);
                track.style.transform = `translate3d(${(-currentScroll).toFixed(2)}px, 0, 0)`;
                rafId = requestAnimationFrame(loop);
            };

            const start = () => {
                if (rafId || prefersReduced) return;
                lastTs = 0;
                rafId = requestAnimationFrame(loop);
            };
            const stop = () => {
                if (!rafId) return;
                cancelAnimationFrame(rafId);
                rafId = null;
            };

            const visObs = new IntersectionObserver(([entry]) => {
                isVisible = entry.isIntersecting;
                if (isVisible) start(); else stop();
            }, { threshold: 0.01 });
            visObs.observe(wrapper);

            const onVisChange = () => {
                if (document.hidden) stop();
                else if (isVisible) start();
            };
            document.addEventListener('visibilitychange', onVisChange);

            const onMouseEnter = () => { isHovering = true; };
            const onMouseLeave = () => {
                isHovering = false;
                isDown = false;
                container.style.cursor = 'grab';
            };
            container.addEventListener('mouseenter', onMouseEnter);
            container.addEventListener('mouseleave', onMouseLeave);

            const onMouseDown = (e) => {
                isDown = true;
                startX = e.pageX;
                scrollAtDown = currentScroll;
                clickOffset = 0;
                container.style.cursor = 'grabbing';
            };
            const onMouseUp = () => {
                if (!isDown) return;
                isDown = false;
                container.style.cursor = 'grab';
            };
            const onMouseMove = (e) => {
                if (!isDown) return;
                e.preventDefault();
                const walk = (e.pageX - startX) * DRAG_FACTOR;
                currentScroll = scrollAtDown - walk;
            };
            container.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mouseup', onMouseUp);
            container.addEventListener('mousemove', onMouseMove);

            let btnHandlers = [];
            if (btnNext && btnPrev) {
                const startHoverScroll = (dir) => {
                    hoverTimeout = setTimeout(() => {
                        isHoverScroll = true;
                        scrollDirection = dir;
                    }, HOVER_DELAY_MS);
                };
                const stopHoverScroll = () => {
                    clearTimeout(hoverTimeout);
                    isHoverScroll = false;
                };

                const nextEnter = () => { isHovering = true; startHoverScroll(1); };
                const nextLeave = () => { isHovering = false; stopHoverScroll(); };
                const prevEnter = () => { isHovering = true; startHoverScroll(-1); };
                const prevLeave = () => { isHovering = false; stopHoverScroll(); };
                const nextClick = () => { clickOffset += CLICK_STEP; };
                const prevClick = () => { clickOffset -= CLICK_STEP; };

                btnNext.addEventListener('mouseenter', nextEnter);
                btnNext.addEventListener('mouseleave', nextLeave);
                btnPrev.addEventListener('mouseenter', prevEnter);
                btnPrev.addEventListener('mouseleave', prevLeave);
                btnNext.addEventListener('click', nextClick);
                btnPrev.addEventListener('click', prevClick);

                btnHandlers = [
                    () => btnNext.removeEventListener('mouseenter', nextEnter),
                    () => btnNext.removeEventListener('mouseleave', nextLeave),
                    () => btnPrev.removeEventListener('mouseenter', prevEnter),
                    () => btnPrev.removeEventListener('mouseleave', prevLeave),
                    () => btnNext.removeEventListener('click', nextClick),
                    () => btnPrev.removeEventListener('click', prevClick),
                ];
            }

            start();

            cleanupFns.push(
                stop,
                () => visObs.disconnect(),
                () => document.removeEventListener('visibilitychange', onVisChange),
                () => container.removeEventListener('mouseenter', onMouseEnter),
                () => container.removeEventListener('mouseleave', onMouseLeave),
                () => container.removeEventListener('mousedown', onMouseDown),
                () => window.removeEventListener('mouseup', onMouseUp),
                () => container.removeEventListener('mousemove', onMouseMove),
                ...btnHandlers,
            );
        };

        const apply = () => {
            const target = (isMobile() || isTouch()) ? 'mobile' : 'desktop';
            if (mode === target) return;
            if (mode) teardown();
            mode = target;
            try {
                if (target === 'mobile') setupMobile();
                else setupDesktop();
            } catch (err) {
                console.warn('Erro ao configurar carrossel:', err);
                mode = null;
            }
        };

        // Garantir que apply seja chamado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', apply);
        } else {
            apply();
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(apply, 250);
        }, { passive: true });
    });
})();

/* ---------- Renderização Dinâmica do Currículo ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const dadosCurriculo = {
        formacao: [
            { periodo: "Concluído em dezembro de 2023", curso: "Curso de Extensão Acadêmica em Jornalismo Econômico", instituicao: "Fundação Getulio Vargas (FGV)" },
            { periodo: "Concluído em Setembro de 2023", curso: "Mestrado em Estudos Linguísticos", instituicao: "Universidade Estadual Paulista “Júlio de Mesquita Filho” (UNESP) – Câmpus de São José do Rio Preto" },
            { periodo: "Concluída em Março de 2021", curso: "Graduação em Jornalismo", instituicao: "Universidade Estadual Paulista “Júlio de Mesquita Filho” (UNESP) – Câmpus de Bauru" }
        ],
        experiencia: [
            { periodo: "Novembro de 2025 – Atual", empresa: "GOTCHA! – Assessor de Imprensa", desc: "Redação de releases; monitoramento de pautas; relacionamento com a imprensa." },
            { periodo: "Junho de 2025 – Setembro de 2025", empresa: "ESTADÃO – Repórter de Política", desc: "Redação de notícias e reportagens para a editoria de Política; criação de pautas; entrevistas com fontes; apuração jornalística e pesquisa." },
            { periodo: "Janeiro de 2025 – Junho de 2025", empresa: "LETS MARKETING – Assessor de Imprensa", desc: "Redação de releases; monitoramento de pautas; relacionamento com a imprensa; criação de conteúdo para redes sociais; ghostwriting de artigos." },
            { periodo: "Setembro de 2023 – Dezembro de 2024", empresa: "ESTADÃO – Repórter de Mobilidade Urbana", desc: "Redação de notícias e reportagens para a editoria de Mobilidade Urbana; criação de pautas; entrevistas com fontes; cobertura de eventos; apuração jornalística e pesquisa." },
            { periodo: "Junho de 2022 – Outubro de 2022", empresa: "OLIVE COMUNICAÇÃO – Redator e Revisor", desc: "Criação de conteúdo para redes sociais e blogs; redação de artigos com técnicas de SEO; revisão de textos." },
            { periodo: "Março de 2019 – Junho de 2019", empresa: "TV UNESP – Estagiário", desc: "Redação de roteiros e edição de programas jornalísticos; criação de conteúdo para redes sociais." }
        ],
        idiomas: [
            "Inglês avançado",
            "Francês intermediário"
        ]
    };

    const expContainer = document.getElementById('dynamic-experience');
    const eduContainer = document.getElementById('dynamic-education');
    const langContainer = document.getElementById('dynamic-languages');

    if (expContainer) {
        expContainer.innerHTML = dadosCurriculo.experiencia.map(item => `
            <div class="resume-item">
                <span class="tag" style="margin-bottom: 12px; display: inline-block;">${item.periodo}</span>
                <h3>${item.empresa}</h3>
                <p>${item.desc}</p>
            </div>
        `).join('');
    }

    if (eduContainer) {
        eduContainer.innerHTML = dadosCurriculo.formacao.map(item => `
            <div class="resume-item">
                <span class="tag" style="margin-bottom: 12px; display: inline-block;">${item.periodo}</span>
                <h3>${item.curso}</h3>
                <p>${item.instituicao}</p>
            </div>
        `).join('');
    }

    if (langContainer) {
        langContainer.innerHTML = dadosCurriculo.idiomas.map(item => `
            <div class="resume-item">
                <h3>${item}</h3>
            </div>
        `).join('');
    }
});
