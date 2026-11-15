module.exports = {
  // root: true stops ESLint walking up past this repository. Without it, a
  // checkout inside another workspace inherits that workspace's rules, which is
  // exactly how a submodule ends up linted by its parent's configuration.
  root: true,
  env: { browser: true, es6: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:nuxt/recommended',
    'plugin:vue/recommended',
    // Last, so formatting rules that would fight Prettier are turned off.
    'prettier',
  ],
  overrides: [
    {
      files: ['*.test.js', 'test/**/*.js'],
      env: { jest: true },
    },
    {
      // The library's components are registered with a `Dui` prefix, so the
      // name a site writes is `DuiHeader` and never `Header`. The rule reads
      // the file, which cannot see the prefix the module applies.
      files: ['src/components/**/*.vue', 'src/layouts/*.vue'],
      rules: { 'vue/multi-word-component-names': 'off' },
    },
  ],
}
