# OCR and ordered image uploads — frontend

## Recovery locator
Full feature document: `C:/Users/Bienvenido/OneDrive/Documentos/SistemaDeBusqueda2.0/archivo_backend/odd/tasks/ocr-image-upload.md` (sibling repository).

## Authorized frontend task
- [x] T3: Remove global batch-navigation entry while keeping /digitalizar and Add documents from expediente details; clarify image grouping and preserve selected order in creation and later upload. Frontend commit `9167eb9`; parent verified 15 tests.
- Route: delegated; multi-file UI implementation and verification.
- Branch: fix/ocr-image-upload; delivery_strategy: ask-on-risk; chain_strategy: feature-branch-chain.
- Preserve existing visual language and Spanish UI; no redesign or unrelated changes.
- Verify targeted tests, npm test -- --watch=false and npm run build.
- Native RDD on globally; no consent inferred for individual candidates.
- No push, PR, or merge authorized.
- Commit `9167eb9`; native main..HEAD medium/482 lines, `review_due=false`, `under_budget`. Reviewed boundary remains main, slice pending; no fabricated approval or acknowledgement.
- Engram mirror pending: ambiguous workspace and user requested no save now.

## T3 verification and readiness
- Implementation committed and verified. Only the global menu entry was removed. `/digitalizar` and the expediente-detail `Añadir documentos` link/query binding remain unchanged.
- Both upload flows explain ordered image grouping, TIFF internal page order, separate PDFs, original preservation and automatic OCR after saving. No synchronous OCR-success claim was added. Creation now has accessible move-up/down controls and numbered upload order; later upload supports both directions with boundary/busy guards.
- Both selections reject more than 100 files and more than 20 MB of images before upload; the existing 150 MB overall cap remains. Separate PDFs do not consume the grouped-image limit. Existing error recovery and retry behavior retained.
- RED: `npm test -- --watch=false` observed five expected failures (global menu, missing initial reorder, invalid later move, image-total limit in both flows).
- GREEN, final bytes: `npm test -- --watch=false` passed all 15 tests across 4 files; `npm run build` passed. Tests cover both submitted FormData orders, retained route/query binding, limits, busy/boundary protection and upload-failure recovery.
- Source normalization completed before final checks; accidental normalization of untouched sections was restored to avoid unrelated formatting churn. `git diff --check` passed. Impeccable detector ran once on the three UI sources and returned no findings. Context helper was not rerun.
- Runtime: Angular development server PID 32988 belongs to this checkout and listens on `::1:4200`; parent verified frontend HTTP 200. No frontend process restarted or killed during T3. Parent browser reached login only; authenticated desktop/mobile visual inspection and live end-to-end upload were not performed. Backend was not changed or restarted during T3.
- Authored T3 behavior/test changes: 456 additions plus deletions, excluding this task document. One coherent UI unit; no tests or whitespace removed to fit the advisory budget. Rollback surface: the three components and their three new specs.
- Backend recovery references: T1 `91ab901`, T2 `e0225b9`; independent verification passed 46 Java tests and migration inventory V1–V12. Native main..HEAD medium/1292 lines, `review_due=false`, `under_budget`; retain exact provider outcome. Backend restored by parent with Java 24/session-only selector fallback, PID 15860 on 8080; API HTTP 200, unauthenticated originals HTTP 401, Flyway V12 nullable TEXT validated, OCR healthy.

## Recovery and limitations
- Runtime operational command, failed startup evidence and verification checklist are in the absolute backend task locator above and `C:/Users/Bienvenido/OneDrive/Documentos/SistemaDeBusqueda2.0/archivo_backend/OCR.md`. Do not create the documented selector probe directory or persist the temporary JVM property.
- Backup: `C:/Users/Bienvenido/OneDrive/Documentos/SistemaDeBusqueda2.0/output/backups/ocr-image-upload/archivo_sanjose-pre-v12-20261014-120932.dump` (validated PGDMP, 112 entries, 55,461 bytes).
- Successful backend log: `C:/Users/Bienvenido/OneDrive/Documentos/SistemaDeBusqueda2.0/output/backups/ocr-image-upload/backend-recovery-tcp.stdout.log`.
- Both feature-branch slices remain pending from main (about 1292 backend/482 frontend lines); no PR, push or merge. Coupled atomic safety/tests justify the larger unit rather than artificial compression.
- Original images are available through authenticated APIs; a new image-original download UI was not built. No user records created or original PDFs modified; snapshot 4 completed, 2 existing errors, 0 pending.
- Historical Python Unicode suite unavailable (`pypdf` absent); 14 actual OCR rendering/batch tests passed. Live authenticated end-to-end upload and desktop/mobile visual validation remain unchecked.
- Local documents remain authoritative; memory mirror pending ambiguity and user no-save request. Next action is optional authenticated validation or the user's publishing decision, not automatic remote delivery.
