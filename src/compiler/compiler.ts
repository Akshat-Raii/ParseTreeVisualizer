import { Lexer } from './lexer';
import { Parser } from './parser';

interface ComplexityAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  details: string[];
}

function analyzeComplexity(ast: any): ComplexityAnalysis {
  let maxComplexity = 'O(1)';
  const details: string[] = [];

  function getLoopComplexity(node: any): string {
    if (node.type === 'FOR_STATEMENT' || node.type === 'WHILE_STATEMENT') {
      // Check for nested loops
      let nestedComplexity = 'O(n)';
      for (const child of node.children) {
        const childComplexity = getLoopComplexity(child);
        if (childComplexity !== 'O(1)') {
          nestedComplexity = 'O(n²)'; // Nested loops indicate quadratic complexity
        }
      }
      return nestedComplexity;
    }

    // Recursively check children
    let maxChildComplexity = 'O(1)';
    for (const child of node.children) {
      const complexity = getLoopComplexity(child);
      if (complexity === 'O(n²)') {
        maxChildComplexity = 'O(n²)';
      } else if (complexity === 'O(n)' && maxChildComplexity !== 'O(n²)') {
        maxChildComplexity = 'O(n)';
      }
    }
    return maxChildComplexity;
  }

  // Analyze the AST
  maxComplexity = getLoopComplexity(ast);

  // Add complexity details
  if (maxComplexity === 'O(n²)') {
    details.push('Nested loops detected - Quadratic time complexity');
  } else if (maxComplexity === 'O(n)') {
    details.push('Single loop detected - Linear time complexity');
  } else {
    details.push('No loops detected - Constant time complexity');
  }

  // Analyze variable usage and space complexity
  let spaceComplexity = 'O(1)';
  let variableCount = 0;
  
  function countVariables(node: any) {
    if (node.type === 'VARIABLE_DECLARATION') {
      variableCount++;
    }
    for (const child of node.children) {
      countVariables(child);
    }
  }
  
  countVariables(ast);
  
  if (variableCount > 0) {
    spaceComplexity = 'O(n)';
    details.push(`Space complexity: ${spaceComplexity} (${variableCount} variables declared)`);
  } else {
    details.push('Space complexity: O(1) (No additional space used)');
  }

  return {
    timeComplexity: maxComplexity,
    spaceComplexity,
    details
  };
}

export function compileCode(code: string) {
  try {
    // Step 1: Tokenize the input code
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    // Step 2: Parse the tokens into an AST
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Step 3: Analyze complexity
    const complexity = analyzeComplexity(ast);
    
    // Return the compilation result with complexity analysis
    return {
      tokens,
      ast,
      complexity
    };
  } catch (error) {
    const err = error as Error;
    // Enhanced error handling with line and column information
    const match = err.message.match(/line (\d+), column (\d+)/);
    if (match) {
      const [, line, column] = match;
      throw {
        message: err.message,
        location: {
          line: parseInt(line),
          column: parseInt(column)
        },
        type: err.message.includes('Unexpected character') ? 'Lexical Error' :
              err.message.includes('Expected') ? 'Syntax Error' : 'Compilation Error'
      };
    }
    throw error;
  }
}