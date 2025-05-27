export interface ErrorLocation {
  line: number;
  column: number;
}

export interface CompilationErrorDetails {
  type: 'LexicalError' | 'SyntaxError' | 'SemanticError';
  line: number;
  column: number;
}

export class CompilationError extends Error {
  public type: string;
  public line: number;
  public column: number;

  constructor(message: string, details: CompilationErrorDetails) {
    super(message);
    this.type = details.type;
    this.line = details.line;
    this.column = details.column;
  }
}