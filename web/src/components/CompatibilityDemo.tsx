import CompatibilityBadge, { CompatibilityText } from './CompatibilityBadge';

// Demo component to showcase the bucketing system
export default function CompatibilityDemo() {
  const testScores = [95, 85, 75, 65, 55, 25];
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Compatibility Bucketing System</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Badge Style (with labels)</h4>
          <div className="flex flex-wrap gap-2">
            {testScores.map(score => (
              <CompatibilityBadge 
                key={score} 
                score={score} 
                showPercentage={true}
                showLabel={true}
                size="md"
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Badge Style (percentage only)</h4>
          <div className="flex flex-wrap gap-2">
            {testScores.map(score => (
              <CompatibilityBadge 
                key={score} 
                score={score} 
                showPercentage={true}
                showLabel={false}
                size="sm"
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Text Style</h4>
          <div className="space-y-1">
            {testScores.map(score => (
              <div key={score}>
                <CompatibilityText 
                  score={score} 
                  showPercentage={true}
                  showLabel={true}
                  className="font-medium"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
