const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const content = document.querySelector(".smooth-content");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const revealItems = document.querySelectorAll(".reveal");

let currentY = window.scrollY;
let targetY = window.scrollY;
let smoothFrame = null;
let anchorFrame = null;

const easeInOutCubic = (value) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

function setPageHeight() {
  if (!content || reduceMotion.matches) return;
  document.body.style.height = `${content.getBoundingClientRect().height}px`;
}

function smoothStep() {
  targetY = window.scrollY;
  currentY += (targetY - currentY) * 0.075;

  if (Math.abs(targetY - currentY) < 0.1) {
    currentY = targetY;
  }

  content.style.transform = `translate3d(0, ${-currentY}px, 0)`;
  smoothFrame = requestAnimationFrame(smoothStep);
}

function targetPageY(target) {
  const header = document.querySelector(".header");
  const headerOffset = header ? header.offsetHeight : 0;
  const contentTop = content ? content.offsetTop : 0;
  return Math.max(0, target.offsetTop + contentTop - headerOffset - 18);
}

function animatePageScroll(to) {
  if (anchorFrame) {
    cancelAnimationFrame(anchorFrame);
    anchorFrame = null;
  }

  const from = window.scrollY;
  const distance = to - from;
  const duration = Math.min(1850, Math.max(1000, Math.abs(distance) * 0.75));
  let startTime = null;

  function frame(timestamp) {
    if (startTime === null) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const nextY = from + distance * easeInOutCubic(progress);

    window.scrollTo(0, nextY);

    if (progress < 1) {
      anchorFrame = requestAnimationFrame(frame);
    } else {
      anchorFrame = null;
      window.scrollTo(0, to);
    }
  }

  anchorFrame = requestAnimationFrame(frame);
}

if (content && !reduceMotion.matches) {
  document.documentElement.classList.add("smooth-enabled");
  setPageHeight();
  smoothFrame = requestAnimationFrame(smoothStep);

  window.addEventListener("load", setPageHeight);

  if (document.fonts?.ready) {
    document.fonts.ready.then(setPageHeight).catch(() => {});
  }

  document.querySelectorAll("img").forEach((image) => {
    if (image.complete) return;
    image.addEventListener("load", setPageHeight, { once: true });
  });

  window.addEventListener("resize", () => {
    setPageHeight();
    currentY = window.scrollY;
    targetY = window.scrollY;
    content.style.transform = `translate3d(0, ${-currentY}px, 0)`;
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    animatePageScroll(targetPageY(target));
  });
});

window.addEventListener("beforeunload", () => {
  if (smoothFrame) cancelAnimationFrame(smoothFrame);
  if (anchorFrame) cancelAnimationFrame(anchorFrame);
});
