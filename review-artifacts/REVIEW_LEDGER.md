# Review ledger

Only explicit owner decisions change dispositions. 23 SELECTED candidates; 9 REJECTED treatments; 7 HOLD; 50 UNREVIEWED; 0 IN REVIEW.

Demo A and B: SELECTED CANDIDATE. Demo C: HOLD, including corrected visible reduced-motion green check. Previous Demo D: REJECTED in full; specifically shadows, category fills/borders and Grade/GP lighter styling must never be reintroduced by renaming. Other fundamentally different same-component proposals are not automatically rejected. Native-dialog and other unimplemented alternatives are not silently selected. No production approval exists.

| ID | Recommendation | Status | Prior demonstration |
| --- | --- | --- | --- |
| [R-001](MASTER_RECOMMENDATIONS.md#r-001--contain-closed-stream-details-so-hidden-panels-cannot-extend-root-layout-width) | Contain closed stream details so hidden panels cannot extend root layout width | SELECTED | Demo B |
| [R-002](MASTER_RECOMMENDATIONS.md#r-002--position-open-stream-details-against-viewport-edges) | Position open stream details against viewport edges | SELECTED | Demo B |
| [R-003](MASTER_RECOMMENDATIONS.md#r-003--wrap-long-open-stream-detail-content-within-viewport-bounds) | Wrap long open stream-detail content within viewport bounds | SELECTED | Demo B |
| [R-004](MASTER_RECOMMENDATIONS.md#r-004--set-explicit-initial-focus-when-opening-each-tracker-modal) | Set explicit initial focus when opening each tracker modal | SELECTED | Demo A |
| [R-005](MASTER_RECOMMENDATIONS.md#r-005--contain-tab-and-shifttab-within-the-active-tracker-modal) | Contain Tab and Shift+Tab within the active tracker modal | SELECTED | Demo A |
| [R-006](MASTER_RECOMMENDATIONS.md#r-006--make-background-content-inert-while-a-tracker-modal-is-open) | Make background content inert while a tracker modal is open | SELECTED | Demo A |
| [R-007](MASTER_RECOMMENDATIONS.md#r-007--support-escape-dismissal-for-the-active-tracker-modal) | Support Escape dismissal for the active tracker modal | SELECTED | Demo A; existing behavior preserved |
| [R-008](MASTER_RECOMMENDATIONS.md#r-008--restore-focus-to-the-opener-on-tracker-modal-dismissal) | Restore focus to the opener on tracker-modal dismissal | SELECTED | Demo A |
| [R-009](MASTER_RECOMMENDATIONS.md#r-009--retain-tracker-overlays-and-reuse-the-admin-drawer-custom-focus-management-pattern) | Retain tracker overlays and reuse the admin drawer custom focus-management pattern | SELECTED | Demo A |
| [R-010](MASTER_RECOMMENDATIONS.md#r-010--use-native-dialogshowmodal-instead-of-custom-tracker-overlays) | Use native dialog.showModal instead of custom tracker overlays | UNREVIEWED | NO |
| [R-011](MASTER_RECOMMENDATIONS.md#r-011--give-each-tracker-close-button-a-context-specific-accessible-name) | Give each tracker close button a context-specific accessible name | SELECTED | Demo A |
| [R-012](MASTER_RECOMMENDATIONS.md#r-012--keep-close-button-icons-decorative-alongside-their-accessible-names) | Keep close-button icons decorative alongside their accessible names | SELECTED | Demo A |
| [R-013](MASTER_RECOMMENDATIONS.md#r-013--expose-roletab-on-each-settings-tab-button) | Expose role=tab on each Settings tab button | SELECTED | Demo A |
| [R-014](MASTER_RECOMMENDATIONS.md#r-014--expose-roletabpanel-on-each-settings-panel) | Expose role=tabpanel on each Settings panel | SELECTED | Demo A |
| [R-015](MASTER_RECOMMENDATIONS.md#r-015--use-roving-tabindex-so-only-the-active-settings-tab-is-in-the-tab-sequence) | Use roving tabindex so only the active Settings tab is in the Tab sequence | SELECTED | Demo A |
| [R-016](MASTER_RECOMMENDATIONS.md#r-016--synchronize-aria-selected-with-active-settings-tab) | Synchronize aria-selected with active Settings tab | SELECTED | Demo A |
| [R-017](MASTER_RECOMMENDATIONS.md#r-017--link-each-settings-tab-to-its-panel-using-aria-controls) | Link each Settings tab to its panel using aria-controls | SELECTED | Demo A |
| [R-018](MASTER_RECOMMENDATIONS.md#r-018--name-each-settings-panel-through-its-tab-using-aria-labelledby) | Name each Settings panel through its tab using aria-labelledby | SELECTED | Demo A |
| [R-019](MASTER_RECOMMENDATIONS.md#r-019--implement-leftright-arrow-navigation-between-settings-tabs) | Implement Left/Right arrow navigation between Settings tabs | SELECTED | Demo A |
| [R-020](MASTER_RECOMMENDATIONS.md#r-020--implement-homeend-navigation-to-the-firstlast-settings-tab) | Implement Home/End navigation to the first/last Settings tab | SELECTED | Demo A |
| [R-021](MASTER_RECOMMENDATIONS.md#r-021--reuse-the-existing-admin-catalog-tab-interaction-pattern) | Reuse the existing Admin Catalog tab interaction pattern | SELECTED | Demo A |
| [R-022](MASTER_RECOMMENDATIONS.md#r-022--increase-the-actual-stream-trigger-box-to-at-least-24-by-24-css-pixels) | Increase the actual stream trigger box to at least 24 by 24 CSS pixels | SELECTED | Demo B |
| [R-023](MASTER_RECOMMENDATIONS.md#r-023--make-the-containing-stream-badge-the-interactive-target) | Make the containing stream badge the interactive target | UNREVIEWED | NO |
| [R-024](MASTER_RECOMMENDATIONS.md#r-024--assess-sufficient-spacing-and-sc-258-exceptions-before-declaring-target-size-nonconformance) | Assess sufficient spacing and SC 2.5.8 exceptions before declaring target-size nonconformance | UNREVIEWED | NO |
| [R-025](MASTER_RECOMMENDATIONS.md#r-025--choose-instantauto-scrolling-under-reduced-motion-for-back-to-top-retaining-smooth-otherwise) | Choose instant/auto scrolling under reduced motion for Back to Top, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-026](MASTER_RECOMMENDATIONS.md#r-026--choose-instantauto-scrolling-under-reduced-motion-for-stream-see-more-retaining-smooth-otherwise) | Choose instant/auto scrolling under reduced motion for stream See more, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-027](MASTER_RECOMMENDATIONS.md#r-027--choose-instantauto-scrolling-under-reduced-motion-for-admin-catalog-editor-retaining-smooth-otherwise) | Choose instant/auto scrolling under reduced motion for Admin Catalog editor, retaining smooth otherwise | HOLD | Demo C (Admin via synthetic DOM harness) |
| [R-028](MASTER_RECOMMENDATIONS.md#r-028--centralize-one-reduced-motion-scroll-helper-and-reuse-it-in-all-three-scroll-paths) | Centralize one reduced-motion scroll helper and reuse it in all three scroll paths | HOLD | PARTIAL: tracker helper only |
| [R-029](MASTER_RECOMMENDATIONS.md#r-029--use-instant-scrolling-for-keyboard-back-to-top-activation-independently-of-motion-preference) | Use instant scrolling for keyboard Back to Top activation independently of motion preference | UNREVIEWED | NO |
| [R-030](MASTER_RECOMMENDATIONS.md#r-030--use-instant-scrolling-for-keyboard-stream-see-more-activation-independently-of-motion-preference) | Use instant scrolling for keyboard stream See more activation independently of motion preference | UNREVIEWED | NO |
| [R-031](MASTER_RECOMMENDATIONS.md#r-031--suppress-the-faculty-copy-button-pop-keyframe-under-reduced-motion-while-preserving-non-motion-confirmation) | Suppress the faculty copy-button pop keyframe under reduced motion while preserving non-motion confirmation | HOLD | Demo C corrected |
| [R-032](MASTER_RECOMMENDATIONS.md#r-032--set-copied-check-opacity-to-1-and-transform-to-none-under-reduced-motion) | Set copied-check opacity to 1 and transform to none under reduced motion | HOLD | Corrected Demo C |
| [R-033](MASTER_RECOMMENDATIONS.md#r-033--replace-undefined-tooltip---shadow-lg-with-existing---shadow) | Replace undefined tooltip --shadow-lg with existing --shadow | SELECTED | Demo B |
| [R-034](MASTER_RECOMMENDATIONS.md#r-034--replace-undefined-tooltip---shadow-lg-with-existing---soft-shadow) | Replace undefined tooltip --shadow-lg with existing --soft-shadow | UNREVIEWED | NO |
| [R-035](MASTER_RECOMMENDATIONS.md#r-035--deliberately-add-a-documented-tooltip-elevation-token) | Deliberately add a documented tooltip-elevation token | UNREVIEWED | NO |
| [R-036](MASTER_RECOMMENDATIONS.md#r-036--document-a-radius-hierarchy-rule-for-repeated-tracker-surfaces) | Document a radius hierarchy rule for repeated tracker surfaces | UNREVIEWED | NO |
| [R-037](MASTER_RECOMMENDATIONS.md#r-037--document-an-elevation-hierarchy-rule-for-repeated-tracker-surfaces) | Document an elevation hierarchy rule for repeated tracker surfaces | UNREVIEWED | NO |
| [R-038](MASTER_RECOMMENDATIONS.md#r-038--prototype-removal-of-only-redundant-inner-containers-after-a-targeted-comparison) | Prototype removal of only redundant inner containers after a targeted comparison | UNREVIEWED | NO |
| [R-039](MASTER_RECOMMENDATIONS.md#r-039--prototype-removing-redundant-inner-pills-after-a-targeted-comparison) | Prototype removing redundant inner pills after a targeted comparison | UNREVIEWED | NO |
| [R-040](MASTER_RECOMMENDATIONS.md#r-040--rationalize-spacing-within-existing-tracker-composition) | Rationalize spacing within existing tracker composition | UNREVIEWED | NO |
| [R-041](MASTER_RECOMMENDATIONS.md#r-041--reserve-visual-emphasis-for-the-roadmap-academic-statuses-and-course-identity) | Reserve visual emphasis for the roadmap, academic statuses and course identity | UNREVIEWED | NO |
| [R-042](MASTER_RECOMMENDATIONS.md#r-042--establish-shared-semantic-focus-rules-while-retaining-page-owned-palettes) | Establish shared semantic focus rules while retaining page-owned palettes | UNREVIEWED | NO |
| [R-043](MASTER_RECOMMENDATIONS.md#r-043--establish-shared-semantic-target-size-rules-while-retaining-page-owned-palettes) | Establish shared semantic target-size rules while retaining page-owned palettes | UNREVIEWED | NO |
| [R-044](MASTER_RECOMMENDATIONS.md#r-044--establish-shared-elevation-names-while-retaining-page-owned-palettes) | Establish shared elevation names while retaining page-owned palettes | UNREVIEWED | NO |
| [R-045](MASTER_RECOMMENDATIONS.md#r-045--consider-a-subtle-non-moving-save-confirmation) | Consider a subtle non-moving save confirmation | UNREVIEWED | NO |
| [R-046](MASTER_RECOMMENDATIONS.md#r-046--consider-a-short-optional-content-state-crossfade) | Consider a short optional content-state crossfade | UNREVIEWED | NO |
| [R-047](MASTER_RECOMMENDATIONS.md#r-047--remove-cse110-card-shadow) | Remove CSE110 card shadow | REJECTED | Demo D |
| [R-048](MASTER_RECOMMENDATIONS.md#r-048--remove-category-badge-background-fill) | Remove category badge background fill | REJECTED | Demo D |
| [R-049](MASTER_RECOMMENDATIONS.md#r-049--remove-category-badge-border-color) | Remove category badge border color | REJECTED | Demo D |
| [R-050](MASTER_RECOMMENDATIONS.md#r-050--replace-cse110-status-strip-elevation-with-a-top-divider) | Replace CSE110 status-strip elevation with a top divider | REJECTED | Demo D |
| [R-051](MASTER_RECOMMENDATIONS.md#r-051--make-gradegp-pill-borders-transparent) | Make Grade/GP pill borders transparent | REJECTED | Demo D |
| [R-052](MASTER_RECOMMENDATIONS.md#r-052--make-gradegp-pill-backgrounds-transparent) | Make Grade/GP pill backgrounds transparent | REJECTED | Demo D |
| [R-053](MASTER_RECOMMENDATIONS.md#r-053--remove-grade-scale-table-wrap-shadow) | Remove Grade Scale table-wrap shadow | REJECTED | Demo D |
| [R-054](MASTER_RECOMMENDATIONS.md#r-054--use-medium-radius-on-grade-scale-table-wrap) | Use medium radius on Grade Scale table wrap | REJECTED | Demo D |
| [R-055](MASTER_RECOMMENDATIONS.md#r-055--set-grade-scale-heading-bottom-spacing-to-16px) | Set Grade Scale heading bottom spacing to 16px | REJECTED | Demo D |
| [R-056](MASTER_RECOMMENDATIONS.md#r-056--review-degree-plan-discoverability) | Review Degree Plan discoverability | UNREVIEWED | NO |
| [R-057](MASTER_RECOMMENDATIONS.md#r-057--review-intermediate-width-admin-table-usability) | Review intermediate-width Admin table usability | UNREVIEWED | NO |
| [R-058](MASTER_RECOMMENDATIONS.md#r-058--review-academic-status-label-readability-and-contrast) | Review academic status label readability and contrast | UNREVIEWED | NO |
| [R-059](MASTER_RECOMMENDATIONS.md#r-059--consider-lazy-loading-the-pdf-engine) | Consider lazy loading the PDF engine | UNREVIEWED | NO |
| [R-060](MASTER_RECOMMENDATIONS.md#r-060--consider-deferred-or-conditional-decorative-webgl-loading) | Consider deferred or conditional decorative WebGL loading | UNREVIEWED | NO |
| [R-061](MASTER_RECOMMENDATIONS.md#r-061--review-resilience-when-external-icons-fail-to-load) | Review resilience when external icons fail to load | UNREVIEWED | NO |
| [R-062](MASTER_RECOMMENDATIONS.md#r-062--review-mobile-navigation-clarity) | Review mobile navigation clarity | UNREVIEWED | NO |
| [R-063](MASTER_RECOMMENDATIONS.md#r-063--review-shared-semantic-design-token-consistency) | Review shared semantic design-token consistency | UNREVIEWED | NO |
| [R-064](MASTER_RECOMMENDATIONS.md#r-064--review-maintenance-page-heading-clarity) | Review maintenance-page heading clarity | UNREVIEWED | NO |
| [R-065](MASTER_RECOMMENDATIONS.md#r-065--review-remaining-course-listreport-responsive-behavior-where-independently-reproducible) | Review remaining Course List/report responsive behavior where independently reproducible | UNREVIEWED | NO |
| [R-066](MASTER_RECOMMENDATIONS.md#r-066--add-rendered-focus-entry-regression-coverage) | Add rendered focus-entry regression coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-067](MASTER_RECOMMENDATIONS.md#r-067--add-rendered-focus-containment-regression-coverage) | Add rendered focus-containment regression coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-068](MASTER_RECOMMENDATIONS.md#r-068--assert-root-scrollwidth-does-not-exceed-clientwidth-outside-deliberate-scrollers) | Assert root scrollWidth does not exceed clientWidth outside deliberate scrollers | UNREVIEWED | Some historical coverage; not a new demo |
| [R-069](MASTER_RECOMMENDATIONS.md#r-069--assert-actual-stream-trigger-target-box-dimensions) | Assert actual stream-trigger target-box dimensions | UNREVIEWED | Some historical coverage; not a new demo |
| [R-070](MASTER_RECOMMENDATIONS.md#r-070--exercise-settings-tab-arrow-key-navigation-in-browser-tests) | Exercise Settings tab arrow-key navigation in browser tests | UNREVIEWED | Some historical coverage; not a new demo |
| [R-071](MASTER_RECOMMENDATIONS.md#r-071--exercise-reduced-motion-behavior-in-regression-checks) | Exercise reduced-motion behavior in regression checks | UNREVIEWED | Some historical coverage; not a new demo |
| [R-072](MASTER_RECOMMENDATIONS.md#r-072--retest-pdfprint-invariants-when-ui-changes-are-proposed) | Retest PDF/print invariants when UI changes are proposed | UNREVIEWED | Some historical coverage; not a new demo |
| [R-073](MASTER_RECOMMENDATIONS.md#r-073--improve-actual-accessibility-tree-verification-coverage) | Improve actual accessibility-tree verification coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-074](MASTER_RECOMMENDATIONS.md#r-074--improve-rendered-browser-positioning-verification-coverage) | Improve rendered browser-positioning verification coverage | UNREVIEWED | Some historical coverage; not a new demo |
| [R-075](MASTER_RECOMMENDATIONS.md#r-075--improve-authenticated-end-to-end-coverage-using-appropriate-safe-fixtures) | Improve authenticated end-to-end coverage using appropriate safe fixtures | UNREVIEWED | Some historical coverage; not a new demo |
| [R-076](MASTER_RECOMMENDATIONS.md#r-076--test-long-curriculum-labels-in-the-stream-disclosure-demo) | Test long curriculum labels in the stream-disclosure demo | UNREVIEWED | Some historical coverage; not a new demo |
| [R-077](MASTER_RECOMMENDATIONS.md#r-077--test-long-email-content-in-the-responsive-demo) | Test long email content in the responsive demo | UNREVIEWED | Some historical coverage; not a new demo |
| [R-078](MASTER_RECOMMENDATIONS.md#r-078--test-actual-200400-percent-browser-zoom) | Test actual 200–400 percent browser zoom | UNREVIEWED | Some historical coverage; not a new demo |
| [R-079](MASTER_RECOMMENDATIONS.md#r-079--test-nested-native-support-dialog-interaction-during-modal-changes) | Test nested native support dialog interaction during modal changes | UNREVIEWED | Some historical coverage; not a new demo |
| [R-080](MASTER_RECOMMENDATIONS.md#r-080--test-tracker-modal-behavior-at-mobile-widths) | Test tracker-modal behavior at mobile widths | UNREVIEWED | Some historical coverage; not a new demo |
| [R-081](MASTER_RECOMMENDATIONS.md#r-081--increase-the-actual-stream-interaction-box-without-visually-inflating-every-badge) | Increase the actual stream interaction box without visually inflating every badge | SELECTED | Demo B |
| [R-082](MASTER_RECOMMENDATIONS.md#r-082--define-the-missing-semantic-shadow-token-in-both-light-and-dark-themes) | Define the missing semantic shadow token in both light and dark themes | UNREVIEWED | NO |
| [R-083](MASTER_RECOMMENDATIONS.md#r-083--reduce-nested-card-repetition-only-where-hierarchy-does-not-require-it) | Reduce nested-card repetition only where hierarchy does not require it | UNREVIEWED | NO |
| [R-084](MASTER_RECOMMENDATIONS.md#r-084--reduce-pill-repetition-only-where-hierarchy-does-not-require-it) | Reduce pill repetition only where hierarchy does not require it | UNREVIEWED | NO |
| [R-085](MASTER_RECOMMENDATIONS.md#r-085--quiet-redundant-surface-treatments-while-preserving-emphasis-on-academic-content) | Quiet redundant surface treatments while preserving emphasis on academic content | UNREVIEWED | NO |
| [R-086](MASTER_RECOMMENDATIONS.md#r-086--quiet-redundant-badge-treatments-while-preserving-emphasis-on-academic-content) | Quiet redundant badge treatments while preserving emphasis on academic content | UNREVIEWED | NO |
| [R-087](MASTER_RECOMMENDATIONS.md#r-087--target-simplification-inside-repeated-metadata-groups-while-preserving-expressive-identity) | Target simplification inside repeated metadata groups while preserving expressive identity | UNREVIEWED | NO |
| [R-088](MASTER_RECOMMENDATIONS.md#r-088--use-spacing-or-dividers-for-structural-grouping-where-elevation-is-unnecessary) | Use spacing or dividers for structural grouping where elevation is unnecessary | UNREVIEWED | NO |
| [R-089](MASTER_RECOMMENDATIONS.md#r-089--suppress-the-faculty-copied-check-pop-keyframe-under-reduced-motion-while-preserving-non-motion-confirmation) | Suppress the faculty copied-check pop keyframe under reduced motion while preserving non-motion confirmation | HOLD | Demo C corrected |

## Task history

| Task | Scope | Status | Next gate |
| --- | --- | --- | --- |
| [TASK_001](TASK_001/TASK_REVIEW_001.md) | Available-source extraction and review-branch publication only | READY FOR INDEPENDENT REVIEW (preliminary) | Independent ChatGPT review; owner instruction before any demo |

No new candidate was selected for demonstration this turn. Latest owner GitHub workflow overrides the earlier “create first pending demo now” instruction. The overall review queue remains incomplete until every retained proposal receives an explicit owner disposition.
