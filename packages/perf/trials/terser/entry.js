const { asyncSeriesRepeat } = require('../../util')
const { minify } = require('terser')

// use globalThis.process to avoid hardcoding value when bundling
const nTimes = Number.parseInt(globalThis.process.env.PERF_N || 5, 10)

asyncSeriesRepeat(nTimes, main)

async function main () {
  await minify({
    "file1.js": "function add(first, second) { return first + second; }",
    "file2.js": "console.log(add(1 + 2, 3 + 4));"
  })
}