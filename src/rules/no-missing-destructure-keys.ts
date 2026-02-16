import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type TargetOption = {
  name: string;
  argumentIndex?: number;
};

type Options = [
  {
    targets?: TargetOption[];
    ignoreKeys?: string[];
    ignoreKeyPattern?: string;
  }
];

type MessageIds = "missingKeys" | "cannotVerify";

const createRule = ESLintUtils.RuleCreator(
  () =>
    "https://www.npmjs.com/package/eslint-plugin-destructure-consistency#readme"
);

function getDestructuredKeys(pattern: TSESTree.ObjectPattern): {
  keys: Set<string>;
  hasRestElement: boolean;
} {
  const keys = new Set<string>();
  let hasRestElement = false;

  for (const property of pattern.properties) {
    if (property.type === "RestElement") {
      hasRestElement = true;
      continue;
    }

    if (
      property.type === "Property" &&
      !property.computed &&
      property.key.type === "Identifier"
    ) {
      keys.add(property.key.name);
    }
  }

  return { keys, hasRestElement };
}

function getProvidedKeys(argument: TSESTree.ObjectExpression): {
  keys: string[];
  cannotVerify: boolean;
} {
  const seen = new Set<string>();
  const keys: string[] = [];

  for (const property of argument.properties) {
    if (property.type === "SpreadElement") {
      return { keys: [], cannotVerify: true };
    }

    if (property.type === "Property") {
      if (property.computed) {
        return { keys: [], cannotVerify: true };
      }

      if (property.key.type === "Identifier" && !seen.has(property.key.name)) {
        seen.add(property.key.name);
        keys.push(property.key.name);
      }
    }
  }

  return { keys, cannotVerify: false };
}

export default createRule<Options, MessageIds>({
  name: "no-missing-destructure-keys",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require keys passed in object literal call arguments to be destructured from the call result."
    },
    messages: {
      missingKeys:
        "Keys provided to {{functionName}}(...) must be destructured from its result. Missing: {{missingKeys}}.",
      cannotVerify:
        "Cannot verify keys for {{functionName}}(...) because the object argument contains spread elements or computed keys."
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          targets: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                argumentIndex: {
                  type: "integer",
                  minimum: 0
                }
              },
              required: ["name"]
            }
          },
          ignoreKeys: {
            type: "array",
            items: { type: "string" }
          },
          ignoreKeyPattern: { type: "string" }
        }
      }
    ],
    defaultOptions: [{}]
  },
  create(context, [options]) {
    const configuredTargets = (options.targets ?? []).map((target) => ({
      name: target.name,
      argumentIndex: target.argumentIndex ?? 0
    }));

    if (configuredTargets.length === 0) {
      return {};
    }

    const targetMap = new Map<string, number>(
      configuredTargets.map((target) => [target.name, target.argumentIndex])
    );

    const ignoreKeys = new Set(options.ignoreKeys ?? []);
    let ignorePattern: RegExp | null = null;
    if (options.ignoreKeyPattern) {
      try {
        ignorePattern = new RegExp(options.ignoreKeyPattern);
      } catch {
        ignorePattern = null;
      }
    }

    const shouldIgnoreKey = (key: string): boolean => {
      if (ignoreKeys.has(key)) {
        return true;
      }

      return ignorePattern?.test(key) ?? false;
    };

    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== "ObjectPattern" ||
          !node.init ||
          node.init.type !== "CallExpression" ||
          node.init.callee.type !== "Identifier"
        ) {
          return;
        }

        const functionName = node.init.callee.name;
        const argumentIndex = targetMap.get(functionName);

        if (argumentIndex === undefined) {
          return;
        }

        const argument = node.init.arguments[argumentIndex];
        if (!argument || argument.type !== "ObjectExpression") {
          return;
        }

        const destructured = getDestructuredKeys(node.id);
        if (destructured.hasRestElement) {
          return;
        }

        const provided = getProvidedKeys(argument);
        if (provided.cannotVerify) {
          context.report({
            node: node.id,
            messageId: "cannotVerify",
            data: { functionName }
          });
          return;
        }

        const missing = provided.keys.filter(
          (key) => !shouldIgnoreKey(key) && !destructured.keys.has(key)
        );

        if (missing.length > 0) {
          context.report({
            node: node.id,
            messageId: "missingKeys",
            data: {
              functionName,
              missingKeys: missing.join(", ")
            }
          });
        }
      }
    };
  }
});
