// Main routes for the Confluence API Spec Documentation Plugin
const express = require('express');
const router = express.Router();
const ac = require('atlassian-connect-express');
const addon = ac();

// Home route - redirects to Atlassian Marketplace
router.get('/', function(req, res) {
  res.redirect('https://marketplace.atlassian.com/');
});

// Macro editor route
router.get('/macro-editor', addon.authenticate(), function(req, res) {
  res.render('macro-editor', {
    title: 'API Spec Documentation Editor'
  });
});

// Macro view route
router.get('/macro-view', addon.authenticate(), function(req, res) {
  const config = req.query.config || '{}';
  let macroConfig;
  
  try {
    macroConfig = JSON.parse(config);
  } catch (e) {
    macroConfig = {};
  }
  
  res.render('macro-view', {
    title: 'API Spec Documentation',
    macroConfig: JSON.stringify(macroConfig)
  });
});

module.exports = router;
