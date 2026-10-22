/**
 * Site-wide motion layer (GSAP + ScrollTrigger + SplitText + Lenis).
 * Markup opts in with data attributes, so pages stay declarative:
 *   data-split[="load"]   line-by-line masked reveal for headings
 *   data-reveal           staggered fade-up of direct children on enter
 *   data-reveal-self      fade-up of the element itself
 *   data-clip             image curtain reveal (clip-path + inner zoom-out)
 *   data-parallax="n"     scrubbed vertical drift, n = yPercent
 *   data-magnetic         element follows the pointer a little on hover
 *   data-cursor="Label"   cursor ring expands and shows the label
 * Everything is skipped under prefers-reduced-motion; content is never hidden without JS.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { $cartOpen } from './cart';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;

function initLenis() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, anchors: { offset: -96 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $cartOpen.subscribe((open) => (open ? lenis?.stop() : lenis?.start()));
}

function initCursor() {
  const root = document.querySelector<HTMLElement>('[data-cursor-root]');
  if (!root || root.dataset.ready || !finePointer() || reduced()) return;
  root.dataset.ready = '1';
  const ring = root.querySelector<HTMLElement>('[data-cursor-ring]')!;
  const dot = root.querySelector<HTMLElement>('[data-cursor-dot]')!;
  const label = root.querySelector<HTMLElement>('[data-cursor-label]')!;
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2' });
  window.addEventListener('pointermove', (e) => {
    root.dataset.visible = '1';
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerleave', () => delete root.dataset.visible);
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const labeled = t.closest<HTMLElement>('[data-cursor]');
    const interactive = t.closest('a, button, input, select, textarea, label, [role="button"]');
    root.dataset.mode = labeled ? 'label' : interactive ? 'link' : '';
    label.textContent = labeled?.dataset.cursor ?? '';
  });
  document.addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.85, duration: 0.2 }));
  document.addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.5)' }));
}

const HIDDEN = '[data-split], [data-reveal] > *, [data-reveal-self], [data-clip]';

/** Safety net: show everything without animation (used if any setup step fails). */
function revealAll() {
  document.documentElement.classList.remove('js-motion');
  gsap.set(gsap.utils.toArray(HIDDEN), { clearProps: 'opacity,visibility,clipPath,transform' });
}

/** Runs one setup step; a failure in one element never leaves the rest of the page hidden. */
function safely(label: string, fn: () => void) {
  try { fn(); } catch (e) {
    console.warn(`[motion] ${label}:`, (e as Error).message);
    failed = true;
  }
}
let failed = false;

function initPage() {
  ctx?.revert();
  failed = false;
  ctx = gsap.context(() => {
    if (reduced()) return;

    gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => safely('split', () => {
      const onLoad = el.dataset.split === 'load';
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, {
            yPercent: 115, rotate: 2, transformOrigin: '0% 100%', duration: 1.3, ease: EASE, stagger: 0.09,
            delay: onLoad ? 0.15 : 0,
            scrollTrigger: onLoad ? undefined : { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    }));

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((group) => safely('reveal', () => {
      gsap.fromTo(group.children, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 86%', once: true },
      });
    }));

    gsap.utils.toArray<HTMLElement>('[data-reveal-self]').forEach((el) => safely('reveal-self', () => {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 1.1, ease: EASE, delay: Number(el.dataset.revealSelf || 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }));

    gsap.utils.toArray<HTMLElement>('[data-clip]').forEach((el) => safely('clip', () => {
      const media = el.querySelector('img, video');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' });
      if (media) tl.from(media, { scale: 1.25, duration: 2, ease: EASE }, 0);
    }));

    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => safely('parallax', () => {
      const amt = Number(el.dataset.parallax || 12);
      gsap.fromTo(el, { yPercent: -amt / 2 }, {
        yPercent: amt / 2, ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }));

    if (finePointer()) {
      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
        const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
        const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.28);
          y((e.clientY - r.top - r.height / 2) * 0.38);
        };
        const leave = () => { x(0); y(0); };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
      });
    }
  });
  if (failed) revealAll();
}

export function bootMotion() {
  document.documentElement.dataset.motion = '1';
  // each navigation gets an id; work started for a page that is already gone is discarded
  let navId = 0;
  document.addEventListener('astro:page-load', async () => {
    const id = ++navId;
    initLenis();
    // keep Lenis in sync with the scroll position the router restored
    lenis?.resize();
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
    initCursor();
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
    if (id !== navId) return;
    try {
      initPage();
      ScrollTrigger.refresh();
    } catch (e) {
      console.warn('[motion] init:', (e as Error).message);
      revealAll();
    }
    document.documentElement.dataset.motion = '1';
  });
  document.addEventListener('astro:before-swap', () => {
    navId++;
    ctx?.revert();
    ctx = null;
    ScrollTrigger.getAll().forEach((t) => t.kill());
  });
}

export { gsap, ScrollTrigger };
