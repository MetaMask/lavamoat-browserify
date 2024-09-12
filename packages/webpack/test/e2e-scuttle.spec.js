const test = require('ava')
const path = require('node:path')
// eslint-disable-next-line ava/no-import-test-files
const { scaffold, runScriptWithSES } = require('./scaffold.js')
const {makeConfig} = require('./fixtures/main/webpack.config.js')

const err = (intrinsic) =>
  'LavaMoat - property "' +
  intrinsic +
  '" of globalThis is inaccessible under ' +
  'scuttling mode. To learn more visit https://github.com/LavaMoat/LavaMoat/pull/360.'

async function scuttle(t, scuttleGlobalThis, globals) {
  const webpackConfigDefault = makeConfig({
    scuttleGlobalThis,
    generatePolicy: true,
    emitPolicySnapshot: true,
    diagnosticsVerbosity: 1,
    policyLocation: path.resolve(__dirname, 'fixtures/main/policy-scuttling'),
  })
  const webpackConfig = {
    ...webpackConfigDefault,
    entry: {
      app: './simple.js',
    },
  }
  await t.notThrowsAsync(async () => {
    t.context.build = await scaffold(webpackConfig)
    t.context.bundle = t.context.build.snapshot['/dist/app.js']
    t.context.globalThis = runScriptWithSES(t.context.bundle, globals).context
  }, 'Expected the build to succeed')
}

test(`webpack/scuttled - dist shape`, async (t) => {
  await scuttle(t, true)
  t.snapshot(Object.keys(t.context.build.snapshot))
})

test(`webpack/scuttled - hosting globalThis's environment is not scuttled`, async (t) => {
  await scuttle(t)
  try {
    const global = t.context.globalThis
    Object.getOwnPropertyNames(global).forEach(name => global[name])
  } catch (e) {
    t.fail(`Unexpected error in scenario: ${e.message}`)
  }
})

test(`webpack/scuttled - hosting globalThis's "Function" is not scuttled`, async (t) => {
  await scuttle(t)
  try {
    t.is(new t.context.globalThis.Function('return 1')(), 1)
  } catch (e) {
    t.fail(`Unexpected error in scenario: ${e.message}`)
  }
})

test(`webpack/scuttled - hosting globalThis's "Function" is scuttled`, async (t) => {
  await scuttle(t, true)
  try {
    new t.context.globalThis.Function('1')()
  } catch (e) {
    t.true(e.message === err('Function'))
  }
})

test(`webpack/scuttled - hosting globalThis's "Function" is scuttled excepted`, async (t) => {
  await scuttle(t, {enabled: true, exceptions: ['Function']})
  try {
    t.is(new t.context.globalThis.Function('return 1')(), 1)
  } catch (e) {
    t.fail(`Unexpected error in scenario: ${e.message}`)
  }
})

test(`webpack/scuttled - provided scuttlerName successfully invoked defined scuttlerFunc`, async (t) => {
  const scuttlerName = 'SCUTTLER';
  await scuttle(t, {
    enabled: true,
    scuttlerName,
  }, {
    [scuttlerName]: (globalRef, scuttle) => {
      t.context.scuttler_func_called = true
      scuttle(globalRef)
    }
  })
  t.true(t.context.scuttler_func_called);
})
