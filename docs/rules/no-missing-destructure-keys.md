# no-missing-destructure-keys

Require object keys passed into configured function calls to also be destructured from the call result.

## Why

When a function/hook is called with an object literal, it is easy to pass additional fields and forget to destructure one of them from the return value. This rule catches that mismatch.

## Rule details

This rule checks assignments like:

```ts
const { a, b } = useUnit({
  a: model.a,
  b: model.b,
  c: model.c
});
```

The code above reports because `c` was provided but not destructured.

## Options

```ts
type Options = [
  {
    targets?: Array<{ name: string; argumentIndex?: number }>;
    ignoreKeys?: string[];
    ignoreKeyPattern?: string;
  }
];
```

- `targets`: call targets to inspect. If omitted, no calls are checked.
- `ignoreKeys`: key names to ignore.
- `ignoreKeyPattern`: regex string to ignore matching keys.

## Supported shape (v1)

- Variable declarator ID is an object pattern.
- Initializer is a call expression.
- Callee is an identifier (for example, `useUnit(...)`).
- Target argument is an object literal.
- Input object keys are plain properties with identifier keys.
- Destructured keys are identifier keys (aliasing is supported).

## Special cases

- `...rest` in destructuring covers all remaining keys and the rule does not report.
- Spread/computed keys in the input object (`{ ...x }` or `{ [k]: v }`) produce a "cannot verify" report.
- String literal keys in input objects are ignored in v1.
