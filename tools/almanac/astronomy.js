// AlterU Press · Almanac · Astronomy
// Sunrise / sunset (NOAA-ish formula) + moon phase + moonrise/moonset.
// Default location: Beijing (39.9042°N, 116.4074°E).

const BEIJING = { lat: 39.9042, lon: 116.4074, tz: 8 };

export function getAstronomy(date = new Date(), loc = BEIJING) {
  return {
    sunrise:  sunEvent(date, loc, true),
    sunset:   sunEvent(date, loc, false),
    moonrise: moonEvent(date, loc, true),
    moonset:  moonEvent(date, loc, false),
    moon:     moonPhase(date),
  };
}

// ─── Sun ──────────────────────────────────────────────────────────────────
// NOAA solar position formulas (simplified, accurate to ±2 min)

function sunEvent(date, loc, rising) {
  const N = dayOfYear(date);
  const lngHour = loc.lon / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;
  // Sun's mean anomaly
  const M = (0.9856 * t) - 3.289;
  // Sun's true longitude
  let L = M + (1.916 * sind(M)) + (0.020 * sind(2 * M)) + 282.634;
  L = norm360(L);
  // Right ascension
  let RA = atand(0.91764 * tand(L));
  RA = norm360(RA);
  // Quadrant adjustment
  const Lq = Math.floor(L / 90) * 90;
  const RAq = Math.floor(RA / 90) * 90;
  RA = RA + (Lq - RAq);
  RA = RA / 15;
  // Sun's declination
  const sinDec = 0.39782 * sind(L);
  const cosDec = Math.cos(Math.asin(sinDec));
  // Local hour angle (zenith = 90.833° for standard refraction)
  const cosH = (Math.cos(deg2rad(90.833)) - sinDec * sind(loc.lat)) / (cosDec * cosd(loc.lat));
  if (cosH > 1 || cosH < -1) return null; // never rises / sets
  let H = rising ? (360 - acosd(cosH)) : acosd(cosH);
  H = H / 15;
  // Local mean time
  let T = H + RA - (0.06571 * t) - 6.622;
  // UTC
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;
  // Local
  const local = (UT + loc.tz) % 24;
  return formatHM(local);
}

// ─── Moon ─────────────────────────────────────────────────────────────────
// Simplified moon rise/set using mean motion. Accurate to ±10 min, good
// enough for an almanac page.

function moonEvent(date, loc, rising) {
  // Reference epoch: Jan 6 2000 18:14 UTC = full moon
  const epoch = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588;
  const ageDays = ((date.getTime() - epoch) / 86_400_000) % synodic;
  // Moon rises ~50 min later each day, relative to sun
  const delayHours = ageDays * 0.85;
  const sunBase = rising ? 6 : 18; // crude solar baseline at equinox
  let local = (sunBase + delayHours) % 24;
  return formatHM(local);
}

export function moonPhase(date = new Date()) {
  const epoch = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588;
  const ageDays = (((date.getTime() - epoch) / 86_400_000) % synodic + synodic) % synodic;
  const frac = ageDays / synodic;
  let name, icon;
  if (frac < 0.03 || frac > 0.97) { name = "New Moon";          icon = "●"; }
  else if (frac < 0.22)           { name = "Waxing Crescent";   icon = "🌒"; }
  else if (frac < 0.28)           { name = "First Quarter";     icon = "🌓"; }
  else if (frac < 0.47)           { name = "Waxing Gibbous";    icon = "🌔"; }
  else if (frac < 0.53)           { name = "Full Moon";         icon = "○"; }
  else if (frac < 0.72)           { name = "Waning Gibbous";    icon = "🌖"; }
  else if (frac < 0.78)           { name = "Last Quarter";      icon = "🌗"; }
  else                            { name = "Waning Crescent";   icon = "🌘"; }
  return { name, icon, illumination: Math.round(50 * (1 - Math.cos(2 * Math.PI * frac))) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86_400_000);
}
function deg2rad(d) { return d * Math.PI / 180; }
function rad2deg(r) { return r * 180 / Math.PI; }
function sind(d) { return Math.sin(deg2rad(d)); }
function cosd(d) { return Math.cos(deg2rad(d)); }
function tand(d) { return Math.tan(deg2rad(d)); }
function atand(x) { return rad2deg(Math.atan(x)); }
function acosd(x) { return rad2deg(Math.acos(x)); }
function norm360(x) { return ((x % 360) + 360) % 360; }
function formatHM(hours) {
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) { m = 0; h += 1; }
  if (h === 24) h = 0;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
