const header = document.querySelector(".site-header");
const art = document.querySelector(".hero-art");
const navigation = [...header.querySelectorAll("nav a")].map((link) => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
}));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeLink = null;
let framePending = false;
let parallaxOffset = 0;
let parallaxTarget = 0;
let parallaxFrame = null;
let previousFrameTime = null;

function renderParallax(time) {
  const elapsed = previousFrameTime === null ? 16 : time - previousFrameTime;
  const distance = parallaxTarget - parallaxOffset;
  const settled = Math.abs(distance) < 0.5;

  // Time-based easing keeps the same weight at different refresh rates.
  parallaxOffset = settled ? parallaxTarget : parallaxOffset + distance * (1 - Math.exp(-elapsed / 125));
  art.style.setProperty("--orbit-offset", `${parallaxOffset * 0.09}px`);
  art.style.setProperty("--star-offset", `${parallaxOffset * -0.055}px`);

  previousFrameTime = settled ? null : time;
  parallaxFrame = settled ? null : window.requestAnimationFrame(renderParallax);
}

function updateScroll() {
  framePending = false;
  const readingLine = header.getBoundingClientRect().bottom + window.innerHeight * 0.18;
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  let nextLink = null;

  for (const { link, section } of navigation) {
    if (atBottom || section.getBoundingClientRect().top <= readingLine) nextLink = link;
  }

  if (nextLink !== activeLink) {
    activeLink?.removeAttribute("aria-current");
    nextLink?.setAttribute("aria-current", "location");
    activeLink = nextLink;
  }

  const { top, bottom } = art.getBoundingClientRect();
  parallaxTarget = Math.max(0, Math.min(window.scrollY, 500));

  if (reducedMotion.matches || bottom < 0 || top > window.innerHeight) {
    if (parallaxFrame !== null) window.cancelAnimationFrame(parallaxFrame);
    parallaxFrame = null;
    previousFrameTime = null;
    parallaxOffset = parallaxTarget;
    return;
  }

  if (parallaxFrame === null) parallaxFrame = window.requestAnimationFrame(renderParallax);
}

function scheduleUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateScroll);
}

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
reducedMotion.addEventListener("change", scheduleUpdate);
scheduleUpdate();
