# Master recommendation register

Current: TASK_001_CORRECTION_001 · 2026-11-06T21:34:58.100Z · base 9d86db46b1134a3755a2e269252b1ee1234f2570. [Correction report](TASK_001_CORRECTION_001/TASK_REVIEW_001_CORRECTION_001.md). [Previous immutable register](https://github.com/sk-reyad/bracu-course-tracker/blob/7f5cb29cf48e1aac417a4610399bf04f90e7f01b/review-artifacts/MASTER_RECOMMENDATIONS.md).

## Scope and recovered evidence

The original Impeccable report is now available as owner-delivered primary historical source S10. **12/20**, manual code/browser inspection; the detector could not start. This is a historical score, not current deployment certification. The full supplied original report has been reconciled; **separate full raw outputs** for other skill audits remain unavailable. S01 contains summarized framework sections from one assistant, not independent votes. Audits 08/09/18/19 were skipped; 17 was N/A; no findings invented for them.

[Current register/occurrences](TASK_001_CORRECTION_001/evidence/REGISTER.json), [exact reconciliation](TASK_001_CORRECTION_001/evidence/RECONCILIATION.json), [source inventory](TASK_001_CORRECTION_001/evidence/SOURCE_INVENTORY.json), [all-line coverage](TASK_001_CORRECTION_001/evidence/SOURCE_COMPLETENESS.json), [original report](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt). S01–S09 remain byte-identical in TASK_001; statements that S10 was missing are historical, superseded here. Source instructions and suggested skill command sequence are context, not authority to run a new audit or implement changes.

## Counts

```json
{
  "previousRaw": 100,
  "previousRetained": 89,
  "priorGenericLeadOccurrencesReclassifiedAsContext": 9,
  "originalRecoveredActionOccurrences": 28,
  "newRecoveredExactDuplicateOccurrences": 2,
  "newRecords": 17,
  "refinedRecords": 9,
  "rawAtomicSourceOccurrences": 119,
  "exactDuplicateOccurrencesRemoved": 13,
  "retained": 106,
  "statuses": {
    "SELECTED": 23,
    "REJECTED": 9,
    "HOLD": 7,
    "UNREVIEWED": 67,
    "IN REVIEW": 0
  },
  "statusChanges": 0
}
```

100 previous raw occurrences - 9 generic owner leads reclassified as historical context + 28 recovered actionable occurrences = 119 raw. Deduplication removes 13 exact repetitions (11 previous + 2 recovered), leaving 106 active records. Nine old IDs are source-grounded refinements; 17 new IDs are R-090–R-106. No old ID or owner lead is silently deleted. Counts cover proposals, test/process records, rejected demo treatments and one still-uncorroborated owner lead, not 106 confirmed bugs.

Per-source counts and exact clauses are in the source inventory/completeness/occurrence evidence; S10 has 28 actionable occurrences and 26 primary records. The duplicate S11 embedded copy is not a second audit.

## Owner decisions and verification status

23 SELECTED CANDIDATE records (A/B), 9 REJECTED D treatments, 7 HOLD records (C), 67 UNREVIEWED, 0 IN REVIEW. No status changed. Recovered proposals remain UNREVIEWED unless an exact action was already owner-selected (R-009/R-011); this preserves an old decision, not new approval. C retains the corrected visible success check. D may not be reintroduced under another name. No production authorization exists. Recovered findings require re-verification; no new browser or current-defect certification was performed.

## Exact duplicates

- **R-004**: O-004, O-005; 1 repeated occurrence(s) removed. Same Dashboard, Settings, Course, Department modals; same atomic action: Set explicit initial focus when opening each tracker modal; same outcome: Orient keyboard users; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-005**: O-006, O-007; 1 repeated occurrence(s) removed. Same Four tracker modals; same atomic action: Contain Tab and Shift+Tab within the active tracker modal; same outcome: Prevent focus escaping to hidden background; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-008**: O-010, O-011; 1 repeated occurrence(s) removed. Same Four tracker modals; same atomic action: Restore focus to the opener on tracker-modal dismissal; same outcome: Preserve task orientation; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-009**: O-012, O-013; 1 repeated occurrence(s) removed. The admin-drawer/custom-focus branch specifies the same student/tracker modal scope, admin-focus reuse action, predictable modal focus outcome and custom existing-overlay implementation as R-009. The OR native-support branch is separately retained as R-105. No A status expansion.
- **R-011**: O-015, O-016; 1 repeated occurrence(s) removed. Same student-dialog close controls, same action of supplying accessible names, same assistive-technology identification outcome and same markup-naming behavior as R-011. No different label wording or control scope is prescribed. Existing contextual labels remain; source recovery alone does not select anything new.
- **R-021**: O-026, O-027; 1 repeated occurrence(s) removed. Same Settings tab implementation; same atomic action: Reuse the existing Admin Catalog tab interaction pattern; same outcome: Avoid inconsistent keyboard models; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-025**: O-031, O-032; 1 repeated occurrence(s) removed. Same Back to Top in js/app.js; same atomic action: Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-026**: O-033, O-034; 1 repeated occurrence(s) removed. Same Stream See more in js/app.js; same atomic action: Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-027**: O-035, O-036; 1 repeated occurrence(s) removed. Same Admin Catalog openEditor; same atomic action: Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise; same outcome: Honor motion preference; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-031**: O-040, O-041, O-042; 2 repeated occurrence(s) removed. Same Faculty .faculty-email-copy-btn.copied button; same atomic action: Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation; same outcome: Honor reduced motion without losing success feedback; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.
- **R-089**: O-100, O-101, O-102; 2 repeated occurrence(s) removed. Same Faculty copied check icon; same atomic action: Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation; same outcome: Honor reduced motion without losing success feedback; no different material implementation specified by the repeated clause. Surrounding clauses are separately retained; source quotations remain available.

## Distinct alternatives and overlaps

Degree Plan navbar R-056 vs credit-progress link R-090; local SVG R-061 vs visible text R-097; custom focus reuse R-009 vs generic native showModal R-010 vs support native-pattern reuse R-105; text color R-058 vs metadata size R-095; essential Admin columns R-057/R-091–R-093 vs moving login metrics R-094; on-demand PDF R-059 vs preparation state R-102; static background R-096 vs conditional WebGL R-060; rendered focus-ring consistency R-098 vs semantic focus rules R-042; button-size consistency R-099 vs target rules R-043; generic root overflow R-104 vs cause-specific closed-tooltip containment R-001. R-106 is broader, unspecified Settings keyboard navigation, not a claim that S10 prescribed the specific keys in selected R-019/R-020. Partial overlap is not an exact merge. Constraints (green tint, roadmap, page families, illustration) stay attached to actions, not counted as standalone changes.

## Retained recommendations

### R-001

**Contain closed stream details so hidden panels cannot extend root layout width**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:browser-qa; ecc:accessibility; EXPLICIT; related finding: F-001.
- **Target:** Roadmap and Course List .stream-category-tooltip
- **Proposed change:** Contain closed stream details so hidden panels cannot extend root layout width
- **Category / priority:** Responsive / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Eliminate unintended page scrolling
- **Regression risk:** Medium: deliberate roadmap scrolling must remain
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L260](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-002

**Position open stream details against viewport edges**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:browser-qa; ecc:accessibility; EXPLICIT; related finding: F-001.
- **Target:** Roadmap and Course List stream disclosure
- **Proposed change:** Position open stream details against viewport edges
- **Category / priority:** Responsive / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Keep open details reachable
- **Regression risk:** Medium: transformed ancestors and scroll dismissal
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L260](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-003

**Wrap long open stream-detail content within viewport bounds**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:browser-qa; ecc:accessibility; EXPLICIT; related finding: F-001.
- **Target:** Stream disclosure text
- **Proposed change:** Wrap long open stream-detail content within viewport bounds
- **Category / priority:** Responsive / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent clipped long content
- **Regression risk:** Medium: panel height and internal scroll
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L260](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L260) — - **Recommended correction:** Contain non-open tooltips so they do not affect root overflow; add viewport-aware left/right positioning and wrapping for open tooltips. Preserve the roadmap's internal horizontal scroll.

### R-004

**Set explicit initial focus when opening each tracker modal**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; ecc:browser-qa; EXPLICIT; related finding: F-002.
- **Target:** Dashboard, Settings, Course, Department modals
- **Proposed change:** Set explicit initial focus when opening each tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Orient keyboard users
- **Regression risk:** Medium: choose an appropriate first control
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-005

**Contain Tab and Shift+Tab within the active tracker modal**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; ecc:browser-qa; EXPLICIT; related finding: F-002.
- **Target:** Four tracker modals
- **Proposed change:** Contain Tab and Shift+Tab within the active tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent focus escaping to hidden background
- **Regression risk:** Medium: native nested support dialog
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-006

**Make background content inert while a tracker modal is open**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-002.
- **Target:** Four tracker modals and background siblings
- **Proposed change:** Make background content inert while a tracker modal is open
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Prevent interacting with obscured content
- **Regression risk:** Medium: restore previous inert states
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-007

**Support Escape dismissal for the active tracker modal**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-002.
- **Target:** Four tracker modals
- **Proposed change:** Support Escape dismissal for the active tracker modal
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Provide predictable dismissal
- **Regression risk:** Medium: nested native dialog precedence
- **Demonstrated:** Demo A; existing behavior preserved
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-008

**Restore focus to the opener on tracker-modal dismissal**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-002.
- **Target:** Four tracker modals
- **Proposed change:** Restore focus to the opener on tracker-modal dismissal
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Preserve task orientation
- **Regression risk:** Medium: disconnected openers
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S01 L469](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-009

**Retain tracker overlays and reuse the admin drawer custom focus-management pattern**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S10: Original Impeccable primary historical audit (Exact duplicate corroboration without new owner approval)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; impeccable:impeccable — original manual audit; EXPLICIT; related finding: F-002.
- **Target:** Tracker modal implementation
- **Proposed change:** Retain tracker overlays and reuse the admin drawer custom focus-management pattern
- **Category / priority:** Implementation alternative / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Reuse working local interaction model
- **Regression risk:** Medium: custom lifecycle ownership
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.
- **Exact source:** [S10 L30](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L30) — - Reuse the admin drawer's focus-management approach OR the support form's native dialog pattern.

### R-010

**Use native dialog.showModal instead of custom tracker overlays**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-002.
- **Target:** Tracker modal implementation
- **Proposed change:** Use native dialog.showModal instead of custom tracker overlays
- **Category / priority:** Implementation alternative / P1
- **Evidence and confirmation:** Source-supported alternative; not demonstrated or selected. Conflicts with R-009 implementation.
- **Expected benefit:** Leverage native modality
- **Regression risk:** Medium/high: new top-layer and nested-dialog contract
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L278](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L278) — - **Recommended correction:** Reuse the admin drawer's focusable-control/trap pattern or native `<dialog>.showModal()` with explicit initial focus, inert background, Escape, and focus restoration.

### R-011

**Give each tracker close button a context-specific accessible name**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S10: Original Impeccable primary historical audit (Exact duplicate corroboration without new owner approval)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; impeccable:impeccable — original manual audit; EXPLICIT; related finding: F-003.
- **Target:** Four [data-close-modal] header buttons
- **Proposed change:** Give each tracker close button a context-specific accessible name
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Identify close actions to assistive technology
- **Regression risk:** Low: preserve click wiring
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L296](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L296) — - **Recommended correction:** Add context-specific `aria-label` values and keep the icon decorative.
- **Exact source:** [S10 L31](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L31) — - Give close buttons accessible names.

### R-012

**Keep close-button icons decorative alongside their accessible names**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-003.
- **Target:** Four tracker-modal close icons
- **Proposed change:** Keep close-button icons decorative alongside their accessible names
- **Category / priority:** Accessibility / P1
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Avoid duplicate icon announcements
- **Regression risk:** Low
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L296](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L296) — - **Recommended correction:** Add context-specific `aria-label` values and keep the icon decorative.

### R-013

**Expose role=tab on each Settings tab button**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings .tab-btn
- **Proposed change:** Expose role=tab on each Settings tab button
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Widget roles
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-014

**Expose role=tabpanel on each Settings panel**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings .tab-panel
- **Proposed change:** Expose role=tabpanel on each Settings panel
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Panel semantics
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-015

**Use roving tabindex so only the active Settings tab is in the Tab sequence**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tab buttons
- **Proposed change:** Use roving tabindex so only the active Settings tab is in the Tab sequence
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Tab sequence
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-016

**Synchronize aria-selected with active Settings tab**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tab buttons
- **Proposed change:** Synchronize aria-selected with active Settings tab
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Selection state
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-017

**Link each Settings tab to its panel using aria-controls**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tabs and panels
- **Proposed change:** Link each Settings tab to its panel using aria-controls
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Control relationship
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-018

**Name each Settings panel through its tab using aria-labelledby**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings panels
- **Proposed change:** Name each Settings panel through its tab using aria-labelledby
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Panel naming
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-019

**Implement Left/Right arrow navigation between Settings tabs**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tab keyboard handler
- **Proposed change:** Implement Left/Right arrow navigation between Settings tabs
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Directional navigation
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-020

**Implement Home/End navigation to the first/last Settings tab**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tab keyboard handler
- **Proposed change:** Implement Home/End navigation to the first/last Settings tab
- **Category / priority:** Accessibility / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Boundary navigation
- **Regression risk:** Medium: active panel and focus state must agree
- **Demonstrated:** Demo A
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L309](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L309) — - **Expected behavior:** Tabs expose `role=tab`, roving `tabindex`, `aria-selected`, and `aria-controls`; panels expose `role=tabpanel` and `aria-labelledby`; Left/Right/Home/End work consistently.

### R-021

**Reuse the existing Admin Catalog tab interaction pattern**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:frontend-a11y; EXPLICIT; related finding: F-004.
- **Target:** Settings tab implementation
- **Proposed change:** Reuse the existing Admin Catalog tab interaction pattern
- **Category / priority:** Implementation pattern / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Avoid inconsistent keyboard models
- **Regression risk:** Medium: do not alter Admin itself
- **Demonstrated:** Demo A
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L314](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L314) — - **Recommended correction:** Match the already implemented Admin Catalog tab pattern rather than creating another interaction model.
- **Exact source:** [S01 L451](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L451) — 3. Complete Settings tabs by reusing the Admin Catalog keyboard pattern.

### R-022

**Increase the actual stream trigger box to at least 24 by 24 CSS pixels**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:browser-qa; EXPLICIT; related finding: F-005.
- **Target:** Stream .stream-category-trigger
- **Proposed change:** Increase the actual stream trigger box to at least 24 by 24 CSS pixels
- **Category / priority:** Target size / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Improve touch and motor access
- **Regression risk:** Low: preserve badge text style
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L327](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L327) — - **Expected behavior:** Target size is at least 24 × 24 CSS px or qualifies through sufficient target spacing; the containing badge may be made the target.

### R-023

**Make the containing stream badge the interactive target**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:browser-qa; EXPLICIT; related finding: F-005.
- **Target:** Stream containing badge
- **Proposed change:** Make the containing stream badge the interactive target
- **Category / priority:** Target-size alternative / P2
- **Evidence and confirmation:** Source alternative; current demo enlarges the existing button, not the containing badge.
- **Expected benefit:** Increase usable hit area
- **Regression risk:** Medium: markup and focus boundaries differ
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L327](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L327) — - **Expected behavior:** Target size is at least 24 × 24 CSS px or qualifies through sufficient target spacing; the containing badge may be made the target.

### R-024

**Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; EXPLICIT; related finding: F-005.
- **Target:** Stream targets and adjacent controls
- **Proposed change:** Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance
- **Category / priority:** Verification / P2
- **Evidence and confirmation:** 13px baseline verified; spacing exceptions not measured (S01 L331). This is an assessment, not a request to increase spacing.
- **Expected benefit:** Avoid unsupported WCAG claims
- **Regression risk:** Low; no automatic UI change
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L148](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L148) — - `F-005`: stream triggers are 13 px high; assess target spacing exceptions before calling this a definitive WCAG failure.

### R-025

**Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-006.
- **Target:** Back to Top in js/app.js
- **Proposed change:** Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Regression risk:** Low/medium: preserve navigation destinations
- **Demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L346](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-026

**Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-006.
- **Target:** Stream See more in js/app.js
- **Proposed change:** Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Regression risk:** Low/medium: preserve navigation destinations
- **Demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L346](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-027

**Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-006.
- **Target:** Admin Catalog openEditor
- **Proposed change:** Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise
- **Category / priority:** Reduced motion / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor motion preference
- **Regression risk:** Low/medium: preserve navigation destinations
- **Demonstrated:** Demo C (Admin via synthetic DOM harness)
- **Duplicate relationship:** 2 exact atomic source occurrences; proof above
- **Exact source:** [S01 L346](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L346) — - **Expected behavior:** Under `prefers-reduced-motion: reduce`, use `instant`/`auto`; otherwise use smooth.
- **Exact source:** [S01 L222](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L222) — | Smooth scrolling requested regardless of preference (`js/app.js:1025`, `:1875`; `js/admin-catalog.js:161`) | Preference-aware instant/auto path (F-006) | Avoid forced movement for reduced-motion users |

### R-028

**Centralize one reduced-motion scroll helper and reuse it in all three scroll paths**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-006.
- **Target:** Tracker and Admin Catalog scroll implementation
- **Proposed change:** Centralize one reduced-motion scroll helper and reuse it in all three scroll paths
- **Category / priority:** Implementation proposal / P2
- **Evidence and confirmation:** Source proposal. Demo C shares a tracker helper but Admin uses its own preference branch; full cross-page centralization NOT demonstrated.
- **Expected benefit:** Avoid policy drift
- **Regression risk:** Medium: classic script dependency/order
- **Demonstrated:** PARTIAL: tracker helper only
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L351](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L351) — - **Recommended correction:** Centralize a reduced-motion-aware scroll helper and reuse it in all three paths.

### R-029

**Use instant scrolling for keyboard Back to Top activation independently of motion preference**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; EXPLICIT; related finding: F-006.
- **Target:** Back to Top keyboard path
- **Proposed change:** Use instant scrolling for keyboard Back to Top activation independently of motion preference
- **Category / priority:** Interaction alternative / P2
- **Evidence and confirmation:** Audit 10 explicitly includes keyboard paths. Existing Demo C only branches on motion preference.
- **Expected benefit:** Immediate repeated keyboard response
- **Regression risk:** Medium: distinguish keyboard from pointer activation
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L193](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L193) — | Unconditional smooth scroll at `js/app.js:1025` and `:1875` | Instant scrolling for reduced-motion/keyboard paths (F-006) | Repeated keyboard actions should respond immediately |

### R-030

**Use instant scrolling for keyboard stream See more activation independently of motion preference**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; EXPLICIT; related finding: F-006.
- **Target:** Stream See more keyboard path
- **Proposed change:** Use instant scrolling for keyboard stream See more activation independently of motion preference
- **Category / priority:** Interaction alternative / P2
- **Evidence and confirmation:** Distinct from reduced-motion-only handling; not demonstrated.
- **Expected benefit:** Immediate keyboard response
- **Regression risk:** Medium: preserve filtering/focus
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L193](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L193) — | Unconditional smooth scroll at `js/app.js:1025` and `:1875` | Instant scrolling for reduced-motion/keyboard paths (F-006) | Repeated keyboard actions should respond immediately |

### R-031

**Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-007.
- **Target:** Faculty .faculty-email-copy-btn.copied button
- **Proposed change:** Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation
- **Category / priority:** Reduced motion / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor reduced motion without losing success feedback
- **Regression risk:** Low: success must remain visible and announced
- **Demonstrated:** Demo C corrected
- **Duplicate relationship:** 3 exact atomic source occurrences; proof above
- **Exact source:** [S01 L369](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L369) — - **Recommended correction:** Disable the copy keyframes within the existing reduced-motion media query while retaining label/toast feedback.
- **Exact source:** [S01 L194](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L194) — | Copy pop keyframes at `css/style.css:3104` and `:3115` | Keep text/toast feedback; suppress movement under reduced motion (F-007) | Feedback should preserve user motion preferences |
- **Exact source:** [S01 L223](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L223) — | Copy scale/pop animations continue under reduced motion (`css/style.css:3104`, `:3115`) | Non-moving confirmation under reduce (F-007) | Preserve confirmation while removing movement |

### R-032

**Set copied-check opacity to 1 and transform to none under reduced motion**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S03: Later owner instruction/correction evidence (Action source)
- **Skill/source attribution:** Owner correction; isolated correction verification; EXPLICIT; related finding: F-007.
- **Target:** Faculty copied check reduced-motion rule
- **Proposed change:** Set copied-check opacity to 1 and transform to none under reduced motion
- **Category / priority:** Regression correction / P2
- **Evidence and confirmation:** Confirmed pre-correction opacity 0; S03 reports four corrected theme/motion cases.
- **Expected benefit:** Keep the actual green check visible when animation is disabled
- **Regression risk:** Low: scope to reduce and copied state
- **Demonstrated:** Corrected Demo C
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S03 L25](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S03_CORRECTION_REVIEW.txt#L25) — The reduced-motion copied-check rule now explicitly sets opacity:1 and

### R-033

**Replace undefined tooltip --shadow-lg with existing --shadow**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; EXPLICIT; related finding: F-008.
- **Target:** Stream detail elevation
- **Proposed change:** Replace undefined tooltip --shadow-lg with existing --shadow
- **Category / priority:** Token alternative / P3
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Restore declared owning-page elevation
- **Regression risk:** Low: theme token resolves
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L387](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-034

**Replace undefined tooltip --shadow-lg with existing --soft-shadow**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; EXPLICIT; related finding: F-008.
- **Target:** Stream detail elevation
- **Proposed change:** Replace undefined tooltip --shadow-lg with existing --soft-shadow
- **Category / priority:** Token alternative / P3
- **Evidence and confirmation:** Source alternative; not the demonstrated --shadow choice.
- **Expected benefit:** Use a softer existing elevation
- **Regression risk:** Low: visual comparison required
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L387](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-035

**Deliberately add a documented tooltip-elevation token**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; EXPLICIT; related finding: F-008.
- **Target:** Tracker token definitions and stream tooltip
- **Proposed change:** Deliberately add a documented tooltip-elevation token
- **Category / priority:** Token alternative / P3
- **Evidence and confirmation:** Source alternative; new token not demonstrated. Distinct documentation requirement from the both-theme definition proposal.
- **Expected benefit:** Give tooltip elevation explicit semantics
- **Regression risk:** Medium: documentation and consumers
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L387](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L387) — - **Recommended correction:** Map to the existing `--shadow`/`--soft-shadow` rule or deliberately add a documented tooltip-elevation token.

### R-036

**Document a radius hierarchy rule for repeated tracker surfaces**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Roadmap, Settings, dashboards
- **Proposed change:** Document a radius hierarchy rule for repeated tracker surfaces
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L405](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-037

**Document an elevation hierarchy rule for repeated tracker surfaces**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Roadmap, Settings, dashboards
- **Proposed change:** Document an elevation hierarchy rule for repeated tracker surfaces
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L405](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-038

**Prototype removal of only redundant inner containers after a targeted comparison**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Roadmap, Settings, dashboards nested containers
- **Proposed change:** Prototype removal of only redundant inner containers after a targeted comparison
- **Category / priority:** Visual proposal / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L405](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-039

**Prototype removing redundant inner pills after a targeted comparison**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Repeated roadmap/Settings/dashboard pills
- **Proposed change:** Prototype removing redundant inner pills after a targeted comparison
- **Category / priority:** Visual proposal / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L405](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L405) — - **Recommended correction:** Preserve the roadmap and blue identity; establish a documented radius/elevation rule and remove only redundant inner containers/pills after targeted prototypes.

### R-040

**Rationalize spacing within existing tracker composition**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Tracker spacing; specific component requires scoping
- **Proposed change:** Rationalize spacing within existing tracker composition
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L210](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-041

**Reserve visual emphasis for the roadmap, academic statuses and course identity**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** frontend-design; EXPLICIT; related finding: F-009.
- **Target:** Tracker composition and metadata emphasis
- **Proposed change:** Reserve visual emphasis for the roadmap, academic statuses and course identity
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L206](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-042

**Establish shared semantic focus rules while retaining page-owned palettes**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; cross-audit synthesis; EXPLICIT; related finding: F-009.
- **Target:** Tracker/Auth/Admin focus semantics
- **Proposed change:** Establish shared semantic focus rules while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L428](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-043

**Establish shared semantic target-size rules while retaining page-owned palettes**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; cross-audit synthesis; EXPLICIT; related finding: F-009.
- **Target:** Tracker/Auth/Admin target semantics
- **Proposed change:** Establish shared semantic target-size rules while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L428](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-044

**Establish shared elevation names while retaining page-owned palettes**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; cross-audit synthesis; EXPLICIT; related finding: F-009.
- **Target:** Tracker/Auth/Admin elevation semantics
- **Proposed change:** Establish shared elevation names while retaining page-owned palettes
- **Category / priority:** Design principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** More consistent visual hierarchy
- **Regression risk:** Medium: must scope a distinct prototype; rejected D treatments remain prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L428](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L428) — 3. **Page-owned tokens vs one universal system.** Current documentation intentionally allows separate Auth/Admin/Tracker families. Design-system guidance favors consolidation. The safer choice is shared semantic rules (focus, target size, elevation names) while retaining page-family palettes.

### R-045

**Consider a subtle non-moving save confirmation**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** improve-animations; EXPLICIT; related finding: None.
- **Target:** Save feedback; exact control not specified in source
- **Proposed change:** Consider a subtle non-moving save confirmation
- **Category / priority:** Speculative opportunity / P3
- **Evidence and confirmation:** Audit 14 potential future opportunity, not a verified defect; scope must be defined first.
- **Expected benefit:** Clarify saved state
- **Regression risk:** Medium: preserve save/persistence lifecycle
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L214](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L214) — **Status: PARTIAL.** Read the recovered skill and `AUDIT.md`; applied its eight-category checklist to existing motion sources. Motion is plain CSS plus canvas/pointer enhancements, with page-specific easing and reduced-motion rules. Default hover/press paths are frequent; modal/support notices are occasional. F-006 (scroll preference gap) and F-007 (copy keyframes) are the actionable findings. Existing purposeful feedback and fine-pointer gates should be preserved. Separate animation plan files and the parallel category audit were not produced; the user permits only this report and requires sequential audits. Potential future additions are a subtle non-moving save confirmation and a short optional content-state crossfade, but neither is a verified defect or authorized implementation.

### R-046

**Consider a short optional content-state crossfade**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** improve-animations; EXPLICIT; related finding: None.
- **Target:** Content-state transition; exact component not specified
- **Proposed change:** Consider a short optional content-state crossfade
- **Category / priority:** Speculative opportunity / P3
- **Evidence and confirmation:** Audit 14 potential future opportunity, not a verified defect; scope must be defined first.
- **Expected benefit:** Orient content changes
- **Regression risk:** Medium: reduced motion and interruption
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L214](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L214) — **Status: PARTIAL.** Read the recovered skill and `AUDIT.md`; applied its eight-category checklist to existing motion sources. Motion is plain CSS plus canvas/pointer enhancements, with page-specific easing and reduced-motion rules. Default hover/press paths are frequent; modal/support notices are occasional. F-006 (scroll preference gap) and F-007 (copy keyframes) are the actionable findings. Existing purposeful feedback and fine-pointer gates should be preserved. Separate animation plan files and the parallel category audit were not produced; the user permits only this report and requires sequential audits. Potential future additions are a subtle non-moving save confirmation and a short optional content-state crossfade, but neither is a verified defect or authorized implementation.

### R-047

**Remove CSE110 card shadow**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110
- **Proposed change:** Remove CSE110 card shadow
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L3](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L3) —   box-shadow: none;

### R-048

**Remove category badge background fill**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110 .card-meta-category .badge
- **Proposed change:** Remove category badge background fill
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L6](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L6) —   background: transparent;

### R-049

**Remove category badge border color**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110 .card-meta-category .badge
- **Proposed change:** Remove category badge border color
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L7](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L7) —   border-color: transparent;

### R-050

**Replace CSE110 status-strip elevation with a top divider**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110 .status-strip
- **Proposed change:** Replace CSE110 status-strip elevation with a top divider
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L10](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L10) —   box-shadow: 0 -1px 0 var(--border);

### R-051

**Make Grade/GP pill borders transparent**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110 .status-pill:not(.faculty-pill)
- **Proposed change:** Make Grade/GP pill borders transparent
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L13](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L13) —   border-color: transparent;

### R-052

**Make Grade/GP pill backgrounds transparent**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #card-CSE110 .status-pill:not(.faculty-pill)
- **Proposed change:** Make Grade/GP pill backgrounds transparent
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L14](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L14) —   background: transparent;

### R-053

**Remove Grade Scale table-wrap shadow**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #gradeEditor .grade-scale-table-wrap
- **Proposed change:** Remove Grade Scale table-wrap shadow
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L17](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L17) —   box-shadow: none;

### R-054

**Use medium radius on Grade Scale table wrap**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #gradeEditor .grade-scale-table-wrap
- **Proposed change:** Use medium radius on Grade Scale table wrap
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L18](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L18) —   border-radius: var(--radius-md);

### R-055

**Set Grade Scale heading bottom spacing to 16px**

- **Status/owner:** REJECTED — Demo D styling REJECTED; never reintroduce under a new ID
- **Provenance:** S09: Later demonstration implementation (Action source)
- **Skill/source attribution:** Demo D implementation; ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** #gradeEditor .grade-scale-heading
- **Proposed change:** Set Grade Scale heading bottom spacing to 16px
- **Category / priority:** Rejected visual experiment / P3
- **Evidence and confirmation:** Actual opt-in D treatment; owner rejected the previous demonstration as a whole.
- **Expected benefit:** Original intended benefit: quieter hierarchy; owner disliked result
- **Regression risk:** Do not reintroduce; same-component different proposals remain separately reviewable
- **Demonstrated:** Demo D
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S09 L21](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S09_DEMO_D_CSS.txt#L21) —   margin-bottom: 16px;

### R-056

**Add a visible Degree Plan navigation link beside Roadmap and My Path**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Tracker main navigation
- **Proposed change:** Add a visible Degree Plan navigation link beside Roadmap and My Path
- **Category / priority:** Discoverability alternative / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Degree Plan was inside Settings; usability benefit remains a proposal. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make Degree Plan directly discoverable
- **Regression risk:** Medium: navigation/focus must preserve existing destinations
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L67](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L67) — - Add a visible Degree Plan navigation link beside Roadmap and My Path.
- **Earlier owner-lead context:** - Degree Plan discoverability (provenance bridge, not an exact duplicate).

### R-057

**Keep Account visible at intermediate Admin table widths**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Admin account-table Account column
- **Proposed change:** Keep Account visible at intermediate Admin table widths
- **Category / priority:** Responsive Admin hierarchy / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Report measured 1400px table inside 990px container at 1024px; intentional scroller is not proof of root overflow. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep account identity reachable
- **Regression risk:** Medium: safe synthetic/authenticated read-only verification needed
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L81](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L81) — - Keep Account visible.
- **Earlier owner-lead context:** - Intermediate-width Admin table usability (provenance bridge, not an exact duplicate).

### R-058

**Use darker text on the light completed-prerequisite chip while preserving its green tint**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Light completed-prerequisite status chip
- **Proposed change:** Use darker text on the light completed-prerequisite chip while preserving its green tint
- **Category / priority:** Contrast / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Approximately 11px text at 3.66:1 reported historically; no new measurement. Dark mode not declared defective. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Improve status readability while keeping semantic color
- **Regression risk:** Low/medium: verify rendered light/dark contrast and status identity
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L55](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L55) — - Use darker text.
- **Earlier owner-lead context:** - Academic status label readability/contrast (provenance bridge, not an exact duplicate).

### R-059

**Load the PDF engine when export is requested**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Tracker PDF vendor loading
- **Proposed change:** Load the PDF engine when export is requested
- **Category / priority:** On-demand loading / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — About 885 KiB uncompressed eagerly loaded; production timing and real export not measured. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Avoid startup loading for unused export
- **Regression risk:** Medium/high: export readiness/error paths/PDF output must remain
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L106](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L106) — - Load the PDF engine when export is requested.
- **Earlier owner-lead context:** - Lazy loading of the PDF engine (provenance bridge, not an exact duplicate).

### R-060

**Load decorative WebGL only when appropriate**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Sign-in decorative WebGL resources
- **Proposed change:** Load decorative WebGL only when appropriate
- **Category / priority:** Conditional loading / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Upfront transfer reported; exact appropriateness policy is unspecified. Do not invent idle/viewport/device thresholds. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Avoid unnecessary decorative transfer
- **Regression risk:** Medium/high: authentication must not depend on decoration
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L109](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L109) — - Load decorative WebGL only when appropriate.
- **Earlier owner-lead context:** - Deferred or conditional decorative WebGL loading (provenance bridge, not an exact duplicate).

### R-061

**Use local SVG icons for essential actions**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Essential action icons across surfaces
- **Proposed change:** Use local SVG icons for essential actions
- **Category / priority:** Asset-fallback alternative / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Some icon-only buttons appeared blank when external requests were blocked; no new blocking test. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Preserve visible action identification when CDN icons fail
- **Regression risk:** Medium: icon identity/accessibility/asset delivery
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L120](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L120) — - Use local SVG icons for essential actions.
- **Earlier owner-lead context:** - External icon fallback resilience (provenance bridge, not an exact duplicate).

### R-062

**Make mobile navigation clearly reveal that additional destinations exist**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Tracker mobile navigation
- **Proposed change:** Make mobile navigation clearly reveal that additional destinations exist
- **Category / priority:** Navigation clarity / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Original audit gives the intended outcome but does not prescribe arrows, overflow menus or a specific control. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Expose additional destinations
- **Regression risk:** Medium: scope a faithful prototype only after re-verification
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L45](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L45) — - Make mobile navigation clearly reveal that additional destinations exist.
- **Earlier owner-lead context:** - Mobile navigation clarity (provenance bridge, not an exact duplicate).

### R-063

**Improve consistency of cross-page semantic colors while retaining page-family differences**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Cross-page semantic colors
- **Proposed change:** Improve consistency of cross-page semantic colors while retaining page-family differences
- **Category / priority:** Design consistency / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Manual historical assessment; page-family differences must remain. No layout/token migration specified. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make equivalent meanings visually consistent
- **Regression risk:** Medium: preserve compact Admin rows and readable legal surfaces
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L92](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L92) — - Semantic colors
- **Earlier owner-lead context:** - Shared semantic design-token consistency (provenance bridge, not an exact duplicate).

### R-064

**Make the maintenance h1 independently communicate Scheduled maintenance**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Maintenance h1
- **Proposed change:** Make the maintenance h1 independently communicate Scheduled maintenance
- **Category / priority:** Content clarity / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Historical maintenance heading/copy observation; preserve the illustration. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** State the page purpose independently
- **Regression risk:** Low: preserve illustration/branding and readable heading structure
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L124](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L124) — - Make the maintenance `h1` independently communicate "Scheduled maintenance" instead of only saying "better."
- **Earlier owner-lead context:** - Maintenance-page heading clarity (provenance bridge, not an exact duplicate).

### R-065

**Review remaining Course List/report responsive behavior where independently reproducible**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S04: Later owner instruction/correction evidence (Action source)
- **Skill/source attribution:** Later owner instruction S04; broader Course List/report lead not established by S10; OWNER LEAD — UNCORROBORATED; related finding: HISTORICAL.
- **Target:** Course List and report layouts
- **Proposed change:** Review remaining Course List/report responsive behavior where independently reproducible
- **Category / priority:** Historical lead / UNRANKED
- **Evidence and confirmation:** S10 is now available, but does not identify a distinct remaining Course List issue. Its concrete PDF-viewer containment action is separately retained as R-101. This broader owner lead stays UNREVIEWED and requires a reproducible issue before proposing changes.
- **Expected benefit:** Keep course and report information reachable
- **Regression risk:** Medium/high: report and PDF content invariants
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S04 L99](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S04_OWNER_SEQUENTIAL.txt#L99) — - Remaining course-list/report responsive behavior, where independently reproducible

### R-066

**Add rendered focus-entry regression coverage**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; ASSESSMENT-DERIVED TEST NEED; related finding: TEST-COVERAGE.
- **Target:** Tracker dialogs
- **Proposed change:** Add rendered focus-entry regression coverage
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch defects missed by source-contract tests
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L231](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-067

**Add rendered focus-containment regression coverage**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Tracker dialogs
- **Proposed change:** Add rendered focus-containment regression coverage
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch Tab escaping modal boundaries
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-068

**Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Tracker stream disclosures
- **Proposed change:** Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch document-level overflow
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-069

**Assert actual stream-trigger target-box dimensions**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Stream triggers
- **Proposed change:** Assert actual stream-trigger target-box dimensions
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Catch undersized interaction geometry
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-070

**Exercise Settings tab arrow-key navigation in browser tests**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Settings tabs
- **Proposed change:** Exercise Settings tab arrow-key navigation in browser tests
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify the actual keyboard model
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-071

**Exercise reduced-motion behavior in regression checks**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Programmatic scrolling and faculty feedback
- **Proposed change:** Exercise reduced-motion behavior in regression checks
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify preference handling in the browser
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-072

**Retest PDF/print invariants when UI changes are proposed**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Report preview and PDF export
- **Proposed change:** Retest PDF/print invariants when UI changes are proposed
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve intentionally separate report output
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L474](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L474) — Keep dialog changes isolated from tooltip changes, and visual-density experiments isolated from behavior. Regression tests must cover focus containment, root `scrollWidth <= clientWidth` outside deliberate scrollers, target boxes, tab arrow keys, reduced motion, and PDF/print invariants.

### R-073

**Improve actual accessibility-tree verification coverage**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; ASSESSMENT-DERIVED TEST NEED; related finding: TEST-COVERAGE.
- **Target:** Rendered interactive UI
- **Proposed change:** Improve actual accessibility-tree verification coverage
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Validate exposed roles/names rather than source-only markup
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L231](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-074

**Improve rendered browser-positioning verification coverage**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; ASSESSMENT-DERIVED TEST NEED; related finding: TEST-COVERAGE.
- **Target:** Disclosures and overlays
- **Proposed change:** Improve rendered browser-positioning verification coverage
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Validate computed placement
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L231](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-075

**Improve authenticated end-to-end coverage using appropriate safe fixtures**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; ASSESSMENT-DERIVED TEST NEED; related finding: TEST-COVERAGE.
- **Target:** Authenticated student/admin UI
- **Proposed change:** Improve authenticated end-to-end coverage using appropriate safe fixtures
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Check flows not covered by source contracts
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L231](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L231) — Coverage is strong for source contracts and pure behavior but weak for rendered keyboard focus, overflow, actual accessibility trees, browser positioning, and authenticated end-to-end flows. The current suite specifically asserts Escape/focus restoration but does not catch focus entering/trapping, which explains why `F-002` coexists with a green suite.

### R-076

**Test long curriculum labels in the stream-disclosure demo**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Stream detail text
- **Proposed change:** Test long curriculum labels in the stream-disclosure demo
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify robust wrapping
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L470](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-077

**Test long email content in the responsive demo**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Faculty email content
- **Proposed change:** Test long email content in the responsive demo
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify long unbroken text
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L470](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-078

**Test actual 200–400 percent browser zoom**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Tracker disclosure/reflow journeys
- **Proposed change:** Test actual 200–400 percent browser zoom
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Verify zoom beyond CSS-width equivalence
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L470](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L470) — 2. **Responsive stream disclosure:** target size, edge-aware tooltip positioning, long labels/emails, 200–400% zoom, 360/390/768/1280 widths, light/dark.

### R-079

**Test nested native support dialog interaction during modal changes**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Tracker modal and support dialog
- **Proposed change:** Test nested native support dialog interaction during modal changes
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve topmost focus/Escape behavior
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L469](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-080

**Test tracker-modal behavior at mobile widths**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:e2e-testing; cross-audit demo guidance; EXPLICIT TEST RECOMMENDATION; related finding: TEST-COVERAGE.
- **Target:** Four tracker modals
- **Proposed change:** Test tracker-modal behavior at mobile widths
- **Category / priority:** Verification/process / P2
- **Evidence and confirmation:** Source test recommendation or actionable coverage gap; historical demos cover some cases, but owner has not separately dispositioned the testing proposal. No tests implemented in this task.
- **Expected benefit:** Preserve touch and constrained viewport usability
- **Regression risk:** Low/medium; browser/credential constraints must remain explicit
- **Demonstrated:** Some historical coverage; not a new demo
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L469](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L469) — 1. **Accessibility foundation:** modal initial focus/trap/restoration, named close buttons, complete Settings tabs. Test keyboard-only, screen-reader names, Escape, nested support dialog, and mobile.

### R-081

**Increase the actual stream interaction box without visually inflating every badge**

- **Status/owner:** SELECTED — Demo A/B SELECTED CANDIDATE; no production authorization
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:accessibility; ecc:browser-qa; EXPLICIT; related finding: F-005.
- **Target:** Stream .stream-category-trigger
- **Proposed change:** Increase the actual stream interaction box without visually inflating every badge
- **Category / priority:** Target-size implementation constraint / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Improve hit area while preserving appearance
- **Regression risk:** Low: distinct from merely specifying a minimum dimension
- **Demonstrated:** Demo B
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L333](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L333) — - **Recommended correction:** Increase the actual interactive box without visually inflating every badge; keep a visible focus indicator.

### R-082

**Define the missing semantic shadow token in both light and dark themes**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; EXPLICIT; related finding: F-008.
- **Target:** Tracker tooltip-elevation token
- **Proposed change:** Define the missing semantic shadow token in both light and dark themes
- **Category / priority:** Token alternative / P3
- **Evidence and confirmation:** Source alternative, not demonstrated; the theme requirement is retained separately from deliberate documentation.
- **Expected benefit:** Ensure both themes resolve the declaration
- **Regression risk:** Medium: theme coverage
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L382](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L382) — - **Expected behavior:** Use a declared owning-page shadow token or define the missing semantic token in both themes.

### R-083

**Reduce nested-card repetition only where hierarchy does not require it**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Tracker nested-card hierarchy
- **Proposed change:** Reduce nested-card repetition only where hierarchy does not require it
- **Category / priority:** Visual principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Improve scan hierarchy
- **Regression risk:** Medium: scope first; D cannot be repeated
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L210](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-084

**Reduce pill repetition only where hierarchy does not require it**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Tracker pill hierarchy
- **Proposed change:** Reduce pill repetition only where hierarchy does not require it
- **Category / priority:** Visual principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Improve scan hierarchy
- **Regression risk:** Medium: distinct from removing pills in a targeted prototype; no D repeat
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L210](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L210) — **Status: COMPLETED within secondary scope.** The skill itself states it is not the primary authority for dashboards, data tables, or multi-step product UI. Applied selectively, it supports targeted evolution: preserve IA, anchors, copy voice, Lucide family, academic palette, and roadmap; rationalize spacing/radii; reduce nested-card/pill repetition where hierarchy does not require it. It does not support a Tailwind/React migration.

### R-085

**Quiet redundant surface treatments while preserving emphasis on academic content**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** frontend-design; EXPLICIT; related finding: F-009.
- **Target:** Tracker repeated surface treatments
- **Proposed change:** Quiet redundant surface treatments while preserving emphasis on academic content
- **Category / priority:** Visual principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce competing emphasis
- **Regression risk:** Medium: precise treatment undecided; rejected D prohibited
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L206](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-086

**Quiet redundant badge treatments while preserving emphasis on academic content**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** frontend-design; EXPLICIT; related finding: F-009.
- **Target:** Tracker repeated badge treatments
- **Proposed change:** Quiet redundant badge treatments while preserving emphasis on academic content
- **Category / priority:** Visual principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce competing emphasis
- **Regression risk:** Medium: do not use rejected D lighter fills/borders
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L206](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L206) — **Status: COMPLETED.** The recovered skill was applied as an audit framework. The roadmap is the characteristic subject artifact and should remain the signature. Space Grotesk headings plus Inter body text establish a usable display/body distinction; there is no evidence justifying a font replacement. F-009 is its main observation: reserve visual emphasis for the map, academic statuses, and course identity; quiet redundant surface/badge treatments. Recommendations remain subjective and require comparison in a later approved demo. No replacement tokens, layout, assets, or code were produced.

### R-087

**Target simplification inside repeated metadata groups while preserving expressive identity**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** cross-audit synthesis; EXPLICIT; related finding: F-009.
- **Target:** Tracker repeated metadata groups
- **Proposed change:** Target simplification inside repeated metadata groups while preserving expressive identity
- **Category / priority:** Visual principle / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Reduce operational density
- **Regression risk:** Medium: broad principle, must scope before demo; no D repeat
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L426](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L426) — 1. **Expressive identity vs quiet operational density.** Design-direction guidance supports the distinctive roadmap, dot grid, status colors, and academic personality. Design-taste guidance warns against repeated cards/pills and decorative effects. The safer choice is targeted simplification inside repeated metadata groups, not removal of the roadmap or a generic SaaS redesign.

### R-088

**Use spacing or dividers for structural grouping where elevation is unnecessary**

- **Status/owner:** UNREVIEWED — None; distinct alternative/lead awaits owner
- **Provenance:** S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** ecc:design-system; ecc:frontend-design-direction; design-taste-frontend; EXPLICIT; related finding: F-009.
- **Target:** Tracker structural surface grouping
- **Proposed change:** Use spacing or dividers for structural grouping where elevation is unnecessary
- **Category / priority:** Visual implementation proposal / P3
- **Evidence and confirmation:** Subjective source proposal; no validated usability benefit. Precise prototype must be scoped before demonstration.
- **Expected benefit:** Communicate hierarchy through grouping
- **Regression risk:** Medium: distinct from removing containers; no D repeat
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S01 L400](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L400) — - **Expected behavior:** Elevation, border, radius, and pill usage communicate distinct hierarchy; structural grouping can use spacing/dividers where elevation is unnecessary.

### R-089

**Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation**

- **Status/owner:** HOLD — Demo C HOLD; preserve corrected visible success check
- **Provenance:** S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source); S01: Other/consolidated skill framework audit (Action source)
- **Skill/source attribution:** emil-design-eng; improve-animations; review-animations; EXPLICIT; related finding: F-007.
- **Target:** Faculty copied check icon
- **Proposed change:** Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation
- **Category / priority:** Reduced motion / P2
- **Evidence and confirmation:** Previously verified in isolated demo; S02/S03 are historical evidence, not a new browser run.
- **Expected benefit:** Honor reduced motion without losing success feedback
- **Regression risk:** Low: retain the corrected opacity and transform
- **Demonstrated:** Demo C corrected
- **Duplicate relationship:** 3 exact atomic source occurrences; proof above
- **Exact source:** [S01 L369](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L369) — - **Recommended correction:** Disable the copy keyframes within the existing reduced-motion media query while retaining label/toast feedback.
- **Exact source:** [S01 L194](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L194) — | Copy pop keyframes at `css/style.css:3104` and `:3115` | Keep text/toast feedback; suppress movement under reduced motion (F-007) | Feedback should preserve user motion preferences |
- **Exact source:** [S01 L223](TASK_001_CORRECTION_001/../TASK_001/evidence/sources/S01_AUDIT.txt#L223) — | Copy scale/pop animations continue under reduced motion (`css/style.css:3104`, `:3115`) | Non-moving confirmation under reduce (F-007) | Preserve confirmation while removing movement |

### R-090

**Link directly to Degree Plan from a credit-progress summary**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Credit-progress summary
- **Proposed change:** Link directly to Degree Plan from a credit-progress summary
- **Category / priority:** Discoverability alternative / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Alternative to the new navbar link; not a Dashboard shortcut unless source/owner later specifies it. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Reach graduation requirements from relevant progress context
- **Regression risk:** Medium: independent alternative to R-056
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L68](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L68) — - OR link directly from a credit-progress summary.

### R-091

**Keep Role visible at intermediate Admin table widths**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Admin account-table Role column
- **Proposed change:** Keep Role visible at intermediate Admin table widths
- **Category / priority:** Responsive Admin hierarchy / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Different essential column/action from Account; original intermediate-width context only. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep role reachable
- **Regression risk:** Medium: preserve compact rows and existing account actions
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L82](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L82) — - Keep Role visible.

### R-092

**Keep Status visible at intermediate Admin table widths**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Admin account-table Status column
- **Proposed change:** Keep Status visible at intermediate Admin table widths
- **Category / priority:** Responsive Admin hierarchy / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Different essential column/action from Account; original intermediate-width context only. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep status reachable
- **Regression risk:** Medium: preserve compact rows and existing account actions
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L83](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L83) — - Keep Status visible.

### R-093

**Keep View visible at intermediate Admin table widths**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Admin account-table View column
- **Proposed change:** Keep View visible at intermediate Admin table widths
- **Category / priority:** Responsive Admin hierarchy / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Different essential column/action from Account; original intermediate-width context only. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep view reachable
- **Regression risk:** Medium: preserve compact rows and existing account actions
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L84](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L84) — - Keep View visible.

### R-094

**Move secondary login metrics into the Admin details drawer**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Admin login metrics and details drawer
- **Proposed change:** Move secondary login metrics into the Admin details drawer
- **Category / priority:** Admin information hierarchy / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Reallocation of secondary information, distinct from preserving essential columns. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Reduce intermediate table pressure
- **Regression risk:** Medium: preserve metric access, labels and permissions
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L85](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L85) — - Move secondary login metrics into the details drawer.

### R-095

**Give important academic metadata enough size for comfortable scanning**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Important academic metadata
- **Proposed change:** Give important academic metadata enough size for comfortable scanning
- **Category / priority:** Readability / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Size/readability proposal distinct from changing chip text color; no exact font size was specified. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Improve repeated metadata scanning
- **Regression risk:** Medium: preserve responsive geometry and status meaning
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L56](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L56) — - Give important metadata enough size for comfortable scanning.

### R-096

**Show the sign-in static background immediately**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Sign-in static background
- **Proposed change:** Show the sign-in static background immediately
- **Category / priority:** Loading presentation / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Immediate static presentation is distinct from conditional WebGL loading. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Provide usable sign-in presentation before decoration
- **Regression risk:** Medium: do not change authentication logic
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L108](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L108) — - Show the sign-in static background immediately.

### R-097

**Use visible fallback text labels for essential actions**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Essential action labels across surfaces
- **Proposed change:** Use visible fallback text labels for essential actions
- **Category / priority:** Asset-fallback alternative / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Alternative to local SVGs, materially different visual result; no new fallback behavior is implemented. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Preserve visible action identification when external icons fail
- **Regression risk:** Medium: label geometry and accessible-name parity
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L121](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L121) — - OR use visible fallback text labels.

### R-098

**Improve consistency of cross-page focus rings while retaining page-family differences**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Cross-page rendered focus rings
- **Proposed change:** Improve consistency of cross-page focus rings while retaining page-family differences
- **Category / priority:** Design consistency / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Manual historical assessment; page-family differences must remain. No layout/token migration specified. Rendered ring consistency differs from R-042 semantic focus-rule policy. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make keyboard focus consistently visible
- **Regression risk:** Medium: contrast/focus states in both themes
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L93](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L93) — - Focus rings

### R-099

**Improve consistency of cross-page button sizes while retaining page-family differences**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Cross-page button sizes
- **Proposed change:** Improve consistency of cross-page button sizes while retaining page-family differences
- **Category / priority:** Design consistency / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Manual historical assessment; page-family differences must remain. No layout/token migration specified. Button size consistency differs from R-043 shared target-size accessibility rules. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make equivalent controls more predictable
- **Regression risk:** Medium: preserve dense Admin layout
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L94](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L94) — - Button sizes

### R-100

**Improve consistency of cross-page dialog spacing while retaining page-family differences**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Cross-page dialog spacing
- **Proposed change:** Improve consistency of cross-page dialog spacing while retaining page-family differences
- **Category / priority:** Design consistency / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Manual historical assessment; page-family differences must remain. No layout/token migration specified. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make dialog composition more predictable
- **Regression risk:** Medium: compact/low-height scrolling and focus geometry
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L95](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L95) — - Dialog spacing

### R-101

**Keep PDF preview print proportions inside a contained viewer**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Tracker PDF preview viewer
- **Proposed change:** Keep PDF preview print proportions inside a contained viewer
- **Category / priority:** Responsive containment / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Viewer containment is distinct from generic Course List/report reflow or changing PDF data/output. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Fit page chrome while preserving print proportions
- **Regression risk:** Medium/high: preserve intentional print layout and report data
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L44](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L44) — - Keep PDF preview print proportions inside a contained viewer.

### R-102

**Show a preparing/loading state during export preparation**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** PDF export preparation feedback
- **Proposed change:** Show a preparing/loading state during export preparation
- **Category / priority:** Loading feedback / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Feedback proposal is distinct from loading the engine on request. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Explain export preparation progress
- **Regression risk:** Medium: preserve busy/reset/error states without changing PDF logic
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L107](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L107) — - Show a preparing/loading state during export preparation.

### R-103

**Give headings explicit font fallbacks**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Headings across audited surfaces
- **Proposed change:** Give headings explicit font fallbacks
- **Category / priority:** Asset fallback / P2
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — No replacement font family or exact fallback stack was prescribed. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep headings readable if remote fonts fail
- **Regression risk:** Low/medium: preserve typography and layout
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L122](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L122) — - Give headings explicit font fallbacks.

### R-104

**Fix unintended root document overflow while preserving the internal roadmap scroller**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Tracker document/root layout
- **Proposed change:** Fix unintended root document overflow while preserving the internal roadmap scroller
- **Category / priority:** Responsive overflow / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Historical root width 441px at 360px viewport. Broader source does not isolate the tooltip cause; not collapsed into R-001 closed-panel containment. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Keep surrounding page within viewport
- **Regression risk:** Medium: do not suppress legitimate roadmap scrolling or mask overflow
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L43](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L43) — - Fix unintended root document overflow.

### R-105

**Reuse the support form native dialog pattern for student dialogs**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Student dialogs using existing support native-dialog pattern
- **Proposed change:** Reuse the support form native dialog pattern for student dialogs
- **Category / priority:** Implementation alternative / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Native-pattern reuse is an explicit alternative. Distinct from custom admin reuse (R-009) and generic dialog.showModal migration (R-010). Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Reuse an established local native-dialog contract
- **Regression risk:** Medium/high: modality, top layer and nested support behavior
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L30](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L30) — - Reuse the admin drawer's focus-management approach OR the support form's native dialog pattern.

### R-106

**Implement keyboard navigation for Settings tabs**

- **Status/owner:** UNREVIEWED — UNREVIEWED; recovered source does not confer owner selection
- **Provenance:** S10: Original Impeccable primary historical audit (Action source)
- **Skill/source attribution:** impeccable:impeccable — original manual audit; RECOVERED ORIGINAL ACTION; related finding: Recovered original Impeccable (section in exact source).
- **Target:** Settings tabs; exact key model unspecified by original
- **Proposed change:** Implement keyboard navigation for Settings tabs
- **Category / priority:** Keyboard interaction scope / P1
- **Evidence and confirmation:** HISTORICAL MANUAL FINDING — Recovered report does not enumerate keys. Its broad interface contract is not falsely attributed as prescribing Left/Right/Home/End; R-019/R-020 remain selected narrower actions. Requires re-verification before any proposal/demo; no current defect certification.
- **Expected benefit:** Make the tab interface usable from the keyboard
- **Regression risk:** Medium: scope exact key model from verified owning pattern before any demo
- **Demonstrated:** NO
- **Duplicate relationship:** No exact duplicates merged
- **Exact source:** [S10 L32](TASK_001_CORRECTION_001/evidence/sources/S10_ORIGINAL_IMPECCABLE.txt#L32) — - Implement keyboard navigation for Settings tabs.
