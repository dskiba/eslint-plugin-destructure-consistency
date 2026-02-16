# eslint-plugin-destructure-consistency

ESLint plugin for enforcing consistency between object keys passed into a function call and keys destructured from that call's result.

## Why

It helps prevent subtle omissions like passing a key in the input object and forgetting to destructure it from the returned object.

Example bug this catches:

```ts
const { runTask, taskResult } = useUnit({
  runTask: taskModel.runTask,
  taskResult: taskModel.$taskResult,
  isTaskPending: taskModel.isTaskPending
});
// Missing: isTaskPending
```

## Installation

```bash
npm install --save-dev eslint-plugin-destructure-consistency
```

## Usage (flat config)

```ts
import destructureConsistency from "eslint-plugin-destructure-consistency";

export default [
  {
    plugins: { "destructure-consistency": destructureConsistency },
    rules: {
      "destructure-consistency/no-missing-destructure-keys": [
        "error",
        {
          targets: [{ name: "useUnit", argumentIndex: 0 }],
          ignoreKeyPattern: "^_"
        }
      ]
    }
  }
];
```

## Rule: `no-missing-destructure-keys`

Ensures that when a function is called with an object literal argument, every eligible key from that object is also destructured from the call result.

### Default behavior

If no options are provided, the rule does nothing.

To enable checks, configure `targets` explicitly:

```ts
[{ name: "yourFunctionName", argumentIndex: 0 }]
```

### Options

```ts
type Options = [
  {
    targets?: Array<{ name: string; argumentIndex?: number }>;
    ignoreKeys?: string[];
    ignoreKeyPattern?: string;
  }
];
```

- `targets`: function names and argument indexes to inspect. If omitted, no calls are checked.
- `ignoreKeys`: exact key names to ignore.
- `ignoreKeyPattern`: regex string; keys matching it are ignored.

### Triggered shape (v1)

The rule only checks these cases:

- `VariableDeclarator` with `id` as `ObjectPattern`
- `init` as `CallExpression`
- callee is an `Identifier` (e.g. `useUnit(...)`)
- configured argument index is an `ObjectExpression`
- object argument keys are `Property` entries with identifier keys
- destructuring keys are identifier keys (`{ foo: alias }` counts as key `foo`)

### Special cases

- If destructuring contains rest (`...rest`), it is treated as covering all remaining keys (no error).
- If the object argument contains a spread (`{ ...x }`) or computed key (`{ [k]: v }`), the rule reports:
  - `Cannot verify keys for <fn>(...) because the object argument contains spread elements or computed keys.`
- String literal keys in the argument object are ignored in v1.

### Reported error

When keys are missing:

- `Keys provided to <fn>(...) must be destructured from its result. Missing: a, b.`

### Examples

#### Failing

```ts
const { runTask, taskResult } = useUnit({
  runTask: taskModel.runTask,
  taskResult: taskModel.$taskResult,
  isTaskPending: taskModel.isTaskPending
});
```

#### Passing

```ts
const { runTask, taskResult, isTaskPending } = useUnit({
  runTask: taskModel.runTask,
  taskResult: taskModel.$taskResult,
  isTaskPending: taskModel.isTaskPending
});
```

## Development

```bash
npm run build
npm test
```
