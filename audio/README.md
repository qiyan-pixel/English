# Optional pre-recorded audio

The site plays audio for words and sentences using the browser's built-in
speech (Web Speech API) by default — no setup needed.

If you generate better audio yourself (any local TTS tool, or real
recordings), drop the files in here using this naming convention and the
site will automatically prefer them over the browser voice — no code
changes needed:

- Word audio: `audio/words/<id>.mp3` (or `.ogg` / `.wav`)
- Sentence audio: `audio/sentences/<id>.mp3` (or `.ogg` / `.wav`)

The `<id>` is the `id` field from `data/vocabulary.json` or
`data/sentences.json` (e.g. `audio/words/busy.mp3` for the word "busy",
`audio/sentences/s1-01.mp3` for sentence `s1-01`). Dialogue lines use
`<dialogueId>-<lineIndex>.mp3` (e.g. `audio/sentences/d1-greeting-0.mp3`
for the first line of dialogue `d1-greeting`).

You don't need audio for everything — the browser voice fills in any word
or sentence that doesn't have a file yet.
