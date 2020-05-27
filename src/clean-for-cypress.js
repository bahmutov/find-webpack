// @ts-check
const debug = require('debug')('find-webpack')

// note: modifies the argument object in place
const addCypressToEslintRules = (webpackOptions) => {
  if (webpackOptions.module && Array.isArray(webpackOptions.module.rules)) {
    const modulePre = webpackOptions.module.rules.find(
      (rule) => rule.enforce === 'pre',
    )
    if (modulePre && Array.isArray(modulePre.use)) {
      debug('found Pre block %o', modulePre)

      const useEslintLoader = modulePre.use.find(
        (use) => use.loader && use.loader.includes('eslint-loader'),
      )
      if (useEslintLoader) {
        debug('found useEslintLoader %o', useEslintLoader)

        if (useEslintLoader.options) {
          if (Array.isArray(useEslintLoader.options.globals)) {
            debug(
              'adding cy to existing globals %o',
              useEslintLoader.options.globals,
            )
            useEslintLoader.options.globals.push('cy')
            useEslintLoader.options.globals.push('Cypress')
          } else {
            debug('setting new list of globals with cy and Cypress')
            useEslintLoader.options.globals = ['cy', 'Cypress']
          }
        }
      }
    }
  }
}

const findBabelRule = (webpackOptions) => {
  if (!webpackOptions) {
    return
  }
  if (!webpackOptions.module) {
    return
  }
  debug('webpackOptions.module %o', webpackOptions.module)
  if (!Array.isArray(webpackOptions.module.rules)) {
    return
  }
  const oneOfRule = webpackOptions.module.rules.find((rule) =>
    Array.isArray(rule.oneOf),
  )
  if (!oneOfRule) {
    debug('could not find oneOfRule')
    return
  }
  debug('looking through oneOf rules')
  const babelRule = oneOfRule.oneOf.find(
    (rule) => rule.loader && rule.loader.includes('/babel-loader/'),
  )
  return babelRule
}

// see https://github.com/bahmutov/find-webpack/issues/7
const findBabelLoaderRule = (webpackOptions) => {
  debug('looking for babel-loader rule')
  if (!webpackOptions) {
    return
  }
  if (!webpackOptions.module) {
    return
  }
  debug('webpackOptions.module %o', webpackOptions.module)
  if (!Array.isArray(webpackOptions.module.rules)) {
    return
  }
  const babelRule = webpackOptions.module.rules.find(
    (rule) => rule.loader === 'babel-loader',
  )
  if (!babelRule) {
    debug('could not find babel rule')
    return
  }

  debug('found Babel rule that applies to %s', babelRule.test.toString())
  return babelRule
}

// note: modifies the argument object in place
const addCodeCoverage = (webpackOptions) => {
  debug('trying to add code instrumentation plugin')
  let babelRule = findBabelRule(webpackOptions)
  if (!babelRule) {
    debug('could not find Babel rule using oneOf')
    babelRule = findBabelLoaderRule(webpackOptions)
  }

  if (!babelRule) {
    debug('could not find Babel rule')
    return
  }

  debug('babel rule %o', babelRule)
  if (!babelRule.options) {
    return
  }
  if (!Array.isArray(babelRule.options.plugins)) {
    return
  }
  babelRule.options.plugins.push('babel-plugin-istanbul')
  debug('added babel-plugin-istanbul')
}

const addComponentFolder = (addFolderToTranspile, webpackOptions) => {
  if (!addFolderToTranspile) {
    debug('no extra folders to transpile using Babel')
    return
  }

  debug('trying to transpile component tests folder using Babel')
  const babelRule = findBabelRule(webpackOptions)
  if (!babelRule) {
    debug('could not find Babel rule')
    return
  }
  debug('babel rule %o', babelRule)
  if (typeof babelRule.include === 'string') {
    babelRule.include = [babelRule.include]
  }
  babelRule.include.push(addFolderToTranspile)
  debug('added component tests folder to babel rules')
}

function cleanForCypress(opts, webpackOptions) {
  debug('cleanForCypress: top level opts %o', opts)
  if (!webpackOptions) {
    throw new Error(`cannot clean up config - missing webpack options object`)
  }

  // are we cleaning Webpack from react-scripts?
  const reactScripts = opts && opts.reactScripts

  if (reactScripts) {
    debug('cleaning webpack for react-scripts')
    // we assume the webpack is installed if we found its config
    const webpack = require('webpack')

    if (webpackOptions.optimization) {
      // these two plugins often cause problems loading tests
      delete webpackOptions.optimization.splitChunks
      delete webpackOptions.optimization.runtimeChunk
      debug('deleted split chunks and runtime chunks optimizations')
    }

    // by limiting EVERYTHING into a single chunk
    // we bundle lazy loaded components into the same spec bundle
    // example in https://github.com/bahmutov/test-mdx-example/issues/1
    webpackOptions.plugins = webpackOptions.plugins || []
    webpackOptions.plugins.push(
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1, // no chunks from dynamic imports -- includes the entry file
      }),
    )

    const addFolderToTranspile = opts && opts.addFolderToTranspile
    addComponentFolder(addFolderToTranspile, webpackOptions)
    debug('cleaned webpack %o', webpackOptions)
  } else {
    // remove bunch of options, we just need to bundle spec files
    delete webpackOptions.optimization
  }

  debug('deleting webpack options plugins')
  delete webpackOptions.plugins

  addCypressToEslintRules(webpackOptions)
  const insertCoveragePlugin = opts && opts.coverage
  if (insertCoveragePlugin) {
    addCodeCoverage(webpackOptions)
  }

  return webpackOptions
}

module.exports = cleanForCypress
