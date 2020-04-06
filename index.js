const debug = require('debug')('find-webpack')
const path = require('path')
const findYarnWorkspaceRoot = require('find-yarn-workspace-root')

const webpackConfigPath = path.resolve(
  findYarnWorkspaceRoot() || process.cwd(),
  'node_modules',
  'react-scripts',
  'config',
  'webpack.config.js',
)

debug('path to react-scripts own webpack.config.js: %s', webpackConfigPath)

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

const getWebpackOptions = () => {
  const webpackFactory = require(webpackConfigPath)
  const webpackOptions = webpackFactory('development')
  debug('webpack options: %o', webpackOptions)
  return webpackOptions
}

module.exports = {
  getWebpackOptions
}
