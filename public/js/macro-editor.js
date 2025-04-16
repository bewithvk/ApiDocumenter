// JavaScript for the macro editor view
(function() {
  // Wait for the document to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get references to key elements
    const form = document.getElementById('apiSpecForm');
    const specInput = document.getElementById('specInput');
    const fileUpload = document.getElementById('fileUpload');
    const formatSelector = document.getElementById('formatSelector');
    const previewButton = document.getElementById('previewButton');
    const saveButton = document.getElementById('saveButton');
    const previewArea = document.getElementById('previewArea');
    const errorArea = document.getElementById('errorArea');
    
    // Get Confluence context from AP
    const AP = window.AP || {};
    
    // Check if we're in edit mode with existing data
    function initializeWithExistingData() {
      AP.confluence.getMacroData(function(macroData) {
        if (macroData && macroData.spec) {
          specInput.value = macroData.spec;
          if (macroData.format) {
            formatSelector.value = macroData.format;
          }
        }
      });
    }
    
    // Initialize file upload handling
    function initializeFileUpload() {
      fileUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Auto-detect format from file extension
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.json')) {
          formatSelector.value = 'json';
        } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
          formatSelector.value = 'yaml';
        }
        
        // Read the file contents
        const reader = new FileReader();
        reader.onload = function(e) {
          specInput.value = e.target.result;
        };
        reader.onerror = function() {
          showError('Error reading file');
        };
        reader.readAsText(file);
      });
    }
    
    // Initialize preview functionality
    function initializePreview() {
      previewButton.addEventListener('click', function(event) {
        event.preventDefault();
        generatePreview();
      });
    }
    
    // Generate preview by sending spec to backend for parsing
    function generatePreview() {
      const spec = specInput.value.trim();
      const format = formatSelector.value;
      
      if (!spec) {
        showError('Please enter an OpenAPI specification');
        return;
      }
      
      // Clear any previous errors
      clearError();
      
      // Show loading state
      previewArea.innerHTML = '<div class="loading">Loading preview...</div>';
      
      // Send to backend for parsing
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
        renderPreview(tables);
      })
      .catch(error => {
        showError('Error generating preview: ' + error.message);
      });
    }
    
    // Render the preview tables in the preview area
    function renderPreview(tables) {
      // Clear previous preview
      previewArea.innerHTML = '';
      
      // Add info section
      if (tables.info) {
        const infoElement = document.createElement('div');
        infoElement.classList.add('preview-info');
        infoElement.innerHTML = tables.info;
        previewArea.appendChild(infoElement);
      }
      
      // Add each path section
      tables.paths.forEach(path => {
        const pathElement = document.createElement('div');
        pathElement.classList.add('preview-path');
        
        // Add path header
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
        
        // Add header table if available
        if (path.headerTable) {
          const headerSection = document.createElement('div');
          headerSection.classList.add('table-section');
          headerSection.innerHTML = path.headerTable;
          pathElement.appendChild(headerSection);
        }
        
        // Add request tables if available
        if (path.requestTables && path.requestTables.length > 0) {
          path.requestTables.forEach(table => {
            const requestSection = document.createElement('div');
            requestSection.classList.add('table-section');
            requestSection.innerHTML = table;
            pathElement.appendChild(requestSection);
          });
        }
        
        // Add response tables if available
        if (path.responseTables && path.responseTables.length > 0) {
          path.responseTables.forEach(table => {
            const responseSection = document.createElement('div');
            responseSection.classList.add('table-section');
            responseSection.innerHTML = table;
            pathElement.appendChild(responseSection);
          });
        }
        
        previewArea.appendChild(pathElement);
      });
      
      // Initialize expandable rows
      initializeExpandableRows();
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
    
    // Initialize save functionality
    function initializeSave() {
      saveButton.addEventListener('click', function(event) {
        event.preventDefault();
        saveData();
      });
    }
    
    // Save the macro data
    function saveData() {
      const spec = specInput.value.trim();
      const format = formatSelector.value;
      
      if (!spec) {
        showError('Please enter an OpenAPI specification');
        return;
      }
      
      // Save the macro data
      AP.confluence.saveMacro({
        spec: spec,
        format: format
      });
      
      // Close the dialog
      AP.dialog.close();
    }
    
    // Show error message
    function showError(message) {
      errorArea.textContent = message;
      errorArea.style.display = 'block';
    }
    
    // Clear error message
    function clearError() {
      errorArea.textContent = '';
      errorArea.style.display = 'none';
    }
    
    // Initialize everything
    function initialize() {
      initializeWithExistingData();
      initializeFileUpload();
      initializePreview();
      initializeSave();
      
      // Add handler for the cancel button
      document.getElementById('cancelButton').addEventListener('click', function(event) {
        event.preventDefault();
        AP.dialog.close();
      });
    }
    
    // Initialize when AP is ready
    if (AP.confluence) {
      initialize();
    } else {
      AP.ready(function() {
        initialize();
      });
    }
  });
})();
