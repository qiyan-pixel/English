// localStorage-based progress tracking: per-item mastery level (0-5, Leitner-ish),
// plus a daily streak counter. No backend, no accounts — everything lives in
// this browser only (use Export/Import on the Progress page to move devices).
const Progress = (() => {
  const KEY = "engcourse_progress_v1";
  let state = null;

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function defaultState() {
    return { items: {}, streak: { lastDate: null, count: 0 }, stars: { total: 0, today: 0, date: null }, createdAt: Date.now() };
  }

  function fillDefaults(s) {
    if (!s.items) s.items = {};
    if (!s.streak) s.streak = { lastDate: null, count: 0 };
    if (!s.stars) s.stars = { total: 0, today: 0, date: null };
    return s;
  }

  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : defaultState();
    } catch (e) {
      state = defaultState();
    }
    return fillDefaults(state);
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // storage full or unavailable (private mode) — fail silently, practice still works this session
    }
  }

  function key(category, id) {
    return `${category}:${id}`;
  }

  function getItem(category, id) {
    load();
    return state.items[key(category, id)] || { level: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
  }

  function recordResult(category, id, correct) {
    load();
    const k = key(category, id);
    const cur = state.items[k] || { level: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
    cur.seen += 1;
    cur.last = Date.now();
    if (correct) {
      cur.correct += 1;
      cur.level = Math.min(5, cur.level + 1);
    } else {
      cur.wrong += 1;
      cur.level = Math.max(0, cur.level - 1);
    }
    state.items[k] = cur;
    save();
    return cur;
  }

  function statsFor(category, ids) {
    load();
    let mastered = 0, attempted = 0;
    for (const id of ids) {
      const it = state.items[key(category, id)];
      if (it && it.seen > 0) attempted += 1;
      if (it && it.level >= 4) mastered += 1;
    }
    return { total: ids.length, attempted, mastered, pct: ids.length ? Math.round((mastered / ids.length) * 100) : 0 };
  }

  function touchStreak() {
    load();
    const today = todayStr();
    if (state.streak.lastDate === today) return state.streak.count;
    const yesterday = new Date(Date.now() - 86400000);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (state.streak.lastDate === yStr) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastDate = today;
    save();
    return state.streak.count;
  }

  function getStreak() {
    load();
    return state.streak.count;
  }

  function getStars() {
    load();
    return { total: state.stars.total, today: state.stars.date === todayStr() ? state.stars.today : 0 };
  }

  // Awarded only for answers the site actually checked (not self-graded ones),
  // so stars can't be farmed by tapping "I know it".
  function addStar() {
    load();
    const today = todayStr();
    if (state.stars.date !== today) {
      state.stars.date = today;
      state.stars.today = 0;
    }
    state.stars.total += 1;
    state.stars.today += 1;
    save();
    window.dispatchEvent(new CustomEvent("engcourse:star", { detail: getStars() }));
  }

  function exportJSON() {
    load();
    return JSON.stringify(state, null, 2);
  }

  function importJSON(str) {
    const parsed = JSON.parse(str);
    if (!parsed || typeof parsed !== "object" || !parsed.items) {
      throw new Error("这不是有效的学习记录文件");
    }
    state = fillDefaults(parsed);
    save();
  }

  function resetAll() {
    state = defaultState();
    save();
  }

  return { load, getItem, recordResult, statsFor, touchStreak, getStreak, getStars, addStar, exportJSON, importJSON, resetAll };
})();
