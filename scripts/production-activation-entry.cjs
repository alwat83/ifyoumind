// Isolated Functions entry, adapted from the validated PR96 staging bootstrap.
// Copy into the compiled lib directory; package main must name this file explicitly.
const {getApps,initializeApp}=require('firebase-admin/app');
const {setGlobalOptions}=require('firebase-functions/v2');
if(!getApps().some(app=>app.name==='[DEFAULT]'))initializeApp();
setGlobalOptions({region:'us-central1'});
const market=require('./intelligence/market-intelligence');
module.exports={
  createMarketIntelligenceProject:market.createMarketIntelligenceProject,
  getMarketIntelligenceProject:market.getMarketIntelligenceProject,
  explainDecisionReport:require('./intelligence/explain-decision-report').explainDecisionReport,
};
