const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  optimize: { LimitChunkCountPlugin },
} = require('webpack')
const { cleanForCypress } = require('../src/index')

class DefinePlugin {}
class HotModuleReplacementPlugin {}
class ReactRefreshPlugin {}
class DisallowedPlugin {}

const getPlugins = () => [
  new DefinePlugin(),
  new DisallowedPlugin(),
  new HotModuleReplacementPlugin(),
  new ReactRefreshPlugin(),
]

const demoConfig = {
  target: ['browserslist'],
  stats: 'errors-warnings',
  mode: 'production',
  devtool: false,
  entry: '',
  output: {
    path: '',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
    publicPath: '',
  },
  infrastructureLogging: {
    level: 'none',
  },
  optimization: {
    minimize: true,
    minimizer: [],
    splitChunks: 'natural',
    runtimeChunk: {},
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    plugins: [
      {
        appSrcs: ['old value'],
      },
    ],
  },
  plugins: getPlugins(),
  module: {
    strictExportPresence: true,
    rules: [
      {
        enforce: 'pre',
        use: [
          {
            loader: 'eslint-loader',
            options: {
              globals: [],
            },
          },
        ],
      },
      {
        oneOf: [
          {
            loader: 'babel-loader',
            include: ['old value'],
            options: {
              plugins: [],
            },
          },
        ],
      },
    ],
  },
  performance: false,
}

const getEslintLoaderOption = (config) => config.module.rules[0].use[0].options

const getEslintLoaderOptionGlobals = (config) =>
  getEslintLoaderOption(config).globals

const getBabelLoader = (config) => config.module.rules[1].oneOf[0]

const getBabelLoaderOptionPlugins = (config) =>
  getBabelLoader(config).options.plugins

const getBabelLoaderInclude = (config) => getBabelLoader(config).include

const getModuleSourcePlugin = (config) => config.resolve.plugins[0].appSrcs

const includesPluginTransformModulesCommonjs = (config) =>
  getBabelLoaderOptionPlugins(config).find(
    (plugin) => plugin[0] === '@babel/plugin-transform-modules-commonjs',
  )
const includesPluginIstanbul = (config) =>
  getBabelLoaderOptionPlugins(config).includes('babel-plugin-istanbul')

const includesCypressInEslintGlobals = (config) =>
  getEslintLoaderOptionGlobals(config).includes('Cypress')

let config

test.before.each(() => {
  // just copy config
  config = JSON.parse(JSON.stringify(demoConfig))
})

test('cleanForCypress / should return the webpack config if passed', () => {
  assert.ok(cleanForCypress({}, config))
})

test('cleanForCypress / should throw an exception if no webpack config is passed', () => {
  assert.throws(() => cleanForCypress({}))
})

test('cleanForCypress / should add cypress globals to eslint rules', () => {
  assert.not(includesCypressInEslintGlobals(config))
  cleanForCypress({}, config)
  assert.ok(includesCypressInEslintGlobals(config))
})

test('cleanForCypress / should set cypress globals to eslint rules if they are not exist', () => {
  delete getEslintLoaderOption(config).globals
  cleanForCypress({}, config)
  assert.ok(includesCypressInEslintGlobals(config))
})

test('cleanForCypress / coverage:true / should add babel-plugin-istanbul', () => {
  assert.not(includesPluginIstanbul(config))
  cleanForCypress({ coverage: true }, config)
  assert.ok(includesPluginIstanbul(config))
})

test('cleanForCypress / coverage:false / should not add babel-plugin-istanbul', () => {
  assert.not(includesPluginIstanbul(config))
  cleanForCypress({}, config)
  assert.not(includesPluginIstanbul(config))
})

test('cleanForCypress / looseModules:true / should add @babel/plugin-transform-modules-commonjs', () => {
  assert.not(includesPluginTransformModulesCommonjs(config))
  cleanForCypress({ looseModules: true }, config)
  assert.ok(includesPluginTransformModulesCommonjs(config))
})

test('cleanForCypress / looseModules:false / should not @babel/plugin-transform-modules-commonjs', () => {
  assert.not(includesPluginTransformModulesCommonjs(config))
  cleanForCypress({}, config)
  assert.not(includesPluginTransformModulesCommonjs(config))
})

test('cleanForCypress / reactScripts:true / should delete splitChunks and runtimeChunk from optimization', () => {
  assert.ok(config.optimization.minimize)
  assert.ok(config.optimization.splitChunks)
  assert.ok(config.optimization.runtimeChunk)

  cleanForCypress({ reactScripts: true }, config)

  assert.ok(config.optimization.minimize)
  assert.not(config.optimization.splitChunks)
  assert.not(config.optimization.runtimeChunk)
})

test('cleanForCypress / reactScripts:true / should filter plugins by allowed list', () => {
  config.plugins = getPlugins()
  cleanForCypress({ reactScripts: true }, config)
  assert.not(
    config.plugins.find((plugin) => plugin instanceof DisallowedPlugin),
  )
})

test('cleanForCypress / reactScripts:true / should add LimitChunkCountPlugin plugins', () => {
  config.plugins = getPlugins()
  cleanForCypress({ reactScripts: true }, config)
  assert.ok(
    config.plugins.find((plugin) => plugin instanceof LimitChunkCountPlugin),
  )
})

test('cleanForCypress / reactScripts:true / should add folder to transpile / when one item', () => {
  assert.not(getBabelLoaderInclude(config).includes('foo'))
  assert.not(getModuleSourcePlugin(config).includes('foo'))
  cleanForCypress({ reactScripts: true, addFolderToTranspile: 'foo' }, config)
  assert.ok(getBabelLoaderInclude(config).includes('old value'))
  assert.ok(getModuleSourcePlugin(config).includes('old value'))
  assert.ok(getBabelLoaderInclude(config).includes('foo'))
  assert.ok(getModuleSourcePlugin(config).includes('foo'))
})

test('cleanForCypress / reactScripts:true / should add folder to transpile / when include is string', () => {
  getBabelLoader(config).include = 'old value'
  cleanForCypress({ reactScripts: true, addFolderToTranspile: 'foo' }, config)
  assert.ok(getBabelLoaderInclude(config).includes('old value'))
  assert.ok(getModuleSourcePlugin(config).includes('old value'))
  assert.ok(getBabelLoaderInclude(config).includes('foo'))
  assert.ok(getModuleSourcePlugin(config).includes('foo'))
})

test('cleanForCypress / reactScripts:true / should add folder to transpile / when array of items', () => {
  assert.not(getBabelLoaderInclude(config).includes('foo'))
  assert.not(getModuleSourcePlugin(config).includes('foo'))
  assert.not(getBabelLoaderInclude(config).includes('bar'))
  assert.not(getModuleSourcePlugin(config).includes('bar'))
  cleanForCypress(
    { reactScripts: true, addFolderToTranspile: ['foo', 'bar'] },
    config,
  )
  assert.ok(getBabelLoaderInclude(config).includes('old value'))
  assert.ok(getModuleSourcePlugin(config).includes('old value'))
  assert.ok(getBabelLoaderInclude(config).includes('foo'))
  assert.ok(getModuleSourcePlugin(config).includes('foo'))
  assert.ok(getBabelLoaderInclude(config).includes('bar'))
  assert.ok(getModuleSourcePlugin(config).includes('bar'))
})

test('cleanForCypress / reactScripts:false / should remove optimization and plugins', () => {
  assert.ok(config.plugins)
  assert.ok(config.optimization)

  cleanForCypress({}, config)

  assert.not(config.plugins)
  assert.not(config.optimization)
})

test.run()
