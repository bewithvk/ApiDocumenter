package com.example.confluence.rest;

import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.example.confluence.parser.OpenApiParser;
import com.example.confluence.renderer.OpenApiRenderer;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

/**
 * REST resource for handling OpenAPI specification related requests.
 */
@Path("/openapi")
public class OpenApiResource {
    
    private final OpenApiParser openApiParser;
    private final OpenApiRenderer openApiRenderer;
    
    @Inject
    public OpenApiResource(OpenApiParser openApiParser, OpenApiRenderer openApiRenderer) {
        this.openApiParser = openApiParser;
        this.openApiRenderer = openApiRenderer;
    }
    
    /**
     * Render OpenAPI specification as HTML
     * This endpoint is used by the macro editor to preview the rendered spec.
     *
     * @param request Map containing the specification and format
     * @return HTML rendering of the OpenAPI spec
     */
    @POST
    @Path("/render")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_HTML)
    @AnonymousAllowed
    public Response renderSpec(Map<String, String> request) {
        try {
            String spec = request.get("spec");
            String format = request.get("format");
            
            if (spec == null || spec.trim().isEmpty()) {
                return createErrorResponse("No specification content provided");
            }
            
            // Parse the OpenAPI specification
            Map<String, Object> parsedSpec = openApiParser.parseSpec(spec, format);
            
            // Render the specification as HTML tables
            String html = openApiRenderer.renderOpenApiSpec(parsedSpec);
            
            return Response.ok(html).build();
        } catch (Exception e) {
            return createErrorResponse("Error processing OpenAPI specification: " + e.getMessage());
        }
    }
    
    /**
     * Create error response with JSON payload
     *
     * @param message Error message
     * @return Response object with error details
     */
    private Response createErrorResponse(String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        return Response.status(Response.Status.BAD_REQUEST)
                .entity(errorResponse)
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}