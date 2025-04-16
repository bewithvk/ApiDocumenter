package com.example.confluence.macro;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.plugin.spring.scanner.annotation.component.Scanned;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.webresource.api.assembler.PageBuilderService;
import com.example.confluence.parser.OpenApiParser;
import com.example.confluence.renderer.OpenApiRenderer;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.Map;

/**
 * OpenAPI Documentation Macro
 * 
 * Renders OpenAPI specifications as interactive documentation in Confluence pages
 */
@Scanned
@Named
public class OpenApiMacro implements Macro {

    private final PageBuilderService pageBuilderService;
    private final OpenApiParser openApiParser;
    private final OpenApiRenderer openApiRenderer;
    
    @Inject
    public OpenApiMacro(
            @ComponentImport PageBuilderService pageBuilderService,
            OpenApiParser openApiParser,
            OpenApiRenderer openApiRenderer) {
        this.pageBuilderService = pageBuilderService;
        this.openApiParser = openApiParser;
        this.openApiRenderer = openApiRenderer;
    }

    /**
     * Execute the macro with the given parameters
     *
     * @param parameters Parameters specified by the user in the macro
     * @param body The body of the macro (if the macro has a body)
     * @param conversionContext Context of the current rendering process
     * @return Rendered macro output
     * @throws MacroExecutionException If any error occurs during execution
     */
    @Override
    public String execute(Map<String, String> parameters, String body, ConversionContext conversionContext)
            throws MacroExecutionException {
        try {
            // Include CSS and JavaScript resources for the rendered output
            pageBuilderService.assembler().resources().requireWebResource("com.example.confluence.openapi-documentation:openapi-documentation-resources");
            
            // Get parameters
            String spec = parameters.get("spec");
            String format = parameters.getOrDefault("format", "json").toLowerCase();
            
            // Use macro body if no spec parameter is provided
            if (spec == null || spec.trim().isEmpty()) {
                spec = body;
            }
            
            // If still no spec content, show an error
            if (spec == null || spec.trim().isEmpty()) {
                return renderError("No OpenAPI specification provided.");
            }
            
            // Determine format if not explicitly specified
            if (format == null || format.isEmpty()) {
                // Try to auto-detect format based on content
                format = detectFormat(spec);
            }
            
            // Parse the OpenAPI specification
            Map<String, Object> parsedSpec = openApiParser.parseSpec(spec, format);
            
            // Render the specification as HTML
            String renderedHtml = openApiRenderer.renderOpenApiSpec(parsedSpec);
            
            return renderedHtml;
        } catch (Exception e) {
            return renderError("Error processing OpenAPI specification: " + e.getMessage());
        }
    }

    /**
     * Get the name of the macro
     *
     * @return Name of the macro
     */
    @Override
    public String getBodyType() {
        return "Rich Text";
    }

    /**
     * Get the output format type
     *
     * @return Output format type
     */
    @Override
    public OutputType getOutputType() {
        return OutputType.BLOCK;
    }
    
    /**
     * Detect format of the OpenAPI specification based on content
     *
     * @param content OpenAPI specification content
     * @return Detected format (json or yaml)
     */
    private String detectFormat(String content) {
        // Basic detection based on first non-whitespace character
        String trimmed = content.trim();
        if (trimmed.startsWith("{")) {
            return "json";
        } else {
            return "yaml";
        }
    }
    
    /**
     * Render an error message
     *
     * @param message Error message to display
     * @return HTML error message
     */
    private String renderError(String message) {
        return "<div class=\"aui-message aui-message-error\">" +
                "<p class=\"title\"><strong>Error rendering OpenAPI specification</strong></p>" +
                "<p>" + message + "</p>" +
                "</div>";
    }
}