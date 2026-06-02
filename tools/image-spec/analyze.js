// AlterU Press · Image Spec · client-side pixel analysis
// All analysis runs on a downsampled canvas for speed.

export const ANALYZE_VERSION = "1.0";
const SAMPLE_MAX = 220;

export async function analyzeImage(imgEl) {
  const t0 = performance.now();

  const { canvas, ctx, w, h, scale } = downsample(imgEl);
  const data = ctx.getImageData(0, 0, w, h).data;

  const palette = kmeansPalette(data, 6);
  const bright = brightnessStats(data);
  const temp = colorTemperature(data, palette);
  const sat = saturationStats(data);
  const edges = edgeDensity(data, w, h);
  const focal = focalPoint(data, w, h);

  const naturalW = imgEl.naturalWidth || imgEl.width;
  const naturalH = imgEl.naturalHeight || imgEl.height;
  const ar = aspectLabel(naturalW, naturalH);

  return {
    version: ANALYZE_VERSION,
    elapsed: Math.round(performance.now() - t0),
    dimensions: {
      w: naturalW,
      h: naturalH,
      megapixels: +(naturalW * naturalH / 1_000_000).toFixed(2),
      aspect: ar.label,
      aspectRatio: ar.ratio,
      orientation: naturalW > naturalH ? "landscape" : naturalW < naturalH ? "portrait" : "square",
    },
    palette,
    brightness: bright,
    temperature: temp,
    saturation: sat,
    edges,
    focal,
    sample: { w, h, scale },
  };
}

function downsample(img) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const scale = Math.min(1, SAMPLE_MAX / Math.max(nw, nh));
  const w = Math.max(2, Math.round(nw * scale));
  const h = Math.max(2, Math.round(nh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h, scale };
}

// ---------- Palette via quantized k-means ----------

function kmeansPalette(data, k) {
  const buckets = new Map();
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const points = [];
  for (const [key, count] of buckets) {
    const r = ((key >> 10) & 31) << 3;
    const g = ((key >> 5) & 31) << 3;
    const b = (key & 31) << 3;
    points.push([r, g, b, count]);
  }
  if (points.length === 0) return [];
  points.sort((a, b) => b[3] - a[3]);
  const seeds = [];
  const minDist2 = 60 * 60;
  for (const p of points) {
    if (seeds.length >= k) break;
    let ok = true;
    for (const s of seeds) {
      const d2 = (p[0] - s[0]) ** 2 + (p[1] - s[1]) ** 2 + (p[2] - s[2]) ** 2;
      if (d2 < minDist2) { ok = false; break; }
    }
    if (ok) seeds.push([p[0], p[1], p[2]]);
  }
  while (seeds.length < k && seeds.length < points.length) {
    seeds.push([...points[seeds.length].slice(0, 3)]);
  }

  let centroids = seeds.map(s => s.slice());
  for (let iter = 0; iter < 10; iter++) {
    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (const p of points) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = sqDist(p, centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      const s = sums[best];
      s[0] += p[0] * p[3];
      s[1] += p[1] * p[3];
      s[2] += p[2] * p[3];
      s[3] += p[3];
    }
    let moved = 0;
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c][3] === 0) continue;
      const nr = sums[c][0] / sums[c][3];
      const ng = sums[c][1] / sums[c][3];
      const nb = sums[c][2] / sums[c][3];
      moved += Math.abs(nr - centroids[c][0]) + Math.abs(ng - centroids[c][1]) + Math.abs(nb - centroids[c][2]);
      centroids[c] = [nr, ng, nb];
    }
    if (moved < 2) break;
  }

  const counts = centroids.map(() => 0);
  for (const p of points) {
    let best = 0, bestD = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const d = sqDist(p, centroids[c]);
      if (d < bestD) { bestD = d; best = c; }
    }
    counts[best] += p[3];
  }
  const sumAll = counts.reduce((a, b) => a + b, 0) || 1;
  const out = centroids.map((c, i) => ({
    rgb: [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])],
    hex: rgbToHex(c[0], c[1], c[2]),
    pct: +(counts[i] / sumAll * 100).toFixed(1),
    name: namedHue(c[0], c[1], c[2]),
  }))
  .filter(c => c.pct >= 0.5)
  .sort((a, b) => b.pct - a.pct);

  return out;
}

function sqDist(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// ---------- Brightness ----------

function brightnessStats(data) {
  const bins = new Array(16).fill(0);
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const y = luma(data[i], data[i + 1], data[i + 2]);
    sum += y;
    n++;
    bins[Math.min(15, Math.floor(y / 16))]++;
  }
  const avg = n ? sum / n : 0;
  const max = Math.max(...bins) || 1;
  const norm = bins.map(b => +(b / max).toFixed(3));
  let label = "balanced";
  if (avg < 80) label = "dim";
  else if (avg < 110) label = "muted";
  else if (avg < 150) label = "balanced";
  else if (avg < 190) label = "bright";
  else label = "blown";
  return { avg: Math.round(avg), histogram: norm, label };
}

// ---------- Color temperature ----------

function colorTemperature(data, palette) {
  let warm = 0, cool = 0, neutral = 0;
  for (const p of palette) {
    const t = hueTemp(p.rgb[0], p.rgb[1], p.rgb[2]);
    if (t > 0) warm += p.pct * t;
    else if (t < 0) cool += p.pct * -t;
    else neutral += p.pct;
  }
  const total = warm + cool + neutral || 1;
  const warmPct = Math.round(warm / total * 100);
  const coolPct = Math.round(cool / total * 100);
  const neutralPct = Math.max(0, 100 - warmPct - coolPct);
  let label = "neutral";
  if (warmPct - coolPct > 20) label = "warm";
  else if (coolPct - warmPct > 20) label = "cool";
  else if (Math.abs(warmPct - coolPct) <= 8) label = "balanced";
  return { warm: warmPct, cool: coolPct, neutral: neutralPct, label };
}

function hueTemp(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.12) return 0;
  const { h } = rgbToHsl(r, g, b);
  if (h < 60 || h > 320) return 1;
  if (h >= 180 && h <= 260) return -1;
  if (h >= 60 && h < 90) return 0.6;
  if (h >= 90 && h < 180) return -0.4;
  if (h > 260 && h <= 320) return -0.5;
  return 0;
}

// ---------- Saturation ----------

function saturationStats(data) {
  let sum = 0, n = 0, vivid = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const { s } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    sum += s;
    if (s > 60) vivid++;
    n++;
  }
  const avg = n ? sum / n : 0;
  let label = "muted";
  if (avg > 55) label = "vivid";
  else if (avg > 35) label = "saturated";
  else if (avg > 18) label = "soft";
  else label = "muted";
  return { avg: Math.round(avg), vividPct: Math.round(vivid / (n || 1) * 100), label };
}

// ---------- Edges (Sobel magnitude) ----------

function edgeDensity(data, w, h) {
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = luma(data[i], data[i + 1], data[i + 2]);
  }
  let sum = 0, count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = gray[i - w - 1], t = gray[i - w], tr = gray[i - w + 1];
      const l = gray[i - 1], r = gray[i + 1];
      const bl = gray[i + w - 1], b = gray[i + w], br = gray[i + w + 1];
      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      sum += Math.abs(gx) + Math.abs(gy);
      count++;
    }
  }
  const mean = sum / (count || 1);
  const score = Math.min(10, +(mean / 30).toFixed(1));
  let label = "soft";
  if (score >= 7) label = "intricate";
  else if (score >= 5) label = "busy";
  else if (score >= 3) label = "balanced";
  else if (score >= 1.5) label = "spare";
  else label = "soft";
  return { score, label };
}

// ---------- Focal point ----------

function focalPoint(data, w, h) {
  const gridX = 6, gridY = 6;
  const cells = new Array(gridX * gridY).fill(0);
  const cellArea = new Array(gridX * gridY).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 32) continue;
      const { s } = rgbToHsl(data[idx], data[idx + 1], data[idx + 2]);
      const y8 = luma(data[idx], data[idx + 1], data[idx + 2]);
      const energy = s * 0.7 + (255 - Math.abs(y8 - 160)) * 0.3;
      const cx = Math.min(gridX - 1, Math.floor(x / w * gridX));
      const cy = Math.min(gridY - 1, Math.floor(y / h * gridY));
      const ci = cy * gridX + cx;
      cells[ci] += energy;
      cellArea[ci]++;
    }
  }
  for (let i = 0; i < cells.length; i++) {
    cells[i] = cellArea[i] ? cells[i] / cellArea[i] : 0;
  }
  let max = -Infinity, mi = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] > max) { max = cells[i]; mi = i; }
  }
  const fx = mi % gridX, fy = Math.floor(mi / gridX);
  const xLabel = ["far left", "left", "center-left", "center-right", "right", "far right"][fx];
  const yLabel = ["top", "upper", "upper-mid", "lower-mid", "lower", "bottom"][fy];
  let label;
  if (fx >= 2 && fx <= 3 && fy >= 2 && fy <= 3) label = "centered";
  else label = `${yLabel} ${xLabel}`;
  return { gridX: fx, gridY: fy, label };
}

// ---------- Utilities ----------

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHex(r, g, b) {
  const h = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return ("#" + h(r) + h(g) + h(b)).toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function namedHue(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 8) {
    if (l < 12) return "near black";
    if (l < 32) return "charcoal";
    if (l < 55) return "grey";
    if (l < 80) return "silver";
    return "near white";
  }
  if (s < 22) {
    if (l < 40) return "muted dark";
    if (l < 70) return "muted mid";
    return "muted light";
  }
  const family =
    h < 15  ? "red"     :
    h < 40  ? "orange"  :
    h < 65  ? "yellow"  :
    h < 95  ? "lime"    :
    h < 160 ? "green"   :
    h < 190 ? "teal"    :
    h < 220 ? "cyan"    :
    h < 255 ? "blue"    :
    h < 290 ? "violet"  :
    h < 325 ? "magenta" : "red";
  const tone = l < 30 ? "deep" : l < 55 ? "" : l < 75 ? "soft" : "pale";
  return tone ? `${tone} ${family}` : family;
}

function aspectLabel(w, h) {
  if (w === h) return { label: "1:1", ratio: 1 };
  const ratios = [
    { w: 16, h: 9 }, { w: 9, h: 16 },
    { w: 4, h: 3 },  { w: 3, h: 4 },
    { w: 3, h: 2 },  { w: 2, h: 3 },
    { w: 5, h: 4 },  { w: 4, h: 5 },
    { w: 21, h: 9 }, { w: 9, h: 21 },
    { w: 2, h: 1 },  { w: 1, h: 2 },
  ];
  const target = w / h;
  let best = ratios[0], bestDiff = Infinity;
  for (const r of ratios) {
    const diff = Math.abs(target - r.w / r.h);
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  if (bestDiff > 0.05) {
    return { label: `${target.toFixed(2)}:1`, ratio: +target.toFixed(3) };
  }
  return { label: `${best.w}:${best.h}`, ratio: +(best.w / best.h).toFixed(3) };
}
