import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  return (
    <div className="w-full rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[400px] p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
};

export default CodeEditor;