// Dialogue role-play (real listening scripts from the courseware) and
// extended open-ended questions (self-answered, not auto-graded — these are
// about the learner's own life, so there's no single correct answer).
const DialogueView = (() => {
  let mode = "dialogue";
  let container = null;
  let lessonFilter = "all";

  function dialoguesForLesson() {
    const { dialogues } = AppData.get();
    return lessonFilter === "all" ? dialogues : dialogues.filter((d) => d.lesson === lessonFilter);
  }

  function questionsForLesson() {
    const { questions } = AppData.get();
    return lessonFilter === "all" ? questions : questions.filter((q) => q.lesson === lessonFilter);
  }

  function renderDialogues() {
    const list = dialoguesForLesson();
    if (!list.length) {
      container.innerHTML = `<p class="hint">这个范围还没有对话，换一个课件试试吧。</p>`;
      return;
    }
    container.innerHTML = list.map((d, idx) => `
      <div class="dialogue-card" data-idx="${idx}">
        <h3>${Util.escapeHtml(d.title)}</h3>
        <p class="zh-title">${Util.escapeHtml(d.title_zh || "")}</p>
        <div class="card-controls" style="justify-content:flex-start;margin:0 0 10px;">
          <button class="btn primary small" data-action="playAll">▶️ 播放整段对话</button>
          <button class="btn ghost small" data-action="toggleHide">🙈 隐藏文本，只听</button>
        </div>
        <div class="dlg-lines">
          ${d.lines.map((l, li) => `
            <div class="dlg-line" data-li="${li}">
              <div class="dlg-speaker">${Util.escapeHtml(l.speaker)}</div>
              <div class="dlg-text">${Util.escapeHtml(l.en)}</div>
              <button class="audio-btn small" data-action="playLine" data-li="${li}" title="播放">🔊</button>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".dialogue-card").forEach((card) => {
      const idx = Number(card.dataset.idx);
      const d = list[idx];
      card.querySelector('[data-action="playAll"]').addEventListener("click", async () => {
        for (let li = 0; li < d.lines.length; li++) {
          await TTS.speak(d.lines[li].en, { kind: "sentence", id: `${d.id}-${li}` });
          await new Promise((r) => setTimeout(r, 250));
        }
      });
      card.querySelector('[data-action="toggleHide"]').addEventListener("click", (e) => {
        const hidden = card.classList.toggle("text-hidden");
        card.querySelectorAll(".dlg-text").forEach((t) => { t.style.visibility = hidden ? "hidden" : "visible"; });
        e.target.textContent = hidden ? "👀 显示文本" : "🙈 隐藏文本，只听";
      });
      card.querySelectorAll('[data-action="playLine"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          const li = Number(btn.dataset.li);
          TTS.speak(d.lines[li].en, { kind: "sentence", id: `${d.id}-${li}` });
        });
      });
    });
  }

  function renderQuestions() {
    const list = questionsForLesson();
    if (!list.length) {
      container.innerHTML = `<p class="hint">这个范围还没有扩展问题，换一个课件试试吧。</p>`;
      return;
    }
    container.innerHTML = `<p class="hint">这些问题没有标准答案，用来练习口语和写作。可以大声说出来，也可以写下你的答案。</p>` +
      list.map((q) => `
        <div class="question-card" data-id="${q.id}">
          <button class="audio-btn small" data-action="play">🔊</button>
          <div class="q-text">
            <div>${Util.escapeHtml(q.en)}</div>
            <textarea class="exercise-input" rows="1" style="margin-top:8px;" placeholder="Write your answer here (optional)..." data-action="answer"></textarea>
          </div>
          <button class="btn ghost small" data-action="done">✅ 练过了</button>
        </div>
      `).join("");

    container.querySelectorAll(".question-card").forEach((card) => {
      const id = card.dataset.id;
      const q = list.find((x) => x.id === id);
      card.querySelector('[data-action="play"]').addEventListener("click", () => TTS.speak(q.en, {}));
      card.querySelector('[data-action="done"]').addEventListener("click", (e) => {
        Progress.recordResult("question", id, true);
        e.target.textContent = "✅ 已完成";
        e.target.disabled = true;
      });
    });
  }

  function render() {
    if (!container) return;
    if (mode === "dialogue") renderDialogues();
    else renderQuestions();
  }

  function setMode(m) {
    mode = m;
    render();
  }

  function init(el, lesson) {
    container = el;
    lessonFilter = lesson;
    render();
  }

  function setLesson(lesson) {
    lessonFilter = lesson;
    render();
  }

  return { init, setMode, setLesson };
})();
