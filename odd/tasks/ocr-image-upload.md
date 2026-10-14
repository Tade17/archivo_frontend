# OCR and ordered image uploads — frontend

## Recovery locator
Full feature document: ../archivo_backend/odd/tasks/ocr-image-upload.md (sibling repository).

## Authorized frontend task
- [ ] T3: Remove global batch-navigation entry while keeping /digitalizar and Add documents from expediente details; clarify image grouping and preserve selected order in creation and later upload.
- Route: delegated; multi-file UI implementation and verification.
- Branch: fix/ocr-image-upload; delivery_strategy: ask-on-risk; chain_strategy: feature-branch-chain.
- Preserve existing visual language and Spanish UI; no redesign or unrelated changes.
- Verify targeted tests, npm test -- --watch=false and npm run build.
- Native RDD on globally; no consent inferred for individual candidates.
- No push, PR, or merge authorized.
- Commit, check results and review boundary pending.
- Engram mirror pending: ambiguous workspace and user requested no save now.

## T3 verification and readiness
- Implementation complete; parent commit/native assessment pending. Only the global menu entry was removed. `/digitalizar` and the expediente-detail `Añadir documentos` link/query binding remain unchanged.
- Both upload flows explain ordered image grouping, TIFF internal page order, separate PDFs, original preservation and automatic OCR after saving. No synchronous OCR-success claim was added. Creation now has accessible move-up/down controls and numbered upload order; later upload supports both directions with boundary/busy guards.
- Both selections reject more than 100 files and more than 20 MB of images before upload; the existing 150 MB overall cap remains. Separate PDFs do not consume the grouped-image limit. Existing error recovery and retry behavior retained.
- RED: `npm test -- --watch=false` observed five expected failures (global menu, missing initial reorder, invalid later move, image-total limit in both flows).
- GREEN, final bytes: `npm test -- --watch=false` passed all 15 tests across 4 files; `npm run build` passed. Tests cover both submitted FormData orders, retained route/query binding, limits, busy/boundary protection and upload-failure recovery.
- Source normalization completed before final checks; accidental normalization of untouched sections was restored to avoid unrelated formatting churn. `git diff --check` passed. Impeccable detector ran once on the three UI sources and returned no findings. Context helper was not rerun.
- Runtime inspected read-only: existing Angular `ng serve` process PID 32988 belongs to this checkout and listens on `::1:4200`. No process restarted or killed. Development server may refresh changed UI; production activation and browser desktop/mobile visual inspection remain for the parent. Backend was not changed or restarted during T3.
- Authored T3 behavior/test changes: 456 additions plus deletions, excluding this task document. One coherent UI unit; no tests or whitespace removed to fit the advisory budget. Rollback surface: the three components and their three new specs.
- Backend recovery references: T1 `91ab901`, T2 `e0225b9`; parent independent verification passed 46 Java tests and migration inventory V1–V12. Native provider assessment main..HEAD medium, 1292 lines, `review_due=false`, `under_budget`; retain this exact outcome without reinterpreting it. Backend deployment remains parent-owned.
