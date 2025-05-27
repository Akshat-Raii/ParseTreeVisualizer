export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private input: string;
  private position: number;
  private line: number;
  private column: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.currentChar = this.input.length > 0 ? this.input[0] : null;
  }

  private advance(): void {
    this.position++;
    if (this.position >= this.input.length) {
      this.currentChar = null;
    } else {
      this.currentChar = this.input[this.position];
      this.column++;
    }
  }

  private peek(): string | null {
    const peekPos = this.position + 1;
    if (peekPos >= this.input.length) {
      return null;
    }
    return this.input[peekPos];
  }

  private isAlpha(char: string | null): boolean {
    return char !== null && /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string | null): boolean {
    return char !== null && /[a-zA-Z0-9_]/.test(char);
  }

  private isDigit(char: string | null): boolean {
    return char !== null && /[0-9]/.test(char);
  }

  private isWhitespace(char: string | null): boolean {
    return char !== null && /\s/.test(char);
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && this.isWhitespace(this.currentChar)) {
      if (this.currentChar === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
  }

  private skipComment(): void {
    if (this.currentChar === '/' && this.peek() === '/') {
      // Skip the current line (single-line comment)
      while (this.currentChar !== null && this.currentChar !== '\n') {
        this.advance();
      }
      
      // Skip the newline character
      if (this.currentChar === '\n') {
        this.line++;
        this.column = 1;
        this.advance();
      }
    } else if (this.currentChar === '/' && this.peek() === '*') {
      // Skip until we find the closing '*/' (multi-line comment)
      this.advance(); // Skip '/'
      this.advance(); // Skip '*'
      
      let prevChar = null;
      while (!(prevChar === '*' && this.currentChar === '/') && this.currentChar !== null) {
        prevChar = this.currentChar;
        
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 1;
        }
        
        this.advance();
      }
      
      if (this.currentChar === '/') {
        this.advance(); // Skip the closing '/'
      }
    }
  }

  private identifier(): Token {
    let result = '';
    const startColumn = this.column;
    
    while (this.currentChar !== null && this.isAlphaNumeric(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    
    // Check if the identifier is a keyword
    const keywords = [
      'int', 'char', 'float', 'double', 'void', 
      'if', 'else', 'while', 'for', 'return', 'printf'
    ];
    
    const type = keywords.includes(result) ? 'KEYWORD' : 'IDENTIFIER';
    
    return {
      type,
      value: result,
      line: this.line,
      column: startColumn
    };
  }

  private number(): Token {
    let result = '';
    const startColumn = this.column;
    
    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    
    // Handle decimal point
    if (this.currentChar === '.' && this.peek() !== null && this.isDigit(this.peek()!)) {
      result += this.currentChar; // Add the decimal point
      this.advance();
      
      while (this.currentChar !== null && this.isDigit(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
    }
    
    return {
      type: 'NUMBER',
      value: result,
      line: this.line,
      column: startColumn
    };
  }

  private operator(): Token {
    const startColumn = this.column;
    let value = this.currentChar!;
    
    // Check for multi-character operators
    const peekChar = this.peek();
    if (
      (this.currentChar === '=' && peekChar === '=') ||
      (this.currentChar === '!' && peekChar === '=') ||
      (this.currentChar === '<' && peekChar === '=') ||
      (this.currentChar === '>' && peekChar === '=') ||
      (this.currentChar === '&' && peekChar === '&') ||
      (this.currentChar === '|' && peekChar === '|') ||
      (this.currentChar === '+' && peekChar === '+') ||
      (this.currentChar === '-' && peekChar === '-')
    ) {
      this.advance();
      value += this.currentChar!;
    }
    
    this.advance();
    
    return {
      type: 'OPERATOR',
      value,
      line: this.line,
      column: startColumn
    };
  }

  private punctuation(): Token {
    const startColumn = this.column;
    const value = this.currentChar!;
    this.advance();
    
    return {
      type: 'PUNCTUATION',
      value,
      line: this.line,
      column: startColumn
    };
  }

  private comment(): Token {
    const startColumn = this.column;
    let value = '';
    let type = 'COMMENT';
    
    // Single-line comment
    if (this.currentChar === '/' && this.peek() === '/') {
      value = '//';
      this.advance(); // Skip '/'
      this.advance(); // Skip '/'
      
      while (this.currentChar !== null && this.currentChar !== '\n') {
        value += this.currentChar;
        this.advance();
      }
    }
    // Multi-line comment
    else if (this.currentChar === '/' && this.peek() === '*') {
      value = '/*';
      this.advance(); // Skip '/'
      this.advance(); // Skip '*'
      
      let prevChar = null;
      while (!(prevChar === '*' && this.currentChar === '/') && this.currentChar !== null) {
        value += this.currentChar;
        prevChar = this.currentChar;
        
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 1;
        }
        
        this.advance();
      }
      
      if (this.currentChar === '/') {
        value += '/';
        this.advance(); // Skip the closing '/'
      }
    }
    
    return {
      type,
      value,
      line: this.line,
      column: startColumn
    };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.currentChar !== null) {
      // Skip whitespace
      if (this.isWhitespace(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }
      
      // Handle comments
      if (this.currentChar === '/' && (this.peek() === '/' || this.peek() === '*')) {
        tokens.push(this.comment());
        continue;
      }
      
      // Handle identifiers and keywords
      if (this.isAlpha(this.currentChar)) {
        tokens.push(this.identifier());
        continue;
      }
      
      // Handle numbers
      if (this.isDigit(this.currentChar)) {
        tokens.push(this.number());
        continue;
      }
      
      // Handle operators
      if (['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|'].includes(this.currentChar)) {
        tokens.push(this.operator());
        continue;
      }
      
      // Handle punctuation
      if ([';', ',', '(', ')', '{', '}', '[', ']'].includes(this.currentChar)) {
        tokens.push(this.punctuation());
        continue;
      }
      
      // If we get here, we encountered an unknown character
      throw new Error(`Unexpected character '${this.currentChar}' at line ${this.line}, column ${this.column}`);
    }
    
    return tokens;
  }
}