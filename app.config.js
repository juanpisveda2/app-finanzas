process.env.EXPO_ROUTER_APP_ROOT = './src/app';

const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    userInterfaceStyle: 'automatic',
    experiments: {
      typedRoutes: true,
    },
  },
};
