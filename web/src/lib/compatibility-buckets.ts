// Compatibility score bucketing system for better UX

export interface CompatibilityBucket {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Convert a raw compatibility score into a user-friendly bucket with labels and colors
 */
export function bucketCompatibility(score: number): CompatibilityBucket {
  if (score >= 90) {
    return {
      label: "Perfect Match",
      color: "#10B981", // green-500
      bgColor: "#ECFDF5", // green-50
      borderColor: "#A7F3D0" // green-200
    };
  } else if (score >= 80) {
    return {
      label: "Great Match",
      color: "#059669", // green-600
      bgColor: "#ECFDF5", // green-50
      borderColor: "#A7F3D0" // green-200
    };
  } else if (score >= 70) {
    return {
      label: "Good Match",
      color: "#3B82F6", // blue-500
      bgColor: "#EFF6FF", // blue-50
      borderColor: "#BFDBFE" // blue-200
    };
  } else if (score >= 60) {
    return {
      label: "Fair Match",
      color: "#6366F1", // indigo-500
      bgColor: "#EEF2FF", // indigo-50
      borderColor: "#C7D2FE" // indigo-200
    };
  } else if (score >= 50) {
    return {
      label: "Mixed Tastes",
      color: "#F59E0B", // amber-500
      bgColor: "#FFFBEB", // amber-50
      borderColor: "#FDE68A" // amber-200
    };
  } else {
    return {
      label: "Different Tastes",
      color: "#EF4444", // red-500
      bgColor: "#FEF2F2", // red-50
      borderColor: "#FECACA" // red-200
    };
  }
}

/**
 * Get just the label for a compatibility score
 */
export function getCompatibilityLabel(score: number): string {
  return bucketCompatibility(score).label;
}

/**
 * Get just the color for a compatibility score
 */
export function getCompatibilityColor(score: number): string {
  return bucketCompatibility(score).color;
}
