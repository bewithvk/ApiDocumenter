// API routes for the Confluence API Spec Documentation Plugin
const express = require('express');
const router = express.Router();
const ac = require('atlassian-connect-express');
const addon = ac();
const openApiParser = require('../utils/openapi-parser');
const tableGenerator = require('../utils/table-generator');

// Parse OpenAPI specification and return structured data
router.post('/parse-spec', addon.authenticate(), async function(req, res) {
  try {
    const { spec, format } = req.body;
    
    if (!spec) {
      return res.status(400).json({
        error: 'No OpenAPI specification provided'
      });
    }
    
    const parsedSpec = await openApiParser.parseSpec(spec, format || 'json');
    res.json(parsedSpec);
  } catch (error) {
    console.error('Error parsing OpenAPI specification:', error);
    res.status(500).json({
      error: 'Failed to parse OpenAPI specification',
      details: error.message
    });
  }
});

// Generate HTML tables from parsed OpenAPI specification
router.post('/generate-tables', addon.authenticate(), function(req, res) {
  try {
    const { parsedSpec } = req.body;
    
    if (!parsedSpec) {
      return res.status(400).json({
        error: 'No parsed specification provided'
      });
    }
    
    const tables = tableGenerator.generateTables(parsedSpec);
    res.json(tables);
  } catch (error) {
    console.error('Error generating tables:', error);
    res.status(500).json({
      error: 'Failed to generate tables',
      details: error.message
    });
  }
});

module.exports = router;
