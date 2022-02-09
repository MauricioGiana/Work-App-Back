const webpush = require('web-push');
const config = require('./config');

webpush.setVapidDetails("mailto:test@workapp.com", config.PUBLIC_VAPID_KEY, config.PRIVATE_VAPID_KEY);

module.exports = webpush;