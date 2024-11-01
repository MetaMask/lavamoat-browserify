/**
 * Generates a list of polyfills with SES to include in the Metro bundle.
 * This sets up a Hardened JavaScript environment on React Native apps at earliest point of entry.
 *
 * @param {Object} options - An object containing the following properties:
 * @param {string} options.engine - The JavaScript engine to secure. If not 'hermes', vanilla flavoured SES will be used.
 * @param {Array} [options.polyfills=[]] - An array of additional polyfills to include as SES vetted shims. Defaults to an empty array.
 * @returns {Array} An array of polyfills to include in the bundle, listed as resolved module paths.
 *
 * @example metro.config.js
 * const makeGetPolyfills = require('@lavamoat/react-native-lockdown/makeGetPolyfills');
 * module.exports = {
 *   serializer: {
 *     getPolyfills: ({platform}) => makeGetPolyfills({engine: 'hermes', polyfills: ['reflect-metadata']}),
 *   },
 * };
 * 
 * TODO: Implement ({platform: ?string}) from https://metrobundler.dev/docs/configuration/#getpolyfills
 * Default platforms: https://metrobundler.dev/docs/configuration/#platforms
 * e.g. Custom React Native setup: iOS running JSC, Android running Hermes.
 * 
 * TODO: De-duplicate polyfills if '@react-native/polyfills' provided.
 * 
 * NB: Sets up Hardened JS before https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Core/InitializeCore.js
 * NB: Since we override the default React Native polyfills, we slot them in as SES vetted shims here.
 */
const makeGetPolyfills = ({engine, polyfills = []}) => {
  const rnPolyfills = require('@react-native/polyfills') // TODO: require.resolve here?
  const ses = engine === 'hermes'
    ? require.resolve('ses/hermes')
    : require.resolve('ses')
  const repair = require.resolve('./repair.js')
  const harden = require.resolve('./harden.js')
  return [ses, repair, ...rnPolyfills(), ...polyfills, harden]
}

module.exports = makeGetPolyfills
