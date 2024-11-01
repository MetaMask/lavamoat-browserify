const { mkdir } = require('node:fs').promises
const { readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

/**
 * Default lockdown/repair options for React Native runtime provided.
 * Hermes is the default engine for React Native.
 * JavaScriptCore (JSC) is the deprecated engine on React Native.
 * 'lockdown' setups up a Hardened JavaScript environment.
 * 'repair' and 'harden' allow a custom Hardened JavaScript environment with vetted shims.
 */
function concat() {
  try {
    const ses = readFileSync(path.join(require.resolve('ses')), 'utf8')
    const sesHermes = readFileSync(
      path.join(require.resolve('ses/hermes')),
      'utf8'
    )
    
    const lockdownSrc = readFileSync('./src/lockdown.js', 'utf8')
    const repairSrc = readFileSync('./src/repair.js', 'utf8')
    
    const lockdown = `${sesHermes}\n;\n${lockdownSrc}`
    const lockdownJsc = `${ses}\n;\n${lockdownSrc}`

    const repair = `${sesHermes}\n;\n${repairSrc}`
    const repairJsc = `${ses}\n;\n${repairSrc}`

    const harden = readFileSync('./src/harden.js', 'utf8')

    const makeGetPolyfills = readFileSync('./src/makeGetPolyfills.js', 'utf8')

    return {
      lockdown,
      lockdownJsc,
      repair,
      repairJsc,
      harden,
      makeGetPolyfills,
    }
  } catch (err) {
    console.error(err)
  }
}

/**
 * Build the files to /dist to export at package.json entry points.
 */
async function build() {
  const distPath = './dist'
  const scripts = concat()
  await mkdir(distPath, { recursive: true })

  Object.entries(scripts).forEach(([name, script]) => {
    writeFileSync(path.join(distPath, name + '.js'), script, 'utf8')
  })
}

build().then(() => console.log('done'), console.error)
