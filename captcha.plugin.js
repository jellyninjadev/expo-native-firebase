const { withInfoPlist } = require('@expo/config-plugins')

// TODO: accept reverse url as input argument

module.exports = (config) => {
  return withInfoPlist(config, async config => {
    config.modResults.CFBundleURLTypes = [
      ...config.modResults.CFBundleURLTypes,
      {"CFBundleURLSchemes": ["com.googleusercontent.apps.177329792829-p07h8jlq4dtpsuussrn7u5n0qkqa5ljg"]}
    ]
    return config
  })
}
