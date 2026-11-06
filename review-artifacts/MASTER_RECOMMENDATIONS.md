# Master recommendation register

TASK_001 · 2026-11-07 · Base 9d86db46b1134a3755a2e269252b1ee1234f2570

This is exhaustive for the **available source bundle**, not for missing historical/full individual reports. It is not a new skill audit or production approval. All framework sections in S01 were inspected; single-assistant framework corroboration is not independent voting. Capability inventory instructions are not user requests or executed findings. [Source inventory](TASK_001/evidence/SOURCE_INVENTORY.json), [complete source snapshots](TASK_001/evidence/sources), [machine-readable register](TASK_001/evidence/REGISTER.json), [line-by-line completeness mapping](TASK_001/evidence/SOURCE_COMPLETENESS.json).

## Counts and counting policy

```json
{
  "rawAtomicSourceOccurrences": 100,
  "exactDuplicateOccurrencesRemoved": 11,
  "retained": 89,
  "statuses": {
    "SELECTED": 23,
    "REJECTED": 9,
    "HOLD": 7,
    "UNREVIEWED": 50,
    "IN REVIEW": 0
  },
  "auditImplementationAndPrinciples": 53,
  "auditVerificationProcess": 16,
  "correctionRecords": 1,
  "historicalLeads": 10,
  "rejectedDemoTreatments": 9
}
```

Raw count means atomic actionable **source-clause occurrences**, not every observation or repeated finding ID. Each occurrence has an exact quotation and source line. A line may contain several different actions. D treatments are implementation-derived rejected records; historical leads are owner-attributed, not invented skill output. Verification/process proposals are labeled separately. Counts combine those disclosed categories; they are not a claim that the nine findings produced 89 independent audited defects.

## Sources and missing evidence

- **S01 AUDIT**: Consolidated audit, including all 19 individual framework sections; not independent assessors. [Snapshot](TASK_001/evidence/sources/S01_AUDIT.txt); 504 lines; 80 atomic occurrences; 69 primary retained records.
- **S02 DEMO_REVIEW**: Historical demonstration handoff; correction report supersedes copy-check visibility and stream semantics claims. [Snapshot](TASK_001/evidence/sources/S02_DEMO_REVIEW.txt); 172 lines; 0 atomic occurrences; 0 primary retained records.
- **S03 CORRECTION_REVIEW**: Latest isolated corrections; reported historical test evidence, not rerun in TASK_001. [Snapshot](TASK_001/evidence/sources/S03_CORRECTION_REVIEW.txt); 120 lines; 1 atomic occurrences; 1 primary retained records.
- **S04 OWNER_SEQUENTIAL**: Owner requirements and ten historical leads; not a skill audit. [Snapshot](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt); 384 lines; 10 atomic occurrences; 10 primary retained records.
- **S05 OWNER_STRICT**: Strict duplicate rule; illustrative examples are not findings. [Snapshot](TASK_001/evidence/sources/S05_OWNER_STRICT.txt); 161 lines; 0 atomic occurrences; 0 primary retained records.
- **S06 OWNER_REPORT**: Report/package requirements. [Snapshot](TASK_001/evidence/sources/S06_OWNER_REPORT.txt); 421 lines; 0 atomic occurrences; 0 primary retained records.
- **S07 OWNER_GITHUB**: Latest override authorizing review-only branch publication, then STOP. [Snapshot](TASK_001/evidence/sources/S07_OWNER_GITHUB.txt); 267 lines; 0 atomic occurrences; 0 primary retained records.
- **S08 CAPABILITY_INVENTORY**: Capability descriptions and example instructions, not executed audit output. [Snapshot](TASK_001/evidence/sources/S08_CAPABILITY_INVENTORY.txt); 410 lines; 0 atomic occurrences; 0 primary retained records.
- **S09 DEMO_D_CSS**: Exact rejected demonstration treatments, not newly invented recommendations. [Snapshot](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt); 23 lines; 9 atomic occurrences; 9 primary retained records.

The original historical Impeccable report and separate full raw outputs for each skill were not found in the supplied/available reports. S01 contains summarized individual audits, not preserved full skill transcripts. The historical 12/20 score remains unverifiable. Audits 08/09/18/19 were skipped; 17 was N/A; they contribute no invented findings. Original source report says 8 completed, 7 partial, 4 skipped, 1 N/A across 20 capability rows. Recommendations from missing sources cannot be certified exhaustive.

## Exact duplicate mapping

- **R-004**: O-004, O-005; remove 1 repeated occurrence(s). Same Dashboard, Settings, Course, Department modals; same atomic action: Set explicit initial focus when opening each tracker modal; same outcome: Orient keyboard users; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-005**: O-006, O-007; remove 1 repeated occurrence(s). Same Four tracker modals; same atomic action: Contain Tab and Shift+Tab within the active tracker modal; same outcome: Prevent focus escaping to hidden background; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-008**: O-010, O-011; remove 1 repeated occurrence(s). Same Four tracker modals; same atomic action: Restore focus to the opener on tracker-modal dismissal; same outcome: Preserve task orientation; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-021**: O-024, O-025; remove 1 repeated occurrence(s). Same Settings tab implementation; same atomic action: Reuse the existing Admin Catalog tab interaction pattern; same outcome: Avoid inconsistent keyboard models; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-025**: O-029, O-030; remove 1 repeated occurrence(s). Same Back to Top in js/app.js; same atomic action: Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-026**: O-031, O-032; remove 1 repeated occurrence(s). Same Stream See more in js/app.js; same atomic action: Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-027**: O-033, O-034; remove 1 repeated occurrence(s). Same Admin Catalog openEditor; same atomic action: Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-031**: O-038, O-039, O-040; remove 2 repeated occurrence(s). Same Faculty .faculty-email-copy-btn.copied button; same atomic action: Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation; same outcome: Honor reduced motion without losing success feedback; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-089**: O-098, O-099, O-100; remove 2 repeated occurrence(s). Same Faculty copied check icon; same atomic action: Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation; same outcome: Honor reduced motion without losing success feedback; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.

See REGISTER.json for every original occurrence, exact quotation and the four identity fields. No cross-target or materially different implementation was merged. Broad statements without a precise component are retained as principles/opportunities, pending scoping before any demo.

## Deliberately separate recommendations

Initial focus / trapping / inert background / Escape / restoration; custom overlays / native dialog; enlarged existing button / entire badge target / assessment of spacing exceptions; reduced-motion scrolling / keyboard-triggered instant scrolling; --shadow / --soft-shadow / a new semantic token; radius / elevation / spacing / containers / pills; every distinct D selector/property. Historical broad token consistency remains a lead apart from the available audit’s specific semantic proposals. Source examples about moving Degree Plan to navbar versus Dashboard are duplicate-rule examples only and were not fabricated as recommendations.

## Retained recommendations

### R-001 — Contain closed stream details so hidden panels cannot extend root layout width

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:browser-qa; ecc:accessibility. EXPLICIT; F-001. Attribution is as reported by S01; line-level primary source below.
- **Component:** Roadmap and Course List .stream-category-tooltip
- **Proposed change:** Contain closed stream details so hidden panels cannot extend root layout width
- **Category / priority:** Responsive / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Eliminate unintended page scrolling
- **Risk:** Medium: deliberate roadmap scrolling must remain
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L260](TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-002 — Position open stream details against viewport edges

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:browser-qa; ecc:accessibility. EXPLICIT; F-001. Attribution is as reported by S01; line-level primary source below.
- **Component:** Roadmap and Course List stream disclosure
- **Proposed change:** Position open stream details against viewport edges
- **Category / priority:** Responsive / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Keep open details reachable
- **Risk:** Medium: transformed ancestors and scroll dismissal
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L260](TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-003 — Wrap long open stream-detail content within viewport bounds

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:browser-qa; ecc:accessibility. EXPLICIT; F-001. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream disclosure text
- **Proposed change:** Wrap long open stream-detail content within viewport bounds
- **Category / priority:** Responsive / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent clipped long content
- **Risk:** Medium: panel height and internal scroll
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L260](TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-004 — Set explicit initial focus when opening each tracker modal

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y; ecc:browser-qa. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Dashboard, Settings, Course, Department modals
- **Proposed change:** Set explicit initial focus when opening each tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Orient keyboard users
- **Risk:** Medium: choose an appropriate first control
- **Already demonstrated:** Demo A
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-005 — Contain Tab and Shift+Tab within the active tracker modal

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y; ecc:browser-qa. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker modals
- **Proposed change:** Contain Tab and Shift+Tab within the active tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent focus escaping to hidden background
- **Risk:** Medium: native nested support dialog
- **Already demonstrated:** Demo A
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-006 — Make background content inert while a tracker modal is open

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker modals and background siblings
- **Proposed change:** Make background content inert while a tracker modal is open
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent interacting with obscured content
- **Risk:** Medium: restore previous inert states
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-007 — Support Escape dismissal for the active tracker modal

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker modals
- **Proposed change:** Support Escape dismissal for the active tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Provide predictable dismissal
- **Risk:** Medium: nested native dialog precedence
- **Already demonstrated:** Demo A; existing behavior preserved
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-008 — Restore focus to the opener on tracker-modal dismissal

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker modals
- **Proposed change:** Restore focus to the opener on tracker-modal dismissal
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Preserve task orientation
- **Risk:** Medium: disconnected openers
- **Already demonstrated:** Demo A
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-009 — Retain tracker overlays and reuse the admin drawer custom focus-management pattern

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker modal implementation
- **Proposed change:** Retain tracker overlays and reuse the admin drawer custom focus-management pattern
- **Category / priority:** Implementation alternative / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Reuse working local interaction model
- **Risk:** Medium: custom lifecycle ownership
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-010 — Use native dialog.showModal instead of custom tracker overlays

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-002. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker modal implementation
- **Proposed change:** Use native dialog.showModal instead of custom tracker overlays
- **Category / priority:** Implementation alternative / P1
- **Evidence:** Source-supported alternative; not demonstrated or selected. Conflicts with R-009 implementation.
- **Expected benefit:** Leverage native modality
- **Risk:** Medium/high: new top-layer and nested-dialog contract
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L278](TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-011 — Give each tracker close button a context-specific accessible name

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-003. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four [data-close-modal] header buttons
- **Proposed change:** Give each tracker close button a context-specific accessible name
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Identify close actions to assistive technology
- **Risk:** Low: preserve click wiring
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L296](TASK_001/evidence/sources/S01_AUDIT.txt#L296) — - **Recommended correction:** Add context-specific `aria-label` values and keep the icon decorative.

### R-012 — Keep close-button icons decorative alongside their accessible names

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-003. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker-modal close icons
- **Proposed change:** Keep close-button icons decorative alongside their accessible names
- **Category / priority:** Accessibility / P1
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Avoid duplicate icon announcements
- **Risk:** Low
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L296](TASK_001/evidence/sources/S01_AUDIT.txt#L296) — - **Recommended correction:** Add context-specific `aria-label` values and keep the icon decorative.

### R-013 — Expose role=tab on each Settings tab button

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings .tab-btn
- **Proposed change:** Expose role=tab on each Settings tab button
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Widget roles
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-014 — Expose role=tabpanel on each Settings panel

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings .tab-panel
- **Proposed change:** Expose role=tabpanel on each Settings panel
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Panel semantics
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-015 — Use roving tabindex so only the active Settings tab is in the Tab sequence

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tab buttons
- **Proposed change:** Use roving tabindex so only the active Settings tab is in the Tab sequence
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Tab sequence
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-016 — Synchronize aria-selected with active Settings tab

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tab buttons
- **Proposed change:** Synchronize aria-selected with active Settings tab
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Selection state
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-017 — Link each Settings tab to its panel using aria-controls

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tabs and panels
- **Proposed change:** Link each Settings tab to its panel using aria-controls
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Control relationship
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-018 — Name each Settings panel through its tab using aria-labelledby

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings panels
- **Proposed change:** Name each Settings panel through its tab using aria-labelledby
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Panel naming
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-019 — Implement Left/Right arrow navigation between Settings tabs

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tab keyboard handler
- **Proposed change:** Implement Left/Right arrow navigation between Settings tabs
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Directional navigation
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-020 — Implement Home/End navigation to the first/last Settings tab

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tab keyboard handler
- **Proposed change:** Implement Home/End navigation to the first/last Settings tab
- **Category / priority:** Accessibility / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Boundary navigation
- **Risk:** Medium: active panel and focus state must agree
- **Already demonstrated:** Demo A
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L309](TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-021 — Reuse the existing Admin Catalog tab interaction pattern

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:frontend-a11y. EXPLICIT; F-004. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tab implementation
- **Proposed change:** Reuse the existing Admin Catalog tab interaction pattern
- **Category / priority:** Implementation pattern / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Avoid inconsistent keyboard models
- **Risk:** Medium: do not alter Admin itself
- **Already demonstrated:** Demo A
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L314](TASK_001/evidence/sources/S01_AUDIT.txt#L314) — - **Recommended correction:** Match the already implemented Admin Catalog tab pattern rather than creating another interaction model.
- **Exact source:** [S01 L451](TASK_001/evidence/sources/S01_AUDIT.txt#L451) — 3. Complete Settings tabs by reusing the Admin Catalog keyboard pattern.

### R-022 — Increase the actual stream trigger box to at least 24 by 24 CSS pixels

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:browser-qa. EXPLICIT; F-005. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream .stream-category-trigger
- **Proposed change:** Increase the actual stream trigger box to at least 24 by 24 CSS pixels
- **Category / priority:** Target size / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Improve touch and motor access
- **Risk:** Low: preserve badge text style
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L327](TASK_001/evidence/sources/S01_AUDIT.txt#L327) — - **Expected behavior:** Target size is at least 24 × 24 CSS px or qualifies through sufficient target spacing; the containing badge may be made the target.

### R-023 — Make the containing stream badge the interactive target

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:accessibility; ecc:browser-qa. EXPLICIT; F-005. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream containing badge
- **Proposed change:** Make the containing stream badge the interactive target
- **Category / priority:** Target-size alternative / P2
- **Evidence:** Source alternative; current demo enlarges the existing button, not the containing badge.
- **Expected benefit:** Increase usable hit area
- **Risk:** Medium: markup and focus boundaries differ
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L327](TASK_001/evidence/sources/S01_AUDIT.txt#L327) — - **Expected behavior:** Target size is at least 24 × 24 CSS px or qualifies through sufficient target spacing; the containing badge may be made the target.

### R-024 — Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:accessibility. EXPLICIT; F-005. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream targets and adjacent controls
- **Proposed change:** Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance
- **Category / priority:** Verification / P2
- **Evidence:** 13px baseline verified; spacing exceptions not measured (S01 L331). This is an assessment, not a request to increase spacing.
- **Expected benefit:** Avoid unsupported WCAG claims
- **Risk:** Low; no automatic UI change
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L148](TASK_001/evidence/sources/S01_AUDIT.txt#L148) — - `F-005`: stream triggers are 13 px high; assess target spacing exceptions before calling this a definitive WCAG failure.

### R-025 — Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Back to Top in js/app.js
- **Proposed change:** Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Risk:** Low/medium: preserve navigation destinations
- **Already demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L346](TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-026 — Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream See more in js/app.js
- **Proposed change:** Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Risk:** Low/medium: preserve navigation destinations
- **Already demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L346](TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-027 — Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Admin Catalog openEditor
- **Proposed change:** Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Risk:** Low/medium: preserve navigation destinations
- **Already demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L346](TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-028 — Centralize one reduced-motion scroll helper and reuse it in all three scroll paths

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker and Admin Catalog scroll implementation
- **Proposed change:** Centralize one reduced-motion scroll helper and reuse it in all three scroll paths
- **Category / priority:** Implementation proposal / P2
- **Evidence:** Source proposal. Demo C shares a tracker helper but Admin uses its own preference branch; full cross-page centralization NOT demonstrated.
- **Expected benefit:** Avoid policy drift
- **Risk:** Medium: classic script dependency/order
- **Already demonstrated:** PARTIAL: tracker helper only
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L351](TASK_001/evidence/sources/S01_AUDIT.txt#L351) — - **Recommended correction:** Centralize a reduced-motion-aware scroll helper and reuse it in all three paths.

### R-029 — Use instant scrolling for keyboard Back to Top activation independently of motion preference

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** emil-design-eng. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Back to Top keyboard path
- **Proposed change:** Use instant scrolling for keyboard Back to Top activation independently of motion preference
- **Category / priority:** Interaction alternative / P2
- **Evidence:** Audit 10 explicitly includes keyboard paths. Existing Demo C only branches on motion preference.
- **Expected benefit:** Immediate repeated keyboard response
- **Risk:** Medium: distinguish keyboard from pointer activation
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L193](TASK_001/evidence/sources/S01_AUDIT.txt#L193) — | Unconditional smooth scroll at `js/app.js:1025` and `:1875` | Instant scrolling for reduced-motion/keyboard paths (F-006) | Repeated keyboard actions should respond immediately |

### R-030 — Use instant scrolling for keyboard stream See more activation independently of motion preference

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** emil-design-eng. EXPLICIT; F-006. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream See more keyboard path
- **Proposed change:** Use instant scrolling for keyboard stream See more activation independently of motion preference
- **Category / priority:** Interaction alternative / P2
- **Evidence:** Distinct from reduced-motion-only handling; not demonstrated.
- **Expected benefit:** Immediate keyboard response
- **Risk:** Medium: preserve filtering/focus
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L193](TASK_001/evidence/sources/S01_AUDIT.txt#L193) — | Unconditional smooth scroll at `js/app.js:1025` and `:1875` | Instant scrolling for reduced-motion/keyboard paths (F-006) | Repeated keyboard actions should respond immediately |

### R-031 — Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-007. Attribution is as reported by S01; line-level primary source below.
- **Component:** Faculty .faculty-email-copy-btn.copied button
- **Proposed change:** Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation
- **Category / priority:** Reduced motion / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor reduced motion without losing success feedback
- **Risk:** Low: success must remain visible and announced
- **Already demonstrated:** Demo C corrected
- **Duplicate relationship:** 3 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L369](TASK_001/evidence/sources/S01_AUDIT.txt#L369) — - **Recommended correction:** Disable the copy keyframes within the existing reduced-motion media query while retaining label/toast feedback.
- **Exact source:** [S01 L194](TASK_001/evidence/sources/S01_AUDIT.txt#L194) — | Copy pop keyframes at `css/style.css:3104` and `:3115` | Keep text/toast feedback; suppress movement under reduced motion (F-007) | Feedback should preserve user motion preferences |
- **Exact source:** [S01 L223](TASK_001/evidence/sources/S01_AUDIT.txt#L223) — | Copy scale/pop animations continue under reduced motion (`css/style.css:3104`, `:3115`) | Non-moving confirmation under reduce (F-007) | Preserve confirmation while removing movement |

### R-032 — Set copied-check opacity to 1 and transform to none under reduced motion

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** Owner correction; isolated correction verification. EXPLICIT; F-007. Attribution is as reported by S01; line-level primary source below.
- **Component:** Faculty copied check reduced-motion rule
- **Proposed change:** Set copied-check opacity to 1 and transform to none under reduced motion
- **Category / priority:** Regression correction / P2
- **Evidence:** Confirmed pre-correction opacity 0; S03 reports four corrected theme/motion cases.
- **Expected benefit:** Keep the actual green check visible when animation is disabled
- **Risk:** Low: scope to reduce and copied state
- **Already demonstrated:** Corrected Demo C
- **Duplicate relationship:** None merged
- **Exact source:** [S03 L25](TASK_001/evidence/sources/S03_CORRECTION_REVIEW.txt#L25) — The reduced-motion copied-check rule now explicitly sets opacity:1 and

### R-033 — Replace undefined tooltip --shadow-lg with existing --shadow

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:design-system. EXPLICIT; F-008. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream detail elevation
- **Proposed change:** Replace undefined tooltip --shadow-lg with existing --shadow
- **Category / priority:** Token alternative / P3
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Restore declared owning-page elevation
- **Risk:** Low: theme token resolves
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L387](TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-034 — Replace undefined tooltip --shadow-lg with existing --soft-shadow

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system. EXPLICIT; F-008. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream detail elevation
- **Proposed change:** Replace undefined tooltip --shadow-lg with existing --soft-shadow
- **Category / priority:** Token alternative / P3
- **Evidence:** Source alternative; not the demonstrated --shadow choice.
- **Expected benefit:** Use a softer existing elevation
- **Risk:** Low: visual comparison required
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L387](TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-035 — Deliberately add a documented tooltip-elevation token

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system. EXPLICIT; F-008. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker token definitions and stream tooltip
- **Proposed change:** Deliberately add a documented tooltip-elevation token
- **Category / priority:** Token alternative / P3
- **Evidence:** Source alternative; new token not demonstrated. Distinct documentation requirement from the both-theme definition proposal.
- **Expected benefit:** Give tooltip elevation explicit semantics
- **Risk:** Medium: documentation and consumers
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L387](TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-036 — Document a radius hierarchy rule for repeated tracker surfaces

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Roadmap, Settings, dashboards
- **Proposed change:** Document a radius hierarchy rule for repeated tracker surfaces
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L405](TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-037 — Document an elevation hierarchy rule for repeated tracker surfaces

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Roadmap, Settings, dashboards
- **Proposed change:** Document an elevation hierarchy rule for repeated tracker surfaces
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L405](TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-038 — Prototype removal of only redundant inner containers after a targeted comparison

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Roadmap, Settings, dashboards nested containers
- **Proposed change:** Prototype removal of only redundant inner containers after a targeted comparison
- **Category / priority:** Visual proposal / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L405](TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-039 — Prototype removing redundant inner pills after a targeted comparison

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Repeated roadmap/Settings/dashboard pills
- **Proposed change:** Prototype removing redundant inner pills after a targeted comparison
- **Category / priority:** Visual proposal / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L405](TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-040 — Rationalize spacing within existing tracker composition

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker spacing; specific component requires scoping
- **Proposed change:** Rationalize spacing within existing tracker composition
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L210](TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-041 — Reserve visual emphasis for the roadmap, academic statuses and course identity

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** frontend-design. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker composition and metadata emphasis
- **Proposed change:** Reserve visual emphasis for the roadmap, academic statuses and course identity
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L206](TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-042 — Establish shared semantic focus rules while retaining page-owned palettes

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; cross-audit synthesis. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker/Auth/Admin focus semantics
- **Proposed change:** Establish shared semantic focus rules while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L428](TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-043 — Establish shared semantic target-size rules while retaining page-owned palettes

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; cross-audit synthesis. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker/Auth/Admin target semantics
- **Proposed change:** Establish shared semantic target-size rules while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L428](TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-044 — Establish shared elevation names while retaining page-owned palettes

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; cross-audit synthesis. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker/Auth/Admin elevation semantics
- **Proposed change:** Establish shared elevation names while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L428](TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-045 — Consider a subtle non-moving save confirmation

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** improve-animations. EXPLICIT; None. Attribution is as reported by S01; line-level primary source below.
- **Component:** Save feedback; exact control not specified in source
- **Proposed change:** Consider a subtle non-moving save confirmation
- **Category / priority:** Speculative opportunity / P3
- **Evidence:** Audit 14 potential future opportunity, not a verified defect; scope must be defined first.
- **Expected benefit:** Clarify saved state
- **Risk:** Medium: preserve save/persistence lifecycle
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L214](TASK_001/evidence/sources/S01_AUDIT.txt#L214) — **Status: PARTIAL.** Read the recovered skill and `AUDIT.md`; applied its eight-category checklist to existing motion sources. Motion is plain CSS plus canvas/pointer enhancements, with page-specific easing and reduced-motion rules. Default hover/press paths are frequent; modal/support notices are occasional. F-006 (scroll preference gap) and F-007 (copy keyframes) are the actionable findings. Existing purposeful feedback and fine-pointer gates should be preserved. Separate animation plan files and the parallel category audit were not produced; the user permits only this report and requires sequential audits. Potential future additions are a subtle non-moving save confirmation and a short optional content-state crossfade, but neither is a verified defect or authorized implementation.

### R-046 — Consider a short optional content-state crossfade

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** improve-animations. EXPLICIT; None. Attribution is as reported by S01; line-level primary source below.
- **Component:** Content-state transition; exact component not specified
- **Proposed change:** Consider a short optional content-state crossfade
- **Category / priority:** Speculative opportunity / P3
- **Evidence:** Audit 14 potential future opportunity, not a verified defect; scope must be defined first.
- **Expected benefit:** Orient content changes
- **Risk:** Medium: reduced motion and interruption
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L214](TASK_001/evidence/sources/S01_AUDIT.txt#L214) — **Status: PARTIAL.** Read the recovered skill and `AUDIT.md`; applied its eight-category checklist to existing motion sources. Motion is plain CSS plus canvas/pointer enhancements, with page-specific easing and reduced-motion rules. Default hover/press paths are frequent; modal/support notices are occasional. F-006 (scroll preference gap) and F-007 (copy keyframes) are the actionable findings. Existing purposeful feedback and fine-pointer gates should be preserved. Separate animation plan files and the parallel category audit were not produced; the user permits only this report and requires sequential audits. Potential future additions are a subtle non-moving save confirmation and a short optional content-state crossfade, but neither is a verified defect or authorized implementation.

### R-047 — Remove CSE110 card shadow

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110
- **Proposed change:** Remove CSE110 card shadow
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L3](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L3) —   box-shadow: none;

### R-048 — Remove category badge background fill

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110 .card-meta-category .badge
- **Proposed change:** Remove category badge background fill
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L6](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L6) —   background: transparent;

### R-049 — Remove category badge border color

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110 .card-meta-category .badge
- **Proposed change:** Remove category badge border color
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L7](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L7) —   border-color: transparent;

### R-050 — Replace CSE110 status-strip elevation with a top divider

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110 .status-strip
- **Proposed change:** Replace CSE110 status-strip elevation with a top divider
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L10](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L10) —   box-shadow: 0 -1px 0 var(--border);

### R-051 — Make Grade/GP pill borders transparent

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110 .status-pill:not(.faculty-pill)
- **Proposed change:** Make Grade/GP pill borders transparent
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L13](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L13) —   border-color: transparent;

### R-052 — Make Grade/GP pill backgrounds transparent

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #card-CSE110 .status-pill:not(.faculty-pill)
- **Proposed change:** Make Grade/GP pill backgrounds transparent
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L14](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L14) —   background: transparent;

### R-053 — Remove Grade Scale table-wrap shadow

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #gradeEditor .grade-scale-table-wrap
- **Proposed change:** Remove Grade Scale table-wrap shadow
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L17](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L17) —   box-shadow: none;

### R-054 — Use medium radius on Grade Scale table wrap

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #gradeEditor .grade-scale-table-wrap
- **Proposed change:** Use medium radius on Grade Scale table wrap
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L18](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L18) —   border-radius: var(--radius-md);

### R-055 — Set Grade Scale heading bottom spacing to 16px

- **Status / owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Primary source / corroboration:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** #gradeEditor .grade-scale-heading
- **Proposed change:** Set Grade Scale heading bottom spacing to 16px
- **Category / priority:** Rejected visual experiment / P3
- **Evidence:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Already demonstrated:** Demo D
- **Duplicate relationship:** None merged
- **Exact source:** [S09 L21](TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L21) —   margin-bottom: 16px;

### R-056 — Review Degree Plan discoverability

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings Degree Plan entry
- **Proposed change:** Review Degree Plan discoverability
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Placement confirmed; usability impact subjective. No navbar/dashboard solution attributed. Reverify before proposing a demo.
- **Expected benefit:** Find degree requirements more easily
- **Risk:** Medium: navigation and duplicate entry points
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L90](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L90) — - Degree Plan discoverability

### R-057 — Review intermediate-width Admin table usability

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Admin account table
- **Proposed change:** Review intermediate-width Admin table usability
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** INCONCLUSIVE: intentional internal scroller; authenticated browser not exercised. Reverify before proposing a demo.
- **Expected benefit:** Keep account actions reachable
- **Risk:** Medium: authenticated read-only verification required
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L91](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L91) — - Intermediate-width Admin table usability

### R-058 — Review academic status label readability and contrast

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Completed-prerequisite chip and status labels
- **Proposed change:** Review academic status label readability and contrast
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Historical light sample 3.66:1 at 10.88px bold; dark 6.58:1. Broader status scope not verified. Reverify before proposing a demo.
- **Expected benefit:** Readable academic statuses
- **Risk:** Medium: preserve status meaning and both themes
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L92](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L92) — - Academic status label readability/contrast

### R-059 — Consider lazy loading the PDF engine

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** index.html PDF vendor script
- **Proposed change:** Consider lazy loading the PDF engine
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Historical baseline resource timeline confirms eager load; no change proposed until reverified. Reverify before proposing a demo.
- **Expected benefit:** Avoid loading PDF code before needed
- **Risk:** Medium/high: library readiness, errors, print invariants
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L93](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L93) — - Lazy loading of the PDF engine

### R-060 — Consider deferred or conditional decorative WebGL loading

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Auth Three.js/Vanta resources
- **Proposed change:** Consider deferred or conditional decorative WebGL loading
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Eager static scripts confirmed historically; reduced preference skips initialization, not transfer. Necessity subjective. Reverify before proposing a demo.
- **Expected benefit:** Avoid unused decorative resource transfer
- **Risk:** Medium/high: auth must remain usable without effects
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L94](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L94) — - Deferred or conditional decorative WebGL loading

### R-061 — Review resilience when external icons fail to load

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Lucide header icons
- **Proposed change:** Review resilience when external icons fail to load
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Historical block test: 4 placeholders, 0 header SVGs; accessible labels remained. Reverify before proposing a demo.
- **Expected benefit:** Keep actions visually identifiable during CDN failure
- **Risk:** Medium: approved icon family and naming
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L95](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L95) — - External icon fallback resilience

### R-062 — Review mobile navigation clarity

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker mobile navbar
- **Proposed change:** Review mobile navigation clarity
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Owner-supplied historical lead; original recommendation text and reproducible issue unavailable. Reverify before proposing a demo.
- **Expected benefit:** Improve mobile orientation if a real problem is verified
- **Risk:** Medium: no new navigation solution invented
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L96](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L96) — - Mobile navigation clarity

### R-063 — Review shared semantic design-token consistency

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Cross-page semantic tokens
- **Proposed change:** Review shared semantic design-token consistency
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Owner-supplied historical lead; separate from current report specific semantic focus/target/elevation proposals. Reverify before proposing a demo.
- **Expected benefit:** Consistent semantics without palette replacement
- **Risk:** Medium: broad source lacks exact implementation
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L97](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L97) — - Shared semantic design-token consistency

### R-064 — Review maintenance-page heading clarity

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Maintenance heading
- **Proposed change:** Review maintenance-page heading clarity
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Owner-supplied historical lead; exact original finding unavailable. Reverify before proposing a demo.
- **Expected benefit:** Clarify maintenance state if reproduced
- **Risk:** Low/medium: do not invent copy changes
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L98](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L98) — - Maintenance-page heading clarity

### R-065 — Review remaining Course List/report responsive behavior where independently reproducible

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** Owner-reported historical Impeccable; original report unavailable. HISTORICAL LEAD; HISTORICAL. Attribution is as reported by S01; line-level primary source below.
- **Component:** Course List and report layouts
- **Proposed change:** Review remaining Course List/report responsive behavior where independently reproducible
- **Category / priority:** Historical lead / UNRANKED
- **Evidence:** Owner-supplied broad lead; exact issue/width unavailable; no automatic defect claim. Reverify before proposing a demo.
- **Expected benefit:** Keep course and report information reachable
- **Risk:** Medium/high: report and PDF content invariants
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S04 L99](TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L99) — - Remaining course-list/report responsive behavior, where independently reproducible

### R-066 — Add rendered focus-entry regression coverage

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. ASSESSMENT-DERIVED TEST NEED; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker dialogs
- **Proposed change:** Add rendered focus-entry regression coverage
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch defects missed by source-contract tests
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L231](TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-067 — Add rendered focus-containment regression coverage

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker dialogs
- **Proposed change:** Add rendered focus-containment regression coverage
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch Tab escaping modal boundaries
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-068 — Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker stream disclosures
- **Proposed change:** Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch document-level overflow
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-069 — Assert actual stream-trigger target-box dimensions

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream triggers
- **Proposed change:** Assert actual stream-trigger target-box dimensions
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch undersized interaction geometry
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-070 — Exercise Settings tab arrow-key navigation in browser tests

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Settings tabs
- **Proposed change:** Exercise Settings tab arrow-key navigation in browser tests
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify the actual keyboard model
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-071 — Exercise reduced-motion behavior in regression checks

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Programmatic scrolling and faculty feedback
- **Proposed change:** Exercise reduced-motion behavior in regression checks
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify preference handling in the browser
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-072 — Retest PDF/print invariants when UI changes are proposed

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Report preview and PDF export
- **Proposed change:** Retest PDF/print invariants when UI changes are proposed
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve intentionally separate report output
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L474](TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-073 — Improve actual accessibility-tree verification coverage

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. ASSESSMENT-DERIVED TEST NEED; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Rendered interactive UI
- **Proposed change:** Improve actual accessibility-tree verification coverage
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Validate exposed roles/names rather than source-only markup
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L231](TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-074 — Improve rendered browser-positioning verification coverage

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. ASSESSMENT-DERIVED TEST NEED; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Disclosures and overlays
- **Proposed change:** Improve rendered browser-positioning verification coverage
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Validate computed placement
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L231](TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-075 — Improve authenticated end-to-end coverage using appropriate safe fixtures

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. ASSESSMENT-DERIVED TEST NEED; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Authenticated student/admin UI
- **Proposed change:** Improve authenticated end-to-end coverage using appropriate safe fixtures
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Check flows not covered by source contracts
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L231](TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-076 — Test long curriculum labels in the stream-disclosure demo

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream detail text
- **Proposed change:** Test long curriculum labels in the stream-disclosure demo
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify robust wrapping
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L470](TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-077 — Test long email content in the responsive demo

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Faculty email content
- **Proposed change:** Test long email content in the responsive demo
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify long unbroken text
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L470](TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-078 — Test actual 200–400 percent browser zoom

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker disclosure/reflow journeys
- **Proposed change:** Test actual 200–400 percent browser zoom
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify zoom beyond CSS-width equivalence
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L470](TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-079 — Test nested native support dialog interaction during modal changes

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker modal and support dialog
- **Proposed change:** Test nested native support dialog interaction during modal changes
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve topmost focus/Escape behavior
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L469](TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-080 — Test tracker-modal behavior at mobile widths

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:e2e-testing; cross-audit demo guidance. EXPLICIT TEST RECOMMENDATION; TEST-COVERAGE. Attribution is as reported by S01; line-level primary source below.
- **Component:** Four tracker modals
- **Proposed change:** Test tracker-modal behavior at mobile widths
- **Category / priority:** Verification/process / P2
- **Evidence:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve touch and constrained viewport usability
- **Risk:** Low/medium; browser/credential constraints must remain explicit
- **Already demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L469](TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-081 — Increase the actual stream interaction box without visually inflating every badge

- **Status / owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Primary source / corroboration:** ecc:accessibility; ecc:browser-qa. EXPLICIT; F-005. Attribution is as reported by S01; line-level primary source below.
- **Component:** Stream .stream-category-trigger
- **Proposed change:** Increase the actual stream interaction box without visually inflating every badge
- **Category / priority:** Target-size implementation constraint / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Improve hit area while preserving appearance
- **Risk:** Low: distinct from merely specifying a minimum dimension
- **Already demonstrated:** Demo B
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L333](TASK_001/evidence/sources/S01_AUDIT.txt#L333) — - **Recommended correction:** Increase the actual interactive box without visually inflating every badge; keep a visible focus indicator.

### R-082 — Define the missing semantic shadow token in both light and dark themes

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system. EXPLICIT; F-008. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker tooltip-elevation token
- **Proposed change:** Define the missing semantic shadow token in both light and dark themes
- **Category / priority:** Token alternative / P3
- **Evidence:** Source alternative, not demonstrated; the theme requirement is retained separately from deliberate documentation.
- **Expected benefit:** Ensure both themes resolve the declaration
- **Risk:** Medium: theme coverage
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L382](TASK_001/evidence/sources/S01_AUDIT.txt#L382) — - **Expected behavior:** Use a declared owning-page shadow token or define the missing semantic token in both themes.

### R-083 — Reduce nested-card repetition only where hierarchy does not require it

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker nested-card hierarchy
- **Proposed change:** Reduce nested-card repetition only where hierarchy does not require it
- **Category / priority:** Visual principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Improve scan hierarchy
- **Risk:** Medium: scope first; D cannot be repeated
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L210](TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-084 — Reduce pill repetition only where hierarchy does not require it

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker pill hierarchy
- **Proposed change:** Reduce pill repetition only where hierarchy does not require it
- **Category / priority:** Visual principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Improve scan hierarchy
- **Risk:** Medium: distinct from removing pills in a targeted prototype; no D repeat
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L210](TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-085 — Quiet redundant surface treatments while preserving emphasis on academic content

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** frontend-design. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker repeated surface treatments
- **Proposed change:** Quiet redundant surface treatments while preserving emphasis on academic content
- **Category / priority:** Visual principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce competing emphasis
- **Risk:** Medium: precise treatment undecided; rejected D prohibited
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L206](TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-086 — Quiet redundant badge treatments while preserving emphasis on academic content

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** frontend-design. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker repeated badge treatments
- **Proposed change:** Quiet redundant badge treatments while preserving emphasis on academic content
- **Category / priority:** Visual principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce competing emphasis
- **Risk:** Medium: do not use rejected D lighter fills/borders
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L206](TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-087 — Target simplification inside repeated metadata groups while preserving expressive identity

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** cross-audit synthesis. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker repeated metadata groups
- **Proposed change:** Target simplification inside repeated metadata groups while preserving expressive identity
- **Category / priority:** Visual principle / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce operational density
- **Risk:** Medium: broad principle, must scope before demo; no D repeat
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L426](TASK_001/evidence/sources/S01_AUDIT.txt#L426) — 1. **Expressive identity vs quiet operational density.** Design-direction guidance supports the distinctive roadmap, dot grid, status colors, and academic personality. Design-taste guidance warns against repeated cards/pills and decorative effects. The safer choice is targeted simplification inside repeated metadata groups, not removal of the roadmap or a generic SaaS redesign.

### R-088 — Use spacing or dividers for structural grouping where elevation is unnecessary

- **Status / owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Primary source / corroboration:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend. EXPLICIT; F-009. Attribution is as reported by S01; line-level primary source below.
- **Component:** Tracker structural surface grouping
- **Proposed change:** Use spacing or dividers for structural grouping where elevation is unnecessary
- **Category / priority:** Visual implementation proposal / P3
- **Evidence:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Communicate hierarchy through grouping
- **Risk:** Medium: distinct from removing containers; no D repeat
- **Already demonstrated:** NO
- **Duplicate relationship:** None merged
- **Exact source:** [S01 L400](TASK_001/evidence/sources/S01_AUDIT.txt#L400) — - **Expected behavior:** Elevation, border, radius, and pill usage communicate distinct hierarchy; structural grouping can use spacing/dividers where elevation is unnecessary.

### R-089 — Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation

- **Status / owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Primary source / corroboration:** emil-design-eng; improve-animations; review-animations. EXPLICIT; F-007. Attribution is as reported by S01; line-level primary source below.
- **Component:** Faculty copied check icon
- **Proposed change:** Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation
- **Category / priority:** Reduced motion / P2
- **Evidence:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor reduced motion without losing success feedback
- **Risk:** Low: retain the corrected opacity and transform
- **Already demonstrated:** Demo C corrected
- **Duplicate relationship:** 3 source occurrences retained under this exact atomic action; proof above
- **Exact source:** [S01 L369](TASK_001/evidence/sources/S01_AUDIT.txt#L369) — - **Recommended correction:** Disable the copy keyframes within the existing reduced-motion media query while retaining label/toast feedback.
- **Exact source:** [S01 L194](TASK_001/evidence/sources/S01_AUDIT.txt#L194) — | Copy pop keyframes at `css/style.css:3104` and `:3115` | Keep text/toast feedback; suppress movement under reduced motion (F-007) | Feedback should preserve user motion preferences |
- **Exact source:** [S01 L223](TASK_001/evidence/sources/S01_AUDIT.txt#L223) — | Copy scale/pop animations continue under reduced motion (`css/style.css:3104`, `:3115`) | Non-moving confirmation under reduce (F-007) | Preserve confirmation while removing movement |
