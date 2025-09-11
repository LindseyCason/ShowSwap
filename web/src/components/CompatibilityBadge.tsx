import { bucketCompatibility } from '../lib/compatibility-buckets';

interface CompatibilityBadgeProps {
  score: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CompatibilityBadge({
  score,
  showPercentage = true,
  showLabel = true,
  size = 'md',
  className = ''
}: CompatibilityBadgeProps) {
  const bucket = bucketCompatibility(score);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const badgeStyle = {
    backgroundColor: bucket.bgColor,
    borderColor: bucket.borderColor,
    color: bucket.color
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      style={badgeStyle}
    >
      {showPercentage && showLabel ? (
        <>
          <span className="font-bold">{score}%</span>
          <span className="ml-1">•</span>
          <span className="ml-1">{bucket.label}</span>
        </>
      ) : showPercentage ? (
        <span className="font-bold">{score}%</span>
      ) : showLabel ? (
        <span>{bucket.label}</span>
      ) : (
        <span className="font-bold">{score}%</span>
      )}
    </span>
  );
}

// Simple text-only version for inline use
interface CompatibilityTextProps {
  score: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CompatibilityText({
  score,
  showPercentage = true,
  showLabel = false,
  className = ''
}: CompatibilityTextProps) {
  const bucket = bucketCompatibility(score);
  
  return (
    <span 
      className={className}
      style={{ color: bucket.color }}
    >
      {showPercentage && showLabel
        ? `${score}% ${bucket.label}`
        : showPercentage
        ? `${score}%`
        : showLabel
        ? bucket.label
        : null}
    </span>
  );
}
