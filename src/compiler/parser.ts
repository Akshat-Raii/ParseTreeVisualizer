import { Token } from './lexer';

export interface ASTNode {
  type: string;
  value?: string;
  children: ASTNode[];
}

export class Parser {
  private tokens: Token[];
  private current: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = 0;
  }

  private peek(): Token | null {
    if (this.current >= this.tokens.length) {
      return null;
    }
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token | null {
    if (this.current < this.tokens.length) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: string, value?: string): boolean {
    const token = this.peek();
    if (!token) return false;
    
    if (value) {
      return token.type === type && token.value === value;
    }
    return token.type === type;
  }

  private match(type: string, value?: string): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: string, value: string | undefined, message: string): Token {
    if (this.check(type, value)) {
      return this.advance()!;
    }
    
    const token = this.peek();
    throw new Error(
      `${message} at line ${token?.line}, column ${token?.column}. ` +
      `Expected ${type}${value ? ` '${value}'` : ''}, got ${token?.type} '${token?.value}'`
    );
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private skipComments() {
    while (this.match('COMMENT')) {
      // Skip all comment tokens
    }
  }

  // Main parse method
  public parse(): ASTNode {
    this.skipComments();
    
    const program: ASTNode = {
      type: 'PROGRAM',
      children: []
    };
    
    while (!this.isAtEnd()) {
      this.skipComments();
      if (this.isAtEnd()) break;
      
      try {
        const declaration = this.declaration();
        if (declaration) {
          program.children.push(declaration);
        }
      } catch (error) {
        console.error(error);
        // Skip to the next statement to recover from errors
        this.synchronize();
      }
    }
    
    return program;
  }

  private synchronize(): void {
    this.advance();
    
    while (!this.isAtEnd()) {
      if (this.previous().value === ';') return;
      
      if (this.peek()?.type === 'KEYWORD') {
        const nextKeyword = this.peek()?.value;
        if (['if', 'while', 'for', 'return', 'int', 'float', 'char', 'void'].includes(nextKeyword!)) {
          return;
        }
      }
      
      this.advance();
    }
  }

  private declaration(): ASTNode {
    if (this.match('KEYWORD', 'int') || 
        this.match('KEYWORD', 'float') || 
        this.match('KEYWORD', 'char') || 
        this.match('KEYWORD', 'void')) {
      const typeToken = this.previous();
      
      if (this.match('IDENTIFIER')) {
        const nameToken = this.previous();
        
        // Function declaration
        if (this.match('PUNCTUATION', '(')) {
          return this.functionDeclaration(typeToken, nameToken);
        }
        
        // Variable declaration
        return this.variableDeclaration(typeToken, nameToken);
      }
      
      throw new Error(`Expected identifier after type at line ${typeToken.line}, column ${typeToken.column}`);
    }
    
    return this.statement();
  }

  private functionDeclaration(typeToken: Token, nameToken: Token): ASTNode {
    const funcNode: ASTNode = {
      type: 'FUNCTION_DECLARATION',
      value: nameToken.value,
      children: []
    };
    
    // Add return type
    const typeNode: ASTNode = {
      type: 'TYPE',
      value: typeToken.value,
      children: []
    };
    funcNode.children.push(typeNode);
    
    // Parse parameters
    const paramsNode: ASTNode = {
      type: 'PARAMETERS',
      children: []
    };
    
    // TODO: Parse function parameters
    // For simplicity, we'll just skip all tokens until we find the closing parenthesis
    while (!this.match('PUNCTUATION', ')')) {
      if (this.isAtEnd()) {
        throw new Error('Unexpected end of input while parsing function parameters');
      }
      this.advance();
    }
    
    funcNode.children.push(paramsNode);
    
    // Parse function body
    if (this.match('PUNCTUATION', '{')) {
      const bodyNode = this.blockStatement();
      funcNode.children.push(bodyNode);
    } else {
      throw new Error(`Expected function body after function declaration at line ${nameToken.line}, column ${nameToken.column}`);
    }
    
    return funcNode;
  }

  private variableDeclaration(typeToken: Token, nameToken: Token): ASTNode {
    const varNode: ASTNode = {
      type: 'VARIABLE_DECLARATION',
      value: nameToken.value,
      children: []
    };
    
    // Add variable type
    const typeNode: ASTNode = {
      type: 'TYPE',
      value: typeToken.value,
      children: []
    };
    varNode.children.push(typeNode);
    
    // Check for initialization
    if (this.match('OPERATOR', '=')) {
      const initNode: ASTNode = {
        type: 'INITIALIZATION',
        children: [this.expression()]
      };
      varNode.children.push(initNode);
    }
    
    this.consume('PUNCTUATION', ';', 'Expected ";" after variable declaration');
    
    return varNode;
  }

  private statement(): ASTNode {
    this.skipComments();
    
    if (this.match('KEYWORD', 'if')) {
      return this.ifStatement();
    }
    
    if (this.match('KEYWORD', 'while')) {
      return this.whileStatement();
    }
    
    if (this.match('KEYWORD', 'for')) {
      return this.forStatement();
    }
    
    if (this.match('KEYWORD', 'return')) {
      return this.returnStatement();
    }
    
    if (this.match('PUNCTUATION', '{')) {
      return this.blockStatement();
    }
    
    return this.expressionStatement();
  }

  private ifStatement(): ASTNode {
    const ifNode: ASTNode = {
      type: 'IF_STATEMENT',
      children: []
    };
    
    this.consume('PUNCTUATION', '(', 'Expected "(" after "if"');
    
    const condition = this.expression();
    ifNode.children.push(condition);
    
    this.consume('PUNCTUATION', ')', 'Expected ")" after if condition');
    
    const thenBranch = this.statement();
    ifNode.children.push(thenBranch);
    
    if (this.match('KEYWORD', 'else')) {
      const elseBranch = this.statement();
      ifNode.children.push(elseBranch);
    }
    
    return ifNode;
  }

  private whileStatement(): ASTNode {
    const whileNode: ASTNode = {
      type: 'WHILE_STATEMENT',
      children: []
    };
    
    this.consume('PUNCTUATION', '(', 'Expected "(" after "while"');
    
    const condition = this.expression();
    whileNode.children.push(condition);
    
    this.consume('PUNCTUATION', ')', 'Expected ")" after while condition');
    
    const body = this.statement();
    whileNode.children.push(body);
    
    return whileNode;
  }

  private forStatement(): ASTNode {
    const forNode: ASTNode = {
      type: 'FOR_STATEMENT',
      children: []
    };
    
    this.consume('PUNCTUATION', '(', 'Expected "(" after "for"');
    
    // Initialization
    const initNode: ASTNode = {
      type: 'FOR_INIT',
      children: []
    };
    
    if (!this.match('PUNCTUATION', ';')) {
      // We have an initialization expression
      if (this.match('KEYWORD', 'int') || 
          this.match('KEYWORD', 'float') || 
          this.match('KEYWORD', 'char')) {
        const typeToken = this.previous();
        
        if (this.match('IDENTIFIER')) {
          const nameToken = this.previous();
          
          // Variable declaration
          const varNode = this.variableDeclaration(typeToken, nameToken);
          initNode.children.push(varNode);
        }
      } else {
        // Expression initialization
        initNode.children.push(this.expression());
        this.consume('PUNCTUATION', ';', 'Expected ";" after for init');
      }
    }
    
    forNode.children.push(initNode);
    
    // Condition
    const conditionNode: ASTNode = {
      type: 'FOR_CONDITION',
      children: []
    };
    
    if (!this.check('PUNCTUATION', ';')) {
      conditionNode.children.push(this.expression());
    }
    
    this.consume('PUNCTUATION', ';', 'Expected ";" after for condition');
    forNode.children.push(conditionNode);
    
    // Increment
    const incrementNode: ASTNode = {
      type: 'FOR_INCREMENT',
      children: []
    };
    
    if (!this.check('PUNCTUATION', ')')) {
      incrementNode.children.push(this.expression());
    }
    
    this.consume('PUNCTUATION', ')', 'Expected ")" after for clauses');
    forNode.children.push(incrementNode);
    
    // Body
    const body = this.statement();
    forNode.children.push(body);
    
    return forNode;
  }

  private returnStatement(): ASTNode {
    const returnNode: ASTNode = {
      type: 'RETURN_STATEMENT',
      children: []
    };
    
    if (!this.check('PUNCTUATION', ';')) {
      returnNode.children.push(this.expression());
    }
    
    this.consume('PUNCTUATION', ';', 'Expected ";" after return value');
    
    return returnNode;
  }

  private blockStatement(): ASTNode {
    const blockNode: ASTNode = {
      type: 'BLOCK',
      children: []
    };
    
    while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
      this.skipComments();
      if (this.check('PUNCTUATION', '}')) break;
      
      const declaration = this.declaration();
      blockNode.children.push(declaration);
    }
    
    this.consume('PUNCTUATION', '}', 'Expected "}" after block');
    
    return blockNode;
  }

  private expressionStatement(): ASTNode {
    const expr = this.expression();
    
    this.consume('PUNCTUATION', ';', 'Expected ";" after expression');
    
    return expr;
  }

  private expression(): ASTNode {
    return this.assignment();
  }

  private assignment(): ASTNode {
    const expr = this.equality();
    
    if (this.match('OPERATOR', '=')) {
      const value = this.assignment();
      
      if (expr.type === 'IDENTIFIER') {
        return {
          type: 'ASSIGNMENT',
          value: expr.value,
          children: [value]
        };
      }
      
      throw new Error('Invalid assignment target');
    }
    
    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();
    
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const operator = this.previous().value;
      const right = this.comparison();
      
      expr = {
        type: 'BINARY',
        value: operator,
        children: [expr, right]
      };
    }
    
    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();
    
    while (
      this.match('OPERATOR', '>') || 
      this.match('OPERATOR', '>=') || 
      this.match('OPERATOR', '<') || 
      this.match('OPERATOR', '<=')
    ) {
      const operator = this.previous().value;
      const right = this.term();
      
      expr = {
        type: 'BINARY',
        value: operator,
        children: [expr, right]
      };
    }
    
    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();
    
    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
      const operator = this.previous().value;
      const right = this.factor();
      
      expr = {
        type: 'BINARY',
        value: operator,
        children: [expr, right]
      };
    }
    
    return expr;
  }

  private factor(): ASTNode {
    let expr = this.unary();
    
    while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
      const operator = this.previous().value;
      const right = this.unary();
      
      expr = {
        type: 'BINARY',
        value: operator,
        children: [expr, right]
      };
    }
    
    return expr;
  }

  private unary(): ASTNode {
    if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-')) {
      const operator = this.previous().value;
      const right = this.unary();
      
      return {
        type: 'UNARY',
        value: operator,
        children: [right]
      };
    }
    
    return this.primary();
  }

  private primary(): ASTNode {
    if (this.match('NUMBER')) {
      return {
        type: 'LITERAL',
        value: this.previous().value,
        children: []
      };
    }
    
    if (this.match('IDENTIFIER')) {
      return {
        type: 'IDENTIFIER',
        value: this.previous().value,
        children: []
      };
    }
    
    if (this.match('PUNCTUATION', '(')) {
      const expr = this.expression();
      this.consume('PUNCTUATION', ')', 'Expected ")" after expression');
      
      return {
        type: 'GROUPING',
        children: [expr]
      };
    }
    
    throw new Error('Expected expression');
  }
}