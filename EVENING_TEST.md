# Evening companion: first test

Open the site with `#evening`, or choose **Evening recap**.

1. Choose **Try the fan-out / fan-in example**. This loads an edited recollection of an idea from Build with Gemini on 13 October 2026, not a recovered event recording.
2. Review the current problem, constraints, excerpt and source. Nothing is recorded or sent automatically.
3. Allow the form inputs to be used, then choose **Create my evening recap**.
4. Check the two sources. The local result proposes two independent analysis perspectives followed by one evidence check. It is a prepared, narrowly matched test rule, not general AI synthesis or a claim that parallel work improves reasoning.
5. Allow voice playback and choose **Listen** if an on-device English voice is available. Browser and device support vary; there is no external voice fallback.
6. Mark the result useful, already known, or irrelevant. Run the suggested comparison and assess whether the extra perspectives actually change a decision.

Try an unrelated event excerpt or a different goal. The local test should decline to force a connection.

## Real synthesis

On the static hosted sites, expand **Try real synthesis with my own assistant**. Copy the prepared prompt, use it in your assistant, and paste its JSON response back. No account is connected automatically. The import checks exact quotes and derives source labels from your form, but cannot prove that the interpretation is correct.

When running `python server.py` locally with the existing backend configuration, enable AI in the evening form and separately authorize the provider request. Only the current form inputs are sent to the existing model provider, with no automatic memory import. `/api/evening-recap` rejects missing consent and invalid evidence.

## Storage and limits

- Saving context, the latest recap and feedback is optional and device-local. **Clear saved evening context & recap** and the existing **Delete everything** control remove it. **Export all data** includes saved evening data.
- The local example works with no provider key. Arbitrary synthesis requires the manual assistant flow or the local AI backend.
- This update does not add automatic evening notifications, background listening, access to past AI chats, or a cloud AI service.
- Test on the same site address where your prior recordings are stored. Browser storage is separate between GitHub Pages and the original Site.

## Validation

Run `node test_engine.cjs`, `node test_recap.cjs`, and `python -m unittest -v test_server test_evening`.
The new tests cover consent gates, source identity, invented quote rejection, unrelated-input fallback, optional storage, voice gating, stale AI responses and deletion. The UI handler tests use a lightweight control fixture; they are not a browser rendering or microphone test. Provider output is mocked, so these checks do not validate a live paid AI call.
