// @ts-check
const debug = require('debug')('find-webpack')
const path = require('path')
const fs = require('fs')
const findYarnWorkspaceRoot = require('find-yarn-workspace-root')
const mockEnv = require('mocked-env')

const tryLoadingWebpackConfig = (webpackConfigPath) => {
  debug('trying to load webpack config from %s', webpackConfigPath)
  // Do this as the first thing so that any code reading it knows the right env.
  const envName = 'development'
  // @ts-ignore
  const restoreEnv = mockEnv({
    BABEL_ENV: envName,
    NODE_ENV: envName,
  })
  try {
    let webpackOptions = require(webpackConfigPath)
    if (typeof webpackOptions === 'function') {
      webpackOptions = webpackOptions(envName)
    }
    debug('webpack options: %o', webpackOptions)
    return webpackOptions
  } catch (err) {
    debug('could not load react-scripts webpack')
    debug('error %s', err.message)
    debug(err)
    restoreEnv()
  }
}

const tryVueCLIScripts = () => {
  const webpackConfigPath = path.resolve(
    findYarnWorkspaceRoot() || process.cwd(),
    'node_modules',
    '@vue',
    'cli-service',
    'webpack.config.js',
  )

  debug('path to Vue CLI resolved webpack.config.js: %s', webpackConfigPath)
  return tryLoadingWebpackConfig(webpackConfigPath)
}

const tryRootProjectWebpack = () => {
  const webpackConfigPath = path.resolve(
    findYarnWorkspaceRoot() || process.cwd(),
    'webpack.config.js',
  )

  debug('path to root webpack.config.js: %s', webpackConfigPath)
  return tryLoadingWebpackConfig(webpackConfigPath)
}

const tryReactScripts = () => {
  // try requiring the file or, if it does not work, try parent folders
  // maybe it is a monorepo situation
  const root = findYarnWorkspaceRoot() || process.cwd()
  debug('trying filename for react scripts from root %s', root)
  const filename = path.resolve(
    root,
    'node_modules',
    'react-scripts',
    'config',
    'webpack.config.js',
  )
  return tryLoadingWebpackConfig(filename)
}

const tryEjectedReactScripts = () => {
  const webpackConfigPath = path.resolve(
    process.cwd(),
    'config',
    'webpack.config.js',
  )
  return tryLoadingWebpackConfig(webpackConfigPath)
}

/**
 * Try loading React scripts webpack config using "require" - because maybe
 * the `react-scripts` were installed in a parent folder (but without using Yarn workspace)
 */
const tryWebpackInReactScriptsModule = () => {
  const webpackConfigModuleName = 'react-scripts/config/webpack.config.js'
  debug(
    'trying to require webpack config via path: %s',
    webpackConfigModuleName,
  )

  const found = tryLoadingWebpackConfig(webpackConfigModuleName)
  if (!found) {
    debug('Could not find react-scripts webpack config')
    const packageJsonExists = fs.existsSync(
      path.join(process.cwd(), 'package.json'),
    )
    if (!packageJsonExists) {
      debug('⚠️ react-scripts requires package.json file')
      debug('We could not find it in % s', process.cwd())
    }
  }
}

/**
 * Tries really hard to find Webpack config file
 * and load it using development environment name.
 */
const getWebpackOptions = () => {
  debug('get webpack starting from cwd: %s', process.cwd())
  const webpackOptions =
    tryReactScripts() ||
    tryEjectedReactScripts() ||
    tryVueCLIScripts() ||
    tryRootProjectWebpack() ||
    tryWebpackInReactScriptsModule()

  if (!webpackOptions) {
    // TODO: nice user error message if we can't find
    // any of the normal webpack configurations
    debug('could not find webpack options')
  }
  return webpackOptions
}

module.exports = getWebpackOptions
