import React from 'react';

interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

interface TokenDisplayProps {
  tokens: Token[];
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokens }) => {
  return (
    <div>
      <h3 className="text-md font-medium mb-2">Tokens</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-md">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Line</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Column</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tokens.map((token, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  <span 
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTokenTypeColor(token.type)}`}
                  >
                    {token.type}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-800 dark:text-gray-200">{token.value}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{token.line}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{token.column}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function getTokenTypeColor(type: string): string {
  switch (type) {
    case 'KEYWORD':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'IDENTIFIER':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'NUMBER':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'OPERATOR':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'PUNCTUATION':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'COMMENT':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default TokenDisplay;