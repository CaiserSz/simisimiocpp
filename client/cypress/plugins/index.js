// ***********************************************************
// This is a custom plugin that can be used to modify the config
// and add custom behavior to Cypress.
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const { startDevServer } = require('@cypress/webpack-dev-server');
const webpackConfig = require('../../webpack.config');

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  
  // Enable code coverage collection
  require('@cypress/code-coverage/task')(on, config);
  
  // Configure webpack dev server
  on('dev-server:start', (options) => {
    return startDevServer({ options, webpackConfig });
  });
  
  // Log browser console messages
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    }
  });
  
  // Handle file downloads
  on('task', {
    downloadFile(downloads) {
      console.log('downloadFile', downloads);
      return null;
    },
  });
  
  // Set up environment variables
  config.env.API_URL = process.env.API_URL || 'http://localhost:3001/api';
  
  // Return the config object
  return config;
};
