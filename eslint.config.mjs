import stylistic from "@stylistic/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "node_modules/",
      ".react-router",
      "!**/.server",
      "!**/.client",
      "!**/server",
    ],
  },
  tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.{jsx,tsx,js,ts}"],
    ...reactPlugin.configs.flat.recommended,
    plugins: {
      "react-hooks": reactHooks,
      "@stylistic": stylistic,
    },
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
      parser: tseslint.parser,
      parserOptions: {
        ...reactPlugin.configs.flat.recommended.languageOptions.parserOptions,
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/restrict-template-expressions": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "no-console": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "all",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/consistent-type-imports": "warn",
      "@stylistic/quotes": ["warn", "double"],
      "@stylistic/semi": ["warn", "always"],
      "@stylistic/padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: ["return", "export"] },
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: [
            "const",
            "let",
            "var",
            "function",
            "type",
            "class",
            "block-like",
          ],
        },
        {
          blankLine: "always",
          prev: "function",
          next: [
            "const",
            "let",
            "var",
            "function",
            "type",
            "class",
            "block-like",
          ],
        },
        {
          blankLine: "always",
          prev: ["type", "class", "block-like"],
          next: [
            "const",
            "let",
            "var",
            "function",
            "type",
            "class",
            "block-like",
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
