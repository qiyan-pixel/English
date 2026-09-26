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
  function switchView(view) {
    currentView = view;
    $all(".view").forEach((v) => v.classList.remove("active"));
    $(`#view-${view}`).classList.add("active");
    $all(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    closeMobileNav();
    initViewModule(view);
  }

  function updateVocabScopeNote() {
    const { vocabulary, lessons } = AppData.get();
    const count = lessonFilter === "all" ? vocabulary.length : vocabulary.filter((v) => v.lesson === lessonFilter).length;
    const label = lessonFilter === "all" ? "全部 6 课" : (lessons.find((l) => l.id === lessonFilter)?.title || `第 ${lessonFilter} 课`);
    $("#vocabScopeNote").textContent = `当前范围：${label} · 共 ${count} 个单词 · 所有单词均来自这 6 份课件，绝不超纲`;
  }

  function initViewModule(view) {
    if (view === "vocab") { VocabView.init($("#vocabArea"), lessonFilter); updateVocabScopeNote(); }
    else if (view === "sentences") SentencesView.init($("#sentArea"), lessonFilter);
    else if (view === "translate") TranslateView.init($("#transArea"), lessonFilter);
    else if (view === "dialogue") DialogueView.init($("#dlgArea"), lessonFilter);
    else if (view === "chat") ChatView.init($("#view-chat"), lessonFilter);
    else if (view === "home") renderHome();
    else if (view === "progress") renderProgress();
  }

  function openMobileNav() {
    $("#sideNav").classList.add("open");
    $("#navScrim").classList.add("open");
    $("#navToggle").setAttribute("aria-expanded", "true");
  }
  function closeMobileNav() {
    $("#sideNav").classList.remove("open");
    $("#navScrim").classList.remove("open");
    $("#navToggle").setAttribute("aria-expanded", "false");
  }

  function wireNav() {
    $all(".nav-item").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
    $all(".quick-link").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
    $("#navToggle").addEventListener("click", () => {
      $("#sideNav").classList.contains("open") ? closeMobileNav() : openMobileNav();
    });
    $("#navScrim").addEventListener("click", closeMobileNav);
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
  function renderLessonChips() {
    const { lessons } = AppData.get();
    const wrap = $("#lessonChips");
    const chips = [{ id: "all", title: "全部 All" }, ...lessons.map((l) => ({ id: l.id, title: `L${l.id}` }))];
    wrap.innerHTML = chips.map((c) =>
      `<button class="lesson-chip ${c.id === lessonFilter ? "active" : ""}" data-lesson="${c.id}">${c.title}</button>`
    ).join("");
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".lesson-chip");
      if (!btn) return;
      lessonFilter = btn.dataset.lesson === "all" ? "all" : Number(btn.dataset.lesson);
      $all(".lesson-chip", wrap).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (currentView === "vocab") { VocabView.setLesson(lessonFilter); updateVocabScopeNote(); }
      else if (currentView === "sentences") SentencesView.setLesson(lessonFilter);
      else if (currentView === "translate") TranslateView.setLesson(lessonFilter);
      else if (currentView === "dialogue") DialogueView.setLesson(lessonFilter);
      else if (currentView === "chat") ChatView.setLesson(lessonFilter);
      else if (currentView === "home") renderHome();
      else if (currentView === "progress") renderProgress();
    });
  }

  function selectLesson(id) {
    lessonFilter = id;
    $all(".lesson-chip").forEach((b) => b.classList.toggle("active", b.dataset.lesson == id));
  }

  // ---------- Home ----------
  function renderHome() {
    const { lessons, vocabulary } = AppData.get();
    const totalWords = vocabulary.length;
    const overall = Progress.statsFor("vocab", vocabulary.map((v) => v.id));
    $("#homeStats").innerHTML = `
      <div class="stat-pill"><span class="num">${totalWords}</span><span class="label">课件总词汇（已去重）</span></div>
      <div class="stat-pill"><span class="num">${overall.mastered}</span><span class="label">已掌握单词</span></div>
      <div class="stat-pill"><span class="num">${overall.attempted}</span><span class="label">已练习过单词</span></div>
      <div class="stat-pill"><span class="num">${Progress.getStreak()}</span><span class="label">连续学习天数</span></div>
    `;
    $("#lessonCards").innerHTML = lessons.map((l) => {
      const ids = vocabulary.filter((v) => v.lesson === l.id).map((v) => v.id);
      const stats = Progress.statsFor("vocab", ids);
      return `
        <button class="lesson-card" data-lesson="${l.id}">
          <h3>${Util.escapeHtml(l.title)}</h3>
          <p>${Util.escapeHtml(l.grammar_zh)}</p>
          <div class="bar-track"><div class="bar-fill" style="width:${stats.pct}%"></div></div>
          <span class="pct">${ids.length} 个单词 · 掌握 ${stats.pct}%</span>
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
    const { vocabulary, sentences, translations } = AppData.get();
    const v = Progress.statsFor("vocab", vocabulary.map((x) => x.id));
    const s = Progress.statsFor("sentence", sentences.map((x) => x.id));
    const t = Progress.statsFor("translation", translations.map((x) => x.id));
    $("#progressSummary").innerHTML = `
      <div class="stat-pill"><span class="num">${v.mastered}/${v.total}</span><span class="label">单词掌握</span></div>
      <div class="stat-pill"><span class="num">${s.attempted}/${s.total}</span><span class="label">句子练习过</span></div>
      <div class="stat-pill"><span class="num">${t.attempted}/${t.total}</span><span class="label">翻译练习过</span></div>
      <div class="stat-pill"><span class="num">${Progress.getStreak()}</span><span class="label">连续学习天数</span></div>
    `;
    const { lessons } = AppData.get();
    $("#progressByLesson").innerHTML = lessons.map((l) => {
      const ids = vocabulary.filter((x) => x.lesson === l.id).map((x) => x.id);
      const stats = Progress.statsFor("vocab", ids);
      return `
        <div class="progress-lesson-row">
          <span class="name">${Util.escapeHtml(l.title)}</span>
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
        renderProgress();
        renderHome();
      }
    });
  }

  // ---------- Settings modal ----------
  function populateVoiceSelect() {
    const sel = $("#voiceSelect");
    const voices = TTS.getVoices();
    const current = TTS.getVoiceName();
    if (!voices.length) {
      sel.innerHTML = `<option value="">（浏览器暂无可用英文语音，将稍后自动加载）</option>`;
      return;
    }
    sel.innerHTML = voices.map((v) => `<option value="${Util.escapeHtml(v.name)}">${Util.escapeHtml(v.name)} (${v.lang})</option>`).join("");
    if (current) sel.value = current;
  }

  function openSettingsModal() {
    $("#settingsModal").hidden = false;
    populateVoiceSelect();
    setTimeout(populateVoiceSelect, 300); // voices often load async on first visit
    $("#rateRange").value = TTS.getRate();
    $("#rateValue").textContent = TTS.getRate().toFixed(1) + "x";
    $("#apiModelSelect").value = localStorage.getItem("engcourse_api_model") || "claude-haiku-4-5-20251001";
    $("#apiKeyInput").value = "";
    updateKeyStatus();
  }
  window.openSettingsModal = openSettingsModal;

  function closeSettingsModal() {
    $("#settingsModal").hidden = true;
  }

  function updateKeyStatus() {
    const has = !!localStorage.getItem("engcourse_api_key");
    $("#keyStatus").textContent = has ? "✅ 已保存一个 API Key。" : "尚未设置 API Key，AI 对话功能不可用。";
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

    $("#apiModelSelect").addEventListener("change", (e) => localStorage.setItem("engcourse_api_model", e.target.value));
    $("#saveKeyBtn").addEventListener("click", () => {
      const val = $("#apiKeyInput").value.trim();
      if (!val) { toast("请先输入 API Key"); return; }
      localStorage.setItem("engcourse_api_key", val);
      $("#apiKeyInput").value = "";
      updateKeyStatus();
      toast("已保存 API Key");
      if (currentView === "chat") ChatView.render();
    });
    $("#clearKeyBtn").addEventListener("click", () => {
      localStorage.removeItem("engcourse_api_key");
      updateKeyStatus();
      toast("已删除 API Key");
      if (currentView === "chat") ChatView.render();
    });
  }

  // ---------- Boot ----------
  async function boot() {
    try {
      await AppData.loadAll();
    } catch (err) {
      $("#main").innerHTML = `<p style="color:var(--danger)">加载课程数据失败：${err.message}<br>如果你是直接双击打开 index.html，请改用本地服务器打开（例如 python3 -m http.server），浏览器的安全限制不允许直接读取本地文件。</p>`;
      return;
    }
    $("#streakBadge").textContent = `🔥 ${Progress.touchStreak()}`;
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
