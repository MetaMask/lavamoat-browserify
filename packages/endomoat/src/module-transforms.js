import { evadeCensorSync } from '@endo/evasive-transform'
import { applySourceTransforms } from 'lavamoat-core'

export const decoder = new TextDecoder()
export const encoder = new TextEncoder()

/**
 * Create module transform which performs source transforms to evade SES
 * restrictions
 *
 * @param {import('@endo/compartment-mapper').Language} parser
 * @returns {import('@endo/compartment-mapper').SyncModuleTransform}
 */
export function createModuleTransform(parser) {
  return (sourceBytes, specifier, location, _packageLocation, opts) => {
    let source = decoder.decode(sourceBytes)
    // FIXME: this function calls stuff we could get in `ses/tools.js`
    // except `evadeDirectEvalExpressions`. unclear if we should be using this from `lavamoat-core`
    source = applySourceTransforms(source)
    const { code, map } = evadeCensorSync(source, {
      sourceMap: opts?.sourceMap,
      sourceUrl: new URL(specifier, location).href,
      sourceType: 'module',
    })
    const objectBytes = encoder.encode(code)
    return { bytes: objectBytes, parser, map }
  }
}

/**
 * Standard set of module transforms for our purposes
 */
export const syncModuleTransforms = /** @type {const} */ ({
  cjs: createModuleTransform('cjs'),
  mjs: createModuleTransform('mjs'),
})
