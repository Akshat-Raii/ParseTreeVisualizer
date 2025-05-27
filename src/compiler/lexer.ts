import { CompilationError } from './types';

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
      while (this.currentChar !== null && this.currentChar !== '\n') {
        this.advance();
      }
      if (this.currentChar === '\n') {
        this.line++;
        this.column = 1;
        this.advance();
      }
    } else if (this.currentChar === '/' && this.peek() === '*') {
      this.advance();
      this.advance();
      let prevChar = null;
      while (!(prevChar === '*' && this.currentChar === '/') && this.currentChar !== null) {
        if (this.currentChar === null) {
          throw new CompilationError('Unclosed multi-line comment', {
            type: 'LexicalError',
            line: this.line,
            column: this.column
          });
        }
        prevChar = this.currentChar;
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
      if (this.currentChar === '/') {
        this.advance();
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
    let hasDecimal = false;
    
    while (this.currentChar !== null && (this.isDigit(this.currentChar) || this.currentChar === '.')) {
      if (this.currentChar === '.') {
        if (hasDecimal) {
          throw new CompilationError('Invalid number format: multiple decimal points', {
            type: 'LexicalError',
            line: this.line,
            column: this.column
          });
        }
        hasDecimal = true;
      }
      result += this.currentChar;
      this.advance();
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
    
    if (this.currentChar === '/' && this.peek() === '/') {
      value = '//';
      this.advance();
      this.advance();
      
      while (this.currentChar !== null && this.currentChar !== '\n') {
        value += this.currentChar;
        this.advance();
      }
    } else if (this.currentChar === '/' && this.peek() === '*') {
      value = '/*';
      this.advance();
      this.advance();
      
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
        this.advance();
      }
    }
    
    return {
      type: 'COMMENT',
      value,
      line: this.line,
      column: startColumn
    };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.currentChar !== null) {
      try {
        if (this.isWhitespace(this.currentChar)) {
          this.skipWhitespace();
          continue;
        }
        
        if (this.currentChar === '/' && (this.peek() === '/' || this.peek() === '*')) {
          tokens.push(this.comment());
          continue;
        }
        
        if (this.isAlpha(this.currentChar)) {
          tokens.push(this.identifier());
          continue;
        }
        
        if (this.isDigit(this.currentChar)) {
          tokens.push(this.number());
          continue;
        }
        
        if (['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|'].includes(this.currentChar)) {
          tokens.push(this.operator());
          continue;
        }
        
        if ([';', ',', '(', ')', '{', '}', '[', ']'].includes(this.currentChar)) {
          tokens.push(this.punctuation());
          continue;
        }
        
        throw new CompilationError(`Invalid character '${this.currentChar}'`, {
          type: 'LexicalError',
          line: this.line,
          column: this.column
        });
      } catch (error) {
        if (error instanceof CompilationError) {
          throw error;
        }
        throw new CompilationError(`Unexpected error during lexical analysis`, {
          type: 'LexicalError',
          line: this.line,
          column: this.column
        });
      }
    }
    
    return tokens;
  }
}