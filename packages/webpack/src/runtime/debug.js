/**
 * @type {Record<string, { globals: Record<string, boolean> }>}
 */
const incrementalPolicy = {}

const printPolicyDebug = () => {
  const policy = JSON.stringify(incrementalPolicy, null, 2)
  console.dir(policy)
}
globalThis.LM_printPolicyDebug = printPolicyDebug

/**
 * @type {NodeJS.Timeout}
 */
let debounceTimer

/**
 * Adds a key to the incremental policy.
 *
 * @param {string} hint - The hint for the incremental policy.
 * @param {string} key - The key to be added to the incremental policy.
 * @returns {void}
 */
function addToPolicy(hint, key) {
  if (!incrementalPolicy[hint]) {
    incrementalPolicy[hint] = { globals: Object.create(null) }
  }
  if (!incrementalPolicy[hint].globals[key]) {
    incrementalPolicy[hint].globals[key] = true
    const informativeStack =
      '\n' + (Error().stack || '').split('\n').slice(2).join('\n')
    console.log(`-- missing ${key} from ${hint}`, informativeStack)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(printPolicyDebug, 3000)
  }
}
/**
 * Creates a recursive proxy object.
 *
 * @param {string} hint - The hint for missing properties.
 * @param {string[]} path - The path to the missing property.
 * @returns {object} - The recursive proxy object.
 */
function recursiveProxy(hint, path) {
  return new Proxy(
    function () {}, //makes it callable to survive a few more lines before we cause an error and stop collecting further policy updates.
    {
      get(target, key) {
        if (typeof key === 'symbol') {
          key = key.toString()
        }
        path = [...path, key]
        addToPolicy(hint, path.join('.'))
        return recursiveProxy(hint, path)
      },
    }
  )
}

/**
 * @param {object | null} obj
 */
function getAllKeys(obj) {
  const keys = []
  for (; obj != null; obj = Object.getPrototypeOf(obj)) {
    keys.push(...Object.getOwnPropertyNames(obj))
  }
  return keys
}

/**
 * Creates a debug proxy for a target object.
 *
 * @param {any} target - The target object to create a debug proxy for.
 * @param {object} source - The keys to check for in the target object.
 * @param {string} hint - The hint to identify the source of the missing key.
 */
const debugProxy = (target, source, hint) => {
  const inheritedFromObj = Object.getOwnPropertyNames(Object.prototype)

  const keys = getAllKeys(source)
  keys.forEach((key) => {
    if (!Object.hasOwn(target, key) && !inheritedFromObj.includes(key)) {
      Object.defineProperty(target, key, {
        get() {
          addToPolicy(hint, key)
          return recursiveProxy(hint, [key])
        },
      })
    }
  })
}

module.exports = {
  debugProxy,
}
