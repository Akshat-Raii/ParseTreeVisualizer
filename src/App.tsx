import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import ParseTree from './components/ParseTree';
import TokenDisplay from './components/TokenDisplay';
import ComplexityAnalysis from './components/ComplexityAnalysis';
import { compileCode } from './compiler/compiler';
import { Info, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

function App() {
  const [code, setCode] = useState(`// Write your code here
int main() {
  int x = 10;
  // This is a comment
  for (int i = 0; i < 5; i = i + 1) {
    if (i > 2) {
      x = x + i;
    }
  }
  return x;
}`);
  const [compileResult, setCompileResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleCompile = () => {
    try {
      const result = compileCode(code);
      setCompileResult(result);
      setError(null);
    } catch (err: any) {
      setError(err);
      setCompileResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-indigo-600 dark:bg-indigo-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Parse Tree Visualizer</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCompile}
              className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Compile
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('how-it-works');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center text-white hover:text-indigo-200 transition-colors"
            >
              <Info className="w-5 h-5 mr-1" />
              How it works
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-medium">Source Code</h2>
            </div>
            <div className="p-4">
              <CodeEditor code={code} onChange={setCode} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-medium">Compiler Output</h2>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{error.type || 'Error'}</h3>
                      <p className="mt-1">{error.message}</p>
                      {error.location && (
                        <p className="mt-1 text-sm">
                          at line {error.location.line}, column {error.location.column}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {compileResult && (
                <div className="space-y-6">
                  <TokenDisplay tokens={compileResult.tokens} />
                  <ComplexityAnalysis complexity={compileResult.complexity} />
                  <div>
                    <h3 className="text-md font-medium mb-2">Parse Tree</h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 overflow-auto max-h-[600px]">
                      <ParseTree ast={compileResult.ast} />
                    </div>
                  </div>
                </div>
              )}
              
              {!compileResult && !error && (
                <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                  <p>Click "Compile" to analyze your code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                <h2 className="text-lg font-medium">Error Handling</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-medium text-yellow-700 dark:text-yellow-400">Lexical Errors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Invalid characters, malformed tokens, or unrecognized symbols in the source code.
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-medium text-red-700 dark:text-red-400">Syntax Errors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Violations of the language grammar rules, such as missing semicolons or mismatched parentheses.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-medium text-orange-700 dark:text-orange-400">Semantic Errors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Type mismatches, undeclared variables, or invalid operations on incompatible types.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                <h2 className="text-lg font-medium">Complexity Analysis</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-400">Time Complexity</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Analysis of how execution time grows with input size, considering loops and nested operations.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 dark:text-green-400">Space Complexity</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Measurement of memory usage based on variable declarations and data structures.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-purple-700 dark:text-purple-400">Code Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Detailed breakdown of code structure and potential optimization opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">How the Compiler Works</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Lexical Analysis</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The compiler first breaks down your code into tokens through a process called lexical analysis. 
                Each token represents a meaningful unit in the programming language, such as keywords, 
                identifiers, operators, or literals.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">2. Syntax Analysis (Parsing)</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The parser takes the stream of tokens and builds a parse tree (also known as an Abstract Syntax Tree or AST).
                This tree represents the grammatical structure of the code according to the language's grammar rules.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">3. Complexity Analysis</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The compiler analyzes your code's time and space complexity by examining loops, variable declarations,
                and nested operations. This helps you understand the performance characteristics of your code.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Supported Features</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Variable declarations and assignments</li>
                <li>Arithmetic expressions</li>
                <li>Conditional statements (if-else)</li>
                <li>Loops (for, while)</li>
                <li>Function declarations and calls</li>
                <li>Comments (single-line and multi-line)</li>
                <li>Time and space complexity analysis</li>
                <li>Detailed error reporting with line and column information</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-200 dark:bg-gray-800 mt-10 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>Mini Compiler with Parse Tree Visualization | Educational Tool</p>
        </div>
      </footer>
    </div>
  );
}

export default App;