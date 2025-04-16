// Table generator for the API Spec Documentation Plugin
/**
 * Generates HTML tables from parsed OpenAPI specification
 * @param {Object} parsedSpec - Parsed OpenAPI specification
 * @returns {Object} HTML tables for headers, request, and response
 */
function generateTables(parsedSpec) {
  const tables = {
    info: generateInfoTable(parsedSpec.info),
    paths: []
  };
  
  // Generate tables for each endpoint
  parsedSpec.paths.forEach(path => {
    const pathTables = {
      path: path.path,
      method: path.method,
      summary: path.summary,
      description: path.description,
      headerTable: generateHeaderTable(path.parameters),
      requestTables: generateRequestTables(path.requestBody),
      responseTables: generateResponseTables(path.responses)
    };
    
    tables.paths.push(pathTables);
  });
  
  return tables;
}

/**
 * Generate API info table
 */
function generateInfoTable(info) {
  if (!info) return '';
  
  return `
    <div class="api-spec-info">
      <h2>${escapeHtml(info.title)}</h2>
      <p class="version">Version: ${escapeHtml(info.version)}</p>
      <div class="description">${escapeHtml(info.description)}</div>
    </div>
  `;
}

/**
 * Generate header parameters table
 */
function generateHeaderTable(parameters) {
  if (!parameters || parameters.length === 0) return '';
  
  // Filter to only get header parameters
  const headerParams = parameters.filter(param => param.in === 'header');
  if (headerParams.length === 0) return '';
  
  let tableRows = '';
  
  headerParams.forEach(param => {
    tableRows += `
      <tr data-param-name="${escapeHtml(param.name)}" class="param-row">
        <td class="name">${escapeHtml(param.name)}</td>
        <td class="required">${param.required ? 'Yes' : 'No'}</td>
        <td class="type">${param.schema ? escapeHtml(param.schema.type) : ''}</td>
        <td class="example">${param.example ? escapeHtml(JSON.stringify(param.example)) : ''}</td>
        <td class="description">${escapeHtml(param.description)}</td>
      </tr>
    `;
  });
  
  return `
    <div class="api-spec-section">
      <h3>Headers</h3>
      <table class="api-spec-table header-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Required</th>
            <th>Type</th>
            <th>Example</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate tables for request parameters
 */
function generateRequestTables(requestBody) {
  if (!requestBody) return '';
  
  const tables = [];
  
  // Process each content type in the request body
  for (const [mediaType, content] of Object.entries(requestBody.content || {})) {
    if (!content.schema) continue;
    
    tables.push(`
      <div class="api-spec-section">
        <h3>Request - ${escapeHtml(mediaType)}</h3>
        ${generateSchemaTable(content.schema, 'request')}
      </div>
    `);
  }
  
  return tables;
}

/**
 * Generate tables for response parameters
 */
function generateResponseTables(responses) {
  if (!responses) return '';
  
  const tables = [];
  
  // Process each status code and its responses
  for (const [statusCode, response] of Object.entries(responses)) {
    for (const [mediaType, content] of Object.entries(response.content || {})) {
      if (!content.schema) continue;
      
      tables.push(`
        <div class="api-spec-section">
          <h3>Response ${escapeHtml(statusCode)} - ${escapeHtml(mediaType)}</h3>
          <p>${escapeHtml(response.description)}</p>
          ${generateSchemaTable(content.schema, 'response')}
        </div>
      `);
    }
  }
  
  return tables;
}

/**
 * Generate table from schema
 */
function generateSchemaTable(schema, context, prefix = '') {
  if (!schema) return '';
  
  // Handle array type
  if (schema.type === 'array' && schema.items) {
    return generateSchemaTable(schema.items, context, prefix + '[]');
  }
  
  // Handle object type or schemas with properties
  if ((schema.type === 'object' || !schema.type) && schema.properties) {
    let tableRows = '';
    
    // Process each property
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const fullPath = prefix ? `${prefix}.${propName}` : propName;
      const isRequired = schema.required && schema.required.includes(propName);
      
      if (propSchema.type === 'object' && propSchema.properties) {
        // Nested object - generate a separate table
        tableRows += `
          <tr data-prop-name="${escapeHtml(propName)}" class="param-row expandable">
            <td class="name">${escapeHtml(propName)}</td>
            <td class="required">${isRequired ? 'Yes' : 'No'}</td>
            <td class="type">object</td>
            <td class="example">${propSchema.example ? escapeHtml(JSON.stringify(propSchema.example)) : ''}</td>
            <td class="description">${escapeHtml(propSchema.description || '')}</td>
          </tr>
          <tr class="nested-table-row">
            <td colspan="5">
              ${generateSchemaTable(propSchema, context, fullPath)}
            </td>
          </tr>
        `;
      } else if (propSchema.type === 'array' && propSchema.items) {
        // Array type with complex items
        if (propSchema.items.type === 'object' && propSchema.items.properties) {
          tableRows += `
            <tr data-prop-name="${escapeHtml(propName)}" class="param-row expandable">
              <td class="name">${escapeHtml(propName)}</td>
              <td class="required">${isRequired ? 'Yes' : 'No'}</td>
              <td class="type">array of objects</td>
              <td class="example">${propSchema.example ? escapeHtml(JSON.stringify(propSchema.example)) : ''}</td>
              <td class="description">${escapeHtml(propSchema.description || '')}</td>
            </tr>
            <tr class="nested-table-row">
              <td colspan="5">
                ${generateSchemaTable(propSchema.items, context, fullPath + '[]')}
              </td>
            </tr>
          `;
        } else {
          // Array of simple types
          tableRows += `
            <tr data-prop-name="${escapeHtml(propName)}" class="param-row">
              <td class="name">${escapeHtml(propName)}</td>
              <td class="required">${isRequired ? 'Yes' : 'No'}</td>
              <td class="type">array of ${propSchema.items.type || 'unknown'}</td>
              <td class="example">${propSchema.example ? escapeHtml(JSON.stringify(propSchema.example)) : ''}</td>
              <td class="description">${escapeHtml(propSchema.description || '')}</td>
            </tr>
          `;
        }
      } else {
        // Simple property
        tableRows += `
          <tr data-prop-name="${escapeHtml(propName)}" class="param-row">
            <td class="name">${escapeHtml(propName)}</td>
            <td class="required">${isRequired ? 'Yes' : 'No'}</td>
            <td class="type">${escapeHtml(propSchema.type || 'unknown')}${propSchema.format ? ' (' + escapeHtml(propSchema.format) + ')' : ''}</td>
            <td class="example">${propSchema.example ? escapeHtml(JSON.stringify(propSchema.example)) : ''}</td>
            <td class="description">${escapeHtml(propSchema.description || '')}</td>
          </tr>
        `;
      }
    }
    
    return `
      <table class="api-spec-table schema-table ${context}-table" data-path="${escapeHtml(prefix)}">
        <thead>
          <tr>
            <th>Name</th>
            <th>Required</th>
            <th>Type</th>
            <th>Example</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }
  
  // Simple non-object schema
  return `
    <table class="api-spec-table schema-table ${context}-table" data-path="${escapeHtml(prefix)}">
      <thead>
        <tr>
          <th>Type</th>
          <th>Format</th>
          <th>Example</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(schema.type || 'unknown')}</td>
          <td>${schema.format ? escapeHtml(schema.format) : ''}</td>
          <td>${schema.example ? escapeHtml(JSON.stringify(schema.example)) : ''}</td>
          <td>${escapeHtml(schema.description || '')}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  generateTables
};
