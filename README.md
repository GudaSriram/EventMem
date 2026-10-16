# EventMemory

A mobile-responsive, local-first PWA MVP for in-person event capture and cited personal memory connections. The hosted private version is the browser-local MVP. The optional AI backend runs locally; it is not deployed with the static Site.

## Architecture

1. **Capture:** device microphone → browser recording. Offline mode writes MediaRecorder chunks to IndexedDB every five seconds. AI mode creates independent 30-second mono WAV chunks, saves them to IndexedDB before upload, and submits them to the local backend for OpenAI transcription.
2. **Transcript:** timestamped segments are saved incrementally. Browser speech recognition is opt-in and provider-dependent. Paste/import is always available. Timestamp labels are approximate segment/chunk starts, not exact word timings. There is no speaker diarization in this MVP.
3. **Understanding:** every two minutes, bounded transcript windows are analyzed into topics. The offline version groups keyword topics; AI mode extracts topics with a language model.
4. **Memory:** paste text or import TXT/Markdown/JSON chat exports. Notes are split into overlapping 1,100-character chunks. Offline mode uses sparse lexical vectors. AI mode creates `text-embedding-3-small` embeddings and persists them in a SQLite vector store with model/content hashes. Cosine search is exact over local vectors, suitable for a small personal collection rather than a large multi-user vector database.
5. **Connections:** topic → embedding → memory retrieval → relevance check → source-backed explanation. Source metadata and excerpts are resolved from actual stored notes, never model-created source identities. No accepted match yields “No relevant memory found.” AI interpretations still need human validation; existing citations alone do not prove a claim.
6. **Brief and chat:** AI-generated structured output is checked for known evidence IDs before display. The offline version provides extractive briefs and evidence search. The AI chat searches the whole transcript in chunks. Briefs summarize extracted topics plus bounded supporting excerpts. For very long sessions the brief is not exhaustive.
7. **PWA:** app manifest, PNG icons, service worker app-shell caching. Stored events and notes remain accessible offline. AI and browser-provider speech services still require connectivity.

## Run locally

Requires Python 3.10+; no Python packages are needed. Node is only needed for JavaScript tests.

```bash
cd eventmemory
python3 server.py
```

Open **http://localhost:8765** in Chrome, Edge, or Safari. The default is audio-only capture plus offline lexical retrieval. To try the complete workflow, click **Try a sample session**. This adds clearly labeled fictional notes and a sample transcript. These fictional records can remain in History; distinguish them from your own material.

For live browser transcription without the AI backend, open **Privacy & settings** and opt in to browser speech recognition. Browser support varies; audio may be processed by the browser vendor. Keep the page foregrounded.

For the semantic connection engine and chunk transcription:

```bash
read -rsp 'OpenAI API key: ' OPENAI_API_KEY
export OPENAI_API_KEY
python3 server.py
```

Restarting the server after changing configuration is required. Reload the app and confirm it says **AI ready**. Your API key stays on the server; never put it in browser code or commit it. Provider usage incurs charges. The UI explicitly describes provider processing and obtains recording consent. Importing notes in AI mode sends their text to the embeddings provider.

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CHAT_MODEL` | `gpt-4o-mini` | Topic extraction, connections, brief, Q&A |
| `TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | Audio chunk transcription |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Semantic vectors |
| `RETRIEVAL_THRESHOLD` | `0.32` | Similarity cutoff; calibrate with your evaluation corpus |
| `EVENTMEMORY_DB` | `data/vectors.sqlite3` | Local vector store location |

The backend binds only to loopback and rejects foreign Host/Origin headers. Do not expose it as a public multi-user service. A phone cannot use your laptop’s localhost backend. The hosted PWA supports browser-local capture/import/retrieval, but hosted AI requires a separately secured HTTPS backend with authentication, per-user storage, quotas, and a configured endpoint. Those production features are not included in this local MVP.

## Use

1. **My memory:** add a note title, original discussion date, and content. Choose files to import exports. Unknown dates remain unknown; file modification times are not used as discussion dates. Exported ChatGPT JSON conversations are extracted as text. A file containing many conversations currently has one source title/date; split it for precise per-chat citation metadata.
2. **Workspace:** name the event. Start recording and confirm consent. Keep the app visible. Browser audio-only mode stores audio even when transcription is unavailable.
3. Connections refresh at two-minute intervals; click Refresh to run analysis immediately.
4. Stop recording, wait for pending transcription, generate a brief, and ask questions. AI mode uses approximate 30-second chunk-start timestamps. Offline answers are labeled evidence search.
5. **History:** reopen or delete events. **Settings:** download audio, retry failed AI WAV chunks for the open event, or delete everything. Browser-container recordings export as one file per recording take; AI audio exports as independent WAV files.
6. **My memory → Export all data:** JSON containing notes, events, and briefs. Audio is exported separately. The MVP does not have full backup restoration.

## Install

Visit the hosted HTTPS URL in a supported browser and choose the browser’s Install option. The app also displays an Install button when the browser provides an installation prompt. On iPhone use Safari → Share → Add to Home Screen. Localhost installation works where supported. Service-worker installation behavior must be confirmed on actual target devices, including when the private host redirects to sign-in.

## Verification

```bash
node --check dist/app.js
node --check dist/engine.js
node test_engine.cjs
python3 -m unittest discover -s . -p test_server.py -v
```

Automated tests cover vector similarity, chunk coverage, citation identity/date preservation, unrelated-memory abstention, indexing reuse/removal, invalid model citation rejection, API health/assets, and localhost origin protection. See `VALIDATION.md` for the real-device and human-relevance gate. No successful paid-provider call, real microphone capture, browser visual QA, device installation, or two-hour endurance test was performed in the build environment.

## Privacy and reliability limits

- Browser data and SQLite are local but not encrypted. OS/browser profile access can expose them. There is no multi-user sign-in, end-to-end encryption, cross-device sync, or automated retention policy.
- AI mode sends audio and selected text to OpenAI. Browser speech may use vendor services. Local deletion cannot revoke provider processing already completed, exported files, or external backups.
- Keep the page visible. Screen lock, calls, Bluetooth changes, power saving, and browser process termination may interrupt recording. A wake lock is requested when available but is not a background recording guarantee.
- At 16 kHz mono PCM, two hours of AI capture requires about 230 MB for audio alone. Check available storage and export regularly. The app reports failed writes; quotas and eviction vary by browser.
- WAV chunks are saved before upload and can be retried. Browser recording chunks are persisted every five seconds, but playback requires the full ordered container sequence. A sudden browser kill may lose the active final chunk or produce an incomplete container.
- No room calibration, speaker separation, confidence estimation, or overlapping-speaker recovery. Noise suppression is requested from the device; it does not establish noisy-room accuracy.
- Memory limit: 300 notes and 5 MB text per backend request. Topics and connections are bounded per response. Similarity threshold is a starting point, not a calibrated accuracy score.
- Every displayed connection has stored source metadata; every source should still be inspected for factual support. Generative text can make a mistaken interpretation even with valid citations. The MVP cannot promise zero hallucinations.

## Android and iOS release path

This delivery is a PWA and local AI backend, not signed store binaries. Validate first, then implement the native capture layer (for example, a Capacitor shell with custom native audio capture and encrypted storage). Preserve the web UI and retrieval contracts.

Android needs foreground microphone recording and a visible recording notification. iOS needs a native AVAudioSession recorder with microphone purpose strings and correctly justified background audio behavior. A plain WebView wrapper does not fix browser microphone lifecycle limits or establish App Store acceptance.

After the validation gate passes: create the native projects, connect a production authenticated backend or on-device model pipeline, test native interruptions and background capture, add privacy policy and store disclosures, then use Play internal testing and TestFlight before production submission. Store publication requires the owner’s developer accounts, signing identities, application ID, privacy/support URLs, and review materials. No app has been submitted to either store.

Official release references:
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.android.com/develop/background-work/services/fgs/service-types
- https://developer.android.com/develop/background-work/services/fgs/declare

## Paused project / GitHub Pages

The project is parked for later work. GitHub Pages publishes `dist/` using the included Actions workflow. In repository Settings → Pages, select GitHub Actions. The Python backend is preserved for local use and is not run by Pages.

Open `?examples=1` to add the three retained fictional test sessions without overwriting existing records. Browser data belongs to each origin: records on the original Sites URL do not automatically appear on GitHub Pages. Keep the old site available and export valuable data there.

The prototype has not validated automatic access to consumer AI chat history or personal memory. The next product experiment is a user-reviewed goals summary plus a real event transcript, with evidence-backed connections and a useful next action.
