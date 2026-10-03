// Sentence practice: read-aloud mode (see + hear + optional translation) and
// listen-and-transcribe dictation with word-level diff feedback.
const SentencesView = (() => {
  let mode = "read";
  let queue = [];
  let pos = 0;
  let container = null;

  function sentencesForLesson(lessonFilter) {
    const { sentences } = AppData.get();
    return lessonFilter === "all" ? sentences : sentences.filter((s) => s.lesson === lessonFilter);
  }

  function buildQueue(lessonFilter) {
    queue = Progress.orderForPractice("sentence", sentencesForLesson(lessonFilter));
    pos = 0;
  }

  function setMode(m) {
    mode = m;
    pos = 0;
    render();
  }

  function current() {
    return queue[pos];
  }

  function progressLine() {
    const st = Progress.statsFor("sentence", queue.map((s) => s.id));
    return `<div class="progress-line"><span class="saved-stats">✏️ 练过 ${st.attempted} / ${queue.length} 句</span></div>`;
  }

  function renderRead() {
    const s = current();
    if (!s) {
      container.innerHTML = `<p class="hint">这个范围还没有句子，换一个课件试试吧。</p>`;
      return;
    }
    container.innerHTML = `
      ${progressLine()}
      <div class="exercise-card">
        <div class="exercise-prompt">
          <button class="audio-btn" id="readAudioBtn" title="播放">🔊</button>
          <span style="font-size:1.15rem">${Util.escapeHtml(s.en)}</span>
        </div>
        <p class="hint" id="readZh" hidden>${Util.escapeHtml(s.zh || "")}</p>
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn ghost" id="readShowZh">🇨🇳 显示中文意思</button>
          <button class="btn ghost" id="readPrev">⬅️ 上一句</button>
          <button class="btn primary" id="readNext">下一句 ➡️</button>
        </div>
      </div>
    `;
    const play = () => TTS.speak(s.en, { kind: "sentence", id: s.id });
    container.querySelector("#readAudioBtn").addEventListener("click", play);
    container.querySelector("#readShowZh").addEventListener("click", () => {
      container.querySelector("#readZh").hidden = false;
    });
    container.querySelector("#readPrev").addEventListener("click", () => { pos = (pos - 1 + queue.length) % queue.length; render(); });
    container.querySelector("#readNext").addEventListener("click", () => {
      Progress.markSeen("sentence", s.id);
      pos = (pos + 1) % queue.length;
      render();
    });
    play();
  }

  function renderDictation() {
    const s = current();
    if (!s) {
      container.innerHTML = `<p class="hint">这个范围还没有句子，换一个课件试试吧。</p>`;
      return;
    }
    renderDictationCard(container, s, { header: progressLine(), onNext: () => { pos = (pos + 1) % queue.length; render(); } });
  }

  // Shared by the dictation tab and the mistake book.
  function renderDictationCard(container, s, { header = "", onNext, onResult } = {}) {
    container.innerHTML = `
      ${header}
      <div class="exercise-card">
        <div class="exercise-prompt">
          <button class="audio-btn" id="sentDictAudioBtn" title="重听">🔊</button>
          <span>盲听句子，写下你听到的内容</span>
        </div>
        <textarea class="exercise-input" id="sentDictInput" rows="2" placeholder="Type what you hear..." autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn primary" id="sentDictCheckBtn">检查 Check</button>
          <button class="btn ghost" id="sentDictReplayBtn">🔊 重听一次</button>
        </div>
        <div class="exercise-feedback" id="sentDictFeedback"></div>
      </div>
    `;
    const input = container.querySelector("#sentDictInput");
    const feedback = container.querySelector("#sentDictFeedback");
    const play = () => TTS.speak(s.en, { kind: "sentence", id: s.id });
    container.querySelector("#sentDictAudioBtn").addEventListener("click", play);
    container.querySelector("#sentDictReplayBtn").addEventListener("click", play);
    play();
    input.focus();

    let done = false;
    function check() {
      if (done) { onNext(); return; }
      if (!input.value.trim()) { input.focus(); return; }
      done = true;
      const diff = Util.wordDiff(s.en, input.value);
      const correct = diff.every((t) => t.ok) && diff.length > 0;
      const html = diff.map((t) => `<span class="${t.ok ? "diff-ok" : "diff-bad"}">${Util.escapeHtml(t.text)}</span>`).join(" ");
      feedback.className = "exercise-feedback show " + (correct ? "correct" : "wrong");
      feedback.innerHTML = `${correct ? "🎉 完全正确！" : "对照原句（绿色=对，红色=漏掉或拼错的词）："}<br>${html}` +
        (s.zh ? `<br><span class="dim">${Util.escapeHtml(s.zh)}</span>` : "");
      Progress.recordResult("sentence", s.id, correct, true);
      if (correct) { Progress.addStar(); Fx.burst(feedback, 12); }
      input.readOnly = true;
      container.querySelector("#sentDictCheckBtn").hidden = true;
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn primary";
      nextBtn.textContent = "下一句 Next ➡️";
      nextBtn.addEventListener("click", onNext);
      feedback.after(nextBtn);
      if (onResult) onResult(correct, feedback);
    }
    container.querySelector("#sentDictCheckBtn").addEventListener("click", check);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check(); } });
  }

  function render() {
    if (!container) return;
    if (mode === "read") renderRead();
    else renderDictation();
  }

  function init(el, lessonFilter, startMode) {
    container = el;
    if (startMode) mode = startMode;
    buildQueue(lessonFilter);
    render();
  }

  function setLesson(lessonFilter) {
    buildQueue(lessonFilter);
    render();
  }

  return { init, setMode, setLesson, renderDictationCard };
})();
