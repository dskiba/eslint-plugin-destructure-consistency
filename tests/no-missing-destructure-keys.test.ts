import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../src/rules/no-missing-destructure-keys";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 2022,
    sourceType: "module"
  }
});

const useUnitTargetOption = [{ targets: [{ name: "useUnit", argumentIndex: 0 }] }];

ruleTester.run("no-missing-destructure-keys", rule, {
  valid: [
    {
      code: `
        const { runTask } = useUnit({
          runTask: taskModel.runTask,
          taskResult: taskModel.$taskResult,
          isTaskPending: taskModel.isTaskPending,
        });
      `
    },
    {
      code: `
        const { runTask, taskResult, isTaskPending } = useUnit({
          runTask: taskModel.runTask,
          taskResult: taskModel.$taskResult,
          isTaskPending: taskModel.isTaskPending,
        });
      `,
      options: useUnitTargetOption
    },
    {
      code: `
        const { runTask: triggerTask, isTaskPending: pending } = useUnit({
          runTask: taskModel.runTask,
          isTaskPending: taskModel.isTaskPending,
        });
      `,
      options: useUnitTargetOption
    },
    {
      code: `
        const { runTask, ...rest } = useUnit({
          runTask: taskModel.runTask,
          taskResult: taskModel.$taskResult,
          isTaskPending: taskModel.isTaskPending,
        });
      `,
      options: useUnitTargetOption
    },
    {
      code: `
        const { runTask } = useUnit({
          runTask: taskModel.runTask,
          isTaskPending: taskModel.isTaskPending,
        });
      `,
      options: [
        {
          targets: [{ name: "useUnit", argumentIndex: 0 }],
          ignoreKeys: ["isTaskPending"]
        }
      ]
    },
    {
      code: `
        const { runTask } = useUnit({
          runTask: taskModel.runTask,
          _internal: taskModel._internal,
        });
      `,
      options: [
        {
          targets: [{ name: "useUnit", argumentIndex: 0 }],
          ignoreKeyPattern: "^_"
        }
      ]
    },
    {
      code: `
        const { view } = connect(store, {
          view: model.view,
        });
      `,
      options: [{ targets: [{ name: "connect", argumentIndex: 1 }] }]
    }
  ],
  invalid: [
    {
      code: `
        const { runTask, taskResult } = useUnit({
          runTask: taskModel.runTask,
          taskResult: taskModel.$taskResult,
          isTaskPending: taskModel.isTaskPending,
        });
      `,
      options: useUnitTargetOption,
      errors: [
        {
          messageId: "missingKeys",
          data: {
            functionName: "useUnit",
            missingKeys: "isTaskPending"
          }
        }
      ]
    },
    {
      code: `
        const { runTask } = useUnit({
          runTask: taskModel.runTask,
          ...otherUnits,
        });
      `,
      options: useUnitTargetOption,
      errors: [
        {
          messageId: "cannotVerify",
          data: {
            functionName: "useUnit"
          }
        }
      ]
    },
    {
      code: `
        const { runTask } = useUnit({
          runTask: taskModel.runTask,
          [dynamicKey]: taskModel.something,
        });
      `,
      options: useUnitTargetOption,
      errors: [
        {
          messageId: "cannotVerify",
          data: {
            functionName: "useUnit"
          }
        }
      ]
    }
  ]
});
