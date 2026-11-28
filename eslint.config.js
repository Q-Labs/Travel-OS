import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsdoc from 'eslint-plugin-jsdoc';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  // Handbook D27: every export has a JSDoc comment saying what it does and why,
  // with no types in it (TypeScript owns them). This is the kit's block with its
  // paths pointed at apps/web/src, plus one deliberate difference: the preset
  // also demands @param and @returns tags, which for a component with
  // destructured props means a tag per prop ("root0.trip") that only repeats
  // the type. Those two rules are off; a @param that is written must still
  // carry a description.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*', '**/*.stories.*'],
    extends: [jsdoc.configs['flat/recommended-typescript-error']],
    rules: {
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          enableFixer: false,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            'ExportNamedDeclaration > VariableDeclaration',
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
            'TSEnumDeclaration',
          ],
        },
      ],
    },
  },
);
