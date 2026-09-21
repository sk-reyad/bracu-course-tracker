# Zero-scale Button Shutter Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the opacity-masked 2% resting shutter with the user-selected zero-scale shutter without changing any other interaction.

**Architecture:** Keep the existing shared pseudo-element and fine-pointer hover layer. Change only its resting transform and remove opacity-specific declarations and their reduced-motion delay override.

**Tech Stack:** HTML, CSS, Node.js built-in test runner.

## Global Constraints

- Duration remains exactly `260ms`.
- Origin remains `center`.
- All six button variants remain covered.
- Navbar, cards, Dot Grid, JavaScript behavior, colors, disabled gating, and reduced motion remain intact.

---

### Task 1: Zero-scale shutter contract and implementation

**Files:**
- Modify: `tests/interaction-layer.test.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: existing shared button `::before` selectors and fine-pointer hover layer.
- Produces: `scaleX(0) → scaleX(1)` transform-only shutter at 260ms.

- [ ] **Step 1: Write the failing contract**

Require the shared pseudo-layer to contain `transform: scaleX(0)`, retain `transition: transform 260ms var(--ease-out)`, and contain no `opacity` declaration or opacity transition. Remove expectations for hover opacity and shutter transition delays.

- [ ] **Step 2: Verify RED**

Run `node --test tests/interaction-layer.test.js`. Expect the shutter test to fail because the current source still uses `scaleX(0.02)` and opacity masking.

- [ ] **Step 3: Implement the minimal CSS change**

Change the resting transform to `scaleX(0)`, restore the single transform transition, remove hover opacity/delay declarations, and remove the shutter-specific reduced-motion delay block.

- [ ] **Step 4: Verify GREEN and regression safety**

Run `node --test tests/interaction-layer.test.js`, then the complete footer/motion/interaction suite and JavaScript syntax checks.

- [ ] **Step 5: Verify rendered behavior**

Inspect Light and Dark themes. Confirm the computed resting pseudo-layer transform is `matrix(0, 0, 0, 1, 0, 0)` and no idle center line is visible.
