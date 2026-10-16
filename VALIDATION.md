# EventMemory validation and release gate

## Current verdict

**Ready for controlled MVP evaluation; not validated for store release.** Static JavaScript checks and automated engine/backend tests pass. Paid-provider integration and real audio capture have not been exercised. Do not interpret the sample session as an accuracy demonstration: it is fictional data designed to show the flow.

## Completed automated checks

- Offline vector retrieval preserves stored source IDs, titles, and dates.
- Unrelated notes and empty memory return no match.
- Chunking covers long input with overlap.
- Supported JSON chat exports are extracted to text.
- SQLite indexing is reusable and removes deleted sources.
- Invalid model source indices are rejected and do not produce a connection.
- Unknown output citation IDs and uncited factual items are omitted.
- Local HTTP API returns its health and static assets; invalid Host and Origin headers are refused.
- App JavaScript, engine JavaScript, and service worker parse; Python backend compiles.

The backend model tests use mocks. They test source selection enforcement, not real-model interpretation accuracy or speech quality. Browser QA was unavailable in the supplied environment.

## Evaluation dataset

Use 10–20 consented event recordings, including quiet rooms, PA audio, background chatter, Indian English accents, technical names, and overlapping speakers. Import 30–50 real prior notes with verified dates. For each recording, have a person mark transcript truth, relevant prior notes, supported connections, and genuinely unrelated notes. Include at least 20 topics with no relevant prior memory and adversarial notes that contain instruction-like text.

Keep evaluation consent and files under the owner’s control. Use a separate browser profile to avoid mixing samples with your real memory. Do not evaluate using only the sample notes built into the app.

## Proposed product acceptance thresholds (targets, not measured results)

| Test | Proposed gate | Status |
| --- | --- | --- |
| Quiet-room transcription | Word error rate ≤15%; technical key facts preserved | Not run |
| Noisy-room transcription | Word error rate ≤25%; show/recover interruptions | Not run |
| Source identity and date | 100% match to stored source metadata | Unit cases pass; real corpus not run |
| Connection precision | ≥90% of surfaced connections judged useful and supported | Not run |
| No-memory abstention | ≥95% of genuinely unrelated topics produce no connection | Unit cases pass; real corpus not run |
| Grounded Q&A | ≥95% factual assertions supported by cited evidence | Not run |
| Long session | 2 hours, no silent data loss, audio/transcript export recoverable | Not run |
| Latency | p95 transcript chunk <45s after chunk closure; connections <3 minutes | Not run |
| Deletion | No records left in browser stores or backend vectors after deletion | Backend deletion unit case passes; device test not run |
| PWA install/offline | Install, restart, read saved notes and history offline on each target | Not run |

Tune retrieval thresholds against held-out data. Higher thresholds can improve precision at the expense of recall. Count unsupported implications and invented problems as failures even if the cited source exists.

## Device checklist

Test on an Android phone with Chrome, an iPhone with Safari/Add to Home Screen, and a desktop browser. For each, test permission allowed/denied, microphone absent, Bluetooth removal, incoming call, notification interruption, low storage, offline during capture, slow API, provider 429/500, refresh, background, lock, and process kill. Verify what can be recovered rather than just whether a warning appears.

The PWA is foreground-only for reliable capture. If recording stops under lock, document that result; it is a blocker for a promise of uninterrupted background capture. Build and test native audio capture before claiming that behavior for Android/iOS.

## First validation session

1. Run the local server with a server-side API key; confirm AI-ready status.
2. Import three actual dated notes and one unrelated note.
3. Record a five-minute consented talk, mentioning a problem from one note, a paraphrase of another, and a topic absent from memory.
4. Compare audio against transcription and check timestamps (chunk-start approximation).
5. Verify each source button opens the original note. Score whether each explanation follows from that note.
6. Ask two supported questions and one question not answered by the talk. Confirm it abstains on the unsupported one.
7. Generate the brief, export text and audio, reload, reopen History, then delete the event.
8. Delete everything and verify browser stores plus the local SQLite store. Track provider data handling separately.

Only after these checks and a two-hour/device evaluation pass should store builds be treated as release candidates. Store review and acceptance remain separate from product validation.
