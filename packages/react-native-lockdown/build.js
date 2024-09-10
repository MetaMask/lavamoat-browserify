const { mkdir } = require('node:fs').promises
const { readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

function concat() {
  try {
    const ses = readFileSync(
      path.join(require.resolve('ses/hermes')),
      'utf8'
    )
    const beforeSrc = readFileSync('./src/before.js', 'utf8')
    const mainSrc = readFileSync('./src/main.js', 'utf8')
    const after = readFileSync('./src/after.js', 'utf8')
    const before = `${ses}\n;\n${beforeSrc}`
    const main = `${ses}\n;\n${mainSrc}`

    return { main, before, after }
  } catch (err) {
    console.error(err)
  }
}

async function build() {
  const distPath = './dist'
  const scripts = concat()
  await mkdir(distPath, { recursive: true })

  Object.entries(scripts).forEach(([name, script]) => {
    writeFileSync(path.join(distPath, name + '.js'), script, 'utf8')
  })
}

build().then(() => console.log('done'), console.error)
