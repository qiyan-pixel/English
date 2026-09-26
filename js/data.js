// Loads all site content (data/*.json) once at startup.
const AppData = (() => {
  let loaded = null;

  async function loadAll() {
    if (loaded) return loaded;
    const files = ["lessons", "vocabulary", "sentences", "translations", "dialogues", "questions"];
    const results = await Promise.all(
      files.map((f) => fetch(`data/${f}.json`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load data/${f}.json (${r.status})`);
        return r.json();
      }))
    );
    const [lessons, vocabulary, sentences, translations, dialogues, questions] = results;
    loaded = { lessons, vocabulary, sentences, translations, dialogues, questions };
    return loaded;
  }

  function get() {
    if (!loaded) throw new Error("AppData not loaded yet");
    return loaded;
  }

  return { loadAll, get };
})();

// Small shared helpers for grading typed answers, used by vocab/sentence/translation modes.
const Util = (() => {
  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/[.,!?;'"’‘""()]/g, "")
      .replace(/\s+/g, " ");
  }

  function isCloseMatch(a, b) {
    return normalize(a) === normalize(b);
  }

  // Same tokenization as normalize() (strip punctuation, collapse whitespace)
  // but case preserved, so diff feedback can show "I" / "What" properly.
  function tokenizePreserveCase(s) {
    return (s || "")
      .trim()
      .replace(/[.,!?;'"’‘""()]/g, "")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter(Boolean);
  }

  // Word-level diff for dictation feedback: returns arrays of {text, ok} tokens
  // aligned against the target, using a simple LCS-based alignment so extra/
  // missing words don't cascade into a wall of red. Comparison is
  // case-insensitive, but the returned text keeps the target's original case.
  function wordDiff(target, attempt) {
    const t = normalize(target).split(" ").filter(Boolean);
    const tDisplay = tokenizePreserveCase(target);
    const a = normalize(attempt).split(" ").filter(Boolean);
    const dp = Array.from({ length: t.length + 1 }, () => new Array(a.length + 1).fill(0));
    for (let i = 1; i <= t.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        dp[i][j] = t[i - 1] === a[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    const result = [];
    let i = t.length, j = a.length;
    const stack = [];
    while (i > 0 && j > 0) {
      if (t[i - 1] === a[j - 1]) {
        stack.push({ text: tDisplay[i - 1], ok: true });
        i--; j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        stack.push({ text: tDisplay[i - 1], ok: false });
        i--;
      } else {
        j--;
      }
    }
    while (i > 0) { stack.push({ text: tDisplay[i - 1], ok: false }); i--; }
    stack.reverse();
    return stack;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { normalize, isCloseMatch, wordDiff, shuffle, escapeHtml };
})();
