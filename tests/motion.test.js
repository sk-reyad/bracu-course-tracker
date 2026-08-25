const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  DOT_GRID_CONFIG,
  buildDotGridPoints,
  calculateDotTarget,
  getSpotlightPosition,
  initDotGrid,
  initCardSpotlights,
  mountDotGridInModal,
  restoreDotGridHost
} = require("../js/motion.js");

function createDotGridHarness({ reducedMotion = false } = {}) {
  const windowListeners = new Map();
  const documentListeners = new Map();
  const frames = [];
  const arcs = [];
  let mutationCallback = null;
  const mediaListeners = new Map();
  const mediaQuery = {
    matches: reducedMotion,
    addEventListener(type, listener) { mediaListeners.set(type, listener); },
    removeEventListener(type) { mediaListeners.delete(type); }
  };
  const context = {
    clearRect() {},
    setTransform() {},
    beginPath() {},
    arc(x, y, radius) { arcs.push({ x, y, radius }); },
    fill() {},
    fillStyle: "",
    globalAlpha: 1
  };
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext() { return context; }
  };
  const windowObject = {
    innerWidth: 100,
    innerHeight: 60,
    devicePixelRatio: 2,
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type) { windowListeners.delete(type); },
    matchMedia() { return mediaQuery; },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    cancelAnimationFrame() {},
    MutationObserver: class {
      constructor(callback) { mutationCallback = callback; }
      observe() {}
      disconnect() {}
    },
    getComputedStyle() {
      return { getPropertyValue(name) { return name === "--dot-grid-active" ? "#0718a0" : "rgba(20, 87, 183, 0.2)"; } };
    }
  };
  const documentObject = {
    hidden: false,
    documentElement: {},
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    removeEventListener(type) { documentListeners.delete(type); }
  };

  return {
    canvas,
    arcs,
    frames,
    windowListeners,
    documentListeners,
    windowObject,
    documentObject,
    triggerThemeMutation() { mutationCallback?.(); },
    triggerReducedMotion(matches) {
      mediaQuery.matches = matches;
      mediaListeners.get("change")?.({ matches });
    }
  };
}

test("dot grid applies the approved 65 percent interaction intensity", () => {
  const target = calculateDotTarget(
    { ox: 50, oy: 50 },
    { x: 60, y: 50 },
    0,
    DOT_GRID_CONFIG
  );

  assert.equal(DOT_GRID_CONFIG.intensity, 0.65);
  assert.ok(target.x < 50, "a nearby dot should move away from the pointer");
  assert.equal(target.y, 50);
});

test("dot grid only builds points that fit inside the drawing area", () => {
  const points = buildDotGridPoints(50, 30, DOT_GRID_CONFIG);

  assert.deepEqual(points.map(point => [point.ox, point.oy]), [
    [11, 11],
    [33, 11]
  ]);
});

test("spotlight coordinates are local to the hovered card", () => {
  assert.deepEqual(
    getSpotlightPosition({ left: 40, top: 25 }, 75, 55),
    { x: 35, y: 30 }
  );
});

test("dot grid renderer caps pixel ratio and draws the viewport grid", () => {
  const harness = createDotGridHarness();
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  assert.equal(harness.canvas.width, 150);
  assert.equal(harness.canvas.height, 90);
  assert.equal(harness.canvas.style.width, "100px");
  assert.equal(harness.canvas.style.height, "60px");

  harness.frames.shift()(0);
  assert.equal(harness.arcs.length, 15);
  controller.destroy();
});

test("reduced motion keeps the grid static and skips pointer interaction", () => {
  const harness = createDotGridHarness({ reducedMotion: true });
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  assert.equal(harness.windowListeners.has("pointermove"), false);
  assert.equal(harness.windowListeners.has("pointerdown"), false);
  assert.equal(harness.frames.length, 1, "one static frame should be scheduled");
  harness.frames.shift()(0);
  assert.equal(harness.frames.length, 0, "static mode should not schedule another frame");
  controller.destroy();
});

test("reduced-motion grid redraws after resize and theme changes", () => {
  const harness = createDotGridHarness({ reducedMotion: true });
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  harness.frames.shift()(0);
  harness.windowObject.innerWidth = 120;
  harness.windowListeners.get("resize")();
  assert.equal(harness.frames.length, 1, "resize should schedule a fresh static frame");
  harness.frames.shift()(20);

  harness.triggerThemeMutation();
  assert.equal(harness.frames.length, 1, "theme change should schedule a fresh static frame");
  controller.destroy();
});

test("dot grid throttles frames that arrive too quickly", () => {
  const harness = createDotGridHarness();
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  harness.windowListeners.get("pointermove")({ clientX: 60, clientY: 30, timeStamp: 1 });
  harness.frames.shift()(0);
  const drawnArcs = harness.arcs.length;
  harness.frames.shift()(5);

  assert.equal(harness.arcs.length, drawnArcs);
  controller.destroy();
});

test("dot grid stops requesting frames after it settles idle", () => {
  const harness = createDotGridHarness();
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  harness.frames.shift()(0);
  assert.equal(harness.frames.length, 0);
  controller.destroy();
});

test("dot grid follows reduced-motion preference changes after load", () => {
  const harness = createDotGridHarness();
  const controller = initDotGrid(harness.canvas, {
    windowObject: harness.windowObject,
    documentObject: harness.documentObject
  });

  assert.equal(harness.windowListeners.has("pointermove"), true);
  harness.windowListeners.get("pointermove")({ clientX: 20, clientY: 11, timeStamp: 1 });
  harness.frames.shift()(0);
  assert.notEqual(harness.arcs.at(-15).x, 11, "interaction should displace the first dot");

  harness.triggerReducedMotion(true);
  assert.equal(harness.windowListeners.has("pointermove"), false);
  assert.equal(harness.windowListeners.has("pointerdown"), false);
  harness.frames.shift()(25);
  assert.equal(harness.arcs.at(-15).x, 11, "reduced motion should restore the first dot to its origin");
  assert.equal(harness.arcs.at(-15).y, 11, "reduced motion should restore the first dot to its origin");

  harness.triggerReducedMotion(false);
  assert.equal(harness.windowListeners.has("pointermove"), true);
  assert.equal(harness.windowListeners.has("pointerdown"), true);
  controller.destroy();
});

test("card spotlight tracks local pointer coordinates and resets on exit", () => {
  const listeners = new Map();
  const properties = new Map();
  const card = {
    style: { setProperty(name, value) { properties.set(name, value); } },
    getBoundingClientRect() { return { left: 40, top: 25 }; },
    contains(target) { return target === this; }
  };
  const target = { closest() { return card; } };
  const root = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    contains(element) { return element === card; }
  };
  const controller = initCardSpotlights(root, {
    windowObject: { matchMedia() { return { matches: false }; } }
  });

  listeners.get("pointermove")({ target, clientX: 75, clientY: 55 });
  assert.equal(properties.get("--spotlight-x"), "35px");
  assert.equal(properties.get("--spotlight-y"), "30px");

  listeners.get("pointerout")({ target, relatedTarget: null });
  assert.equal(properties.get("--spotlight-x"), "50%");
  assert.equal(properties.get("--spotlight-y"), "50%");
  controller.destroy();
});

test("reduced motion skips card pointer tracking", () => {
  const listeners = new Map();
  const root = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); }
  };

  const controller = initCardSpotlights(root, {
    windowObject: { matchMedia() { return { matches: true }; } }
  });

  assert.equal(listeners.size, 0);
  controller.destroy();
});

test("card spotlight follows reduced-motion preference changes after load", () => {
  const listeners = new Map();
  const properties = new Map();
  let changeListener = null;
  const mediaQuery = {
    matches: false,
    addEventListener(type, listener) { if (type === "change") changeListener = listener; },
    removeEventListener() { changeListener = null; }
  };
  const card = {
    style: { setProperty(name, value) { properties.set(name, value); } },
    getBoundingClientRect() { return { left: 40, top: 25 }; },
    contains() { return false; }
  };
  const target = { closest() { return card; } };
  const root = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    contains(element) { return element === card; },
    querySelectorAll() { return [card]; }
  };
  const controller = initCardSpotlights(root, {
    windowObject: { matchMedia() { return mediaQuery; } }
  });

  assert.equal(listeners.has("pointermove"), true);
  listeners.get("pointermove")({ target, clientX: 75, clientY: 55 });
  assert.equal(properties.get("--spotlight-x"), "35px");
  changeListener({ matches: true });
  assert.equal(listeners.has("pointermove"), false);
  assert.equal(properties.get("--spotlight-x"), "50%");
  assert.equal(properties.get("--spotlight-y"), "50%");
  changeListener({ matches: false });
  assert.equal(listeners.has("pointermove"), true);
  controller.destroy();
});

test("existing dot grid canvas mounts inside an opened modal", () => {
  const canvas = {};
  const modal = {
    prepend(node) { node.host = this; }
  };
  const documentObject = {
    getElementById(id) { return id === "dotGridBackground" ? canvas : null; }
  };

  assert.equal(mountDotGridInModal(modal, documentObject), true);
  assert.equal(canvas.host, modal);
});

test("dot grid restores to the last modal that remains open", () => {
  const canvas = {};
  const underlyingModal = {
    prepend(node) { node.host = this; }
  };
  const body = {
    prepend(node) { node.host = this; }
  };
  const documentObject = {
    body,
    getElementById(id) { return id === "dotGridBackground" ? canvas : null; },
    querySelectorAll() { return [underlyingModal]; }
  };

  assert.equal(restoreDotGridHost(documentObject), true);
  assert.equal(canvas.host, underlyingModal);
});

test("dot grid restores to body when every modal is closed", () => {
  const canvas = {};
  const body = {
    prepend(node) { node.host = this; }
  };
  const documentObject = {
    body,
    getElementById(id) { return id === "dotGridBackground" ? canvas : null; },
    querySelectorAll() { return []; }
  };

  assert.equal(restoreDotGridHost(documentObject), true);
  assert.equal(canvas.host, body);
});
