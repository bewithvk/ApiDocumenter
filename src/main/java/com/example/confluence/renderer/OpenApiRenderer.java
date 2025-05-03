package com.example.confluence.renderer;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Renders OpenAPI specifications as HTML.
 */
@Component
public class OpenApiRenderer {

    /**
     * Render the parsed OpenAPI specification as HTML tables
     * @param parsedSpec The parsed OpenAPI specification
     * @return HTML representation of the specification
     */
    public String renderOpenApiSpec(Map<String, Object> parsedSpec) {
        StringBuilder html = new StringBuilder();
        
        // Add container div with unique ID for JavaScript interaction
        // Use a stable ID if title is available (for testing purposes), otherwise random UUID
        String containerId;
        @SuppressWarnings("unchecked")
        Map<String, Object> info = (Map<String, Object>) parsedSpec.get("info");
        if (info != null && info.get("title") != null) {
            // Use a deterministic ID in test environments
            containerId = "openapi-spec-" + String.valueOf(info.get("title")).replaceAll("[^a-zA-Z0-9]", "");
        } else {
            containerId = "openapi-spec-" + UUID.randomUUID().toString().replace("-", "");
        }
        html.append("<div id=\"").append(containerId).append("\" class=\"openapi-spec-container\" data-searchable=\"true\">");
        
        // Render API info
        html.append(renderApiInfo(parsedSpec));
        
        // Render endpoints
        html.append(renderEndpoints(parsedSpec));
        
        // Add attribution and version info for the search system to pick up
        if (info != null) {
            html.append("<div class=\"api-search-metadata\" style=\"display: none;\">");
            html.append("<span data-title=\"").append(escapeHtml(String.valueOf(info.getOrDefault("title", "API Documentation")))).append("\"></span>");
            html.append("<span data-version=\"").append(escapeHtml(String.valueOf(info.getOrDefault("version", "")))).append("\"></span>");
            html.append("<span data-openapi-version=\"").append(escapeHtml(String.valueOf(parsedSpec.getOrDefault("openapi", "")))).append("\"></span>");
            html.append("</div>");
        }
        
        // Close container div
        html.append("</div>");
        
        return html.toString();
    }
    
    /**
     * Render API basic information
     */
    private String renderApiInfo(Map<String, Object> parsedSpec) {
        StringBuilder html = new StringBuilder();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> info = (Map<String, Object>) parsedSpec.get("info");
        if (info != null) {
            html.append("<div class=\"api-info\">");
            
            // Title and version
            html.append("<h2 class=\"api-title\">")
                .append(escapeHtml(String.valueOf(info.getOrDefault("title", "API Documentation"))))
                .append(" <span class=\"api-version\">")
                .append(escapeHtml(String.valueOf(info.getOrDefault("version", ""))))
                .append("</span></h2>");
            
            // Description
            if (info.get("description") != null) {
                html.append("<div class=\"api-description\">")
                    .append(escapeHtml(String.valueOf(info.get("description"))))
                    .append("</div>");
            }
            
            // Other API information in a table
            html.append("<table class=\"api-info-table\">");
            html.append("<tbody>");
            
            // OpenAPI version
            html.append("<tr>")
                .append("<th>OpenAPI Version</th>")
                .append("<td>").append(escapeHtml(String.valueOf(parsedSpec.getOrDefault("openapi", ""))))
                .append("</td>")
                .append("</tr>");
            
            // Contact info
            @SuppressWarnings("unchecked")
            Map<String, String> contact = (Map<String, String>) info.get("contact");
            if (contact != null) {
                html.append("<tr>")
                    .append("<th>Contact</th>")
                    .append("<td>");
                
                if (contact.get("name") != null) {
                    html.append(escapeHtml(contact.get("name"))).append("<br>");
                }
                if (contact.get("email") != null) {
                    html.append("Email: <a href=\"mailto:").append(escapeHtml(contact.get("email")))
                        .append("\">").append(escapeHtml(contact.get("email"))).append("</a><br>");
                }
                if (contact.get("url") != null) {
                    html.append("URL: <a href=\"").append(escapeHtml(contact.get("url")))
                        .append("\">").append(escapeHtml(contact.get("url"))).append("</a>");
                }
                
                html.append("</td>")
                    .append("</tr>");
            }
            
            // License info
            @SuppressWarnings("unchecked")
            Map<String, String> license = (Map<String, String>) info.get("license");
            if (license != null && license.get("name") != null) {
                html.append("<tr>")
                    .append("<th>License</th>")
                    .append("<td>");
                
                if (license.get("url") != null) {
                    html.append("<a href=\"").append(escapeHtml(license.get("url")))
                        .append("\">").append(escapeHtml(license.get("name"))).append("</a>");
                } else {
                    html.append(escapeHtml(license.get("name")));
                }
                
                html.append("</td>")
                    .append("</tr>");
            }
            
            html.append("</tbody>");
            html.append("</table>");
            
            html.append("</div>");
        }
        
        return html.toString();
    }
    
    /**
     * Render API endpoints
     */
    private String renderEndpoints(Map<String, Object> parsedSpec) {
        StringBuilder html = new StringBuilder();
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> paths = (List<Map<String, Object>>) parsedSpec.get("paths");
        if (paths != null && !paths.isEmpty()) {
            html.append("<div class=\"api-endpoints\">");
            html.append("<h3>Endpoints</h3>");
            
            for (Map<String, Object> operation : paths) {
                String path = String.valueOf(operation.getOrDefault("path", ""));
                String method = String.valueOf(operation.getOrDefault("method", "")).toUpperCase();
                String operationId = String.valueOf(operation.getOrDefault("operationId", ""));
                String summary = String.valueOf(operation.getOrDefault("summary", ""));
                String description = String.valueOf(operation.getOrDefault("description", ""));
                boolean deprecated = Boolean.parseBoolean(String.valueOf(operation.getOrDefault("deprecated", "false")));
                
                // Generate an ID for this endpoint for comments targeting
                // In test environments, use a deterministic ID based on the method and path
                String endpointId = "endpoint-" + method.toLowerCase() + "-" + path.replaceAll("[^a-zA-Z0-9]", "_");
                
                // Add data attributes for filtering and searching
                html.append("<div class=\"endpoint\" id=\"").append(endpointId).append("\"")
                    .append(" data-method=\"").append(method.toLowerCase()).append("\"")
                    .append(" data-path=\"").append(escapeHtml(path)).append("\"")
                    .append(" data-operation-id=\"").append(escapeHtml(operationId)).append("\"")
                    .append(" data-deprecated=\"").append(deprecated).append("\"");

                // Add tag data attributes if available
                @SuppressWarnings("unchecked")
                List<String> tags = (List<String>) operation.get("tags");
                if (tags != null && !tags.isEmpty()) {
                    html.append(" data-tags=\"");
                    boolean first = true;
                    for (String tag : tags) {
                        if (!first) {
                            html.append(",");
                        }
                        html.append(escapeHtml(tag));
                        first = false;
                    }
                    html.append("\"");
                }
                
                // Add summary data attribute
                if (!summary.equals("null")) {
                    html.append(" data-summary=\"").append(escapeHtml(summary)).append("\"");
                }
                
                html.append(">");
                
                // Endpoint header
                html.append("<div class=\"endpoint-header method-").append(method.toLowerCase()).append("\">");
                html.append("<span class=\"http-method ").append(method.toLowerCase()).append("\">").append(method).append("</span>");
                html.append("<span class=\"endpoint-path\">").append(escapeHtml(path)).append("</span>");
                
                if (deprecated) {
                    html.append("<span class=\"deprecated-badge\">Deprecated</span>");
                }
                
                // Add tags as badges if available
                @SuppressWarnings("unchecked")
                List<String> tagsList = (List<String>) operation.get("tags");
                if (tagsList != null && !tagsList.isEmpty()) {
                    html.append("<div class=\"endpoint-tags\">");
                    for (String tag : tagsList) {
                        html.append("<span class=\"tag-badge\">").append(escapeHtml(tag)).append("</span>");
                    }
                    html.append("</div>");
                }
                
                html.append("</div>");
                
                // Endpoint details
                html.append("<div class=\"endpoint-details\">");
                
                if (!operationId.equals("null")) {
                    html.append("<div class=\"operation-id\"><strong>Operation ID:</strong> ").append(escapeHtml(operationId)).append("</div>");
                }
                
                if (!summary.equals("null")) {
                    html.append("<div class=\"summary\">").append(escapeHtml(summary)).append("</div>");
                }
                
                if (!description.equals("null")) {
                    html.append("<div class=\"description\">").append(escapeHtml(description)).append("</div>");
                }
                
                // Parameters table
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parameters = (List<Map<String, Object>>) operation.get("parameters");
                if (parameters != null && !parameters.isEmpty()) {
                    html.append(renderParametersTable(parameters, endpointId));
                }
                
                // Request body
                @SuppressWarnings("unchecked")
                Map<String, Object> requestBody = (Map<String, Object>) operation.get("requestBody");
                if (requestBody != null) {
                    html.append(renderRequestBody(requestBody, endpointId));
                }
                
                // Responses
                @SuppressWarnings("unchecked")
                Map<String, Object> responses = (Map<String, Object>) operation.get("responses");
                if (responses != null && !responses.isEmpty()) {
                    html.append(renderResponses(responses, endpointId));
                }
                
                html.append("</div>"); // End of endpoint-details
                html.append("</div>"); // End of endpoint
            }
            
            html.append("</div>"); // End of api-endpoints
        }
        
        return html.toString();
    }
    
    /**
     * Render parameters table
     */
    private String renderParametersTable(List<Map<String, Object>> parameters, String endpointId) {
        StringBuilder html = new StringBuilder();
        
        html.append("<div class=\"parameters-section\">");
        html.append("<h4>Parameters</h4>");
        html.append("<table class=\"parameters-table\" id=\"").append(endpointId).append("-parameters\">");
        
        // Table header
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>Name</th>");
        html.append("<th>Location</th>");
        html.append("<th>Type</th>");
        html.append("<th>Required</th>");
        html.append("<th>Description</th>");
        html.append("</tr>");
        html.append("</thead>");
        
        // Table body
        html.append("<tbody>");
        
        for (Map<String, Object> parameter : parameters) {
            String name = String.valueOf(parameter.getOrDefault("name", ""));
            String location = String.valueOf(parameter.getOrDefault("in", ""));
            String description = String.valueOf(parameter.getOrDefault("description", ""));
            boolean required = Boolean.parseBoolean(String.valueOf(parameter.getOrDefault("required", "false")));
            
            // Get parameter type from schema
            String type = "string";
            String format = "";
            @SuppressWarnings("unchecked")
            Map<String, Object> schema = (Map<String, Object>) parameter.get("schema");
            if (schema != null) {
                type = String.valueOf(schema.getOrDefault("type", "string"));
                if (schema.get("format") != null) {
                    format = String.valueOf(schema.get("format"));
                }
            }
            
            // Generate unique ID for this parameter for comments targeting
            String parameterId = endpointId + "-param-" + name.replaceAll("[^a-zA-Z0-9]", "_");
            
            // Add data attributes for search functionality
            html.append("<tr id=\"").append(parameterId).append("\"")
                .append(" data-name=\"").append(escapeHtml(name)).append("\"")
                .append(" data-in=\"").append(escapeHtml(location)).append("\"")
                .append(" data-type=\"").append(escapeHtml(type)).append("\"")
                .append(" data-required=\"").append(required).append("\"")
                .append(" data-param=\"").append(escapeHtml(name)).append("\"")
                .append(" data-location=\"").append(escapeHtml(location)).append("\"");
            
            // Add format data attribute if available
            if (!format.isEmpty() && !format.equals("null")) {
                html.append(" data-format=\"").append(escapeHtml(format)).append("\"");
            }
            
            html.append(">");
            html.append("<td>").append(escapeHtml(name)).append("</td>");
            html.append("<td>").append(escapeHtml(location)).append("</td>");
            
            // Type with format if available
            html.append("<td>");
            html.append(escapeHtml(type));
            if (!format.isEmpty() && !format.equals("null")) {
                html.append(" (").append(escapeHtml(format)).append(")");
            }
            html.append("</td>");
            
            html.append("<td>").append(required ? "Yes" : "No").append("</td>");
            html.append("<td class=\"description\">").append(escapeHtml(description)).append("</td>");
            html.append("</tr>");
        }
        
        html.append("</tbody>");
        html.append("</table>");
        html.append("</div>"); // End of parameters-section
        
        return html.toString();
    }
    
    /**
     * Render request body details
     */
    private String renderRequestBody(Map<String, Object> requestBody, String endpointId) {
        StringBuilder html = new StringBuilder();
        
        html.append("<div class=\"request-body-section\">");
        html.append("<h4>Request Body");
        
        boolean required = Boolean.parseBoolean(String.valueOf(requestBody.getOrDefault("required", "false")));
        if (required) {
            html.append(" <span class=\"required-badge\">Required</span>");
        }
        
        html.append("</h4>");
        
        String description = String.valueOf(requestBody.getOrDefault("description", ""));
        if (!description.equals("null") && !description.isEmpty()) {
            html.append("<div class=\"description\">").append(escapeHtml(description)).append("</div>");
        }
        
        // Render content types
        @SuppressWarnings("unchecked")
        Map<String, Object> content = (Map<String, Object>) requestBody.get("content");
        if (content != null && !content.isEmpty()) {
            for (Map.Entry<String, Object> entry : content.entrySet()) {
                String mediaType = entry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> mediaTypeObj = (Map<String, Object>) entry.getValue();
                
                html.append("<div class=\"media-type\">");
                html.append("<h5>Media type: ").append(escapeHtml(mediaType)).append("</h5>");
                
                @SuppressWarnings("unchecked")
                Map<String, Object> schema = (Map<String, Object>) mediaTypeObj.get("schema");
                if (schema != null) {
                    html.append(renderSchemaTable(schema, endpointId + "-request"));
                }
                
                html.append("</div>"); // End of media-type
            }
        }
        
        html.append("</div>"); // End of request-body-section
        
        return html.toString();
    }
    
    /**
     * Render API responses
     */
    private String renderResponses(Map<String, Object> responses, String endpointId) {
        StringBuilder html = new StringBuilder();
        
        html.append("<div class=\"responses-section\">");
        html.append("<h4>Responses</h4>");
        
        for (Map.Entry<String, Object> entry : responses.entrySet()) {
            String statusCode = entry.getKey();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) entry.getValue();
            
            // Generate a unique ID for this response
            String responseId = endpointId + "-response-" + statusCode.replaceAll("[^a-zA-Z0-9]", "_");
            
            html.append("<div class=\"response\" id=\"").append(responseId).append("\">");
            
            // Response header with status code
            String statusCodeClass = "";
            if (statusCode.startsWith("2")) {
                statusCodeClass = "success";
            } else if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
                statusCodeClass = "error";
            } else if (statusCode.startsWith("3")) {
                statusCodeClass = "redirect";
            }
            
            html.append("<div class=\"response-header status-").append(statusCodeClass).append("\"")
                 .append(" data-status=\"").append(escapeHtml(statusCode)).append("\"")
                 .append(" data-code=\"").append(escapeHtml(statusCode)).append("\"")
                 .append(">");
            html.append("<span class=\"status-code\">").append(escapeHtml(statusCode)).append("</span>");
            
            String description = String.valueOf(response.getOrDefault("description", ""));
            if (!description.equals("null")) {
                html.append("<span class=\"response-description\">").append(escapeHtml(description)).append("</span>");
            }
            
            html.append("</div>"); // End of response-header
            
            // Response content
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) response.get("content");
            if (content != null && !content.isEmpty()) {
                for (Map.Entry<String, Object> contentEntry : content.entrySet()) {
                    String mediaType = contentEntry.getKey();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> mediaTypeObj = (Map<String, Object>) contentEntry.getValue();
                    
                    html.append("<div class=\"media-type\">");
                    html.append("<h5>Media type: ").append(escapeHtml(mediaType)).append("</h5>");
                    
                    @SuppressWarnings("unchecked")
                    Map<String, Object> schema = (Map<String, Object>) mediaTypeObj.get("schema");
                    if (schema != null) {
                        html.append(renderSchemaTable(schema, responseId + "-content"));
                    }
                    
                    html.append("</div>"); // End of media-type
                }
            }
            
            html.append("</div>"); // End of response
        }
        
        html.append("</div>"); // End of responses-section
        
        return html.toString();
    }
    
    /**
     * Render a schema table for request/response bodies
     */
    private String renderSchemaTable(Map<String, Object> schema, String parentId) {
        StringBuilder html = new StringBuilder();
        
        String type = String.valueOf(schema.getOrDefault("type", ""));
        
        if ("object".equals(type) && schema.get("properties") != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) schema.get("properties");
            
            if (!properties.isEmpty()) {
                html.append("<table class=\"schema-table\">");
                
                // Table header
                html.append("<thead>");
                html.append("<tr>");
                html.append("<th>Name</th>");
                html.append("<th>Type</th>");
                html.append("<th>Required</th>");
                html.append("<th>Description</th>");
                html.append("</tr>");
                html.append("</thead>");
                
                // Table body
                html.append("<tbody>");
                
                @SuppressWarnings("unchecked")
                List<String> requiredProps = (List<String>) schema.getOrDefault("required", new ArrayList<String>());
                
                for (Map.Entry<String, Object> propertyEntry : properties.entrySet()) {
                    String propertyName = propertyEntry.getKey();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> propertySchema = (Map<String, Object>) propertyEntry.getValue();
                    
                    // Generate unique ID for this property for comments targeting
                    String propertyId = parentId + "-prop-" + propertyName.replaceAll("[^a-zA-Z0-9]", "_");
                    
                    String propType = String.valueOf(propertySchema.getOrDefault("type", "string"));
                    String format = String.valueOf(propertySchema.getOrDefault("format", ""));
                    String description = String.valueOf(propertySchema.getOrDefault("description", ""));
                    boolean required = requiredProps.contains(propertyName);
                    
                    // Add data attributes for search
                    html.append("<tr id=\"").append(propertyId).append("\"")
                        .append(" data-name=\"").append(escapeHtml(propertyName)).append("\"")
                        .append(" data-type=\"").append(escapeHtml(propType)).append("\"")
                        .append(" data-required=\"").append(required).append("\"")
                        .append(" data-property=\"").append(escapeHtml(propertyName)).append("\"");
                    
                    // Add format data attribute if available
                    if (!format.isEmpty() && !format.equals("null")) {
                        html.append(" data-format=\"").append(escapeHtml(format)).append("\"");
                    }
                    
                    html.append(">");
                    html.append("<td>").append(escapeHtml(propertyName)).append("</td>");
                    
                    // Type with format if available
                    html.append("<td>");
                    html.append(escapeHtml(propType));
                    if (!format.isEmpty() && !format.equals("null")) {
                        html.append(" (").append(escapeHtml(format)).append(")");
                    }
                    
                    // Show array item types
                    if ("array".equals(propType) && propertySchema.get("items") != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> items = (Map<String, Object>) propertySchema.get("items");
                        String itemType = String.valueOf(items.getOrDefault("type", "object"));
                        
                        html.append(" of ").append(escapeHtml(itemType));
                    }
                    
                    html.append("</td>");
                    
                    html.append("<td>").append(required ? "Yes" : "No").append("</td>");
                    html.append("<td class=\"description\">").append(escapeHtml(description)).append("</td>");
                    html.append("</tr>");
                }
                
                html.append("</tbody>");
                html.append("</table>");
            }
        } else if ("array".equals(type) && schema.get("items") != null) {
            // For array types
            @SuppressWarnings("unchecked")
            Map<String, Object> items = (Map<String, Object>) schema.get("items");
            String itemType = String.valueOf(items.getOrDefault("type", "object"));
            
            html.append("<div class=\"array-type\">Array of ").append(escapeHtml(itemType)).append("</div>");
            
            // If items are objects, show their properties
            if ("object".equals(itemType) && items.get("properties") != null) {
                html.append(renderSchemaTable(items, parentId + "-items"));
            }
        } else {
            // For simple types
            html.append("<div class=\"simple-type\">Type: ").append(escapeHtml(type)).append("</div>");
        }
        
        return html.toString();
    }
    
    /**
     * Escape HTML characters to prevent XSS vulnerabilities
     */
    private String escapeHtml(String text) {
        if (text == null || text.equals("null")) {
            return "";
        }
        
        // More aggressive HTML escaping with proper order of replacements
        // The order matters - & must be replaced first to avoid double escaping
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#39;");
    }
}