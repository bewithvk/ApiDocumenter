package com.example.confluence.renderer;

import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;

/**
 * Unit tests for the OpenApiRenderer class.
 */
public class OpenApiRendererTest {
    
    private OpenApiRenderer renderer;
    
    @Before
    public void setUp() {
        renderer = new OpenApiRenderer();
    }
    
    /**
     * Test rendering a basic API info section.
     */
    @Test
    public void testRenderApiInfo() {
        // Create a simple parsed spec representation
        Map<String, Object> parsedSpec = new HashMap<>();
        
        // Add openapi version
        parsedSpec.put("openapi", "3.0.0");
        
        // Add API info
        Map<String, Object> info = new HashMap<>();
        info.put("title", "Test API");
        info.put("version", "1.0.0");
        info.put("description", "This is a test API");
        parsedSpec.put("info", info);
        
        // Add empty paths
        List<Map<String, Object>> paths = new ArrayList<>();
        parsedSpec.put("paths", paths);
        
        // Render the spec as HTML
        String html = renderer.renderOpenApiSpec(parsedSpec);
        
        // Verify HTML output contains expected elements
        assertNotNull(html);
        assertTrue(html.contains("<div class=\"openapi-spec-container\""));
        assertTrue(html.contains("<div class=\"api-info\""));
        assertTrue(html.contains("<h2 class=\"api-title\">Test API"));
        assertTrue(html.contains("<span class=\"api-version\">1.0.0</span>"));
        assertTrue(html.contains("<div class=\"api-description\">This is a test API</div>"));
        assertTrue(html.contains("<table class=\"api-info-table\">"));
        assertTrue(html.contains("<th>OpenAPI Version</th>"));
        assertTrue(html.contains("<td>3.0.0</td>"));
    }
    
    /**
     * Test rendering a basic endpoint.
     */
    @Test
    public void testRenderEndpoint() {
        // Create a simple parsed spec representation
        Map<String, Object> parsedSpec = new HashMap<>();
        
        // Add basic info
        parsedSpec.put("openapi", "3.0.0");
        Map<String, Object> info = new HashMap<>();
        info.put("title", "Test API");
        info.put("version", "1.0.0");
        parsedSpec.put("info", info);
        
        // Add a test endpoint
        List<Map<String, Object>> paths = new ArrayList<>();
        Map<String, Object> endpoint = new HashMap<>();
        endpoint.put("path", "/test");
        endpoint.put("method", "get");
        endpoint.put("summary", "Test endpoint");
        endpoint.put("description", "This is a test endpoint");
        
        // Add a response
        Map<String, Object> responses = new HashMap<>();
        Map<String, Object> okResponse = new HashMap<>();
        okResponse.put("description", "OK");
        responses.put("200", okResponse);
        endpoint.put("responses", responses);
        
        paths.add(endpoint);
        parsedSpec.put("paths", paths);
        
        // Render the spec as HTML
        String html = renderer.renderOpenApiSpec(parsedSpec);
        
        // Verify HTML output contains expected elements
        assertNotNull(html);
        assertTrue(html.contains("<div class=\"endpoint\""));
        assertTrue(html.contains("<div class=\"endpoint-header method-get\""));
        assertTrue(html.contains("<span class=\"http-method get\">GET</span>"));
        assertTrue(html.contains("<span class=\"endpoint-path\">/test</span>"));
        assertTrue(html.contains("<div class=\"summary\">Test endpoint</div>"));
        assertTrue(html.contains("<div class=\"description\">This is a test endpoint</div>"));
        assertTrue(html.contains("<div class=\"responses-section\">"));
        assertTrue(html.contains("<span class=\"status-code\">200</span>"));
        assertTrue(html.contains("<span class=\"response-description\">OK</span>"));
    }
    
    /**
     * Test escaping HTML characters in descriptions.
     */
    @Test
    public void testHtmlEscaping() {
        // Create a simple parsed spec representation
        Map<String, Object> parsedSpec = new HashMap<>();
        
        // Add basic info with HTML characters
        parsedSpec.put("openapi", "3.0.0");
        Map<String, Object> info = new HashMap<>();
        info.put("title", "Test <script>alert('XSS')</script> API");
        info.put("version", "1.0.0");
        parsedSpec.put("info", info);
        
        // Add empty paths
        List<Map<String, Object>> paths = new ArrayList<>();
        parsedSpec.put("paths", paths);
        
        // Render the spec as HTML
        String html = renderer.renderOpenApiSpec(parsedSpec);
        
        // Verify HTML output has escaped characters
        assertNotNull(html);
        assertTrue(html.contains("Test &lt;script&gt;alert('XSS')&lt;/script&gt; API"));
        assertFalse(html.contains("<script>alert"));
    }
}