// Optional AI chat: bring-your-own Anthropic API key, called directly from
// the browser (the key never leaves this device — there is no backend).
// The system prompt hands the model the exact courseware vocabulary and
// asks it to stay inside it; this is best-effort, not a hard guarantee,
// which is why the site also ships the fully static, guaranteed-in-scope
// Dialogue & Questions mode as the non-AI alternative.
const ChatView = (() => {
  const KEY_STORAGE = "engcourse_api_key";
  const MODEL_STORAGE = "engcourse_api_model";
  const API_URL = "https://api.anthropic.com/v1/messages";
  const MAX_HISTORY = 16;

  let container = null;
  let lessonFilter = "all";
  let history = [];
  let sending = false;

  function getKey() { return localStorage.getItem(KEY_STORAGE) || ""; }
  function getModel() { return localStorage.getItem(MODEL_STORAGE) || "claude-haiku-4-5-20251001"; }
  function saveKey(k) { localStorage.setItem(KEY_STORAGE, k || ""); }
  function saveModel(m) { localStorage.setItem(MODEL_STORAGE, m || ""); }

  function buildSystemPrompt() {
    const { vocabulary, lessons } = AppData.get();
    const scoped = lessonFilter === "all" ? vocabulary : vocabulary.filter((v) => v.lesson <= lessonFilter);
    const words = [...new Set(scoped.map((v) => v.en.replace(/\s*\(.*?\)\s*/g, "")))];
    const lessonNote = lessonFilter === "all"
      ? "the learner has finished all 6 lessons"
      : `the learner has finished lesson ${lessonFilter} of 6 (${lessons.find((l) => l.id === lessonFilter)?.title || ""})`;
    return [
      "You are a warm, patient English conversation partner for a Chinese-speaking beginner/elementary English learner, helping them adapt to daily life abroad.",
      `Right now ${lessonNote}.`,
      "IMPORTANT VOCABULARY RULE: only use words from this list, plus basic grammar words (a, an, the, is/am/are/was/were, pronouns, numbers, simple prepositions and question words). Do not use any other content word, even a common one, if it is not on this list:",
      words.join(", "),
      "Keep every reply short: 1-3 short sentences, under 30 words total. Use simple present/past tense matching the lesson. End most replies with a simple follow-up question to keep the conversation going.",
      "If the learner writes in Chinese, gently reply in English using only the allowed words, and encourage them to try English.",
      "Never introduce new vocabulary beyond the list above. If you must refer to something outside the list, describe it using only allowed words instead.",
    ].join("\n\n");
  }

  function renderKeyPrompt() {
    container.querySelector("#chatArea").hidden = true;
    const panel = container.querySelector("#chatKeyPanel");
    panel.hidden = false;
    panel.innerHTML = `
      <div class="exercise-card">
        <p>还没有设置 API Key，无法使用自由对话功能。</p>
        <p class="hint">去"设置"里填写你自己的 Anthropic API Key（只保存在这台设备的浏览器里）。如果你还没有 Key，可以在 <b>console.anthropic.com</b> 申请。</p>
        <button class="btn primary" id="openSettingsFromChat">⚙️ 去设置 API Key</button>
      </div>
    `;
    container.querySelector("#openSettingsFromChat").addEventListener("click", () => {
      if (window.openSettingsModal) window.openSettingsModal();
    });
  }

  function addBubble(role, text) {
    const log = container.querySelector("#chatLog");
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    if (role === "assistant") {
      const btn = document.createElement("button");
      btn.className = "audio-btn small";
      btn.style.marginLeft = "8px";
      btn.textContent = "🔊";
      btn.addEventListener("click", () => TTS.speak(text, {}));
      div.appendChild(document.createElement("br"));
      div.appendChild(btn);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function addSystemNote(text) {
    const log = container.querySelector("#chatLog");
    const div = document.createElement("div");
    div.className = "chat-msg system-note";
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function sendMessage(text) {
    if (sending) return;
    sending = true;
    addBubble("user", text);
    history.push({ role: "user", content: text });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    const btn = container.querySelector("#chatForm button");
    btn.disabled = true;
    addSystemNote("Claude is typing...");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": getKey(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: getModel(),
          max_tokens: 200,
          system: buildSystemPrompt(),
          messages: history,
        }),
      });
      container.querySelector("#chatLog .system-note:last-child")?.remove();
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        addSystemNote(`⚠️ 出错了：${msg}`);
        if (res.status === 401) addSystemNote("请检查设置里的 API Key 是否正确。");
        history.pop();
        return;
      }
      const reply = (data.content || []).map((b) => b.text).join("").trim();
      addBubble("assistant", reply || "(no response)");
      history.push({ role: "assistant", content: reply });
    } catch (err) {
      container.querySelector("#chatLog .system-note:last-child")?.remove();
      addSystemNote(`⚠️ 网络请求失败：${err.message}`);
      history.pop();
    } finally {
      sending = false;
      btn.disabled = false;
    }
  }

  function renderChat() {
    container.querySelector("#chatKeyPanel").hidden = true;
    const area = container.querySelector("#chatArea");
    area.hidden = false;
    const { lessons } = AppData.get();
    container.querySelector("#chatTopicLabel").textContent = lessonFilter === "all"
      ? "词汇范围：全部 6 课"
      : `词汇范围：截止到第 ${lessonFilter} 课（${lessons.find((l) => l.id === lessonFilter)?.title || ""}）`;
    if (!container.dataset.wired) {
      container.dataset.wired = "1";
      container.querySelector("#chatForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = container.querySelector("#chatInput");
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        sendMessage(text);
      });
      container.querySelector("#chatClearBtn").addEventListener("click", () => {
        history = [];
        container.querySelector("#chatLog").innerHTML = "";
        addSystemNote("对话已清空 — Conversation cleared.");
      });
    }
  }

  function render() {
    if (!container) return;
    if (getKey()) renderChat();
    else renderKeyPrompt();
  }

  function init(el, lesson) {
    container = el;
    lessonFilter = lesson;
    render();
  }

  function setLesson(lesson) {
    lessonFilter = lesson;
    if (container) render();
  }

  return { init, setLesson, render };
})();
