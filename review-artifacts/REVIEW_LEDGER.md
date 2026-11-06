# Review ledger

Current correction: TASK_001_CORRECTION_002 (source fidelity only); accepted substantive reconciliation and all owner statuses preserved. A/B SELECTED CANDIDATES; C HOLD (corrected check preserved); D REJECTED. 23 selected, 9 rejected, 7 held, 67 unreviewed, 0 in review. No statuses changed by source recovery. Production changes remain unauthorized.

| ID | Recommendation | Status | Prior demonstration |
| --- | --- | --- | --- |
| [R-001](MASTER_RECOMMENDATIONS.md#r-001) | Contain closed stream details so hidden panels cannot extend root layout width | SELECTED | Demo B |
| [R-002](MASTER_RECOMMENDATIONS.md#r-002) | Position open stream details against viewport edges | SELECTED | Demo B |
| [R-003](MASTER_RECOMMENDATIONS.md#r-003) | Wrap long open stream-detail content within viewport bounds | SELECTED | Demo B |
| [R-004](MASTER_RECOMMENDATIONS.md#r-004) | Set explicit initial focus when opening each tracker modal | SELECTED | Demo A |
| [R-005](MASTER_RECOMMENDATIONS.md#r-005) | Contain Tab and Shift+Tab within the active tracker modal | SELECTED | Demo A |
| [R-006](MASTER_RECOMMENDATIONS.md#r-006) | Make background content inert while a tracker modal is open | SELECTED | Demo A |
| [R-007](MASTER_RECOMMENDATIONS.md#r-007) | Support Escape dismissal for the active tracker modal | SELECTED | Demo A; existing behavior preserved |
| [R-008](MASTER_RECOMMENDATIONS.md#r-008) | Restore focus to the opener on tracker-modal dismissal | SELECTED | Demo A |
| [R-009](MASTER_RECOMMENDATIONS.md#r-009) | Retain tracker overlays and reuse the admin drawer custom focus-management pattern | SELECTED | Demo A |
| [R-010](MASTER_RECOMMENDATIONS.md#r-010) | Use native dialog.showModal instead of custom tracker overlays | UNREVIEWED | NO |
| [R-011](MASTER_RECOMMENDATIONS.md#r-011) | Give each tracker close button a context-specific accessible name | SELECTED | Demo A |
| [R-012](MASTER_RECOMMENDATIONS.md#r-012) | Keep close-button icons decorative alongside their accessible names | SELECTED | Demo A |
| [R-013](MASTER_RECOMMENDATIONS.md#r-013) | Expose role=tab on each Settings tab button | SELECTED | Demo A |
| [R-014](MASTER_RECOMMENDATIONS.md#r-014) | Expose role=tabpanel on each Settings panel | SELECTED | Demo A |
| [R-015](MASTER_RECOMMENDATIONS.md#r-015) | Use roving tabindex so only the active Settings tab is in the Tab sequence | SELECTED | Demo A |
| [R-016](MASTER_RECOMMENDATIONS.md#r-016) | Synchronize aria-selected with active Settings tab | SELECTED | Demo A |
| [R-017](MASTER_RECOMMENDATIONS.md#r-017) | Link each Settings tab to its panel using aria-controls | SELECTED | Demo A |
| [R-018](MASTER_RECOMMENDATIONS.md#r-018) | Name each Settings panel through its tab using aria-labelledby | SELECTED | Demo A |
| [R-019](MASTER_RECOMMENDATIONS.md#r-019) | Implement Left/Right arrow navigation between Settings tabs | SELECTED | Demo A |
| [R-020](MASTER_RECOMMENDATIONS.md#r-020) | Implement Home/End navigation to the first/last Settings tab | SELECTED | Demo A |
| [R-021](MASTER_RECOMMENDATIONS.md#r-021) | Reuse the existing Admin Catalog tab interaction pattern | SELECTED | Demo A |
| [R-022](MASTER_RECOMMENDATIONS.md#r-022) | Increase the actual stream trigger box to at least 24 by 24 CSS pixels | SELECTED | Demo B |
| [R-023](MASTER_RECOMMENDATIONS.md#r-023) | Make the containing stream badge the interactive target | UNREVIEWED | NO |
| [R-024](MASTER_RECOMMENDATIONS.md#r-024) | Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance | UNREVIEWED | NO |
| [R-025](MASTER_RECOMMENDATIONS.md#r-025) | Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-026](MASTER_RECOMMENDATIONS.md#r-026) | Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-027](MASTER_RECOMMENDATIONS.md#r-027) | Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-028](MASTER_RECOMMENDATIONS.md#r-028) | Centralize one reduced-motion scroll helper and reuse it in all three scroll paths | HOLD | PARTIAL: tracker helper only |
| [R-029](MASTER_RECOMMENDATIONS.md#r-029) | Use instant scrolling for keyboard Back to Top activation independently of motion preference | UNREVIEWED | NO |
| [R-030](MASTER_RECOMMENDATIONS.md#r-030) | Use instant scrolling for keyboard stream See more activation independently of motion preference | UNREVIEWED | NO |
| [R-031](MASTER_RECOMMENDATIONS.md#r-031) | Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation | HOLD | Demo C corrected |
| [R-032](MASTER_RECOMMENDATIONS.md#r-032) | Set copied-check opacity to 1 and transform to none under reduced motion | HOLD | Corrected Demo C |
| [R-033](MASTER_RECOMMENDATIONS.md#r-033) | Replace undefined tooltip --shadow-lg with existing --shadow | SELECTED | Demo B |
| [R-034](MASTER_RECOMMENDATIONS.md#r-034) | Replace undefined tooltip --shadow-lg with existing --soft-shadow | UNREVIEWED | NO |
| [R-035](MASTER_RECOMMENDATIONS.md#r-035) | Deliberately add a documented tooltip-elevation token | UNREVIEWED | NO |
| [R-036](MASTER_RECOMMENDATIONS.md#r-036) | Document a radius hierarchy rule for repeated tracker surfaces | UNREVIEWED | NO |
| [R-037](MASTER_RECOMMENDATIONS.md#r-037) | Document an elevation hierarchy rule for repeated tracker surfaces | UNREVIEWED | NO |
| [R-038](MASTER_RECOMMENDATIONS.md#r-038) | Prototype removal of only redundant inner containers after a targeted comparison | UNREVIEWED | NO |
| [R-039](MASTER_RECOMMENDATIONS.md#r-039) | Prototype removing redundant inner pills after a targeted comparison | UNREVIEWED | NO |
| [R-040](MASTER_RECOMMENDATIONS.md#r-040) | Rationalize spacing within existing tracker composition | UNREVIEWED | NO |
| [R-041](MASTER_RECOMMENDATIONS.md#r-041) | Reserve visual emphasis for the roadmap, academic statuses and course identity | UNREVIEWED | NO |
| [R-042](MASTER_RECOMMENDATIONS.md#r-042) | Establish shared semantic focus rules while retaining page-owned palettes | UNREVIEWED | NO |
| [R-043](MASTER_RECOMMENDATIONS.md#r-043) | Establish shared semantic target-size rules while retaining page-owned palettes | UNREVIEWED | NO |
| [R-044](MASTER_RECOMMENDATIONS.md#r-044) | Establish shared elevation names while retaining page-owned palettes | UNREVIEWED | NO |
| [R-045](MASTER_RECOMMENDATIONS.md#r-045) | Consider a subtle non-moving save confirmation | UNREVIEWED | NO |
| [R-046](MASTER_RECOMMENDATIONS.md#r-046) | Consider a short optional content-state crossfade | UNREVIEWED | NO |
| [R-047](MASTER_RECOMMENDATIONS.md#r-047) | Remove CSE110 card shadow | REJECTED | Demo D |
| [R-048](MASTER_RECOMMENDATIONS.md#r-048) | Remove category badge background fill | REJECTED | Demo D |
| [R-049](MASTER_RECOMMENDATIONS.md#r-049) | Remove category badge border color | REJECTED | Demo D |
| [R-050](MASTER_RECOMMENDATIONS.md#r-050) | Replace CSE110 status-strip elevation with a top divider | REJECTED | Demo D |
| [R-051](MASTER_RECOMMENDATIONS.md#r-051) | Make Grade/GP pill borders transparent | REJECTED | Demo D |
| [R-052](MASTER_RECOMMENDATIONS.md#r-052) | Make Grade/GP pill backgrounds transparent | REJECTED | Demo D |
| [R-053](MASTER_RECOMMENDATIONS.md#r-053) | Remove Grade Scale table-wrap shadow | REJECTED | Demo D |
| [R-054](MASTER_RECOMMENDATIONS.md#r-054) | Use medium radius on Grade Scale table wrap | REJECTED | Demo D |
| [R-055](MASTER_RECOMMENDATIONS.md#r-055) | Set Grade Scale heading bottom spacing to 16px | REJECTED | Demo D |
| [R-056](MASTER_RECOMMENDATIONS.md#r-056) | Add a visible Degree Plan navigation link beside Roadmap and My Path | UNREVIEWED | NO |
| [R-057](MASTER_RECOMMENDATIONS.md#r-057) | Keep Account visible at intermediate Admin table widths | UNREVIEWED | NO |
| [R-058](MASTER_RECOMMENDATIONS.md#r-058) | Use darker text on the light completed-prerequisite chip while preserving its green tint | UNREVIEWED | NO |
| [R-059](MASTER_RECOMMENDATIONS.md#r-059) | Load the PDF engine when export is requested | UNREVIEWED | NO |
| [R-060](MASTER_RECOMMENDATIONS.md#r-060) | Load decorative WebGL only when appropriate | UNREVIEWED | NO |
| [R-061](MASTER_RECOMMENDATIONS.md#r-061) | Use local SVG icons for essential actions | UNREVIEWED | NO |
| [R-062](MASTER_RECOMMENDATIONS.md#r-062) | Make mobile navigation clearly reveal that additional destinations exist | UNREVIEWED | NO |
| [R-063](MASTER_RECOMMENDATIONS.md#r-063) | Improve consistency of cross-page semantic colors while retaining page-family differences | UNREVIEWED | NO |
| [R-064](MASTER_RECOMMENDATIONS.md#r-064) | Make the maintenance h1 independently communicate Scheduled maintenance | UNREVIEWED | NO |
| [R-065](MASTER_RECOMMENDATIONS.md#r-065) | Review remaining Course List/report responsive behavior where independently reproducible | UNREVIEWED | NO |
| [R-066](MASTER_RECOMMENDATIONS.md#r-066) | Add rendered focus-entry regression coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-067](MASTER_RECOMMENDATIONS.md#r-067) | Add rendered focus-containment regression coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-068](MASTER_RECOMMENDATIONS.md#r-068) | Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers | UNREVIEWED | Some historical coverage; not a new demo |
| [R-069](MASTER_RECOMMENDATIONS.md#r-069) | Assert actual stream-trigger target-box dimensions | UNREVIEWED | Some historical coverage; not a new demo |
| [R-070](MASTER_RECOMMENDATIONS.md#r-070) | Exercise Settings tab arrow-key navigation in browser tests | UNREVIEWED | Some historical coverage; not a new demo |
| [R-071](MASTER_RECOMMENDATIONS.md#r-071) | Exercise reduced-motion behavior in regression checks | UNREVIEWED | Some historical coverage; not a new demo |
| [R-072](MASTER_RECOMMENDATIONS.md#r-072) | Retest PDF/print invariants when UI changes are proposed | UNREVIEWED | Some historical coverage; not a new demo |
| [R-073](MASTER_RECOMMENDATIONS.md#r-073) | Improve actual accessibility-tree verification coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-074](MASTER_RECOMMENDATIONS.md#r-074) | Improve rendered browser-positioning verification coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-075](MASTER_RECOMMENDATIONS.md#r-075) | Improve authenticated end-to-end coverage using appropriate safe fixtures | UNREVIEWED | Some historical coverage; not a new demo |
| [R-076](MASTER_RECOMMENDATIONS.md#r-076) | Test long curriculum labels in the stream-disclosure demo | UNREVIEWED | Some historical coverage; not a new demo |
| [R-077](MASTER_RECOMMENDATIONS.md#r-077) | Test long email content in the responsive demo | UNREVIEWED | Some historical coverage; not a new demo |
| [R-078](MASTER_RECOMMENDATIONS.md#r-078) | Test actual 200–400 percent browser zoom | UNREVIEWED | Some historical coverage; not a new demo |
| [R-079](MASTER_RECOMMENDATIONS.md#r-079) | Test nested native support dialog interaction during modal changes | UNREVIEWED | Some historical coverage; not a new demo |
| [R-080](MASTER_RECOMMENDATIONS.md#r-080) | Test tracker-modal behavior at mobile widths | UNREVIEWED | Some historical coverage; not a new demo |
| [R-081](MASTER_RECOMMENDATIONS.md#r-081) | Increase the actual stream interaction box without visually inflating every badge | SELECTED | Demo B |
| [R-082](MASTER_RECOMMENDATIONS.md#r-082) | Define the missing semantic shadow token in both light and dark themes | UNREVIEWED | NO |
| [R-083](MASTER_RECOMMENDATIONS.md#r-083) | Reduce nested-card repetition only where hierarchy does not require it | UNREVIEWED | NO |
| [R-084](MASTER_RECOMMENDATIONS.md#r-084) | Reduce pill repetition only where hierarchy does not require it | UNREVIEWED | NO |
| [R-085](MASTER_RECOMMENDATIONS.md#r-085) | Quiet redundant surface treatments while preserving emphasis on academic content | UNREVIEWED | NO |
| [R-086](MASTER_RECOMMENDATIONS.md#r-086) | Quiet redundant badge treatments while preserving emphasis on academic content | UNREVIEWED | NO |
| [R-087](MASTER_RECOMMENDATIONS.md#r-087) | Target simplification inside repeated metadata groups while preserving expressive identity | UNREVIEWED | NO |
| [R-088](MASTER_RECOMMENDATIONS.md#r-088) | Use spacing or dividers for structural grouping where elevation is unnecessary | UNREVIEWED | NO |
| [R-089](MASTER_RECOMMENDATIONS.md#r-089) | Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation | HOLD | Demo C corrected |
| [R-090](MASTER_RECOMMENDATIONS.md#r-090) | Link directly to Degree Plan from a credit-progress summary | UNREVIEWED | NO |
| [R-091](MASTER_RECOMMENDATIONS.md#r-091) | Keep Role visible at intermediate Admin table widths | UNREVIEWED | NO |
| [R-092](MASTER_RECOMMENDATIONS.md#r-092) | Keep Status visible at intermediate Admin table widths | UNREVIEWED | NO |
| [R-093](MASTER_RECOMMENDATIONS.md#r-093) | Keep View visible at intermediate Admin table widths | UNREVIEWED | NO |
| [R-094](MASTER_RECOMMENDATIONS.md#r-094) | Move login metrics into the Admin details drawer | UNREVIEWED | NO |
| [R-095](MASTER_RECOMMENDATIONS.md#r-095) | Give important academic metadata enough size for comfortable scanning | UNREVIEWED | NO |
| [R-096](MASTER_RECOMMENDATIONS.md#r-096) | Show the sign-in static background immediately | UNREVIEWED | NO |
| [R-097](MASTER_RECOMMENDATIONS.md#r-097) | Use visible fallback text labels for essential actions | UNREVIEWED | NO |
| [R-098](MASTER_RECOMMENDATIONS.md#r-098) | Improve consistency of cross-page focus rings while retaining page-family differences | UNREVIEWED | NO |
| [R-099](MASTER_RECOMMENDATIONS.md#r-099) | Improve consistency of cross-page button sizes while retaining page-family differences | UNREVIEWED | NO |
| [R-100](MASTER_RECOMMENDATIONS.md#r-100) | Improve consistency of cross-page dialog spacing while retaining page-family differences | UNREVIEWED | NO |
| [R-101](MASTER_RECOMMENDATIONS.md#r-101) | Keep PDF preview print proportions inside a contained viewer | UNREVIEWED | NO |
| [R-102](MASTER_RECOMMENDATIONS.md#r-102) | Show a preparing/loading state during export preparation | UNREVIEWED | NO |
| [R-103](MASTER_RECOMMENDATIONS.md#r-103) | Give every heading an explicit font fallback | UNREVIEWED | NO |
| [R-104](MASTER_RECOMMENDATIONS.md#r-104) | Fix unintended root document overflow while preserving the internal roadmap scroller | UNREVIEWED | NO |
| [R-105](MASTER_RECOMMENDATIONS.md#r-105) | Reuse the support form native dialog pattern for student dialogs | UNREVIEWED | NO |
| [R-106](MASTER_RECOMMENDATIONS.md#r-106) | Implement keyboard navigation for Settings tabs | UNREVIEWED | NO |

## Task history

| Task | Scope | Status | Gate |
| --- | --- | --- | --- |
| [TASK_001](TASK_001/TASK_REVIEW_001.md) at 7f5cb29cf48e1aac417a4610399bf04f90e7f01b | Original available-source extraction; missing Impeccable source at that time | Preserved historical report/evidence | Superseded source coverage by correction below |
| [TASK_001_CORRECTION_001](TASK_001_CORRECTION_001/TASK_REVIEW_001_CORRECTION_001.md) | Recovered original source, reconciliation and artifact-only publication | READY FOR INDEPENDENT REVIEW (preliminary) | Independent ChatGPT review; explicit owner authorization before any demo |
| [TASK_001_CORRECTION_002](TASK_001_CORRECTION_002/TASK_001_CORRECTION_002.md) | Actual original S12 archive; S10 identified as ChatGPT restatement; 28 supports rechecked | READY FOR INDEPENDENT REVIEW (preliminary) | Independent ChatGPT review; no new demo |

R-056–R-064 were refined with recovered actions; R-065 remains a broader later-owner lead; actual S12 names Course List within broad overflow scope, but no distinct remaining cause was verified. R-090–R-106 are new and UNREVIEWED. R-009/R-011 gained exact source corroboration and retained selected status. No demo has started.

Source identity correction: S12 is the actual original (path-only sanitized); S10 is the preserved structured restatement; S11/S13 are later instructions. All 28 clauses supported. Count remains 106; no selection, rejection or hold changed.
