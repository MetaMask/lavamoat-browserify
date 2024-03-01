// @ts-check

/** @type {import('lint-staged').Config} */
module.exports = {
  '*.js': ['eslint --fix', 'prettier --write'],
  '*.(ts|md|ya?ml|json)': ['prettier --write'],
  '!((package-lock|policy)*).json': ['prettier --write'],
  'packages/endomoat/src/default-attenuator.js': () => [
    'npm run update-policy -w @lavamoat/node',
  ],
}
