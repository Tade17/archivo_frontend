# File intake for automatic OCR

## Objective
Reframe the existing Add documents screen around the operator's actual tasks: confirm destination, select and order files, understand the resulting documents, and open automatic OCR processing.

## Authorization and scope
- User approved the proposed distribution while preserving the incumbent municipal visual identity.
- Only the existing upload route/component and its tests; no new routes, OCR engine changes, stored metadata deletion, notifications, page editor, or configurable image groups.
- Compact expediente context, immediate file queue, existing preview/remove/order controls, useful output summary, and truthful save-versus-processing handoff.
- Remove scanner/DPI input and mandatory per-file manual-review gates from this screen. Omit optional capture metadata rather than asserting a measured default resolution.
- Preserve actual file count, size/type and combined-image limits, original retention, authentication and busy/error recovery.
- All images produce one PDF in selected order; PDFs remain separate. File counts must not be represented as page counts, especially for multipage TIFF.
- Professional Spanish UI; code/recovery artifacts in English. Existing fonts, colors and shared components remain authoritative.

## Delivery
- Branch: fix/ocr-image-upload; main untouched; no push/PR/merge.
- delivery_strategy: ask-on-risk; chain_strategy: feature-branch-chain (already selected).
- Forecast: 450–650 authored additions/deletions, generated files excluded; preserve coherent behavior and tests if actual exceeds the advisory estimate.
- Native review mode previously on; read effective mode and use provider-owned assessment/consent. Boundary remains main until acknowledged review.
- Memory mirror pending: unresolved multi-repository provider context; local document is recovery source.

## Tasks
- [ ] U1: Implement approved upload composition and behavior, computed output summary, optional metadata omission and returned-document processing links; targeted RED/GREEN regressions and production build. Route: delegated direct; multi-file/preparation/execution triggers.
- [ ] U2: Verify functional/visual behavior at desktop/mobile, including empty, mixed selection, invalid file, busy, error and saved handoff; record evidence and any unavailable checks. Route: delegated verification where applicable, parent bounded visual inspection.

## Acceptance and checks
- No scanner-profile/fake scanning stepper/static manual-review status or per-file checkbox gate.
- One clear Save documents action; automatic OCR explanation and brief source-quality/order reminder, not a duplicate routine confirmation.
- 8 images + 2 PDFs is three resulting documents; zero/PDF-only/image-only/mixed/TIFF cases calculated correctly without inventing pages.
- Existing previews/removal/reordering and limits remain functional. No uploads while destination/busy/validation preconditions fail.
- Upload/save success retains actual returned document IDs and existing detail links, not a fabricated OCR completion state. Upload failure retains recoverable selection.
- Keyboard/focus/live status and responsive composition checked; no new package or backend API change without a scoped necessity review.
- npm test -- --watch=false, npm run build, detector once, git diff --check.
- Source normalization precedes final checks and review freeze. Record exact observed results, commit identities, actual line count and review outcome.

## Progress
- Existing screenshot and code audited read-only; user approved the proposed composition.
- U1 implementation ready for parent readback and work-unit commit; U1 remains unchecked until commit evidence is recorded.
- Removed simulated scanning stepper, scanner/DPI inputs, mandatory per-file legibility flags, static manual-review badge and duplicate confirmation. Optional metadata is omitted; stored historical data is unchanged.
- Preserved preview/remove/order controls and file/type/size limits. Added computed document output summary, safe destination changes, selection-preserving failures and actual returned-ID processing links on existing routes.
- Observed RED: targeted test compilation failed before source implementation because summary/savedDocuments/changeRecord were absent and the old reviewed property was mandatory.
- Observed GREEN: targeted regression run passed 15 tests; after adding rendered-link and boundary/error regressions, `npm test -- --watch=false` passed all 48 tests in 5 files, including 18 upload tests.
- `npm run build` passed. Initial transfer estimate 85.50 kB; upload lazy chunk transfer estimate 4.71 kB.
- Source normalization completed with Prettier before final functional checks. Scoped Impeccable detector ran once after the build and returned an empty finding list. `git diff --check` passed (only Git line-ending notices).
- Current source/test authored diff: 648 additions + 242 deletions = 890 lines, excluding this recovery document. Over forecast because the coherent template/composition and explicit responsive styles replace the old layout, with regression coverage kept alongside behavior; no artificial slicing or test removal.
- Runtime/browser validation is pending U2. No live upload/OCR, service restart, commit, native review START, remote publication, or credentials use performed by the writer.
- Expected responsive composition: compact destination strip; files left and 330px summary right above 1023px; single column at 1023px or narrower; vertically stacked file selection/destination actions under 600px. Verify actual render, keyboard focus, long names and saved/busy/error states in U2.
- Next: parent structural readback, independent verification and bounded visual U2, then work-unit commit and native risk assessment as applicable. Memory mirror remains pending.
