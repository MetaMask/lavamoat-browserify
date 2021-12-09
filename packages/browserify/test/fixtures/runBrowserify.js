#!/usr/bin/env node
const browserify = require('browserify')
const lavamoatPlugin = require(process.env.PLUGIN_PATH)

const params = JSON.parse(process.argv[2])

browserify(params.entries, {
  // enable inline sourcemaps
  debug: true,
  ...lavamoatPlugin.args,
  plugin: [
    [lavamoatPlugin, params.opts]
  ],
}).bundle().pipe(process.stdout)
