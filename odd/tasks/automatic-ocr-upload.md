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
- [x] U1: Implement approved upload composition and behavior, computed output summary, optional metadata omission and returned-document processing links; targeted RED/GREEN regressions and production build. Route: delegated direct; multi-file/preparation/execution triggers.
- [x] U2: Verify functional/visual behavior at desktop/mobile, including empty, mixed selection, invalid file, busy, error and saved handoff; record evidence and any unavailable checks. Browser checks cover selection only; busy/error/saved network states use unit mocks, and preview is unavailable due to browser security. Route: delegated verification where applicable, parent bounded visual inspection.

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
- U1 completed in work-unit commit `f98f8a2` (`feat(uploads): focus file intake on automatic OCR and output summary`). Parent structural readback and a second full 48-test run passed; source/test bytes remained frozen after verification.
- Removed simulated scanning stepper, scanner/DPI inputs, mandatory per-file legibility flags, static manual-review badge and duplicate confirmation. Optional metadata is omitted; stored historical data is unchanged.
- Preserved preview/remove/order controls and file/type/size limits. Added computed document output summary, safe destination changes, selection-preserving failures and actual returned-ID processing links on existing routes.
- Observed RED: targeted test compilation failed before source implementation because summary/savedDocuments/changeRecord were absent and the old reviewed property was mandatory.
- Observed GREEN: targeted regression run passed 15 tests; after adding rendered-link and boundary/error regressions, `npm test -- --watch=false` passed all 48 tests in 5 files, including 18 upload tests.
- `npm run build` passed. Initial transfer estimate 85.50 kB; upload lazy chunk transfer estimate 4.71 kB.
- Source normalization completed with Prettier before final functional checks. Scoped Impeccable detector ran once after the build and returned an empty finding list. `git diff --check` passed (only Git line-ending notices).
- Source/test authored diff: 890 functional lines; U1 commit totals 938 authored lines including the recovery document. Cached feature-branch-chain strategy remains selected. The forecast overage is a coherent composition replacement plus explicit responsive styles and tests, not compressed or artificially split for size.
- Native assessment of `main..HEAD`: medium risk, 1720 lines, `review_due=false`, reason `under_budget`. Reviewed boundary remains `main`, pending; no approved review or acknowledgement is claimed. No native START, publish, push, PR or merge was performed.

## U2 observed runtime verification
- Parent verified the actual application with CUA at `http://localhost:4200`: test login succeeded, then the existing expediente Add documents route displayed the updated component through the already-running development server. No backend restart or deployment was required.
- Desktop viewport 1440x1000 and mobile viewport 390x844 displayed without horizontal overflow. Observed root scroll width equaled client width: desktop 1440; mobile 390, or 375 with scrollbar.
- Selected only synthetic fixtures client-side: `pagina-01.png` through `pagina-08.png` and `anexo-01.pdf`, `anexo-02.pdf`, from `output/automatic-ocr-upload-qa/fixtures/` under the parent workspace. The output summary showed three documents: one PDF from eight image files plus two independent PDFs.
- Selecting `invalid.txt` produced an actionable format-validation dialog. Dismissing it retained all ten valid selected files.
- Keyboard Enter on the reorder-up control for pagina-02 changed the first row; order was then restored. A roughly 90-character PNG filename was added and removed; the mobile layout retained no horizontal overflow.
- Browser preview was attempted once and explicitly blocked by browser security on blob navigation. Preview runtime/visual verification is unavailable, not a passed check or an application defect; no workaround, retry or alternate browser was used.
- Busy guards, failure selection retention, saved response IDs and rendered existing detail links are proven only by deterministic unit mocks. No real network save or completed OCR cycle was exercised in U2. Save was never clicked; no expediente record, document or OCR job was created by this verification.
- Desktop/mobile evidence exists at `C:/Users/Bienvenido/OneDrive/Documentos/SistemaDeBusqueda2.0/output/automatic-ocr-upload-qa/desktop.jpg`, `mobile.jpg`, and clean unselected viewport `desktop-final.jpg` in that directory. Header and global navigation styles were unchanged; no code corrections were needed after the bounded visual pass, and the detector was not rerun.
- Browser viewport was reset; the test session was logged out and its tab closed. No credentials or session tokens were stored in artifacts.

## Remaining limitations and next step
- Optional real new-document save and eventual OCR completion validation remain unperformed; do not present mocked save/processing handoff as an end-to-end production pass.
- Preview verification remains browser-security-blocked. Source/test changes are frozen; documentation-only structural readback and a documentation work-unit commit remain for the parent.
- Memory mirror remains pending due to unresolved multi-repository provider context. No memory mutation was performed by this writer.