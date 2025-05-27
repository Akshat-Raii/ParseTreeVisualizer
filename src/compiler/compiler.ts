import { Lexer } from './lexer';
import { Parser } from './parser';

export function compileCode(code: string) {
  try {
    // Step 1: Tokenize the input code
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    // Step 2: Parse the tokens into an AST
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    // Return the compilation result
    return {
      tokens,
      ast
    };
  } catch (error) {
    throw error;
  }
}