import React from 'react';

interface ComplexityAnalysisProps {
  complexity: {
    timeComplexity: string;
    spaceComplexity: string;
    details: string[];
  };
}

const ComplexityAnalysis: React.FC<ComplexityAnalysisProps> = ({ complexity }) => {
  return (
    <div>
      <h3 className="text-md font-medium mb-2">Complexity Analysis</h3>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <h4 className="font-medium text-blue-700 dark:text-blue-300">Time Complexity</h4>
            <p className="mt-1 text-blue-600 dark:text-blue-200">{complexity.timeComplexity}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900 rounded-md">
            <h4 className="font-medium text-green-700 dark:text-green-300">Space Complexity</h4>
            <p className="mt-1 text-green-600 dark:text-green-200">{complexity.spaceComplexity}</p>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Details</h4>
          <ul className="space-y-2">
            {complexity.details.map((detail, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded-md"
              >
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComplexityAnalysis;