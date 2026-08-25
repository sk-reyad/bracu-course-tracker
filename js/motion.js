const DOT_GRID_CONFIG = Object.freeze({
  dotSize: 4,
  gap: 18,
  proximity: 170,
  shockRadius: 300,
  shockStrength: 6,
  intensity: 0.65,
});

const SPOTLIGHT_CARD_SELECTOR =
  ".course-card, .path-course-card, .list-course-card";

function buildDotGridPoints(width, height, config = DOT_GRID_CONFIG) {
  const points = [];
  const step = config.dotSize + config.gap;

  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      points.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
    }
  }

  return points;
}

function calculateDotTarget(
  point,
  pointer,
  speed = 0,
  config = DOT_GRID_CONFIG,
) {
  const dx = point.ox - pointer.x;
  const dy = point.oy - pointer.y;
  const distance = Math.hypot(dx, dy) || 1;
  const influence = Math.max(0, 1 - distance / config.proximity);
  const movement =
    influence * influence * (8 + Math.min(1, speed) * 12) * config.intensity;

  return {
    x: point.ox + (dx / distance) * movement,
    y: point.oy + (dy / distance) * movement,
    influence,
  };
}

function getSpotlightPosition(rect, clientX, clientY) {
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function initDotGrid(canvas, environment = {}) {
  if (!canvas?.getContext) return null;

  const windowObject = environment.windowObject || window;
  const documentObject = environment.documentObject || document;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const motionPreference = windowObject.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let reduceMotion = motionPreference.matches;
  const pointer = {
    x: -9999,
    y: -9999,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    speed: 0,
  };
  let points = [];
  let shock = null;
  let frameId = null;
  let lastDrawTime = -Infinity;
  let themeObserver = null;
  let destroyed = false;
  let pointerListenersBound = false;

  function resize() {
    const width = Math.max(1, windowObject.innerWidth);
    const height = Math.max(1, windowObject.innerHeight);
    const ratio = Math.min(windowObject.devicePixelRatio || 1, 1.5);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = buildDotGridPoints(width, height, DOT_GRID_CONFIG);
  }

  function updatePointer(event) {
    const now = event.timeStamp || Date.now();
    const elapsed = Math.max(16, now - pointer.lastTime);
    pointer.speed = Math.min(
      1,
      Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY) /
        elapsed /
        1.5,
    );
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastTime = now;
    scheduleDraw();
  }

  function scheduleDraw() {
    if (!destroyed && !documentObject.hidden && frameId === null) {
      frameId = windowObject.requestAnimationFrame(draw);
    }
  }

  function handleResize() {
    resize();
    scheduleDraw();
  }

  function clearPointer() {
    pointer.x = -9999;
    pointer.y = -9999;
    pointer.speed = 0;
    scheduleDraw();
  }

  function startShock(event) {
    shock = {
      x: event.clientX,
      y: event.clientY,
      started: event.timeStamp || Date.now(),
    };
    scheduleDraw();
  }

  function bindPointerListeners() {
    if (pointerListenersBound) return;
    windowObject.addEventListener("pointermove", updatePointer, {
      passive: true,
    });
    windowObject.addEventListener("pointerleave", clearPointer, {
      passive: true,
    });
    windowObject.addEventListener("pointerdown", startShock, { passive: true });
    pointerListenersBound = true;
  }

  function unbindPointerListeners() {
    if (!pointerListenersBound) return;
    windowObject.removeEventListener("pointermove", updatePointer);
    windowObject.removeEventListener("pointerleave", clearPointer);
    windowObject.removeEventListener("pointerdown", startShock);
    pointerListenersBound = false;
  }

  function handleMotionPreferenceChange(event) {
    reduceMotion = event.matches;
    shock = null;
    pointer.x = -9999;
    pointer.y = -9999;
    pointer.speed = 0;
    if (reduceMotion) {
      unbindPointerListeners();
      points.forEach((point) => {
        point.x = point.ox;
        point.y = point.oy;
        point.vx = 0;
        point.vy = 0;
      });
    } else {
      bindPointerListeners();
    }
    scheduleDraw();
  }

  function draw(now) {
    frameId = null;
    if (destroyed || documentObject.hidden) return;
    if (!reduceMotion && now - lastDrawTime < 1000 / 45) {
      frameId = windowObject.requestAnimationFrame(draw);
      return;
    }
    lastDrawTime = now;

    const width = Math.max(1, windowObject.innerWidth);
    const height = Math.max(1, windowObject.innerHeight);
    const styles = windowObject.getComputedStyle(
      documentObject.documentElement,
    );
    const baseColor =
      styles.getPropertyValue("--dot-grid-base").trim() ||
      "rgba(20, 87, 183, 0.20)";
    const activeColor =
      styles.getPropertyValue("--dot-grid-active").trim() || "#0718a0";
    let shockProgress = -1;
    let motionEnergy = 0;

    context.clearRect(0, 0, width, height);
    if (shock) {
      shockProgress = (now - shock.started) / 780;
      if (shockProgress > 1) shock = null;
    }

    points.forEach((point) => {
      const target = reduceMotion
        ? { x: point.ox, y: point.oy, influence: 0 }
        : calculateDotTarget(point, pointer, pointer.speed, DOT_GRID_CONFIG);

      if (!reduceMotion && shock && shockProgress >= 0 && shockProgress <= 1) {
        const dx = point.ox - shock.x;
        const dy = point.oy - shock.y;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = DOT_GRID_CONFIG.shockRadius * shockProgress;
        const band = Math.max(0, 1 - Math.abs(distance - radius) / 26);
        point.vx +=
          (dx / distance) *
          band *
          DOT_GRID_CONFIG.shockStrength *
          DOT_GRID_CONFIG.intensity;
        point.vy +=
          (dy / distance) *
          band *
          DOT_GRID_CONFIG.shockStrength *
          DOT_GRID_CONFIG.intensity;
      }

      point.vx += (target.x - point.x) * 0.075;
      point.vy += (target.y - point.y) * 0.075;
      point.vx *= 0.82;
      point.vy *= 0.82;
      point.x += point.vx;
      point.y += point.vy;
      motionEnergy = Math.max(
        motionEnergy,
        Math.abs(point.vx),
        Math.abs(point.vy),
        Math.abs(target.x - point.x),
        Math.abs(target.y - point.y),
      );

      context.beginPath();
      context.arc(
        point.x,
        point.y,
        Math.max(
          1.2,
          DOT_GRID_CONFIG.dotSize * 0.5 * DOT_GRID_CONFIG.intensity,
        ),
        0,
        Math.PI * 2,
      );
      context.fillStyle = target.influence > 0.04 ? activeColor : baseColor;
      context.globalAlpha =
        target.influence > 0.04 ? 0.35 + target.influence * 0.65 : 1;
      context.fill();
    });
    context.globalAlpha = 1;

    if (!reduceMotion && (shock || motionEnergy > 0.02)) scheduleDraw();
  }

  function handleVisibilityChange() {
    if (!documentObject.hidden) scheduleDraw();
  }

  resize();
  windowObject.addEventListener("resize", handleResize, { passive: true });
  documentObject.addEventListener("visibilitychange", handleVisibilityChange);
  if (!reduceMotion) bindPointerListeners();
  motionPreference.addEventListener?.("change", handleMotionPreferenceChange);
  frameId = windowObject.requestAnimationFrame(draw);
  if (windowObject.MutationObserver) {
    themeObserver = new windowObject.MutationObserver(scheduleDraw);
    themeObserver.observe(documentObject.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  return {
    destroy() {
      destroyed = true;
      if (frameId !== null) windowObject.cancelAnimationFrame(frameId);
      themeObserver?.disconnect();
      windowObject.removeEventListener("resize", handleResize);
      documentObject.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      unbindPointerListeners();
      motionPreference.removeEventListener?.(
        "change",
        handleMotionPreferenceChange,
      );
    },
  };
}

function initCardSpotlights(root = document, environment = {}) {
  const windowObject = environment.windowObject || window;
  const motionPreference = windowObject.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let listenersBound = false;

  function resetCard(card) {
    card.style.setProperty("--spotlight-x", "50%");
    card.style.setProperty("--spotlight-y", "50%");
  }

  function handlePointerMove(event) {
    const card = event.target.closest?.(SPOTLIGHT_CARD_SELECTOR);
    if (!card || !root.contains(card)) return;
    const position = getSpotlightPosition(
      card.getBoundingClientRect(),
      event.clientX,
      event.clientY,
    );
    card.style.setProperty("--spotlight-x", `${position.x}px`);
    card.style.setProperty("--spotlight-y", `${position.y}px`);
  }

  function handlePointerOut(event) {
    const card = event.target.closest?.(SPOTLIGHT_CARD_SELECTOR);
    if (!card || !root.contains(card) || card.contains(event.relatedTarget))
      return;
    resetCard(card);
  }

  function bindListeners() {
    if (listenersBound) return;
    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerout", handlePointerOut, { passive: true });
    listenersBound = true;
  }

  function unbindListeners() {
    if (!listenersBound) return;
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerout", handlePointerOut);
    listenersBound = false;
  }

  function handleMotionPreferenceChange(event) {
    if (event.matches) {
      unbindListeners();
      root.querySelectorAll?.(SPOTLIGHT_CARD_SELECTOR).forEach(resetCard);
    } else {
      bindListeners();
    }
  }

  if (!motionPreference.matches) bindListeners();
  motionPreference.addEventListener?.("change", handleMotionPreferenceChange);

  return {
    destroy() {
      unbindListeners();
      motionPreference.removeEventListener?.(
        "change",
        handleMotionPreferenceChange,
      );
    },
  };
}

function mountDotGridInModal(modal, documentObject = document) {
  const canvas = documentObject.getElementById("dotGridBackground");
  if (!modal || !canvas) return false;
  modal.prepend(canvas);
  return true;
}

function restoreDotGridHost(documentObject = document) {
  const canvas = documentObject.getElementById("dotGridBackground");
  if (!canvas) return false;

  const openModals = documentObject.querySelectorAll(
    ".modal-backdrop:not([hidden])",
  );
  const host = openModals[openModals.length - 1] || documentObject.body;
  host.prepend(canvas);
  return true;
}

function initMotion() {
  initDotGrid(document.getElementById("dotGridBackground"));
  initCardSpotlights(document);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initMotion);
  else initMotion();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DOT_GRID_CONFIG,
    buildDotGridPoints,
    calculateDotTarget,
    getSpotlightPosition,
    initDotGrid,
    initCardSpotlights,
    mountDotGridInModal,
    restoreDotGridHost,
  };
}
