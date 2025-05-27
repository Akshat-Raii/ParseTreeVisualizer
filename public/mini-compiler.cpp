#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <regex>
#include <sstream>

struct Token {
    std::string type;
    std::string value;
    int line;
    int column;
};

struct ASTNode {
    std::string type;
    std::string value;
    std::vector<std::shared_ptr<ASTNode>> children;
};

class Lexer {
private:
    std::string input;
    size_t position;
    int line;
    int column;

    struct Pattern {
        std::string type;
        std::string regex;
    };

    std::vector<Pattern> patterns = {
        {"KEYWORD", "int|char|float|double|void|if|else|while|for|return|printf"},
        {"IDENTIFIER", "[a-zA-Z_][a-zA-Z0-9_]*"},
        {"NUMBER", "\\d+(\\.\\d+)?"},
        {"OPERATOR", "[+\\-*/%=<>!]"},
        {"PUNCTUATION", "[;,(){}\\[\\]]"},
        {"WHITESPACE", "[ \\t\\n\\r]+"}
    };

public:
    Lexer(const std::string& source) : input(source), position(0), line(1), column(1) {}

    std::vector<Token> tokenize() {
        std::vector<Token> tokens;
        
        while (position < input.length()) {
            char current = input[position];
            
            // Handle whitespace
            if (isspace(current)) {
                if (current == '\n') {
                    line++;
                    column = 1;
                } else {
                    column++;
                }
                position++;
                continue;
            }

            // Handle comments
            if (current == '/' && position + 1 < input.length()) {
                // Single-line comment
                if (input[position + 1] == '/') {
                    int start_column = column;
                    std::string comment = "//";
                    position += 2;
                    column += 2;
                    
                    while (position < input.length() && input[position] != '\n') {
                        comment += input[position];
                        position++;
                        column++;
                    }
                    
                    tokens.push_back({"COMMENT", comment, line, start_column});
                    continue;
                }
                // Multi-line comment
                else if (input[position + 1] == '*') {
                    int start_column = column;
                    std::string comment = "/*";
                    position += 2;
                    column += 2;
                    
                    bool commentClosed = false;
                    while (position + 1 < input.length()) {
                        if (input[position] == '*' && input[position + 1] == '/') {
                            comment += "*/";
                            position += 2;
                            column += 2;
                            commentClosed = true;
                            break;
                        }
                        
                        if (input[position] == '\n') {
                            comment += input[position];
                            position++;
                            line++;
                            column = 1;
                        } else {
                            comment += input[position];
                            position++;
                            column++;
                        }
                    }
                    
                    if (!commentClosed) {
                        throw std::runtime_error("Unclosed multi-line comment");
                    }
                    
                    tokens.push_back({"COMMENT", comment, line, start_column});
                    continue;
                }
            }

            // Handle identifiers and keywords
            if (isalpha(current) || current == '_') {
                std::string identifier;
                int start_column = column;
                
                while (position < input.length() && 
                       (isalnum(input[position]) || input[position] == '_')) {
                    identifier += input[position];
                    position++;
                    column++;
                }

                // Check if it's a keyword
                if (isKeyword(identifier)) {
                    tokens.push_back({"KEYWORD", identifier, line, start_column});
                } else {
                    tokens.push_back({"IDENTIFIER", identifier, line, start_column});
                }
                continue;
            }

            // Handle numbers
            if (isdigit(current)) {
                std::string number;
                int start_column = column;
                
                while (position < input.length() && 
                       (isdigit(input[position]) || input[position] == '.')) {
                    number += input[position];
                    position++;
                    column++;
                }
                
                tokens.push_back({"NUMBER", number, line, start_column});
                continue;
            }

            // Handle operators
            if (strchr("+-*/%=<>!", current)) {
                std::string op;
                int start_column = column;
                
                op += current;
                position++;
                column++;
                
                // Handle two-character operators
                if (position < input.length()) {
                    char next = input[position];
                    if ((current == '=' && next == '=') ||
                        (current == '!' && next == '=') ||
                        (current == '<' && next == '=') ||
                        (current == '>' && next == '=') ||
                        (current == '+' && next == '+') ||
                        (current == '-' && next == '-')) {
                        op += next;
                        position++;
                        column++;
                    }
                }
                
                tokens.push_back({"OPERATOR", op, line, start_column});
                continue;
            }

            // Handle punctuation
            if (strchr(";,(){}[]", current)) {
                std::string punct(1, current);
                tokens.push_back({"PUNCTUATION", punct, line, column});
                position++;
                column++;
                continue;
            }

            // Unknown character
            std::stringstream error;
            error << "Unexpected character '" << current << "' at line " << line << ", column " << column;
            throw std::runtime_error(error.str());
        }

        return tokens;
    }

private:
    bool isKeyword(const std::string& word) {
        static const std::unordered_map<std::string, bool> keywords = {
            {"int", true}, {"char", true}, {"float", true},
            {"double", true}, {"void", true}, {"if", true},
            {"else", true}, {"while", true}, {"for", true},
            {"return", true}, {"printf", true}
        };
        return keywords.find(word) != keywords.end();
    }
};

// Parser class for building AST
class Parser {
private:
    std::vector<Token> tokens;
    size_t current;

public:
    Parser(const std::vector<Token>& tokens) : tokens(tokens), current(0) {}

    std::shared_ptr<ASTNode> parse() {
        auto root = std::make_shared<ASTNode>();
        root->type = "PROGRAM";

        while (current < tokens.size()) {
            if (tokens[current].type == "COMMENT") {
                current++; // Skip comments
                continue;
            }
            
            auto node = parseDeclaration();
            if (node) {
                root->children.push_back(node);
            }
        }

        return root;
    }

private:
    Token peek() const {
        if (current >= tokens.size()) {
            return {"EOF", "", tokens.back().line, tokens.back().column};
        }
        return tokens[current];
    }

    Token previous() const {
        return tokens[current - 1];
    }

    bool isAtEnd() const {
        return current >= tokens.size();
    }

    Token advance() {
        if (!isAtEnd()) {
            current++;
        }
        return previous();
    }

    bool check(const std::string& type, const std::string& value = "") {
        if (isAtEnd()) return false;
        
        if (value.empty()) {
            return tokens[current].type == type;
        } else {
            return tokens[current].type == type && tokens[current].value == value;
        }
    }

    bool match(const std::string& type, const std::string& value = "") {
        if (check(type, value)) {
            advance();
            return true;
        }
        return false;
    }

    Token consume(const std::string& type, const std::string& value, const std::string& message) {
        if (check(type, value)) {
            return advance();
        }
        
        Token token = peek();
        std::stringstream error;
        error << message << " at line " << token.line << ", column " << token.column;
        throw std::runtime_error(error.str());
    }

    std::shared_ptr<ASTNode> parseDeclaration() {
        // Skip comments
        while (match("COMMENT")) {
            // Just skip them
        }
        
        if (isAtEnd()) return nullptr;
        
        // Parse function or variable declaration
        if (match("KEYWORD", "int") || match("KEYWORD", "char") || 
            match("KEYWORD", "float") || match("KEYWORD", "double") || 
            match("KEYWORD", "void")) {
            
            Token typeToken = previous();
            
            if (match("IDENTIFIER")) {
                Token nameToken = previous();
                
                // Function declaration
                if (match("PUNCTUATION", "(")) {
                    return parseFunctionDeclaration(typeToken, nameToken);
                }
                
                // Variable declaration
                return parseVariableDeclaration(typeToken, nameToken);
            }
        }
        
        return parseStatement();
    }

    std::shared_ptr<ASTNode> parseFunctionDeclaration(const Token& typeToken, const Token& nameToken) {
        auto funcNode = std::make_shared<ASTNode>();
        funcNode->type = "FUNCTION_DECLARATION";
        funcNode->value = nameToken.value;

        // Add return type node
        auto typeNode = std::make_shared<ASTNode>();
        typeNode->type = "TYPE";
        typeNode->value = typeToken.value;
        funcNode->children.push_back(typeNode);

        // Parse parameters
        auto paramsNode = std::make_shared<ASTNode>();
        paramsNode->type = "PARAMETERS";
        
        // For simplicity, just parse parameter declarations but don't store them
        while (!match("PUNCTUATION", ")")) {
            // Skip until we reach the closing parenthesis
            if (isAtEnd()) {
                throw std::runtime_error("Unexpected end of file while parsing function parameters");
            }
            advance();
        }
        
        funcNode->children.push_back(paramsNode);

        // Parse function body
        if (match("PUNCTUATION", "{")) {
            auto bodyNode = parseBlock();
            funcNode->children.push_back(bodyNode);
        }

        return funcNode;
    }

    std::shared_ptr<ASTNode> parseVariableDeclaration(const Token& typeToken, const Token& nameToken) {
        auto varNode = std::make_shared<ASTNode>();
        varNode->type = "VARIABLE_DECLARATION";
        varNode->value = nameToken.value;

        // Add type node
        auto typeNode = std::make_shared<ASTNode>();
        typeNode->type = "TYPE";
        typeNode->value = typeToken.value;
        varNode->children.push_back(typeNode);

        // Check for initialization
        if (match("OPERATOR", "=")) {
            auto initNode = std::make_shared<ASTNode>();
            initNode->type = "INITIALIZATION";
            
            auto exprNode = parseExpression();
            initNode->children.push_back(exprNode);
            varNode->children.push_back(initNode);
        }

        consume("PUNCTUATION", ";", "Expected ';' after variable declaration");
        
        return varNode;
    }

    std::shared_ptr<ASTNode> parseStatement() {
        // Skip comments
        while (match("COMMENT")) {
            // Just skip them
        }
        
        if (isAtEnd()) return nullptr;
        
        if (match("KEYWORD", "if")) {
            return parseIfStatement();
        }
        
        if (match("KEYWORD", "while")) {
            return parseWhileStatement();
        }
        
        if (match("KEYWORD", "for")) {
            return parseForStatement();
        }
        
        if (match("KEYWORD", "return")) {
            return parseReturnStatement();
        }
        
        if (match("PUNCTUATION", "{")) {
            return parseBlock();
        }
        
        return parseExpressionStatement();
    }

    std::shared_ptr<ASTNode> parseIfStatement() {
        auto ifNode = std::make_shared<ASTNode>();
        ifNode->type = "IF_STATEMENT";
        
        consume("PUNCTUATION", "(", "Expected '(' after 'if'");
        auto condition = parseExpression();
        ifNode->children.push_back(condition);
        consume("PUNCTUATION", ")", "Expected ')' after if condition");
        
        auto thenBranch = parseStatement();
        ifNode->children.push_back(thenBranch);
        
        if (match("KEYWORD", "else")) {
            auto elseBranch = parseStatement();
            ifNode->children.push_back(elseBranch);
        }
        
        return ifNode;
    }

    std::shared_ptr<ASTNode> parseWhileStatement() {
        auto whileNode = std::make_shared<ASTNode>();
        whileNode->type = "WHILE_STATEMENT";
        
        consume("PUNCTUATION", "(", "Expected '(' after 'while'");
        auto condition = parseExpression();
        whileNode->children.push_back(condition);
        consume("PUNCTUATION", ")", "Expected ')' after while condition");
        
        auto body = parseStatement();
        whileNode->children.push_back(body);
        
        return whileNode;
    }

    std::shared_ptr<ASTNode> parseForStatement() {
        auto forNode = std::make_shared<ASTNode>();
        forNode->type = "FOR_STATEMENT";
        
        consume("PUNCTUATION", "(", "Expected '(' after 'for'");
        
        // Initialization
        auto initNode = std::make_shared<ASTNode>();
        initNode->type = "FOR_INIT";
        
        if (!check("PUNCTUATION", ";")) {
            // Check if it's a variable declaration
            if (match("KEYWORD", "int") || match("KEYWORD", "float") || match("KEYWORD", "char")) {
                Token typeToken = previous();
                
                if (match("IDENTIFIER")) {
                    Token nameToken = previous();
                    auto varNode = parseVariableDeclaration(typeToken, nameToken);
                    initNode->children.push_back(varNode);
                }
            } else {
                // Expression initialization
                auto expr = parseExpression();
                initNode->children.push_back(expr);
                consume("PUNCTUATION", ";", "Expected ';' after for initialization");
            }
        } else {
            advance(); // Skip the semicolon
        }
        
        forNode->children.push_back(initNode);
        
        // Condition
        auto condNode = std::make_shared<ASTNode>();
        condNode->type = "FOR_CONDITION";
        
        if (!check("PUNCTUATION", ";")) {
            auto expr = parseExpression();
            condNode->children.push_back(expr);
        }
        
        consume("PUNCTUATION", ";", "Expected ';' after for condition");
        forNode->children.push_back(condNode);
        
        // Increment
        auto incrNode = std::make_shared<ASTNode>();
        incrNode->type = "FOR_INCREMENT";
        
        if (!check("PUNCTUATION", ")")) {
            auto expr = parseExpression();
            incrNode->children.push_back(expr);
        }
        
        consume("PUNCTUATION", ")", "Expected ')' after for clauses");
        forNode->children.push_back(incrNode);
        
        // Body
        auto body = parseStatement();
        forNode->children.push_back(body);
        
        return forNode;
    }

    std::shared_ptr<ASTNode> parseReturnStatement() {
        auto returnNode = std::make_shared<ASTNode>();
        returnNode->type = "RETURN_STATEMENT";
        
        if (!check("PUNCTUATION", ";")) {
            auto expr = parseExpression();
            returnNode->children.push_back(expr);
        }
        
        consume("PUNCTUATION", ";", "Expected ';' after return statement");
        
        return returnNode;
    }

    std::shared_ptr<ASTNode> parseBlock() {
        auto blockNode = std::make_shared<ASTNode>();
        blockNode->type = "BLOCK";
        
        while (!check("PUNCTUATION", "}") && !isAtEnd()) {
            auto declaration = parseDeclaration();
            if (declaration) {
                blockNode->children.push_back(declaration);
            }
        }
        
        consume("PUNCTUATION", "}", "Expected '}' after block");
        
        return blockNode;
    }

    std::shared_ptr<ASTNode> parseExpressionStatement() {
        auto expr = parseExpression();
        consume("PUNCTUATION", ";", "Expected ';' after expression");
        return expr;
    }

    std::shared_ptr<ASTNode> parseExpression() {
        return parseAssignment();
    }

    std::shared_ptr<ASTNode> parseAssignment() {
        auto expr = parseEquality();
        
        if (match("OPERATOR", "=")) {
            auto value = parseAssignment();
            
            if (expr->type == "IDENTIFIER") {
                auto assignNode = std::make_shared<ASTNode>();
                assignNode->type = "ASSIGNMENT";
                assignNode->value = expr->value;
                assignNode->children.push_back(value);
                return assignNode;
            }
            
            throw std::runtime_error("Invalid assignment target");
        }
        
        return expr;
    }

    std::shared_ptr<ASTNode> parseEquality() {
        auto expr = parseComparison();
        
        while (match("OPERATOR", "==") || match("OPERATOR", "!=")) {
            std::string op = previous().value;
            auto right = parseComparison();
            
            auto binaryNode = std::make_shared<ASTNode>();
            binaryNode->type = "BINARY";
            binaryNode->value = op;
            binaryNode->children.push_back(expr);
            binaryNode->children.push_back(right);
            expr = binaryNode;
        }
        
        return expr;
    }

    std::shared_ptr<ASTNode> parseComparison() {
        auto expr = parseTerm();
        
        while (match("OPERATOR", ">") || match("OPERATOR", ">=") || 
               match("OPERATOR", "<") || match("OPERATOR", "<=")) {
            std::string op = previous().value;
            auto right = parseTerm();
            
            auto binaryNode = std::make_shared<ASTNode>();
            binaryNode->type = "BINARY";
            binaryNode->value = op;
            binaryNode->children.push_back(expr);
            binaryNode->children.push_back(right);
            expr = binaryNode;
        }
        
        return expr;
    }

    std::shared_ptr<ASTNode> parseTerm() {
        auto expr = parseFactor();
        
        while (match("OPERATOR", "+") || match("OPERATOR", "-")) {
            std::string op = previous().value;
            auto right = parseFactor();
            
            auto binaryNode = std::make_shared<ASTNode>();
            binaryNode->type = "BINARY";
            binaryNode->value = op;
            binaryNode->children.push_back(expr);
            binaryNode->children.push_back(right);
            expr = binaryNode;
        }
        
        return expr;
    }

    std::shared_ptr<ASTNode> parseFactor() {
        auto expr = parseUnary();
        
        while (match("OPERATOR", "*") || match("OPERATOR", "/") || match("OPERATOR", "%")) {
            std::string op = previous().value;
            auto right = parseUnary();
            
            auto binaryNode = std::make_shared<ASTNode>();
            binaryNode->type = "BINARY";
            binaryNode->value = op;
            binaryNode->children.push_back(expr);
            binaryNode->children.push_back(right);
            expr = binaryNode;
        }
        
        return expr;
    }

    std::shared_ptr<ASTNode> parseUnary() {
        if (match("OPERATOR", "!") || match("OPERATOR", "-")) {
            std::string op = previous().value;
            auto right = parseUnary();
            
            auto unaryNode = std::make_shared<ASTNode>();
            unaryNode->type = "UNARY";
            unaryNode->value = op;
            unaryNode->children.push_back(right);
            return unaryNode;
        }
        
        return parsePrimary();
    }

    std::shared_ptr<ASTNode> parsePrimary() {
        if (match("NUMBER")) {
            auto literalNode = std::make_shared<ASTNode>();
            literalNode->type = "LITERAL";
            literalNode->value = previous().value;
            return literalNode;
        }
        
        if (match("IDENTIFIER")) {
            auto idNode = std::make_shared<ASTNode>();
            idNode->type = "IDENTIFIER";
            idNode->value = previous().value;
            return idNode;
        }
        
        if (match("PUNCTUATION", "(")) {
            auto expr = parseExpression();
            consume("PUNCTUATION", ")", "Expected ')' after expression");
            
            auto groupNode = std::make_shared<ASTNode>();
            groupNode->type = "GROUPING";
            groupNode->children.push_back(expr);
            return groupNode;
        }
        
        throw std::runtime_error("Expected expression");
    }
};

// Function to pretty-print the AST
void printAST(const std::shared_ptr<ASTNode>& node, int depth = 0) {
    std::string indent(depth * 2, ' ');
    
    std::cout << indent << node->type;
    if (!node->value.empty()) {
        std::cout << ": " << node->value;
    }
    std::cout << std::endl;
    
    for (const auto& child : node->children) {
        printAST(child, depth + 1);
    }
}

int main() {
    // Example usage
    std::string source = R"(
        int main() {
            int x = 10;
            // This is a single-line comment
            if (x > 5) {
                printf("x is greater than 5\n");
            }
            
            /* This is a
               multi-line comment */
            for (int i = 0; i < 5; i = i + 1) {
                x = x + i;
            }
            
            return 0;
        }
    )";

    try {
        // Create lexer and tokenize
        Lexer lexer(source);
        auto tokens = lexer.tokenize();

        // Print tokens
        std::cout << "Tokens:\n";
        for (const auto& token : tokens) {
            std::cout << "Type: " << token.type 
                      << ", Value: " << token.value 
                      << ", Line: " << token.line 
                      << ", Column: " << token.column << "\n";
        }

        // Create parser and generate AST
        Parser parser(tokens);
        auto ast = parser.parse();

        // Print AST
        std::cout << "\nAbstract Syntax Tree:\n";
        printAST(ast);

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}