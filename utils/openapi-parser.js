// OpenAPI specification parser for the API Spec Documentation Plugin
const SwaggerParser = require('@apidevtools/swagger-parser');
const YAML = require('js-yaml');

/**
 * Parse OpenAPI specification into structured format
 * @param {string} spec - The OpenAPI specification as string
 * @param {string} format - Format of the spec ('json' or 'yaml')
 * @returns {Object} Structured data from the specification
 */
async function parseSpec(spec, format = 'json') {
  try {
    let specObj;
    
    // Parse the spec string into an object based on format
    if (format.toLowerCase() === 'json') {
      specObj = JSON.parse(spec);
    } else if (format.toLowerCase() === 'yaml' || format.toLowerCase() === 'yml') {
      specObj = YAML.load(spec);
    } else {
      throw new Error('Unsupported format. Must be JSON or YAML.');
    }
    
    // Validate and dereference the OpenAPI spec
    const api = await SwaggerParser.validate(specObj);
    const dereferenced = await SwaggerParser.dereference(api);
    
    // Extract structured data from the specification
    const result = {
      info: extractInfo(dereferenced),
      paths: extractPaths(dereferenced),
      components: extractComponents(dereferenced)
    };
    
    return result;
  } catch (error) {
    console.error('Error parsing OpenAPI spec:', error);
    throw error;
  }
}

/**
 * Extract basic information from OpenAPI spec
 */
function extractInfo(api) {
  return {
    title: api.info.title || 'API Documentation',
    version: api.info.version || '',
    description: api.info.description || '',
    contact: api.info.contact || null,
    license: api.info.license || null
  };
}

/**
 * Extract path information from OpenAPI spec
 */
function extractPaths(api) {
  const paths = [];
  
  for (const [path, pathItem] of Object.entries(api.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      // Skip if it's not an HTTP method
      if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'].includes(method)) {
        continue;
      }
      
      const pathInfo = {
        path,
        method: method.toUpperCase(),
        summary: operation.summary || '',
        description: operation.description || '',
        operationId: operation.operationId || '',
        parameters: extractParameters(operation.parameters || []),
        requestBody: extractRequestBody(operation.requestBody),
        responses: extractResponses(operation.responses || {}),
        tags: operation.tags || []
      };
      
      paths.push(pathInfo);
    }
  }
  
  return paths;
}

/**
 * Extract parameter information from OpenAPI spec
 */
function extractParameters(parameters) {
  return parameters.map(param => {
    return {
      name: param.name,
      in: param.in, // 'path', 'query', 'header', 'cookie'
      description: param.description || '',
      required: param.required || false,
      schema: extractSchema(param.schema),
      example: param.example || null
    };
  });
}

/**
 * Extract request body information from OpenAPI spec
 */
function extractRequestBody(requestBody) {
  if (!requestBody) return null;
  
  const result = {
    description: requestBody.description || '',
    required: requestBody.required || false,
    content: {}
  };
  
  for (const [mediaType, mediaTypeObject] of Object.entries(requestBody.content || {})) {
    result.content[mediaType] = {
      schema: extractSchema(mediaTypeObject.schema),
      example: mediaTypeObject.example || null
    };
  }
  
  return result;
}

/**
 * Extract response information from OpenAPI spec
 */
function extractResponses(responses) {
  const result = {};
  
  for (const [statusCode, response] of Object.entries(responses)) {
    result[statusCode] = {
      description: response.description || '',
      content: {}
    };
    
    for (const [mediaType, mediaTypeObject] of Object.entries(response.content || {})) {
      result[statusCode].content[mediaType] = {
        schema: extractSchema(mediaTypeObject.schema),
        example: mediaTypeObject.example || null
      };
    }
  }
  
  return result;
}

/**
 * Extract schema information from OpenAPI spec
 */
function extractSchema(schema) {
  if (!schema) return null;
  
  const result = {
    type: schema.type || 'object',
    format: schema.format || null,
    description: schema.description || '',
    default: schema.default,
    example: schema.example,
    enum: schema.enum,
    nullable: schema.nullable || false
  };
  
  // Handle different types
  if (schema.type === 'array' && schema.items) {
    result.items = extractSchema(schema.items);
  } else if (schema.type === 'object' || (!schema.type && (schema.properties || schema.additionalProperties))) {
    result.properties = {};
    
    // Process properties
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      result.properties[propName] = extractSchema(propSchema);
    }
    
    result.required = schema.required || [];
    
    // Handle additionalProperties
    if (schema.additionalProperties) {
      if (typeof schema.additionalProperties === 'object') {
        result.additionalProperties = extractSchema(schema.additionalProperties);
      } else {
        result.additionalProperties = schema.additionalProperties;
      }
    }
  }
  
  return result;
}

/**
 * Extract components from OpenAPI spec
 */
function extractComponents(api) {
  if (!api.components) return null;
  
  const components = {};
  
  // Extract schemas
  if (api.components.schemas) {
    components.schemas = {};
    for (const [name, schema] of Object.entries(api.components.schemas)) {
      components.schemas[name] = extractSchema(schema);
    }
  }
  
  // Extract parameters
  if (api.components.parameters) {
    components.parameters = {};
    for (const [name, param] of Object.entries(api.components.parameters)) {
      components.parameters[name] = {
        name: param.name,
        in: param.in,
        description: param.description || '',
        required: param.required || false,
        schema: extractSchema(param.schema)
      };
    }
  }
  
  // Extract requestBodies
  if (api.components.requestBodies) {
    components.requestBodies = {};
    for (const [name, requestBody] of Object.entries(api.components.requestBodies)) {
      components.requestBodies[name] = extractRequestBody(requestBody);
    }
  }
  
  // Extract responses
  if (api.components.responses) {
    components.responses = {};
    for (const [name, response] of Object.entries(api.components.responses)) {
      components.responses[name] = {
        description: response.description || '',
        content: (response.content || {})
      };
    }
  }
  
  return components;
}

module.exports = {
  parseSpec
};
