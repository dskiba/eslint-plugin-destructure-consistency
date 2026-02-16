import noMissingDestructureKeysRule from "./rules/no-missing-destructure-keys";

const rules = {
  "no-missing-destructure-keys": noMissingDestructureKeysRule
};

const plugin: {
  meta: {
    name: string;
    version: string;
  };
  rules: typeof rules;
  configs: Record<string, unknown>;
} = {
  meta: {
    name: "eslint-plugin-destructure-consistency",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

export = plugin;
