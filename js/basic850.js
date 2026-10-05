// Basic English 850 section: picture scenes for kids. Learn words by tapping
// things in an animated scene, then practise with picture quizzes, spelling
// (shared with the courseware spelling cards) and EN<->ZH choice quizzes.
// Results use the "vocab" progress category with "b850-" ids, so stars, the
// mistake book and mastery all work the same as for courseware words.
const Basic850View = (() => {
  const PREF_KEY = "engcourse_b850_view";
  const MODES = ["learn", "pic", "spell", "trans"];
  let container = null;
  let sceneId = "all";
  let mode = "learn";
  let selected = null;
  let queue = [];
  let pos = 0;

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      if (MODES.includes(p.mode)) mode = p.mode;
      if (p.sceneId === "all" || scenes().some((s) => s.id === p.sceneId)) sceneId = p.sceneId;
    } catch (e) { /* defaults */ }
  }
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ mode, sceneId })); } catch (e) { /* ignore */ }
  }

  const scenes = () => AppData.get().basic850.scenes;
  const scene = (id) => scenes().find((s) => s.id === id);
  const wordMap = (sc) => Object.fromEntries(sc.words.map((w) => [w.id, w]));
  const sceneOf = (wordId) => scenes().find((s) => s.words.some((w) => w.id === wordId));
  const scopeWords = () => (sceneId === "all" ? scenes().flatMap((s) => s.words) : scene(sceneId).words);
  const esc = Util.escapeHtml;

  function stats(words) {
    return Progress.statsFor("vocab", words.map((w) => w.id));
  }

  function speak(w) {
    TTS.speak(w.en, { kind: "word", id: w.id });
  }

  function highlight(sentence, word) {
    const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)`, "i");
    const html = esc(sentence);
    return re.test(html) ? html.replace(re, "<mark>$1</mark>") : html;
  }

  function sceneChips() {
    const chip = (id, label, extra = "") =>
      `<button class="scene-chip ${id === sceneId ? "active" : ""}" data-scene="${id}">${label}${extra}</button>`;
    return `<div class="scene-chips">
      ${chip("all", "🗺️ 全部场景")}
      ${scenes().map((s) => {
        const st = stats(s.words);
        return chip(s.id, `${s.emoji} ${esc(s.title_zh)}`, st.mastered === st.total ? " ✅" : ` <small>${st.mastered}/${st.total}</small>`);
      }).join("")}
    </div>`;
  }

  function progressLine(words) {
    const st = stats(words);
    return `<div class="progress-line"><span class="saved-stats">✏️ 练过 ${st.attempted} / ${st.total} 个</span><span class="saved-stats">✅ 学会 ${st.mastered} 个</span></div>`;
  }

  // ---------- Learn: scene grid + scene with tappable words ----------
  function renderGrid() {
    const total = scenes().reduce((n, s) => n + s.words.length, 0);
    const st = stats(scenes().flatMap((s) => s.words));
    container.innerHTML = `
      ${sceneChips()}
      <p class="hint">已上线 ${scenes().length} 个场景、${total} 个单词（共 850 个，陆续更新中）。学会 ${st.mastered} 个 · 点一个场景开始吧！</p>
      <div class="scene-grid">
        ${scenes().map((s) => {
          const ss = stats(s.words);
          return `<button class="scene-tile" data-scene="${s.id}">
            <div class="scene-thumb">${SceneArt.render(s, wordMap(s), { className: "thumb", interactive: false })}</div>
            <div class="scene-tile-body"><b>${s.emoji} ${esc(s.title_zh)}</b><small>${esc(s.title_en)}</small>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round((ss.mastered / ss.total) * 100)}%"></div></div>
              <span class="dim">学会 ${ss.mastered} / ${ss.total}</span></div>
          </button>`;
        }).join("")}
      </div>`;
  }

  function wordDetail(w) {
    const it = Progress.getItem("vocab", w.id);
    const max = Progress.MASTERED_LEVEL;
    const status = !it.seen ? `<span class="mastery-badge new">🆕 新单词</span>`
      : it.level >= max ? `<span class="mastery-badge done">✅ 已学会</span>`
      : `<span class="mastery-badge">${"⭐".repeat(it.level)}${"☆".repeat(max - it.level)} 去练习里答对就能升级</span>`;
    return `
      <div class="word-detail">
        <div class="wd-pic">${SceneArt.wordPic(w, 104)}</div>
        <div class="wd-body">
          ${status}
          <div class="wd-word"><span>${esc(w.en)}</span><button class="audio-btn small" data-say="word" title="发音">🔊</button></div>
          <div class="wd-zh">${esc(w.zh)} <small class="dim">${esc(w.pos)}</small></div>
          ${w.note ? `<div class="dim wd-note">💡 ${esc(w.note)}</div>` : ""}
          <div class="wd-ex"><button class="audio-btn small" data-say="example" title="朗读例句">🔊</button><span>${highlight(w.example, w.en)}<br><small class="dim">${esc(w.example_zh)}</small></span></div>
        </div>
      </div>`;
  }

  function renderScene() {
    const sc = scene(sceneId);
    const words = wordMap(sc);
    if (!selected || !words[selected]) selected = null;
    container.innerHTML = `
      ${sceneChips()}
      ${progressLine(sc.words)}
      <div class="scene-card">
        <div class="scene-head"><h2>${sc.emoji} ${esc(sc.title_zh)} <small>${esc(sc.title_en)}</small></h2><p>${esc(sc.story)}</p></div>
        <div class="scene-art">${SceneArt.render(sc, words)}</div>
        <p class="hint scene-tip">👆 点一点图里的东西，或者点下面的单词</p>
        <div class="word-chips">${sc.words.map((w) => {
          const it = Progress.getItem("vocab", w.id);
          const cls = it.level >= Progress.MASTERED_LEVEL ? "done" : it.seen ? "seen" : "";
          return `<button class="word-chip ${cls} ${w.id === selected ? "active" : ""}" data-w="${w.id}">${w.pic.startsWith("@") ? "" : `${esc(w.pic)} `}${esc(w.en)}</button>`;
        }).join("")}</div>
        <div id="b850Detail">${selected ? wordDetail(words[selected]) : `<p class="hint">选一个单词，看看它的意思和例句吧！</p>`}</div>
        <div class="card-controls">
          <button class="btn primary" data-goto="pic">🎯 学完了，去看图选词</button>
        </div>
      </div>`;
    const svg = container.querySelector(".scene-art svg");
    if (selected) SceneArt.focus(svg, selected);
    container.querySelector("[data-goto]").addEventListener("click", (e) => setMode(e.target.dataset.goto, true));
  }

  function selectWord(id, { say = true } = {}) {
    const sc = scene(sceneId);
    const w = wordMap(sc)[id];
    if (!w) return;
    selected = id;
    Progress.markSeen("vocab", id);
    container.querySelectorAll(".word-chip").forEach((c) => c.classList.toggle("active", c.dataset.w === id));
    const chip = container.querySelector(`.word-chip[data-w="${CSS.escape(id)}"]`);
    if (chip && !chip.classList.contains("done")) chip.classList.add("seen");
    container.querySelector("#b850Detail").innerHTML = wordDetail(w);
    container.querySelector(".progress-line").outerHTML = progressLine(sc.words);
    SceneArt.focus(container.querySelector(".scene-art svg"), id);
    if (say) speak(w);
  }

  // ---------- Quizzes ----------
  function buildQueue() {
    queue = Progress.orderForPractice("vocab", scopeWords());
    pos = 0;
  }

  function current() {
    return queue[pos % queue.length];
  }

  function next() {
    pos = (pos + 1) % queue.length;
    render();
  }

  // Wrong options: prefer words from the same scene, so the picture helps.
  function options(w, field) {
    const used = new Set([w[field]]);
    const picks = [];
    const take = (list) => {
      for (const x of Util.shuffle(list)) {
        if (picks.length >= 3) return;
        if (!used.has(x[field])) { used.add(x[field]); picks.push(x); }
      }
    };
    take(sceneOf(w.id).words);
    take(scenes().flatMap((s) => s.words));
    return Util.shuffle([w, ...picks]);
  }

  function choiceQuiz({ title, prompt, w, field, svgFocus }) {
    const opts = options(w, field);
    const sc = sceneOf(w.id);
    container.innerHTML = `
      ${sceneChips()}
      ${progressLine(scopeWords())}
      <div class="exercise-card quiz-card">
        <div class="quiz-title">${title}</div>
        ${svgFocus ? `<div class="scene-art quiz-art">${SceneArt.render(sc, wordMap(sc), { className: "quiz", interactive: false })}</div>` : ""}
        <div class="quiz-prompt">${prompt}</div>
        <div class="choice-grid">${opts.map((o) => `<button class="choice-btn" data-id="${o.id}">${esc(o[field])}</button>`).join("")}</div>
        <div class="exercise-feedback" id="quizFeedback"></div>
      </div>`;
    if (svgFocus) SceneArt.focus(container.querySelector(".quiz-art svg"), w.id, { label: false });
    const feedback = container.querySelector("#quizFeedback");
    let done = false;
    container.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (done) return;
        done = true;
        const correct = btn.dataset.id === w.id;
        Progress.recordResult("vocab", w.id, correct, true);
        container.querySelectorAll(".choice-btn").forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === w.id) b.classList.add("right");
        });
        if (!correct) btn.classList.add("wrong");
        if (svgFocus) SceneArt.focus(container.querySelector(".quiz-art svg"), w.id);
        feedback.className = "exercise-feedback show " + (correct ? "correct" : "wrong");
        feedback.innerHTML = `${correct ? "🎉 答对啦！" : "💪 差一点！正确答案是："} <b>${esc(w.en)}</b> — ${esc(w.zh)}<br><span class="dim">${esc(w.example)} ${esc(w.example_zh)}</span>`;
        if (correct) { Progress.addStar(); Fx.burst(btn, 12); }
        speak(w);
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn primary";
        nextBtn.textContent = "下一题 Next ➡️";
        nextBtn.addEventListener("click", next);
        feedback.after(nextBtn);
      });
    });
  }

  function renderPicQuiz() {
    const w = current();
    const hasSpot = sceneOf(w.id).actors.some((a) => a.word === w.id);
    choiceQuiz({
      title: "🎯 看图选词：图里跳动的是什么？",
      prompt: hasSpot ? "" : `<div class="quiz-big-pic">${SceneArt.wordPic(w, 110)}</div>`,
      w, field: "en", svgFocus: hasSpot,
    });
  }

  function renderTransQuiz() {
    const w = current();
    if (pos % 2 === 0) {
      choiceQuiz({
        title: "🔁 中 → 英：选出对应的英文",
        prompt: `<div class="quiz-big-pic">${SceneArt.wordPic(w, 84)}</div><div class="quiz-zh">${esc(w.zh)}</div>`,
        w, field: "en",
      });
    } else {
      choiceQuiz({
        title: "🔁 英 → 中：选出正确的中文意思",
        prompt: `<div class="quiz-en"><span>${esc(w.en)}</span> <button class="audio-btn small" data-say="word">🔊</button></div>`,
        w, field: "zh",
      });
      speak(w);
    }
  }

  function renderSpell() {
    const w = current();
    const header = `${sceneChips()}${progressLine(scopeWords())}<div class="b850-spell-pic">${SceneArt.wordPic(w, 90)}</div>`;
    VocabView.renderSpellCard(container, w, { header, onNext: next });
  }

  // ---------- Wiring ----------
  function render() {
    if (!container) return;
    if (mode === "learn") {
      if (sceneId === "all") renderGrid();
      else renderScene();
      return;
    }
    if (!queue.length) buildQueue();
    if (mode === "pic") renderPicQuiz();
    else if (mode === "spell") renderSpell();
    else renderTransQuiz();
  }

  function onClick(e) {
    const chip = e.target.closest(".scene-chip, .scene-tile");
    if (chip) {
      sceneId = chip.dataset.scene;
      selected = null;
      savePrefs();
      buildQueue();
      render();
      return;
    }
    const wordBtn = e.target.closest(".word-chip, .actor.has-word");
    if (wordBtn && mode === "learn") {
      selectWord(wordBtn.dataset.w);
      return;
    }
    const say = e.target.closest("[data-say]");
    if (say) {
      const w = mode === "learn" ? scopeWords().find((x) => x.id === selected) : current();
      if (!w) return;
      if (say.dataset.say === "example") TTS.speak(w.example, {});
      else speak(w);
    }
  }

  function onKey(e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".actor.has-word") && mode === "learn") {
      e.preventDefault();
      selectWord(e.target.dataset.w);
    }
  }

  function setMode(m, fromButton = false) {
    mode = m;
    savePrefs();
    if (fromButton) {
      document.querySelectorAll("#b850ModeTabs .mode-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
    }
    buildQueue();
    render();
  }

  function init(el) {
    if (!container) {
      el.addEventListener("click", onClick);
      el.addEventListener("keydown", onKey);
      loadPrefs();
    }
    container = el;
    document.querySelectorAll("#b850ModeTabs .mode-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    buildQueue();
    render();
  }

  function allWords() {
    return scenes().flatMap((s) => s.words);
  }

  return { init, setMode, allWords };
})();
