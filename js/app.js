(function () {
  let lessonFilter = "all";
  let currentView = "home";

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  // ---------- Navigation ----------
  function switchView(view, mode) {
    currentView = view;
    if (mode) markModeTab(view, mode);
    $all(".view").forEach((v) => v.classList.remove("active"));
    $(`#view-${view}`).classList.add("active");
    $all(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    window.scrollTo(0, 0);
    initViewModule(view, mode);
  }

  function markModeTab(view, mode) {
    const tab = $(`#view-${view} .mode-tab[data-mode="${mode}"]`);
    if (tab) $all(".mode-tab", tab.parentElement).forEach((b) => b.classList.toggle("active", b === tab));
  }

  function updateVocabScopeNote() {
    const { vocabulary, lessons } = AppData.get();
    const count = lessonFilter === "all" ? vocabulary.length : vocabulary.filter((v) => v.lesson === lessonFilter).length;
    const label = lessonFilter === "all" ? "全部 6 课" : (lessons.find((l) => l.id === lessonFilter)?.title || `第 ${lessonFilter} 课`);
    $("#vocabScopeNote").textContent = `📚 ${label} · 一共 ${count} 个单词，都来自课件哦`;
  }

  function initViewModule(view, mode) {
    if (view === "vocab") { VocabView.init($("#vocabArea"), lessonFilter, mode); updateVocabScopeNote(); }
    else if (view === "sentences") SentencesView.init($("#sentArea"), lessonFilter, mode);
    else if (view === "translate") TranslateView.init($("#transArea"), lessonFilter);
    else if (view === "dialogue") DialogueView.init($("#dlgArea"), lessonFilter);
    else if (view === "mistakes") MistakesView.init($("#mistakeArea"), lessonFilter);
    else if (view === "home") renderHome();
    else if (view === "progress") renderProgress();
  }

  function wireNav() {
    $all(".nav-item").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
    $all(".game-tile").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view, btn.dataset.mode)));
  }

  function wireModeTabs(containerId, onChange) {
    const el = $(containerId);
    el.addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-tab");
      if (!btn) return;
      $all(".mode-tab", el).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(btn.dataset.mode);
    });
  }

  // ---------- Lesson picker ----------
  // Rendered twice: in the side nav (wide screens) and as a row above the
  // content (phones/tablets, where the nav becomes a bottom tab bar).
  function renderLessonChips() {
    const { lessons } = AppData.get();
    const chips = [{ id: "all", title: "全部 All" }, ...lessons.map((l) => ({ id: l.id, title: `L${l.id}` }))];
    $all("[data-chips]").forEach((wrap) => {
      wrap.innerHTML = chips.map((c) =>
        `<button class="lesson-chip ${c.id === lessonFilter ? "active" : ""}" data-lesson="${c.id}">${c.title}</button>`
      ).join("");
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".lesson-chip");
        if (!btn) return;
        selectLesson(btn.dataset.lesson === "all" ? "all" : Number(btn.dataset.lesson));
        if (currentView === "vocab") { VocabView.setLesson(lessonFilter); updateVocabScopeNote(); }
        else if (currentView === "sentences") SentencesView.setLesson(lessonFilter);
        else if (currentView === "translate") TranslateView.setLesson(lessonFilter);
        else if (currentView === "dialogue") DialogueView.setLesson(lessonFilter);
        else if (currentView === "mistakes") MistakesView.setLesson(lessonFilter);
        else if (currentView === "home") renderHome();
        else if (currentView === "progress") renderProgress();
      });
    });
  }

  function selectLesson(id) {
    lessonFilter = id;
    $all(".lesson-chip").forEach((b) => b.classList.toggle("active", b.dataset.lesson == id));
  }

  // ---------- Stars & badges ----------
  function updateBadges() {
    $("#starBadge").textContent = `⭐ ${Progress.getStars().total}`;
    $("#streakBadge").textContent = `🔥 ${Progress.getStreak()}`;
    const n = Progress.getMistakes().length;
    const badge = $("#mistakeBadge");
    badge.hidden = n === 0;
    badge.textContent = n > 99 ? "99+" : String(n);
  }

  function onMistakeCleared(e) {
    const { category, id } = e.detail;
    const { vocabulary, sentences, translations } = AppData.get();
    const list = { vocab: vocabulary, sentence: sentences, translation: translations }[category];
    const item = list.find((x) => x.id === id);
    const name = item ? (category === "translation" ? item.zh : item.en) : "";
    toast(`🎓 「${name.length > 24 ? name.slice(0, 24) + "…" : name}」连续答对 ${Progress.MISTAKE_CLEAR_STREAK} 次，从错题本毕业啦！`);
  }

  function onStar(e) {
    const { total } = e.detail;
    const badge = $("#starBadge");
    updateBadges();
    badge.classList.remove("pop");
    void badge.offsetWidth;
    badge.classList.add("pop");
    const plus = document.createElement("span");
    plus.className = "plus-one";
    plus.textContent = "+1 ⭐";
    plus.addEventListener("animationend", () => plus.remove());
    badge.appendChild(plus);
    if (total % 10 === 0) {
      Fx.burst(badge, 24, 180);
      toast(`🎉 太厉害了！已经收集了 ${total} 颗星星！`);
    }
  }

  function statPill(emoji, num, label, color) {
    return `<div class="stat-pill c-${color}"><span class="sp-emoji">${emoji}</span><span class="num">${num}</span><span class="label">${label}</span></div>`;
  }

  // ---------- Home ----------
  const LESSON_EMOJI = ["👋", "⏰", "🎾", "❤️", "✈️", "🏠"];
  const LESSON_COLORS = ["blue", "orange", "pink", "purple", "teal", "green"];

  function renderHome() {
    const { lessons, vocabulary } = AppData.get();
    const scoped = lessonFilter === "all" ? vocabulary : vocabulary.filter((v) => v.lesson === lessonFilter);
    const overall = Progress.statsFor("vocab", scoped.map((v) => v.id));
    const stars = Progress.getStars();
    $("#homeStats").innerHTML =
      statPill("⭐", stars.today, "今天的星星", "yellow") +
      statPill("🏆", stars.total, "星星总数", "orange") +
      statPill("🔤", `${overall.mastered}<small>/${scoped.length}</small>`, `学会的单词${lessonFilter === "all" ? "" : ` · L${lessonFilter}`}（练过 ${overall.attempted}）`, "blue") +
      statPill("🔥", Progress.getStreak(), "连续学习天数", "pink");
    const mistakes = Progress.getMistakes().length;
    $("#homeMistakes").innerHTML = mistakes
      ? `<button class="mistake-banner" id="mistakeBannerBtn"><span class="mb-emoji">📕</span><span class="mb-text"><b>错题本里有 ${mistakes} 道题</b><small>每道连续答对 3 次就能消灭它！</small></span><span class="mb-go">去练习 ➡️</span></button>`
      : "";
    $("#mistakeBannerBtn")?.addEventListener("click", () => switchView("mistakes"));
    $("#lessonCards").innerHTML = lessons.map((l, i) => {
      const ids = vocabulary.filter((v) => v.lesson === l.id).map((v) => v.id);
      const stats = Progress.statsFor("vocab", ids);
      return `
        <button class="lesson-card c-${LESSON_COLORS[i % LESSON_COLORS.length]}" data-lesson="${l.id}">
          <span class="lc-badge">${LESSON_EMOJI[i % LESSON_EMOJI.length]}</span>
          <h3>${Util.escapeHtml(l.title)}</h3>
          <p>${Util.escapeHtml(l.grammar_zh)}</p>
          <div class="bar-track"><div class="bar-fill" style="width:${stats.pct}%"></div></div>
          <span class="pct">${ids.length} 个单词 · 学会 ${stats.pct}%</span>
        </button>
      `;
    }).join("");
    $all(".lesson-card", $("#lessonCards")).forEach((card) => {
      card.addEventListener("click", () => {
        selectLesson(Number(card.dataset.lesson));
        switchView("vocab");
      });
    });
  }

  // ---------- Progress page ----------
  function renderProgress() {
    const { vocabulary, sentences, translations, lessons } = AppData.get();
    const ids = vocabulary.map((x) => x.id);
    const v = Progress.statsFor("vocab", ids);
    const sp = Progress.statsFor("spell", ids);
    const s = Progress.statsFor("sentence", sentences.map((x) => x.id));
    const t = Progress.statsFor("translation", translations.map((x) => x.id));
    $("#progressSummary").innerHTML =
      statPill("⭐", Progress.getStars().total, "星星总数", "yellow") +
      statPill("🔤", `${v.mastered}<small>/${v.total}</small>`, "学会的单词", "blue") +
      statPill("✍️", `${sp.mastered}<small>/${sp.total}</small>`, "能完整拼写", "orange") +
      statPill("🗣️", `${s.attempted}<small>/${s.total}</small>`, "练过的句子", "pink") +
      statPill("🔁", `${t.attempted}<small>/${t.total}</small>`, "练过的翻译", "purple") +
      statPill("📕", Progress.getMistakes().length, "错题本里的题", "red") +
      statPill("🔥", Progress.getStreak(), "连续学习天数", "green");
    $("#progressByLesson").innerHTML = lessons.map((l, i) => {
      const lessonIds = vocabulary.filter((x) => x.lesson === l.id).map((x) => x.id);
      const stats = Progress.statsFor("vocab", lessonIds);
      return `
        <div class="progress-lesson-row c-${LESSON_COLORS[i % LESSON_COLORS.length]}">
          <span class="name">${LESSON_EMOJI[i % LESSON_EMOJI.length]} ${Util.escapeHtml(l.title)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${stats.pct}%"></div></div>
          <span class="pct">${stats.pct}%</span>
        </div>
      `;
    }).join("");
  }

  function wireProgressPage() {
    $("#exportProgressBtn").addEventListener("click", () => {
      const blob = new Blob([Progress.exportJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `english-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $("#importProgressInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Progress.importJSON(reader.result);
          toast("导入成功！");
          updateBadges();
          renderProgress();
          renderHome();
        } catch (err) {
          toast("导入失败：" + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
    $("#resetProgressBtn").addEventListener("click", () => {
      if (confirm("确定要清空全部学习记录吗？此操作无法撤销。")) {
        Progress.resetAll();
        toast("已重置学习进度");
        updateBadges();
        renderProgress();
        renderHome();
      }
    });
  }

  // ---------- Settings modal ----------
  function populateVoiceSelect() {
    const sel = $("#voiceSelect");
    const voices = TTS.getVoices();
    const saved = TTS.getVoiceName();
    if (!voices.length) {
      sel.innerHTML = `<option value="">（这台设备暂时没有美式英语语音，稍后会自动加载）</option>`;
      return;
    }
    sel.innerHTML = `<option value="">自动选择（推荐）· ${Util.escapeHtml(voices[0].name)}</option>` +
      voices.map((v) => `<option value="${Util.escapeHtml(v.name)}">${Util.escapeHtml(v.name)}</option>`).join("");
    sel.value = voices.some((v) => v.name === saved) ? saved : "";
  }

  function openSettingsModal() {
    $("#settingsModal").hidden = false;
    populateVoiceSelect();
    setTimeout(populateVoiceSelect, 300); // voices often load async on first visit
    $("#rateRange").value = TTS.getRate();
    $("#rateValue").textContent = TTS.getRate().toFixed(1) + "x";
  }

  function closeSettingsModal() {
    $("#settingsModal").hidden = true;
  }

  function wireSettings() {
    $("#settingsBtn").addEventListener("click", openSettingsModal);
    $("#settingsCloseBtn").addEventListener("click", closeSettingsModal);
    $("#settingsModal").addEventListener("click", (e) => { if (e.target.id === "settingsModal") closeSettingsModal(); });

    $("#voiceSelect").addEventListener("change", (e) => TTS.setVoiceName(e.target.value));
    $("#rateRange").addEventListener("input", (e) => {
      TTS.setRate(parseFloat(e.target.value));
      $("#rateValue").textContent = parseFloat(e.target.value).toFixed(1) + "x";
    });
    $("#testVoiceBtn").addEventListener("click", () => TTS.speak("Hello! This is a test. Are you ready to study English?", {}));
  }

  // ---------- Boot ----------
  async function boot() {
    try {
      await AppData.loadAll();
    } catch (err) {
      $("#main").innerHTML = `<p style="color:var(--danger)">加载课程数据失败：${err.message}<br>如果你是直接双击打开 index.html，请改用本地服务器打开（例如 python3 -m http.server），浏览器的安全限制不允许直接读取本地文件。</p>`;
      return;
    }
    Progress.touchStreak();
    updateBadges();
    window.addEventListener("engcourse:star", onStar);
    window.addEventListener("engcourse:mistakes-changed", updateBadges);
    window.addEventListener("engcourse:mistake-cleared", onMistakeCleared);
    renderLessonChips();
    wireNav();
    wireSettings();
    wireProgressPage();
    wireModeTabs("#vocabModeTabs", (m) => VocabView.setMode(m));
    wireModeTabs("#sentModeTabs", (m) => SentencesView.setMode(m));
    wireModeTabs("#transModeTabs", (m) => TranslateView.setDirection(m));
    wireModeTabs("#dlgModeTabs", (m) => DialogueView.setMode(m));
    renderHome();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
