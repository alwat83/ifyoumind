// Copy into functions/lib/staging-entry.js after compiling the reviewed staging source.
const { getApps, initializeApp } = require('firebase-admin/app');

if (!getApps().some(app => app.name === '[DEFAULT]')) initializeApp();

module.exports = {
  explainSyntheticMarket: require('./intelligence/explain-synthetic-market').explainSyntheticMarket,
};
