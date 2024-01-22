# LavaMoat Webpack Plugin

> Putting lava in your pack. For security. We need to work on our metaphors.

LavaMoat Webpack Plugin wraps each module in the bundle in a [Compartment](https://github.com/endojs/endo/tree/master/packages/ses#compartment) and enforces LavaMoat Policies independently per package.

## Usage

> Initial Beta version requires you to generate the policy with lavamoat CLI. We're working on moving that into the plugin.

1. Generate a policy file for your app's entry `npx lavamoat --autopolicy path/to/index.js` and adjust it if needed.
2. Note that `builtins` in the policy indicate modules that webpack will either polyfill or ignore, so they need to be moved to `packages` and explicitly added as dependencies or just removed.
3. Create a webpack bundle with the LavaMoat plugin enabled and pass the policy from the policy file to it in options.
4. Make sure you add a `<script src="./lockdown.js"></script>` before all other scripts or enable the `HtmlWebpackPluginInterop` option if you're using `html-webpack-plugin`.

The LavaMoat plugin takes an options object with the following properties:

- policy: the LavaMoat policy object. (unstable. This will surely change before v1 or a policy loader export will be provided from the main package to incorporate policy-override files)
- runChecks: Optional boolean property to indicate whether to check resulting code with wrapping for correctness. Default is false.
- diagnosticsVerbosity: Optional number property to represent diagnostics output verbosity. A larger number means more overwhelming diagnostics output. Default is 0.  
  Setting positive verbosity will enable runChecks.
- readableResourceIds: Decide whether to keep resource IDs human readable (regardless of production/development mode). If false, they are replaced with a sequence of numbers. Keeping them readable may be useful for debugging when a policy violation error is thrown.
- lockdown: set configuration for [SES lockdown](). Setting the option replaces defaults from LavaMoat.
- HtmlWebpackPluginInterop: add a script tag to the html output for lockdown.js if HtmlWebpackPlugin is in use

```js
const LavaMoatPlugin = require('@lavamoat/webpack')

module.exports = {
  // ... other webpack configuration properties
  plugins: [
    new LavaMoatPlugin({
      // policy generated by lavamoat
      policy: require('./lavamoat/policy.json'),
      // runChecks: true, // enables checking each wrapped module source if it's still proper JavaScript (in case mismatching braces somehow survived Webpack loaders processing)
      // readableResourceIds: true, // explicitly decide if resourceIds from policy should be readable in the bundle or turned into numbers. You might want to bundle in production mode but keep the ids for debugging
      //   diagnosticsVerbosity: 2, // level of output verbosity from the plugin
      // SES lockdown options to use at runtime
      // lockdown: {
      //   errorTaming: "unsafe",
      //   consoleTaming: "unsafe",
      //   overrideTaming: "severe"
      // },
      // HtmlWebpackPluginInterop: false, // set it to true if you want a script tag for lockdown.js to automatically be added to your HTML template
    }),
  ],
  // ... other webpack configuration properties
}
```

One important thing to note when using the LavaMoat plugin is that it disables the `concatenateModules` optimization in webpack. This is because concatenation won't work with wrapped modules.

### Excluding modules

> [!WARNING]
> This is an experimental feature and excluding may be configured differently in the future if this approach is proven insecure.

The default way to define specific behaviors for webpack is creating module rules. To ensure exclude rules are applied on the same exact files that match certain rules (the same RegExp may be matched against different things at different times) we're providing the exclude functionality as a loader you can add to the list of existing loaders or use individually.  
The loader is available as `LavaMoatPlugin.exclude` from the default export of the plugin. It doesn't do anything to the code, but its presence is detected and treated as a mark on the file. Any file that's been processed by `LavaMoatPlugin.exclude` will not be wrapped in a Compartment.

> [!NOTE]
> Exclude loader will only work when used in webpack config. Specifying it inline `require('path/to/excludeLoader.js!./module.js')` will not result in module.js being excluded. (This is a security feature to prevent your dependencies from declaring they want to be excluded.)

Example: avoid wrapping CSS modules:

```js
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          LavaMoatPlugin.exclude,
        ],
        sideEffects: true,
      },
    ],
  },
```

See: `examples/webpack.config.js` for a complete example.

### Gotchas

#### Implicit modules

- Webpack may include dependencies polyfilling Node.js built-ins, such as the `events` or `buffer` packages. In other cases, it will ignore the built-ins and provide empty modules in their place (see below).

When a dependency (eg. `buffer`) is provided by Webpack, and you need to add it explicitly to your dependencies, you'll receive the following error:

```
Error: LavaMoat - Encountered unknown package directory for file "/home/(...)/node_modules/buffer/index.js"
```

#### Webpack-ignored modules

When a built-in Node.js module is ignored, Webpack generates something like this:

```js
const nodeCrypto = __webpack_require__(/*! crypto */ '?0b7d')
```

A carveout is necessary in policy enforcement for these modules.
Sadly, even treeshaking doesn't eliminate that module. It's left there and failing to work when reached by runtime control flow.

This plugin will skip policy enforcement for such ignored modules.

# Security Claims

**This is a _beta_ release and does not provide any guarantees; even those listed below. Use at your own risk!**

- SES must be added to the page without any bundling or transforming for any security guarantees to be sustained.
  - The plugin could add it as an asset to the compilation if that's a good Developer Experience. Feedback welcome.
- Each javascript module resulting from the webpack build is scoped to its package's policy

## Threat Model

- Webpack itself is considered trusted.
- All plugins can bypass LavaMoat protections intentionally.
- It's unlikely _but possible_ that a plugin can bypass LavaMoat protections _unintentionally_.
- It should not be possible for loaders to bypass LavaMoat protections.
- Some plugins (eg. MiniCssExtractPlugin) execute code from the bundle at build time. To make the plugin work you need to trust it and the modules it runs and add the LavaMoat.exclude loader for them.
- This Webpack plugin _does not_ protect against malicious execution by other third-party plugins at runtime (use [LavaMoat](https://npm.im/lavamoat) for that).

## Webpack runtime

Elements of the Webpack runtime (e.g., `__webpack_require__.*`) are currently mostly left intact. To avoid opening up potential bypasses, some functionality of the Webpack runtime will need to be restricted.

# Testing

Run `npm test` to start the automated tests.

## Manual testing

- Navigate to `example/`
- Run `npm ci` and `npm test`
- Open `dist/index.html` in your browser and inspect the console