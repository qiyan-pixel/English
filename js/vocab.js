// Vocabulary practice: flashcards, listen-and-spell dictation, and a mixed
// EN<->ZH translation drill. All three modes share one queue-of-words session.
const VocabView = (() => {
  let mode = "flashcard";
  let queue = [];
  let pos = 0;
  let container = null;
  let currentDirection = "zh2en"; // used by translate mode

  function wordsForLesson(lessonFilter) {
    const { vocabulary } = AppData.get();
    return lessonFilter === "all" ? vocabulary : vocabulary.filter((v) => v.lesson === lessonFilter);
  }

  function buildQueue(lessonFilter) {
    const words = wordsForLesson(lessonFilter);
    // Prioritize less-mastered words, but keep some randomness so it's not robotic.
    const withLevel = words.map((w) => ({ w, level: Progress.getItem("vocab", w.id).level }));
    withLevel.sort((a, b) => a.level - b.level);
    const lowHalf = withLevel.slice(0, Math.ceil(withLevel.length * 0.7)).map((x) => x.w);
    const rest = withLevel.slice(Math.ceil(withLevel.length * 0.7)).map((x) => x.w);
    queue = Util.shuffle(lowHalf).concat(Util.shuffle(rest));
    pos = 0;
  }

  function setMode(m) {
    mode = m;
    pos = 0;
    render();
  }

  function progressLine() {
    return `<div class="progress-line"><span>第 ${Math.min(pos + 1, queue.length)} / ${queue.length} 个</span><span>${queue.length ? "" : "该范围暂无单词"}</span></div>`;
  }

  function current() {
    return queue[pos];
  }

  function advance(correct, category = "vocab") {
    const w = current();
    if (w) Progress.recordResult(category, w.id, correct);
    pos += 1;
    if (pos >= queue.length) pos = 0;
    render();
  }

  function renderFlashcard() {
    const w = current();
    if (!w) {
      container.innerHTML = progressLine() + `<p class="hint">这个范围还没有单词，换一个课件试试吧。</p>`;
      return;
    }
    container.innerHTML = `
      ${progressLine()}
      <div class="flashcard" id="fcCard">
        <div class="word-en">${Util.escapeHtml(w.en)}</div>
        <div class="word-pos">${Util.escapeHtml(w.pos || "")}</div>
        <div class="word-zh">${Util.escapeHtml(w.zh)}${w.note ? `<br><small>${Util.escapeHtml(w.note)}</small>` : ""}</div>
        <div class="word-example">${Util.escapeHtml(w.example)}</div>
        <div class="flip-hint">👆 点击卡片查看中文意思</div>
      </div>
      <div class="card-controls">
        <button class="audio-btn" id="fcAudioBtn" title="发音">🔊</button>
        <button class="btn danger-ghost" id="fcDontKnowBtn">😕 还不熟</button>
        <button class="btn success" id="fcKnowBtn">😊 记住了</button>
      </div>
    `;
    const card = container.querySelector("#fcCard");
    card.addEventListener("click", () => card.classList.toggle("revealed"));
    container.querySelector("#fcAudioBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      TTS.speak(w.en, { kind: "word", id: w.id });
    });
    container.querySelector("#fcDontKnowBtn").addEventListener("click", () => advance(false));
    container.querySelector("#fcKnowBtn").addEventListener("click", () => advance(true));
    TTS.speak(w.en, { kind: "word", id: w.id });
  }

  function renderDictation() {
    const w = current();
    if (!w) {
      container.innerHTML = progressLine() + `<p class="hint">这个范围还没有单词，换一个课件试试吧。</p>`;
      return;
    }
    container.innerHTML = `
      ${progressLine()}
      <div class="exercise-card">
        <div class="exercise-prompt">
          <button class="audio-btn" id="dictAudioBtn" title="播放发音">🔊</button>
          <span>听发音，拼写出这个单词</span>
        </div>
        <input type="text" class="exercise-input" id="dictInput" placeholder="Type the word..." autocomplete="off" autocapitalize="off" spellcheck="false">
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn primary" id="dictCheckBtn">检查 Check</button>
          <button class="btn ghost" id="dictSkipBtn">跳过 Skip</button>
        </div>
        <div class="exercise-feedback" id="dictFeedback"></div>
      </div>
    `;
    const input = container.querySelector("#dictInput");
    const feedback = container.querySelector("#dictFeedback");
    const playAudio = () => TTS.speak(w.en, { kind: "word", id: w.id });
    container.querySelector("#dictAudioBtn").addEventListener("click", playAudio);
    playAudio();
    input.focus();

    function check() {
      const correct = Util.isCloseMatch(input.value, w.en);
      feedback.className = "exercise-feedback show " + (correct ? "correct" : "wrong");
      feedback.innerHTML = correct
        ? `✅ 正确！<br><b>${Util.escapeHtml(w.en)}</b> — ${Util.escapeHtml(w.zh)}<br><span style="color:var(--text-dim)">${Util.escapeHtml(w.example)}</span>`
        : `❌ 再试试。正确答案：<b>${Util.escapeHtml(w.en)}</b> — ${Util.escapeHtml(w.zh)}<br><span style="color:var(--text-dim)">${Util.escapeHtml(w.example)}</span>`;
      Progress.recordResult("vocab", w.id, correct);
      input.disabled = true;
      container.querySelector("#dictCheckBtn").hidden = true;
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn primary";
      nextBtn.textContent = "下一个 Next";
      nextBtn.addEventListener("click", () => { pos = (pos + 1) % queue.length; render(); });
      feedback.after(nextBtn);
    }
    container.querySelector("#dictCheckBtn").addEventListener("click", check);
    container.querySelector("#dictSkipBtn").addEventListener("click", () => advance(false));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  }

  function renderTranslate() {
    const w = current();
    if (!w) {
      container.innerHTML = progressLine() + `<p class="hint">这个范围还没有单词，换一个课件试试吧。</p>`;
      return;
    }
    currentDirection = Math.random() < 0.5 ? "zh2en" : "en2zh";
    if (currentDirection === "zh2en") {
      container.innerHTML = `
        ${progressLine()}
        <div class="exercise-card">
          <div class="exercise-prompt">🇨🇳 ${Util.escapeHtml(w.zh)}${w.note ? `<br><small style="color:var(--text-dim)">${Util.escapeHtml(w.note)}</small>` : ""}</div>
          <input type="text" class="exercise-input" id="trInput" placeholder="Type in English..." autocomplete="off" autocapitalize="off" spellcheck="false">
          <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
            <button class="btn primary" id="trCheckBtn">检查 Check</button>
          </div>
          <div class="exercise-feedback" id="trFeedback"></div>
        </div>
      `;
      const input = container.querySelector("#trInput");
      const feedback = container.querySelector("#trFeedback");
      input.focus();
      function check() {
        const correct = Util.isCloseMatch(input.value, w.en);
        feedback.className = "exercise-feedback show " + (correct ? "correct" : "wrong");
        feedback.innerHTML = correct
          ? `✅ 正确！<b>${Util.escapeHtml(w.en)}</b>`
          : `❌ 正确答案：<b>${Util.escapeHtml(w.en)}</b>`;
        Progress.recordResult("vocab", w.id, correct);
        input.disabled = true;
        container.querySelector("#trCheckBtn").hidden = true;
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn primary";
        nextBtn.textContent = "下一个 Next";
        nextBtn.addEventListener("click", () => { pos = (pos + 1) % queue.length; render(); });
        feedback.after(nextBtn);
      }
      container.querySelector("#trCheckBtn").addEventListener("click", check);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    } else {
      container.innerHTML = `
        ${progressLine()}
        <div class="exercise-card">
          <div class="exercise-prompt">
            <button class="audio-btn small" id="trAudioBtn" title="发音">🔊</button>
            🇬🇧 <b>${Util.escapeHtml(w.en)}</b>
          </div>
          <p class="hint">想一想中文意思，然后点击查看答案</p>
          <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
            <button class="btn primary" id="trRevealBtn">查看答案 Reveal</button>
          </div>
          <div class="exercise-feedback" id="trFeedback"></div>
        </div>
      `;
      container.querySelector("#trAudioBtn").addEventListener("click", () => TTS.speak(w.en, { kind: "word", id: w.id }));
      container.querySelector("#trRevealBtn").addEventListener("click", () => {
        const feedback = container.querySelector("#trFeedback");
        feedback.className = "exercise-feedback show correct";
        feedback.innerHTML = `<b>${Util.escapeHtml(w.zh)}</b>${w.note ? `<br><small>${Util.escapeHtml(w.note)}</small>` : ""}`;
        container.querySelector("#trRevealBtn").hidden = true;
        const row = document.createElement("div");
        row.className = "card-controls";
        row.innerHTML = `<button class="btn danger-ghost" id="trNo">😕 还不熟</button><button class="btn success" id="trYes">😊 记住了</button>`;
        feedback.after(row);
        row.querySelector("#trNo").addEventListener("click", () => advance(false));
        row.querySelector("#trYes").addEventListener("click", () => advance(true));
      });
    }
  }

  function render() {
    if (!container) return;
    if (mode === "flashcard") renderFlashcard();
    else if (mode === "dictation") renderDictation();
    else renderTranslate();
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

  return { init, setMode, setLesson, getMode: () => mode };
})();
