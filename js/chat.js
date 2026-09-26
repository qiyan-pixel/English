// Optional AI chat: bring-your-own API key, called directly from the browser
// (the key never leaves this device — there is no backend). Supports the
// Anthropic API natively, plus a generic "OpenAI-compatible" path that also
// covers OpenAI itself and most Chinese providers (DeepSeek, Kimi/Moonshot,
// Qwen/DashScope, Zhipu GLM, ...) since they all expose an OpenAI-shaped
// /chat/completions endpoint. The system prompt hands the model the exact
// courseware vocabulary and asks it to stay inside it; this is best-effort,
// not a hard guarantee, which is why the site also ships the fully static,
// guaranteed-in-scope Dialogue & Questions mode as the non-AI alternative.
const ChatView = (() => {
  const KEYS = {
    provider: "engcourse_api_provider",
    anthropicKey: "engcourse_api_key",
    anthropicModel: "engcourse_api_model",
    compatKey: "engcourse_api_key_compat",
    compatModel: "engcourse_api_model_compat",
    compatBaseUrl: "engcourse_api_baseurl_compat",
  };
  const MAX_HISTORY = 16;

  let container = null;
  let lessonFilter = "all";
  let history = [];
  let sending = false;

  function getProvider() { return localStorage.getItem(KEYS.provider) || "anthropic"; }
  function setProvider(p) { localStorage.setItem(KEYS.provider, p); }

  function getAnthropicKey() { return localStorage.getItem(KEYS.anthropicKey) || ""; }
  function getAnthropicModel() { return localStorage.getItem(KEYS.anthropicModel) || "claude-haiku-4-5-20251001"; }
  function getCompatKey() { return localStorage.getItem(KEYS.compatKey) || ""; }
  function getCompatModel() { return localStorage.getItem(KEYS.compatModel) || ""; }
  function getCompatBaseUrl() { return localStorage.getItem(KEYS.compatBaseUrl) || ""; }

  function hasActiveKey() {
    return getProvider() === "anthropic" ? !!getAnthropicKey() : !!(getCompatKey() && getCompatBaseUrl() && getCompatModel());
  }

  function normalizeBaseUrl(url) {
    return (url || "").trim().replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  }

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

  async function callAnthropic() {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": getAnthropicKey(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: getAnthropicModel(),
        max_tokens: 200,
        system: buildSystemPrompt(),
        messages: history,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, status: res.status, message: data?.error?.message };
    return { ok: true, text: (data.content || []).map((b) => b.text).join("").trim() };
  }

  async function callOpenAICompatible() {
    const base = normalizeBaseUrl(getCompatBaseUrl());
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${getCompatKey()}`,
      },
      body: JSON.stringify({
        model: getCompatModel(),
        max_tokens: 200,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...history],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, status: res.status, message: data?.error?.message };
    return { ok: true, text: (data.choices?.[0]?.message?.content || "").trim() };
  }

  // Minimal ad-hoc call using whatever credentials are currently typed into
  // the settings form (not necessarily saved yet), for the Settings page's
  // "Test Connection" button.
  async function testConnection({ provider, key, baseUrl, model }) {
    try {
      let res, data;
      if (provider === "anthropic") {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "Hi" }] }),
        });
        data = await res.json();
        if (!res.ok) return { ok: false, message: data?.error?.message || `HTTP ${res.status}` };
        return { ok: true };
      }
      const base = normalizeBaseUrl(baseUrl);
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "Hi" }] }),
      });
      data = await res.json();
      if (!res.ok) return { ok: false, message: data?.error?.message || `HTTP ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, message: `${err.message}（可能是这个服务商不支持网页直接调用 / CORS）` };
    }
  }

  function renderKeyPrompt() {
    container.querySelector("#chatArea").hidden = true;
    const panel = container.querySelector("#chatKeyPanel");
    panel.hidden = false;
    panel.innerHTML = `
      <div class="exercise-card">
        <p>还没有设置 API Key，无法使用自由对话功能。</p>
        <p class="hint">去"设置"里选择一个 AI 服务商并填写 API Key（只保存在这台设备的浏览器里）。除了 Anthropic，也可以用 OpenAI、DeepSeek、Kimi、通义千问等 OpenAI 兼容接口。</p>
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
    addSystemNote("AI is typing...");

    try {
      const result = getProvider() === "anthropic" ? await callAnthropic() : await callOpenAICompatible();
      container.querySelector("#chatLog .system-note:last-child")?.remove();
      if (!result.ok) {
        addSystemNote(`⚠️ 出错了：${result.message || `HTTP ${result.status}`}`);
        if (result.status === 401 || result.status === 403) addSystemNote("请检查设置里的 API Key、接口地址和模型名称是否正确。");
        if (result.status === undefined) addSystemNote("如果一直失败，可能是这个服务商不支持网页直接调用（CORS），需要考虑换一个服务商。");
        history.pop();
        return;
      }
      addBubble("assistant", result.text || "(no response)");
      history.push({ role: "assistant", content: result.text });
    } catch (err) {
      container.querySelector("#chatLog .system-note:last-child")?.remove();
      addSystemNote(`⚠️ 网络请求失败：${err.message}`);
      addSystemNote("如果一直失败，可能是这个服务商不支持网页直接调用（CORS），需要考虑换一个服务商。");
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
    const providerLabel = getProvider() === "anthropic" ? "Anthropic" : "OpenAI 兼容接口";
    const scopeLabel = lessonFilter === "all" ? "全部 6 课" : `截止到第 ${lessonFilter} 课（${lessons.find((l) => l.id === lessonFilter)?.title || ""}）`;
    container.querySelector("#chatTopicLabel").textContent = `服务商：${providerLabel} · 词汇范围：${scopeLabel}`;
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
    if (hasActiveKey()) renderChat();
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

  return {
    init, setLesson, render,
    getProvider, setProvider,
    getAnthropicKey, getAnthropicModel,
    getCompatKey, getCompatModel, getCompatBaseUrl,
    testConnection,
    KEYS,
  };
})();
