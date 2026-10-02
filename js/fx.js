// Small celebration effects for kids (emoji bursts). Decorative only, and
// skipped entirely when the user's system asks for reduced motion.
const Fx = (() => {
  const EMOJI = ["⭐", "✨", "🎉", "🌟", "💫"];

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function burst(el, count = 12, spread = 110) {
    if (!el || reducedMotion()) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "confetti";
      p.textContent = EMOJI[i % EMOJI.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.45 + Math.random() * 0.55);
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist + 24}px`);
      p.style.setProperty("--rot", `${Math.round(Math.random() * 360 - 180)}deg`);
      p.addEventListener("animationend", () => p.remove());
      document.body.appendChild(p);
    }
  }

  return { burst };
})();
