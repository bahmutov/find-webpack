const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')

const { tryLoadingWebpackConfig } = require('../../src/index')

const getPath = (fileName) => path.resolve(__dirname, fileName)

test('tryLoadingWebpackConfig / simple config', () => {
  assert.ok(tryLoadingWebpackConfig(getPath('webpack.config.basic.js')))
})

test('tryLoadingWebpackConfig / config from function', () => {
  assert.ok(tryLoadingWebpackConfig(getPath('webpack.config.function.js')))
})

test('tryLoadingWebpackConfig / config from TS module', () => {
  assert.ok(tryLoadingWebpackConfig(getPath('webpack.config.ts')))
})

test.run()
