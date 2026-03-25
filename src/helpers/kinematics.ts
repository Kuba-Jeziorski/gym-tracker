const toDot = (s: string) => s.trim().replace(",", ".");

function parseNonNegativeNumber(s: string): number | null {
  const trimmed = s?.trim();
  if (!trimmed) return null;
  const n = parseFloat(toDot(trimmed));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseDurationToSeconds(s: string): number | null {
  const trimmed = s?.trim();
  if (!trimmed) return null;
  const norm = trimmed.includes(":") ? trimmed : toDot(trimmed);

  if (norm.includes(":")) {
    const parts = norm.split(":").map((p) => parseNonNegativeNumber(p) ?? NaN);
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return null;
  }

  const n = parseFloat(norm);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parsePaceToMinPerKm(s: string): number | null {
  const trimmed = s?.trim();
  if (!trimmed) return null;
  const norm = trimmed.includes(":") ? toDot(trimmed) : toDot(trimmed);

  if (norm.includes(":")) {
    const [mStr, secStr] = norm.split(":");
    const m = parseNonNegativeNumber(mStr);
    const secs = parseNonNegativeNumber(secStr);
    if (m == null || secs == null) return null;
    if (secs >= 60) return null;
    return m + secs / 60;
  }

  const n = parseFloat(norm);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseDistanceKm(s: string): number | null {
  return parseNonNegativeNumber(s);
}

export function parseAvgVelocityKmh(s: string): number | null {
  return parseNonNegativeNumber(s);
}

export type DerivedKinematics = {
  durationSec: number | null;
  distanceKm: number | null;
  avgVelocityKmh: number | null;
  paceMinPerKm: number | null;
};

export function deriveKinematicsFromSet(set: {
  time?: string;
  distance?: string;
  avgVelocity?: string;
  pace?: string;
}): DerivedKinematics {
  const durationSec = set.time ? parseDurationToSeconds(set.time) : null;
  const distanceKm = set.distance ? parseDistanceKm(set.distance) : null;
  const avgVelocityKmh = set.avgVelocity ? parseAvgVelocityKmh(set.avgVelocity) : null;
  const paceMinPerKm = set.pace ? parsePaceToMinPerKm(set.pace) : null;

  if (durationSec != null && avgVelocityKmh != null) {
    const distance = avgVelocityKmh * (durationSec / 3600);
    const pace = 60 / avgVelocityKmh;
    return { durationSec, distanceKm: distance, avgVelocityKmh, paceMinPerKm: pace };
  }

  if (durationSec != null && paceMinPerKm != null) {
    const distance = (durationSec / 60) / paceMinPerKm;
    const velocity = distance / (durationSec / 3600);
    return { durationSec, distanceKm: distance, avgVelocityKmh: velocity, paceMinPerKm };
  }

  if (distanceKm != null && avgVelocityKmh != null) {
    const duration = (distanceKm / avgVelocityKmh) * 3600;
    const pace = 60 / avgVelocityKmh;
    return { durationSec: duration, distanceKm, avgVelocityKmh, paceMinPerKm: pace };
  }

  if (distanceKm != null && paceMinPerKm != null) {
    const duration = paceMinPerKm * distanceKm * 60;
    const velocity = distanceKm / (duration / 3600);
    return { durationSec: duration, distanceKm, avgVelocityKmh: velocity, paceMinPerKm };
  }

  if (durationSec != null && distanceKm != null) {
    const velocity = distanceKm / (durationSec / 3600);
    const pace = (durationSec / 60) / distanceKm;
    return { durationSec, distanceKm, avgVelocityKmh: velocity, paceMinPerKm: pace };
  }

  return { durationSec, distanceKm, avgVelocityKmh, paceMinPerKm };
}

function fmtFixedOrInt(n: number, decimals: number): string {
  const rounded = Number(n.toFixed(decimals));
  const isIntLike = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  return isIntLike ? String(Math.round(rounded)) : rounded.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatKm(n: number): string {
  return fmtFixedOrInt(n, 2);
}

export function formatKmh(n: number): string {
  return fmtFixedOrInt(n, 2);
}

export function formatSecondsAsMmSs(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}`;
}

export function formatPaceMinPerKm(minPerKm: number): string {
  if (!Number.isFinite(minPerKm) || minPerKm < 0) return "—";
  const totalSec = minPerKm * 60;
  const secRounded = Math.round(totalSec);
  const m = Math.floor(secRounded / 60);
  const s = secRounded % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

