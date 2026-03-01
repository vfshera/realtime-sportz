import { defineConfig } from "oxlint";

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  plugins: ["oxc", "eslint", "typescript", "react", "react-perf", "unicorn"],
  env: {
    browser: true,
    serviceworker: true,
  },
  ignorePatterns: ["node_modules/**", ".react-router"],
  settings: {
    react: {
      version: "19.2.4",
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to", attributes: ["to"] },
        { name: "NavLink", linkAttribute: "to", attributes: ["to"] },
      ],
    },
  },
  rules: {
    "no-console": "warn",
    "typescript/no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "all",
        ignoreRestSiblings: false,
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
    "typescript/consistent-type-imports": "warn",
    "typescript/restrict-template-expressions": "warn",
    "typescript/no-base-to-string": "warn",
    "react/react-in-jsx-scope": "off",
    "react/rules-of-hooks": "error",
  },
});
