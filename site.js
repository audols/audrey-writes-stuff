const header = document.querySelector(".site-header");
const art = document.querySelector(".hero-art");
const navigation = [...header.querySelectorAll("nav a")].map((link) => ({
  link,
  section: document.getElementById(new URL(link.href).pathname.slice(1)),
}));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const routes = new Map([
  ["/", document.getElementById("top")],
  ...navigation.map(({ link, section }) => [new URL(link.href).pathname, section]),
]);

function followRoute(behavior = "instant", focus = false) {
  const legacySection = window.location.hash.slice(1);
  const legacyPath = legacySection === "top" ? "/" : `/${legacySection}`;
  const hasLegacyRoute = Boolean(legacySection) && routes.has(legacyPath);
  const path = hasLegacyRoute ? legacyPath
    : window.location.pathname.replace(/\/index\.html$|\/$/g, "") || "/";
  const section = routes.get(path);
  if (!section || (window.location.hash && !hasLegacyRoute)) return;

  window.history.replaceState(null, "", path);
  if (focus) {
    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  }
  if (path === "/") window.scrollTo({ top: 0, behavior });
  else section.scrollIntoView({ behavior, block: "start" });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin || url.search || url.hash || !routes.has(url.pathname)) return;

  event.preventDefault();
  if (window.location.pathname !== url.pathname || window.location.hash) {
    window.history.pushState(null, "", url.pathname);
  }
  followRoute("auto", true);
});

window.addEventListener("popstate", () => followRoute());
window.addEventListener("hashchange", () => followRoute());
window.addEventListener("load", () => followRoute(), { once: true });
followRoute();

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
    const path = nextLink ? new URL(nextLink.href).pathname : "/";
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
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
