// EN<->ZH sentence translation practice. Because a Chinese or English sentence
// can have more than one valid phrasing, this isn't strict auto-pass/fail:
// it shows a reference answer (with word-diff for the zh->en direction) and
// lets the learner self-grade, the same honest pattern used for vocab review.
const TranslateView = (() => {
  let direction = "zh2en";
  let queue = [];
  let pos = 0;
  let container = null;

  function itemsForLesson(lessonFilter) {
    const { translations } = AppData.get();
    return lessonFilter === "all" ? translations : translations.filter((t) => t.lesson === lessonFilter);
  }

  function buildQueue(lessonFilter) {
    queue = Util.shuffle(itemsForLesson(lessonFilter));
    pos = 0;
  }

  function setDirection(d) {
    direction = d;
    pos = 0;
    render();
  }

  function current() {
    return queue[pos];
  }

  function progressLine() {
    return `<div class="progress-line"><span>第 ${Math.min(pos + 1, queue.length)} / ${queue.length} 句</span></div>`;
  }

  function grade(item, correct) {
    Progress.recordResult("translation", item.id, correct);
    pos = (pos + 1) % queue.length;
    render();
  }

  function renderZh2En() {
    const t = current();
    if (!t) { container.innerHTML = `<p class="hint">这个范围还没有翻译句子。</p>`; return; }
    container.innerHTML = `
      ${progressLine()}
      <div class="exercise-card">
        <div class="exercise-prompt">🇨🇳 ${Util.escapeHtml(t.zh)}</div>
        <textarea class="exercise-input" id="tInput" rows="2" placeholder="Translate into English..." autocomplete="off" spellcheck="false"></textarea>
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn primary" id="tCheckBtn">对照参考答案 Compare</button>
        </div>
        <div class="exercise-feedback" id="tFeedback"></div>
      </div>
    `;
    const input = container.querySelector("#tInput");
    input.focus();
    container.querySelector("#tCheckBtn").addEventListener("click", () => {
      const feedback = container.querySelector("#tFeedback");
      const exact = Util.isCloseMatch(input.value, t.en);
      const diff = Util.wordDiff(t.en, input.value || "");
      const html = diff.map((tok) => `<span class="${tok.ok ? "diff-ok" : "diff-bad"}">${Util.escapeHtml(tok.text)}</span>`).join(" ");
      feedback.className = "exercise-feedback show " + (exact ? "correct" : "wrong");
      feedback.innerHTML = (exact ? "✅ 和参考答案完全一致！" : "参考答案（翻译不必逐字相同，意思对、语法对就可以）：") +
        `<br><b>${Util.escapeHtml(t.en)}</b><br>你的答案对比：${html}`;
      container.querySelector("#tCheckBtn").hidden = true;
      input.disabled = true;
      const row = document.createElement("div");
      row.className = "card-controls";
      row.innerHTML = `<button class="btn danger-ghost" id="tNo">😕 我没翻对</button><button class="btn success" id="tYes">😊 意思对，算我对</button>`;
      feedback.after(row);
      row.querySelector("#tNo").addEventListener("click", () => grade(t, false));
      row.querySelector("#tYes").addEventListener("click", () => grade(t, true));
    });
  }

  function renderEn2Zh() {
    const t = current();
    if (!t) { container.innerHTML = `<p class="hint">这个范围还没有翻译句子。</p>`; return; }
    container.innerHTML = `
      ${progressLine()}
      <div class="exercise-card">
        <div class="exercise-prompt">
          <button class="audio-btn small" id="tAudioBtn" title="发音">🔊</button>
          🇬🇧 ${Util.escapeHtml(t.en)}
        </div>
        <p class="hint">想一想这句话的中文意思，然后点击查看答案</p>
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn primary" id="tRevealBtn">查看答案 Reveal</button>
        </div>
        <div class="exercise-feedback" id="tFeedback"></div>
      </div>
    `;
    container.querySelector("#tAudioBtn").addEventListener("click", () => TTS.speak(t.en, {}));
    container.querySelector("#tRevealBtn").addEventListener("click", () => {
      const feedback = container.querySelector("#tFeedback");
      feedback.className = "exercise-feedback show correct";
      feedback.innerHTML = `<b>${Util.escapeHtml(t.zh)}</b>`;
      container.querySelector("#tRevealBtn").hidden = true;
      const row = document.createElement("div");
      row.className = "card-controls";
      row.innerHTML = `<button class="btn danger-ghost" id="tNo">😕 还不熟</button><button class="btn success" id="tYes">😊 记住了</button>`;
      feedback.after(row);
      row.querySelector("#tNo").addEventListener("click", () => grade(t, false));
      row.querySelector("#tYes").addEventListener("click", () => grade(t, true));
    });
  }

  function render() {
    if (!container) return;
    if (direction === "zh2en") renderZh2En();
    else renderEn2Zh();
  }

  function init(el, lessonFilter) {
    container = el;
    buildQueue(lessonFilter);
    render();
  }

  function setLesson(lessonFilter) {
    buildQueue(lessonFilter);
    render();
  }

  return { init, setDirection, setLesson };
})();
