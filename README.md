Just a tiny arithmetic expression parser written in TypeScript, as an exercise with both TS and lexers/parsers.

Many thanks to [https://ruslanspivak.com/](https://ruslanspivak.com/lsbasi-part9/).

The parser uses the following grammar:
```
INTEGER: [0-9]+
ADDTN: +|-
MULTPL: *|/
POW: ^
PAREN: (|)

powerTerm:
    ADDTN powerTerm |
    INTEGER |
    PAREN expr PAREN

factor:
    powerTerm ( POW powerTerm )*

term:
    factor ( MULTPL factor )*

expr:
    term ( ADDTN term )*
```

# Running locally
Use `npm i` to install packages, `npm run dev` to run it.