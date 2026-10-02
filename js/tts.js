// Audio playback: prefers a pre-recorded file (audio/words/<id>.mp3 or
// audio/sentences/<id>.mp3) when one exists, and falls back to the browser's
// built-in speech synthesis otherwise. This means the site works with zero
// setup, and silently gets better the moment real audio files are dropped in
// — no code changes needed. See audio/README.md for the naming convention.
const TTS = (() => {
  const RATE_KEY = "engcourse_tts_rate";
  const VOICE_KEY = "engcourse_tts_voice";
  const LANG = "en-US";
  const EXTENSIONS = ["mp3", "ogg", "wav"];
  // macOS/iOS ship en-US novelty voices (Bubbles, Zarvox, ...) that are useless for learning pronunciation.
  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|grandma|grandpa|rocko|eddy|flo|reed|sandy|shelley)\b/i;
  const missingCache = new Set();
  let voices = [];
  let currentAudio = null;

  const isUS = (v) => (v.lang || "").replace("_", "-").toLowerCase() === "en-us";

  function voiceScore(v) {
    const n = v.name;
    if (/natural|neural|online/i.test(n)) return 5;
    if (/premium/i.test(n)) return 4;
    if (/enhanced/i.test(n) || /^google us english/i.test(n)) return 3;
    if (/samantha|ava|allison|aria|jenny|zoe|nicky|susan/i.test(n)) return 2;
    return 1;
  }

  function refreshVoices() {
    if (typeof speechSynthesis === "undefined") return [];
    voices = speechSynthesis.getVoices()
      .filter((v) => isUS(v) && !NOVELTY.test(v.name))
      .sort((a, b) => voiceScore(b) - voiceScore(a));
    return voices;
  }

  if (typeof speechSynthesis !== "undefined") {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function getVoices() {
    return voices.length ? voices : refreshVoices();
  }

  function getRate() {
    const v = parseFloat(localStorage.getItem(RATE_KEY));
    return Number.isFinite(v) ? v : 1;
  }

  function setRate(v) {
    localStorage.setItem(RATE_KEY, String(v));
  }

  function getVoiceName() {
    return localStorage.getItem(VOICE_KEY) || "";
  }

  function setVoiceName(name) {
    localStorage.setItem(VOICE_KEY, name || "");
  }

  // A previously saved non-US voice is ignored because the list only holds en-US voices.
  // If the device has no US voice at all, fall back to any English voice rather than
  // letting the engine read English with e.g. a Chinese voice.
  function pickVoice() {
    const wanted = getVoiceName();
    const list = getVoices();
    if (wanted) {
      const found = list.find((v) => v.name === wanted);
      if (found) return found;
    }
    if (list[0]) return list[0];
    if (typeof speechSynthesis === "undefined") return null;
    return speechSynthesis.getVoices().find((v) => /^en/i.test(v.lang || "")) || null;
  }

  function speakBrowser(text) {
    return new Promise((resolve) => {
      if (typeof speechSynthesis === "undefined") {
        resolve(false);
        return;
      }
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANG;
      const v = pickVoice();
      if (v) utter.voice = v;
      utter.rate = getRate();
      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);
      speechSynthesis.speak(utter);
    });
  }

  function tryFile(kind, id, extIndex = 0) {
    return new Promise((resolve) => {
      if (extIndex >= EXTENSIONS.length) {
        resolve(false);
        return;
      }
      const src = `audio/${kind}s/${id}.${EXTENSIONS[extIndex]}`;
      const audio = new Audio(src);
      audio.playbackRate = getRate();
      audio.onerror = () => resolve(tryFile(kind, id, extIndex + 1));
      audio.oncanplaythrough = () => {
        currentAudio = audio;
        audio.play().then(() => resolve(true)).catch(() => resolve(false));
      };
      audio.load();
    });
  }

  async function speak(text, opts = {}) {
    const { kind, id } = opts;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();

    const cacheKey = kind && id ? `${kind}:${id}` : null;
    if (cacheKey && !missingCache.has(cacheKey)) {
      const played = await tryFile(kind, id);
      if (played) return true;
      missingCache.add(cacheKey);
    }
    return speakBrowser(text);
  }

  function stop() {
    if (currentAudio) currentAudio.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  return { speak, stop, getVoices, getRate, setRate, getVoiceName, setVoiceName };
})();
