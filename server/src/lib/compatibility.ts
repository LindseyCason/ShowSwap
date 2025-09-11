// Compatibility calculation types and utilities for ShowSwap

export type RatingMap = Record<string, number>;

export type CompatibilityMethod = "weighted" | "correlation" | "hybrid";

export interface CompatibilityOptions {
  method?: CompatibilityMethod;     // default: "hybrid"
  ratingMin?: number;               // default: 1
  ratingMax?: number;               // default: 5
  minOverlap?: number;              // default: 3  (below this, return 0)
  hybridMinOverlap?: number;        // default: 10 (when to trust correlation)
  hybridWeight?: number;            // default: 0.25 (25% pearson, 75% weighted)
  decimalPlaces?: number;           // default: 0   (integer percent)
}

/**
 * Compute compatibility between two users' ratings (1–5).
 * Returns a percentage [0, 100].
 */
export function computeCompatibility(
  a: RatingMap,
  b: RatingMap,
  opts: CompatibilityOptions = {}
): number {
  const {
    method = "hybrid",
    ratingMin = 1,
    ratingMax = 5,
    minOverlap = 3,
    hybridMinOverlap = 10,
    hybridWeight = 0.25,
    decimalPlaces = 0,
  } = opts;

  const range = ratingMax - ratingMin;
  if (range <= 0) return 0;

  // Build overlap arrays
  const common: Array<{ a: number; b: number }> = [];
  for (const showId in a) {
    if (Object.prototype.hasOwnProperty.call(b, showId)) {
      const ra = a[showId];
      const rb = b[showId];
      if (isFinite(ra) && isFinite(rb)) {
        common.push({ a: ra, b: rb });
      }
    }
  }

  const N = common.length;
  if (N < minOverlap) return 0;

  const weighted = weightedSimilarity(common, range);      // 0..1
  const pearson = pearsonCorrelation(common) ?? 0;         // -1..1 -> map to 0..1 below
  const pearson01 = (pearson + 1) / 2;                     // -1..1 => 0..1

  let score01: number;

  switch (method) {
    case "weighted":
      score01 = weighted;
      break;

    case "correlation":
      score01 = pearson01;
      break;

    case "hybrid":
    default: {
      // If we have plenty of overlap, blend in correlation for taste alignment.
      if (N >= hybridMinOverlap) {
        score01 = clamp01((1 - hybridWeight) * weighted + hybridWeight * pearson01);
      } else {
        // With few overlaps, correlation is noisy—stick to weighted.
        score01 = weighted;
      }
      break;
    }
  }

  const pct = clamp01(score01) * 100;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(pct * factor) / factor;
}

/** Weighted similarity: 1 - average normalized absolute difference. Returns 0..1. */
function weightedSimilarity(
  pairs: Array<{ a: number; b: number }>,
  range: number
): number {
  const totalDiff = pairs.reduce((sum, p) => sum + Math.abs(p.a - p.b), 0);
  const maxDiff = range * pairs.length;
  if (maxDiff === 0) return 0;
  return clamp01(1 - totalDiff / maxDiff);
}

/** Pearson correlation on paired ratings. Returns -1..1 or 0 if degenerate. */
function pearsonCorrelation(
  pairs: Array<{ a: number; b: number }>
): number | null {
  const N = pairs.length;
  if (N === 0) return null;

  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
  for (const { a, b } of pairs) {
    sumX += a; sumY += b;
    sumX2 += a * a; sumY2 += b * b;
    sumXY += a * b;
  }

  const num = N * sumXY - sumX * sumY;
  const denLeft = N * sumX2 - sumX * sumX;
  const denRight = N * sumY2 - sumY * sumY;
  const den = Math.sqrt(denLeft * denRight);

  if (!isFinite(den) || den === 0) return 0; // identical variance (e.g., flat raters)
  return clamp(-1, 1, num / den);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function clamp(min: number, max: number, x: number): number {
  return Math.max(min, Math.min(max, x));
}
