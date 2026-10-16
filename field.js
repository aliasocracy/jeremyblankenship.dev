// Faint ASCII noise field behind the page. Decorative only.
(() => {
  const canvas = document.getElementById("field");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;

  const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+=*/<>{}[]#$%&";
  const FONT_PX = 12;
  const FPS = 10;
  const DRIFT = 3;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let cols, rows, cellW, cellH, glyphs, accents, ink, accent, maxAlpha, timer, frame = 0;

  const hash = (i, j) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const pick = () => CHARS[(Math.random() * CHARS.length) | 0];

  // Pick ink from the background actually painted, so dark-mode
  // extensions that rewrite the page colors don't hide the field.
  function readColors() {
    const bg = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || [255, 255, 255];
    const [r, g, b] = bg.map(Number);
    const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
    ink = dark ? "#e7e5df" : "#1d1d1b";
    accent = dark ? "#ec8358" : "#b4451f";
    maxAlpha = dark ? 0.11 : 0.09;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT_PX}px "Geist Mono", ui-monospace, monospace`;
    ctx.textBaseline = "top";
    cellW = Math.ceil(ctx.measureText("M").width) + 1;
    cellH = FONT_PX + 6;
    cols = Math.ceil(innerWidth / cellW);
    rows = Math.ceil(innerHeight / cellH);
    glyphs = Array.from({ length: cols * rows }, pick);
    accents = new Uint8Array(cols * rows).map(() => (Math.random() < 0.004 ? 1 : 0));
    readColors();
  }

  function draw(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const mid = innerWidth / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const f =
          0.65 * noise(c * 0.035 + t * 0.02, r * 0.07 - t * 0.012) +
          0.35 * noise(c * 0.09 - t * 0.03, r * 0.17 + t * 0.02);
        if (f < 0.56) continue;
        // Strongest at the edges, faint behind the text column.
        const edge = Math.min(Math.abs(c * cellW - mid) / (mid * 0.85), 1);
        const mask = 0.18 + 0.82 * edge * edge;
        const i = r * cols + c;
        ctx.globalAlpha = Math.min((f - 0.56) / 0.3, 1) * maxAlpha * mask * (accents[i] ? 3 : 1);
        ctx.fillStyle = accents[i] ? accent : ink;
        ctx.fillText(glyphs[i], c * cellW, r * cellH);
      }
    }
  }

  function tick() {
    if (!document.hidden) {
      for (let k = 0; k < glyphs.length * 0.01; k++) {
        glyphs[(Math.random() * glyphs.length) | 0] = pick();
      }
      if (++frame % (FPS * 2) === 0) readColors();
      draw((performance.now() / 1000) * DRIFT);
    }
    timer = setTimeout(tick, 1000 / FPS);
  }

  function start() {
    resize();
    if (still) draw(0);
    else tick();
  }

  addEventListener("resize", () => {
    clearTimeout(timer);
    start();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    readColors();
    if (still) draw(0);
  });

  document.fonts.load(`${FONT_PX}px "Geist Mono"`).then(start, start);
})();
