const autogen = require('./autogen')
const security = require('./security')
const basic = require('./basic')
const config = require('./config')
const endowments = require('./endowments')
const exportsDefense = require('./exportsDefense')
const globalWrites = require('./globalWrites')
const moduleExports = require('./moduleExports')
const transforms = require('./transforms')
const globalRef = require('./globalRef')
const scuttle = require('./scuttle')

module.exports = { loadScenarios }
const scenarios = [
  ...autogen,
  ...security,
  ...basic,
  ...config,
  ...endowments,
  ...exportsDefense,
  ...globalWrites,
  ...moduleExports,
  ...transforms,
  ...globalRef,
]

async function * loadScenarios (loadScuttleScenarios = false) {
  const scenarioCreators = [...scenarios, ...(loadScuttleScenarios ? scuttle : [])]
  for (const scenarioCreator of scenarioCreators) {
    yield await scenarioCreator()
  }
  for (const scenarioCreator of scuttle) {
    yield await scenarioCreator()
  }
}
