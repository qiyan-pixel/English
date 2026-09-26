// Audio playback: prefers a pre-recorded file (audio/words/<id>.mp3 or
// audio/sentences/<id>.mp3) when one exists, and falls back to the browser's
// built-in speech synthesis otherwise. This means the site works with zero
// setup, and silently gets better the moment real audio files are dropped in
// — no code changes needed. See audio/README.md for the naming convention.
const TTS = (() => {
  const RATE_KEY = "engcourse_tts_rate";
  const VOICE_KEY = "engcourse_tts_voice";
  const EXTENSIONS = ["mp3", "ogg", "wav"];
  const missingCache = new Set();
  let voices = [];
  let currentAudio = null;

  function refreshVoices() {
    if (typeof speechSynthesis === "undefined") return [];
    voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
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

  function pickVoice() {
    const wanted = getVoiceName();
    const list = getVoices();
    if (wanted) {
      const found = list.find((v) => v.name === wanted);
      if (found) return found;
    }
    // Prefer an "Online"/"Natural" sounding voice if present, then any en-US, then any English voice.
    return (
      list.find((v) => /online|natural/i.test(v.name)) ||
      list.find((v) => v.lang.toLowerCase() === "en-us") ||
      list[0] ||
      null
    );
  }

  function speakBrowser(text) {
    return new Promise((resolve) => {
      if (typeof speechSynthesis === "undefined") {
        resolve(false);
        return;
      }
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
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
