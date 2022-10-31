const test = require('ava')
const { runScenario } = require('./util')
const { loadScenarios } = require('lavamoat-core/test/scenarios/index')
const { runAndTestScenario } = require('lavamoat-core/test/util')

test('Run scenarios', async (t) => {
  for await (const scenario of loadScenarios()) {
    if (!(Object.keys(scenario.context).length === 0 && scenario.context.constructor === Object)) continue
    console.log(`Running Node Scenario: ${scenario.name}`)
    await runAndTestScenario(t, scenario, runScenario)
  }
})

test('Run scenarios with scuttleGlobalThis enabled', async (t) => {
  for await (const scenario of loadScenarios()) {
    if (!(Object.keys(scenario.context).length === 0 && scenario.context.constructor === Object)) continue
    console.log(`Running Node Scenario: ${scenario.name}`)
    const scuttleGlobalThisExceptions = ['console', 'Array', 'RegExp', 'process', 'Date']
    const additionalOpts = { scuttleGlobalThis: true, scuttleGlobalThisExceptions}
    await runAndTestScenario(t, scenario, ({ scenario }) => runScenario({ scenario, additionalOpts }))
  }
})
