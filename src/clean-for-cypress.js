// @ts-check
const debug = require('debug')('find-webpack')

// note: modifies the argument object in place
const addCypressToEslintRules = (webpackOptions) => {
  if (webpackOptions.module && Array.isArray(webpackOptions.module.rules)) {
    const modulePre = webpackOptions.module.rules.find(rule => rule.enforce === 'pre')
    if (modulePre && Array.isArray(modulePre.use)) {
      debug('found Pre block %o', modulePre)

      const useEslintLoader = modulePre.use.find(use => use.loader && use.loader.includes('eslint-loader'))
      if (useEslintLoader) {
        debug('found useEslintLoader %o', useEslintLoader)

        if (useEslintLoader.options) {
          if (Array.isArray(useEslintLoader.options.globals)) {
            debug('adding cy to existing globals %o', useEslintLoader.options.globals)
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

// note: modifies the argument object in place
const addCodeCoverage = (webpackOptions) => {
  debug('trying to add code instrumentation plugin')
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
  const oneOfRule = webpackOptions.module.rules.find(rule => Array.isArray(rule.oneOf))
  if (!oneOfRule) {
    return
  }
  const babelRule = oneOfRule.oneOf.find(rule => rule.loader && rule.loader.includes('/babel-loader/'))
  if (!babelRule) {
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

function cleanForCypress (opts, webpackOptions) {
  debug('top level opts %o', opts)
  if (!webpackOptions) {
    throw new Error(`cannot clean up config - missing webpack options object`)
  }

  // remove bunch of options, we just need to bundle spec files
  delete webpackOptions.optimization
  delete webpackOptions.plugins

  addCypressToEslintRules(webpackOptions)
  const insertCoveragePlugin = opts && opts.coverage
  if (insertCoveragePlugin) {
    addCodeCoverage(webpackOptions)
  }

  return webpackOptions
}

module.exports = cleanForCypress
