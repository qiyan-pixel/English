// Vocabulary practice: flashcards, listen-and-spell dictation, and a mixed
// EN<->ZH translation drill. All three modes share one queue-of-words session.
const VocabView = (() => {
  let mode = "flashcard";
  let queue = [];
  let pos = 0;
  let container = null;
  let currentDirection = "zh2en"; // used by translate mode

  // Spelling difficulty follows each word's own "spell" level (0-5, +1 per correct
  // spelling, -1 per miss), so a word gets more blanks as the learner masters it.
  const SPELL_STAGES = [
    { name: "热身", desc: "填几个字母就好", ratio: 0.3 },
    { name: "进阶", desc: "填一半的字母", ratio: 0.5 },
    { name: "挑战", desc: "大部分字母要自己填", ratio: 0.7 },
    { name: "高手", desc: "只给每个词的首字母", firstOnly: true },
    { name: "大师", desc: "完整听写，一个字母都不给", full: true },
  ];
  const isLetter = (c) => /[a-z]/i.test(c);

  function spellStage(id) {
    return Math.min(Progress.getItem("spell", id).level, SPELL_STAGES.length - 1);
  }

  function starsHtml(stage) {
    const n = stage + 1;
    return `<span class="stars-on">${"★".repeat(n)}</span><span class="stars-off">${"★".repeat(SPELL_STAGES.length - n)}</span>`;
  }

  // Returns the set of character indices to blank out. The first letter stays
  // visible on the easier stages so the learner has an anchor to start from.
  function pickBlanks(word, stage) {
    const chars = [...word];
    const letters = chars.map((c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0);
    if (stage.firstOnly) {
      const rest = letters.filter((i) => i > 0 && isLetter(chars[i - 1]));
      return new Set(rest.length ? rest : letters);
    }
    const pool = letters.length > 1 ? letters.slice(1) : letters;
    const count = Math.max(1, Math.round(letters.length * stage.ratio));
    return new Set(Util.shuffle(pool).slice(0, count));
  }

  function spellBoardHtml(word, blanks) {
    const chars = [...word];
    const longest = Math.max(...word.split(" ").map((t) => [...t].length));
    let i = 0;
    const chunks = word.split(" ").map((token) => {
      const html = [...token].map(() => {
        const idx = i++;
        const c = chars[idx];
        if (blanks.has(idx)) {
          return `<input class="letter-box" data-i="${idx}" type="text" inputmode="latin" lang="en" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="第 ${idx + 1} 个字母">`;
        }
        return `<span class="letter-tile${isLetter(c) ? "" : " sym"}">${Util.escapeHtml(c)}</span>`;
      }).join("");
      i++; // the space consumed by split(" ")
      return `<span class="spell-chunk">${html}</span>`;
    });
    return `<div class="spell-board"><div class="spell-word" style="--n:${longest}">${chunks.join("")}</div></div>`;
  }

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

  function wireLetterBoxes(boxes, onEnter) {
    boxes.forEach((box, k) => {
      const takeLetter = (e) => {
        if (e && e.isComposing) return;
        const typed = ((e && e.data) || box.value).match(/[a-z]/gi);
        box.value = typed ? typed[typed.length - 1] : "";
        box.classList.toggle("filled", !!box.value);
        if (box.value && boxes[k + 1]) boxes[k + 1].focus();
      };
      box.addEventListener("input", takeLetter);
      box.addEventListener("compositionend", () => takeLetter(null));
      box.addEventListener("focus", () => box.select());
      box.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); onEnter(); }
        else if (e.key === "Backspace" && !box.value && boxes[k - 1]) {
          e.preventDefault();
          boxes[k - 1].value = "";
          boxes[k - 1].classList.remove("filled");
          boxes[k - 1].focus();
        } else if (e.key === "ArrowLeft" && boxes[k - 1]) { e.preventDefault(); boxes[k - 1].focus(); }
        else if (e.key === "ArrowRight" && boxes[k + 1]) { e.preventDefault(); boxes[k + 1].focus(); }
      });
    });
  }

  function renderDictation() {
    const w = current();
    if (!w) {
      container.innerHTML = progressLine() + `<p class="hint">这个范围还没有单词，换一个课件试试吧。</p>`;
      return;
    }
    renderSpellCard(container, w, { header: progressLine(), onNext: () => { pos = (pos + 1) % queue.length; render(); } });
  }

  // Shared by the spelling tab and the mistake book. Records the result itself;
  // opts.onResult(correct, feedbackEl) lets the caller add extra feedback afterwards.
  function renderSpellCard(container, w, { header = "", onNext, onResult } = {}) {
    const stageIdx = spellStage(w.id);
    const stage = SPELL_STAGES[stageIdx];
    const blanks = stage.full ? null : pickBlanks(w.en, stage);
    container.innerHTML = `
      ${header}
      <div class="exercise-card spell-card">
        <div class="spell-head">
          <span class="spell-stars" title="这个单词的拼写难度">${starsHtml(stageIdx)}</span>
          <span class="spell-stage">第 ${stageIdx + 1} 级 · ${stage.name}：${stage.desc}</span>
        </div>
        <div class="exercise-prompt">
          <button class="audio-btn" id="dictAudioBtn" title="播放发音">🔊</button>
          <span>${stage.full ? "听发音，拼写出整个单词" : "听发音，把缺的字母填上"}</span>
        </div>
        ${stage.full
          ? `<input type="text" class="exercise-input" id="dictInput" placeholder="Type the word..." autocomplete="off" autocapitalize="off" spellcheck="false">`
          : `<p class="spell-meaning">💡 ${Util.escapeHtml(w.zh)}</p>${spellBoardHtml(w.en, blanks)}`}
        <div class="card-controls" style="justify-content:flex-start;margin-top:0;">
          <button class="btn primary" id="dictCheckBtn">检查 Check</button>
          <button class="btn ghost" id="dictSkipBtn">跳过 Skip</button>
        </div>
        <div class="exercise-feedback" id="dictFeedback"></div>
        <p class="hint spell-rule">每个单词拼对一次升一级 ⬆️，拼错会降一级，多给一些字母提示。</p>
      </div>
    `;
    const feedback = container.querySelector("#dictFeedback");
    const checkBtn = container.querySelector("#dictCheckBtn");
    const input = container.querySelector("#dictInput");
    const boxes = Array.from(container.querySelectorAll(".letter-box"));
    const board = container.querySelector(".spell-board");
    const chars = [...w.en];
    const playAudio = () => TTS.speak(w.en, { kind: "word", id: w.id });
    container.querySelector("#dictAudioBtn").addEventListener("click", playAudio);
    playAudio();
    if (input) input.focus();
    else boxes[0]?.focus();
    let done = false;
    const goNext = onNext;

    // A second Enter after checking moves on, so the keyboard alone is enough.
    function check() {
      if (done) { goNext(); return; }
      const empty = input ? (!input.value.trim() && input) : boxes.find((b) => !b.value);
      if (empty) {
        empty.focus();
        const target = board || input;
        target.classList.remove("nudge");
        void target.offsetWidth;
        target.classList.add("nudge");
        return;
      }
      done = true;
      let correct;
      if (input) {
        correct = Util.isCloseMatch(input.value, w.en);
        input.readOnly = true;
      } else {
        correct = true;
        boxes.forEach((b) => {
          const want = chars[Number(b.dataset.i)];
          const ok = b.value.toLowerCase() === want.toLowerCase();
          if (!ok) correct = false;
          b.value = want;
          b.classList.add(ok ? "ok" : "bad");
          b.readOnly = true;
        });
        board.classList.add(correct ? "win" : "miss");
      }
      Progress.recordResult("vocab", w.id, correct, true);
      const after = Progress.recordResult("spell", w.id, correct);
      const newIdx = Math.min(after.level, SPELL_STAGES.length - 1);
      const detail = `<b>${Util.escapeHtml(w.en)}</b> — ${Util.escapeHtml(w.zh)}<br><span class="dim">${Util.escapeHtml(w.example)}</span>`;
      feedback.className = "exercise-feedback show " + (correct ? "correct" : "wrong");
      if (correct) {
        const levelUp = newIdx > stageIdx ? `<br>⬆️ 升级啦！下次这个词是 <span class="spell-stars">${starsHtml(newIdx)}</span>` : "";
        feedback.innerHTML = `🎉 太棒了，全对！${levelUp}<br>${detail}`;
        Progress.addStar();
        Fx.burst(board || feedback, 14);
        playAudio();
      } else {
        feedback.innerHTML = `💪 差一点点！${input ? "" : "红色格子是正确的字母，"}再记一记：<br>${detail}` +
          (newIdx < stageIdx ? `<br><span class="dim">下次会多给你一些字母提示。</span>` : "");
      }
      checkBtn.hidden = true;
      container.querySelector("#dictSkipBtn").hidden = true;
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn primary";
      nextBtn.textContent = "下一个 Next ➡️";
      nextBtn.addEventListener("click", goNext);
      feedback.after(nextBtn);
      if (onResult) onResult(correct, feedback);
    }
    checkBtn.addEventListener("click", check);
    container.querySelector("#dictSkipBtn").addEventListener("click", () => {
      Progress.recordResult("vocab", w.id, false, true);
      Progress.recordResult("spell", w.id, false);
      goNext();
    });
    if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    else wireLetterBoxes(boxes, check);
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
          ? `🎉 正确！<b>${Util.escapeHtml(w.en)}</b>`
          : `💪 正确答案：<b>${Util.escapeHtml(w.en)}</b>`;
        Progress.recordResult("vocab", w.id, correct, true);
        if (correct) { Progress.addStar(); Fx.burst(feedback, 10); }
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
            🇺🇸 <b>${Util.escapeHtml(w.en)}</b>
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

  return { init, setMode, setLesson, getMode: () => mode, renderSpellCard };
})();
