import rl from "readline-sync";

type AddtnOp = "+" | "-";
type MultplOp = "*" | "/";
type Paren = "(" | ")";
interface TokenValues {
    INTEGER: number;
    MULTPL: MultplOp;
    ADDTN: AddtnOp;
    POW: undefined;
    PAREN: Paren;
    EOF: undefined;
}

class Token<TT extends keyof TokenValues = keyof TokenValues> {
    type: TT;
    value: TokenValues[TT];

    constructor(type: TT, value?: TokenValues[TT]) {
        this.type = type;
        this.value = value!;
    }
}

class AST {}

class UnaryOp<TT extends keyof TokenValues = keyof TokenValues> extends AST {
    op: Token<TT>;
    right: AST;
    constructor(op: Token<TT>, right: AST) {
        super();
        this.op = op;
        this.right = right;
    }
}

class BinaryOp<TT extends keyof TokenValues = keyof TokenValues> extends AST {
    left: AST;
    op: Token<TT>;
    right: AST;
    constructor(left: AST, op: Token<TT>, right: AST) {
        super();
        this.left = left;
        this.op = op;
        this.right = right;
    }
}

class Num extends AST {
    token: Token;
    value: number;
    constructor(token: Token<"INTEGER">) {
        super();
        this.token = token;
        this.value = token.value;
    }
}

class Lexer {
    text: string;
    pos: number = 0;
    get currentChar() {
        return this.text[this.pos] ?? null;
    }

    constructor(text: string) {
        this.text = text;
    }
    
    private skipWhitespace() {
        while (this.currentChar !== null && this.currentChar === " ")
            this.pos++;
    }

    private isDigit = (x: string) => x >= '0' && x <= '9';

    private integer() {
        let result = '';
        while (this.currentChar !== null && this.isDigit(this.currentChar)) {
            result += this.currentChar;
            this.pos++;
        }
        return new Token("INTEGER", parseInt(result));
    }
    
    private multpl() {
        const op = this.currentChar as MultplOp;
        this.pos++;
        return new Token("MULTPL", op);
    }

    private addtn() {
        const op = this.currentChar as AddtnOp;
        this.pos++;
        return new Token("ADDTN", op);
    }

    private pow() {
        this.pos++;
        return new Token("POW", undefined);
    }

    private paren() {
        const paren = this.currentChar as Paren;
        this.pos++;
        return new Token("PAREN", paren);
    }

    getNextToken() {
        const ret = (() => {
            this.skipWhitespace();
            if (this.currentChar === null)
                return new Token("EOF");
            if (this.isDigit(this.currentChar))
                return this.integer();
            if (this.currentChar === "+" || this.currentChar === "-")
                return this.addtn();
            if (this.currentChar === "*" || this.currentChar === "/")
                return this.multpl();
            if (this.currentChar === "^")
                return this.pow();
            if (this.currentChar === "(" || this.currentChar === ")")
                return this.paren();
            throw new Error("Lexer error");
        })();
        console.log(ret);
        return ret;
    }
}

class Parser {
    lexer: Lexer;
    _currentToken: Token<keyof TokenValues>;

    constructor(text: string) {
        this.lexer = new Lexer(text);
        this._currentToken = this.lexer.getNextToken();
    }

    private token<TT extends keyof TokenValues>() {
        return this._currentToken as Token<TT>;
    }

    private eat(type: keyof TokenValues) {
        if (this.token().type === type)
            this._currentToken = this.lexer.getNextToken();
        else throw new Error(`Parser error: expected ${type} but got ${this.token().type}`);
    }

    private powerTerm(): AST {
        const token = this.token();
        if (token.type === "PAREN" && token.value === "(") {
            this.eat("PAREN");
            const node = this.expr();
            this.eat("PAREN");
            return node;
        } else if (token.type === "ADDTN") {
            this.eat("ADDTN");
            return new UnaryOp(token, this.powerTerm());
        } else if (token.type === "INTEGER") {
            this.eat("INTEGER");
            return new Num(token as Token<"INTEGER">);
        }
        throw new Error("Parsing error");
    }

    private factor() {
        let node = this.powerTerm();
        while (this.token().type === "POW") {
            const token = this.token();
            this.eat("POW");
            node = new BinaryOp(
                node,
                token,
                this.powerTerm()
            );
        }
        return node;
    }

    private term() {
        let node = this.factor();
        while (this.token().type === "MULTPL") {
            const token = this.token();
            this.eat("MULTPL");
            node = new BinaryOp(
                node,
                token,
                this.factor()
            );
        }
        return node;
    }

    private expr() {
        let node = this.term();
        while (this.token().type === "ADDTN") {
            const token = this.token();
            this.eat("ADDTN");
            node = new BinaryOp(
                node,
                token,
                this.term()
            );
        }
        return node;
    }

    getAst() {
        return this.expr();
    }
}

class NodeVisitor {
    visit(node: AST): number {
        console.log("At", node.constructor.name);
        let ret;
        if (node instanceof BinaryOp) {
            ret = this.visitBinaryOp(node);
        } else if (node instanceof UnaryOp) {
            ret = this.visitUnaryOp(node);
        } else if (node instanceof Num) {
            ret = this.visitNum(node);
        } else throw new Error("what");
        console.log("From", node.constructor.name, "got", ret);
        return ret;
    }

    visitUnaryOp(node: UnaryOp): number {
        let res = this.visit(node.right);
        if (node.op.value === "-")
            res *= -1;
        return res;
    }

    visitBinaryOp(node: BinaryOp): number {
        if (node.op.type === "ADDTN") {
            if (node.op.value === "+")
                return this.visit(node.left) + this.visit(node.right);
            else if (node.op.value === "-")
                return this.visit(node.left) - this.visit(node.right);
        } else if (node.op.type === "MULTPL") {
            if (node.op.value === "*")
                return this.visit(node.left) * this.visit(node.right);
            else if (node.op.value === "/")
                return this.visit(node.left) / this.visit(node.right);
        } else if (node.op.type === "POW") {
            return Math.pow(this.visit(node.left), this.visit(node.right));
        } 
        throw new Error("what");
    }

    visitNum(node: Num) {
        return node.value;
    }
}

function interpret(text: string) {
    const parser = new Parser(text);
    const root = parser.getAst();
    const visitor = new NodeVisitor();
    return visitor.visit(root);
}

function main() {
    while (true) {
        const expr = rl.question("expr> ");
        try {
            const result = interpret(expr);
            console.log(result);
            console.log("\n");
        } catch (ex) {
            console.error(ex);
        }
    }
}

main();