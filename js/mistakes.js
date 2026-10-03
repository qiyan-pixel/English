// Mistake book: every word / sentence / translation answered wrong (on an
// answer the learner actually typed) lands here, and stays until it's answered
// right Progress.MISTAKE_CLEAR_STREAK times in a row — here or in any other tab.
const MistakesView = (() => {
  const TYPES = {
    vocab: { label: "单词拼写", emoji: "🔤", color: "blue" },
    sentence: { label: "句子听写", emoji: "🎧", color: "pink" },
    translation: { label: "中译英", emoji: "🔁", color: "purple" },
  };
  let container = null;
  let lessonFilter = "all";
  let lastKey = null;
  let pickedKey = null;
  let flash = "";

  const keyOf = (m) => `${m.category}:${m.id}`;

  function lookup(m) {
    const { vocabulary, sentences, translations } = AppData.get();
    const list = { vocab: vocabulary, sentence: sentences, translation: translations }[m.category];
    return list && list.find((x) => x.id === m.id);
  }

  // Lowest streak first, so the shakiest items come up most often.
  function entries() {
    return Progress.getMistakes()
      .map((m) => ({ m, item: lookup(m) }))
      .filter((e) => e.item && (lessonFilter === "all" || e.item.lesson === lessonFilter));
  }

  function dotsHtml(streak) {
    const n = Progress.MISTAKE_CLEAR_STREAK;
    return `<span class="streak-dots" title="连续答对 ${streak}/${n} 次">${"<i class=\"on\"></i>".repeat(streak)}${"<i></i>".repeat(n - streak)}</span>`;
  }

  function itemText(m, item) {
    if (m.category === "vocab") return `<b>${Util.escapeHtml(item.en)}</b> <span class="dim">${Util.escapeHtml(item.zh)}</span>`;
    if (m.category === "translation") return `${Util.escapeHtml(item.zh)}<br><span class="dim">${Util.escapeHtml(item.en)}</span>`;
    return Util.escapeHtml(item.en);
  }

  function pick(list) {
    const forced = pickedKey && list.find((e) => keyOf(e.m) === pickedKey);
    pickedKey = null;
    if (forced) return forced;
    return list.find((e) => keyOf(e.m) !== lastKey) || list[0];
  }

  function onResult(correct, feedback, m) {
    const now = Progress.getMistake(m.category, m.id);
    const n = Progress.MISTAKE_CLEAR_STREAK;
    let html;
    if (!now) html = `🎓 连续答对 ${n} 次，这道题从错题本毕业啦！`;
    else if (correct) html = `${dotsHtml(now.streak)} 再连续答对 ${n - now.streak} 次就能移出错题本`;
    else html = `${dotsHtml(0)} 答错了，连续答对的次数重新开始数`;
    // Translation cards move on as soon as they're graded, so show the note on the next screen.
    if (m.category === "translation") {
      flash = `上一题：${html}`;
      return;
    }
    const streakEl = container.querySelector(".progress-line .mistake-streak");
    if (streakEl) streakEl.innerHTML = now ? `${dotsHtml(now.streak)} 连续答对 ${now.streak}/${n}` : "🎓 已毕业";
    const note = document.createElement("div");
    note.className = "mistake-note";
    note.innerHTML = html;
    feedback.appendChild(note);
  }

  function renderList(list) {
    return `
      <h2 class="section-title">📋 错题列表（${list.length}）</h2>
      <div class="mistake-list">
        ${list.map(({ m, item }) => `
          <button class="mistake-row c-${TYPES[m.category].color}" data-key="${keyOf(m)}">
            <span class="mr-tag">${TYPES[m.category].emoji} ${TYPES[m.category].label}</span>
            <span class="mr-text">${itemText(m, item)}</span>
            <span class="mr-meta">${dotsHtml(m.streak)}<small>错过 ${m.wrong} 次</small></span>
          </button>`).join("")}
      </div>`;
  }

  function render() {
    if (!container) return;
    const list = entries();
    if (!list.length) {
      const others = Progress.getMistakes().length;
      container.innerHTML = `${flash ? `<div class="mistake-note flash">${flash}</div>` : ""}
        <div class="empty-state">
          <div class="es-emoji">${others ? "🔍" : "🎉"}</div>
          <p>${others
            ? `这一课没有错题，其他课还有 <b>${others}</b> 道，选「全部 All」看看吧。`
            : "错题本是空的，太棒了！<br>拼写、听写、中译英里答错的题会自动来到这里。"}</p>
        </div>`;
      flash = "";
      return;
    }
    const { m, item } = pick(list);
    lastKey = keyOf(m);
    const type = TYPES[m.category];
    const header = `<div class="progress-line"><span class="mistake-tag c-${type.color}">📕 ${type.emoji} ${type.label}</span><span class="mistake-streak">${dotsHtml(m.streak)} 连续答对 ${m.streak}/${Progress.MISTAKE_CLEAR_STREAK}</span></div>`;
    const card = document.createElement("div");
    container.innerHTML = flash ? `<div class="mistake-note flash">${flash}</div>` : "";
    flash = "";
    container.appendChild(card);
    const opts = { header, onNext: render, onResult: (correct, feedback) => onResult(correct, feedback, m) };
    if (m.category === "vocab") VocabView.renderSpellCard(card, item, opts);
    else if (m.category === "sentence") SentencesView.renderDictationCard(card, item, opts);
    else TranslateView.renderZh2EnCard(card, item, opts);

    const listEl = document.createElement("div");
    listEl.innerHTML = renderList(list);
    container.appendChild(listEl);
    listEl.querySelectorAll(".mistake-row").forEach((row) => {
      row.addEventListener("click", () => {
        pickedKey = row.dataset.key;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function init(el, lesson) {
    container = el;
    lessonFilter = lesson;
    lastKey = null;
    render();
  }

  function setLesson(lesson) {
    lessonFilter = lesson;
    render();
  }

  return { init, setLesson };
})();
