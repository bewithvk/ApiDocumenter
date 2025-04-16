// JavaScript for the macro view mode
(function() {
  // Wait for the document to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get references to key elements
    const contentContainer = document.getElementById('apiSpecContent');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get Confluence context from AP
    const AP = window.AP || {};
    
    // Load the macro data and render the content
    function loadAndRenderContent() {
      AP.confluence.getMacroData(function(macroData) {
        if (!macroData || !macroData.spec) {
          showError('No OpenAPI specification found');
          return;
        }
        
        const spec = macroData.spec;
        const format = macroData.format || 'json';
        
        // Parse the specification
        fetch('/api/parse-spec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ spec, format })
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(err.error || 'Unknown error');
            });
          }
          return response.json();
        })
        .then(parsedSpec => {
          // Generate tables from the parsed specification
          return fetch('/api/generate-tables', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ parsedSpec })
          });
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(err.error || 'Unknown error');
            });
          }
          return response.json();
        })
        .then(tables => {
          renderContent(tables);
        })
        .catch(error => {
          showError('Error rendering content: ' + error.message);
        });
      });
    }
    
    // Render the content with tables
    function renderContent(tables) {
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Clear previous content
      contentContainer.innerHTML = '';
      
      // Add info section
      if (tables.info) {
        const infoElement = document.createElement('div');
        infoElement.classList.add('api-spec-info');
        infoElement.innerHTML = tables.info;
        contentContainer.appendChild(infoElement);
      }
      
      // Add each path section
      tables.paths.forEach(path => {
        const pathElement = document.createElement('div');
        pathElement.classList.add('api-spec-path');
        
        // Add path header with method and path
        const pathHeader = document.createElement('div');
        pathHeader.classList.add('path-header');
        pathHeader.innerHTML = `
          <div class="method ${path.method.toLowerCase()}">${path.method}</div>
          <div class="path">${path.path}</div>
        `;
        if (path.summary) {
          const summary = document.createElement('div');
          summary.classList.add('summary');
          summary.textContent = path.summary;
          pathHeader.appendChild(summary);
        }
        pathElement.appendChild(pathHeader);
        
        // Add description if available
        if (path.description) {
          const description = document.createElement('div');
          description.classList.add('description');
          description.textContent = path.description;
          pathElement.appendChild(description);
        }
        
        // Create sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.classList.add('api-spec-sections');
        
        // Add header table if available
        if (path.headerTable) {
          const headerSection = document.createElement('div');
          headerSection.classList.add('table-section');
          headerSection.innerHTML = path.headerTable;
          sectionsContainer.appendChild(headerSection);
        }
        
        // Add request tables if available
        if (path.requestTables && path.requestTables.length > 0) {
          path.requestTables.forEach(table => {
            const requestSection = document.createElement('div');
            requestSection.classList.add('table-section');
            requestSection.innerHTML = table;
            sectionsContainer.appendChild(requestSection);
          });
        }
        
        // Add response tables if available
        if (path.responseTables && path.responseTables.length > 0) {
          path.responseTables.forEach(table => {
            const responseSection = document.createElement('div');
            responseSection.classList.add('table-section');
            responseSection.innerHTML = table;
            sectionsContainer.appendChild(responseSection);
          });
        }
        
        pathElement.appendChild(sectionsContainer);
        contentContainer.appendChild(pathElement);
      });
      
      // Initialize expandable rows
      initializeExpandableRows();
      
      // Apply Confluence inline commenting context to all table rows
      applyCommentingContext();
    }
    
    // Initialize expandable rows for nested objects/arrays
    function initializeExpandableRows() {
      const expandableRows = document.querySelectorAll('.expandable');
      expandableRows.forEach(row => {
        row.addEventListener('click', function() {
          const nextRow = this.nextElementSibling;
          if (nextRow && nextRow.classList.contains('nested-table-row')) {
            nextRow.classList.toggle('expanded');
            this.classList.toggle('expanded');
          }
        });
      });
    }
    
    // Apply Confluence commenting context to enable inline comments
    function applyCommentingContext() {
      if (AP.confluence && AP.confluence.inlineDialog && AP.confluence.inlineDialog.contextAwareRegister) {
        // Register all parameter rows for commenting
        const paramRows = document.querySelectorAll('.param-row');
        paramRows.forEach(row => {
          const paramName = row.getAttribute('data-param-name');
          const tablePath = row.closest('table').getAttribute('data-path') || '';
          const fullPath = tablePath ? `${tablePath}.${paramName}` : paramName;
          
          // Register this element for commenting with a unique ID
          AP.confluence.inlineDialog.contextAwareRegister(row, {
            id: `api-param-${fullPath.replace(/\./g, '-').replace(/\[\]/g, '-array')}`,
            title: paramName,
            metadata: {
              paramName: paramName,
              path: fullPath
            }
          });
        });
      }
    }
    
    // Show error message
    function showError(message) {
      loadingIndicator.style.display = 'none';
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }
    
    // Initialize when AP is ready
    if (AP.confluence) {
      loadAndRenderContent();
    } else {
      AP.ready(function() {
        loadAndRenderContent();
      });
    }
  });
})();
