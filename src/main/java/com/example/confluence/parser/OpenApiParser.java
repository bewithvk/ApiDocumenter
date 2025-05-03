package com.example.confluence.parser;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.SwaggerParseResult;

import javax.inject.Named;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parser for OpenAPI specifications.
 */
@Component
@Named
public class OpenApiParser {

    /**
     * Parse an OpenAPI specification.
     *
     * @param specContent The OpenAPI specification content as a string
     * @param format The format of the specification (json or yaml)
     * @return A map containing the parsed specification
     * @throws Exception If parsing fails
     */
    public Map<String, Object> parseSpec(String specContent, String format) throws Exception {
        // Convert the spec to a standardized format
        OpenAPI openAPI = parseOpenApiSpec(specContent);
        
        // Convert the parsed OpenAPI object to a simpler structure for rendering
        return convertToRendererFormat(openAPI);
    }
    
    /**
     * Parse the OpenAPI specification string into an OpenAPI object.
     *
     * @param specContent The OpenAPI specification content as a string
     * @return The parsed OpenAPI object
     * @throws Exception If parsing fails
     */
    private OpenAPI parseOpenApiSpec(String specContent) throws Exception {
        SwaggerParseResult result = new OpenAPIV3Parser().readContents(specContent);
        
        if (result.getMessages() != null && !result.getMessages().isEmpty()) {
            throw new Exception("Error parsing OpenAPI specification: " + String.join(", ", result.getMessages()));
        }
        
        return result.getOpenAPI();
    }
    
    /**
     * Convert the OpenAPI object to a simplified format for rendering.
     *
     * @param openAPI The parsed OpenAPI object
     * @return A map containing the simplified representation
     */
    private Map<String, Object> convertToRendererFormat(OpenAPI openAPI) {
        Map<String, Object> result = new HashMap<>();
        
        // Basic API info
        result.put("openapi", openAPI.getOpenapi());
        
        // Convert Info object to Map
        Map<String, Object> infoMap = new HashMap<>();
        if (openAPI.getInfo() != null) {
            infoMap.put("title", openAPI.getInfo().getTitle());
            infoMap.put("version", openAPI.getInfo().getVersion());
            infoMap.put("description", openAPI.getInfo().getDescription());
            infoMap.put("termsOfService", openAPI.getInfo().getTermsOfService());
            
            // Convert contact info if present
            if (openAPI.getInfo().getContact() != null) {
                Map<String, Object> contactMap = new HashMap<>();
                contactMap.put("name", openAPI.getInfo().getContact().getName());
                contactMap.put("url", openAPI.getInfo().getContact().getUrl());
                contactMap.put("email", openAPI.getInfo().getContact().getEmail());
                infoMap.put("contact", contactMap);
            }
            
            // Convert license info if present
            if (openAPI.getInfo().getLicense() != null) {
                Map<String, Object> licenseMap = new HashMap<>();
                licenseMap.put("name", openAPI.getInfo().getLicense().getName());
                licenseMap.put("url", openAPI.getInfo().getLicense().getUrl());
                infoMap.put("license", licenseMap);
            }
        }
        result.put("info", infoMap);
        
        // Extract paths and operations
        List<Map<String, Object>> paths = new ArrayList<>();
        
        if (openAPI.getPaths() != null) {
            for (Map.Entry<String, PathItem> pathEntry : openAPI.getPaths().entrySet()) {
                String path = pathEntry.getKey();
                PathItem pathItem = pathEntry.getValue();
                
                // Process GET operation
                processOperation(paths, path, pathItem.getGet(), "get");
                
                // Process POST operation
                processOperation(paths, path, pathItem.getPost(), "post");
                
                // Process PUT operation
                processOperation(paths, path, pathItem.getPut(), "put");
                
                // Process DELETE operation
                processOperation(paths, path, pathItem.getDelete(), "delete");
                
                // Process PATCH operation
                processOperation(paths, path, pathItem.getPatch(), "patch");
                
                // Process OPTIONS operation
                processOperation(paths, path, pathItem.getOptions(), "options");
                
                // Process HEAD operation
                processOperation(paths, path, pathItem.getHead(), "head");
            }
        }
        
        result.put("paths", paths);
        
        return result;
    }
    
    /**
     * Process an operation and add it to the paths list.
     *
     * @param paths The list of paths to add to
     * @param path The path string
     * @param operation The operation object
     * @param method The HTTP method
     */
    private void processOperation(List<Map<String, Object>> paths, String path, Operation operation, String method) {
        if (operation == null) {
            return;
        }
        
        Map<String, Object> opMap = new HashMap<>();
        opMap.put("path", path);
        opMap.put("method", method);
        opMap.put("operationId", operation.getOperationId());
        opMap.put("summary", operation.getSummary());
        opMap.put("description", operation.getDescription());
        opMap.put("deprecated", operation.getDeprecated() != null && operation.getDeprecated());
        
        // Process parameters
        if (operation.getParameters() != null) {
            List<Map<String, Object>> parameters = new ArrayList<>();
            
            for (Parameter parameter : operation.getParameters()) {
                Map<String, Object> paramMap = new HashMap<>();
                paramMap.put("name", parameter.getName());
                paramMap.put("in", parameter.getIn());
                paramMap.put("description", parameter.getDescription());
                paramMap.put("required", parameter.getRequired() != null && parameter.getRequired());
                paramMap.put("schema", parameter.getSchema());
                
                parameters.add(paramMap);
            }
            
            opMap.put("parameters", parameters);
        }
        
        // Process request body
        if (operation.getRequestBody() != null) {
            RequestBody requestBody = operation.getRequestBody();
            Map<String, Object> requestBodyMap = new HashMap<>();
            
            requestBodyMap.put("description", requestBody.getDescription());
            requestBodyMap.put("required", requestBody.getRequired() != null && requestBody.getRequired());
            
            // Process content
            if (requestBody.getContent() != null) {
                Map<String, Object> contentMap = new HashMap<>();
                
                for (Map.Entry<String, MediaType> contentEntry : requestBody.getContent().entrySet()) {
                    String mediaType = contentEntry.getKey();
                    MediaType mediaTypeObj = contentEntry.getValue();
                    
                    Map<String, Object> mediaTypeMap = new HashMap<>();
                    
                    if (mediaTypeObj.getSchema() != null) {
                        mediaTypeMap.put("schema", processSchema(mediaTypeObj.getSchema()));
                    }
                    
                    contentMap.put(mediaType, mediaTypeMap);
                }
                
                requestBodyMap.put("content", contentMap);
            }
            
            opMap.put("requestBody", requestBodyMap);
        }
        
        // Process responses
        if (operation.getResponses() != null) {
            Map<String, Object> responsesMap = new HashMap<>();
            
            for (Map.Entry<String, ApiResponse> responseEntry : operation.getResponses().entrySet()) {
                String statusCode = responseEntry.getKey();
                ApiResponse response = responseEntry.getValue();
                
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("description", response.getDescription());
                
                // Process content
                if (response.getContent() != null) {
                    Map<String, Object> contentMap = new HashMap<>();
                    
                    for (Map.Entry<String, MediaType> contentEntry : response.getContent().entrySet()) {
                        String mediaType = contentEntry.getKey();
                        MediaType mediaTypeObj = contentEntry.getValue();
                        
                        Map<String, Object> mediaTypeMap = new HashMap<>();
                        
                        if (mediaTypeObj.getSchema() != null) {
                            mediaTypeMap.put("schema", processSchema(mediaTypeObj.getSchema()));
                        }
                        
                        contentMap.put(mediaType, mediaTypeMap);
                    }
                    
                    responseMap.put("content", contentMap);
                }
                
                responsesMap.put(statusCode, responseMap);
            }
            
            opMap.put("responses", responsesMap);
        }
        
        paths.add(opMap);
    }
    
    /**
     * Process a schema object.
     *
     * @param schema The schema object
     * @return A map containing the processed schema
     */
    private Map<String, Object> processSchema(Schema<?> schema) {
        Map<String, Object> schemaMap = new HashMap<>();
        
        schemaMap.put("type", schema.getType());
        schemaMap.put("format", schema.getFormat());
        schemaMap.put("description", schema.getDescription());
        
        // Process array items
        if ("array".equals(schema.getType()) && schema.getItems() != null) {
            schemaMap.put("items", processSchema(schema.getItems()));
        }
        
        // Process object properties
        if ("object".equals(schema.getType()) && schema.getProperties() != null) {
            Map<String, Object> propertiesMap = new HashMap<>();
            
            for (Map.Entry<String, Schema> propertyEntry : schema.getProperties().entrySet()) {
                String propertyName = propertyEntry.getKey();
                Schema<?> propertySchema = propertyEntry.getValue();
                
                propertiesMap.put(propertyName, processSchema(propertySchema));
            }
            
            schemaMap.put("properties", propertiesMap);
        }
        
        // Process required properties
        if (schema.getRequired() != null) {
            schemaMap.put("required", schema.getRequired());
        }
        
        // Process enum values
        if (schema.getEnum() != null) {
            schemaMap.put("enum", schema.getEnum());
        }
        
        // Process example
        if (schema.getExample() != null) {
            schemaMap.put("example", schema.getExample());
        }
        
        return schemaMap;
    }
}