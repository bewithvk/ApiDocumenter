/**
 * OpenAPI Documentation Client-side JavaScript
 * Provides interactive functionality for the rendered OpenAPI documentation
 */
AJS.toInit(function($) {
    'use strict';
    
    /**
     * Initialize the OpenAPI documentation plugin functionality
     */
    function initialize() {
        setupExpandableEndpoints();
        setupCommentingIntegration();
        addCommentIndicators();
    }
    
    /**
     * Setup expandable/collapsible endpoints for better space utilization
     */
    function setupExpandableEndpoints() {
        $('.openapi-spec-container .endpoint-header').on('click', function() {
            var $endpoint = $(this).closest('.endpoint');
            var $details = $endpoint.find('.endpoint-details');
            
            if ($details.is(':visible')) {
                $details.slideUp(200);
                $endpoint.addClass('collapsed');
            } else {
                $details.slideDown(200);
                $endpoint.removeClass('collapsed');
            }
        });
        
        // Default state: Collapse all endpoints except the first one
        $('.openapi-spec-container .endpoint:not(:first-child) .endpoint-details').hide();
        $('.openapi-spec-container .endpoint:not(:first-child)').addClass('collapsed');
    }
    
    /**
     * Setup integration with Confluence's commenting functionality
     * This allows users to comment on specific parts of the API documentation
     */
    function setupCommentingIntegration() {
        if (AJS.Meta && AJS.Meta.get && AJS.Meta.get('remote-user')) {
            registerCommentableElements();
        }
    }
    
    /**
     * Add comment indicators to show comment counts on different elements
     */
    function addCommentIndicators() {
        $('.openapi-spec-container .endpoint').each(function() {
            var endpointId = $(this).attr('id');
            var commentCount = getCommentCount(endpointId);
            
            if (commentCount > 0) {
                $(this).addClass('has-comments');
                $(this).find('.endpoint-header').append('<span class="comment-indicator">' + commentCount + '</span>');
            }
        });
    }
    
    /**
     * Get comment count for a specific element
     * This is a placeholder - actual implementation would depend on Confluence's API
     */
    function getCommentCount(elementId) {
        // In a real implementation, we would query Confluence's comment API
        // This is a placeholder implementation
        return 0;
    }
    
    /**
     * Show comments for a specific element
     * This is a placeholder - actual implementation would depend on Confluence's API
     */
    function showCommentsFor(elementId) {
        // In a real implementation, we would use Confluence's comment UI
        if (window.AJS && window.AJS.Confluence && window.AJS.Confluence.CommentDisplayManager) {
            // Example of how this might work with Confluence's API
            window.AJS.Confluence.CommentDisplayManager.showComments(elementId);
        }
    }
    
    /**
     * Register elements as commentable with Confluence
     * This allows commenting on specific parts of the API documentation
     */
    function registerCommentableElements() {
        // Make endpoints commentable
        $('.openapi-spec-container .endpoint').each(function() {
            makeElementCommentable($(this).attr('id'));
        });
        
        // Make parameters commentable
        $('.openapi-spec-container .parameters-table tr[id]').each(function() {
            makeElementCommentable($(this).attr('id'));
        });
        
        // Make response bodies commentable
        $('.openapi-spec-container .response').each(function() {
            makeElementCommentable($(this).attr('id'));
        });
        
        // Make schema properties commentable
        $('.openapi-spec-container .schema-table tr[id]').each(function() {
            makeElementCommentable($(this).attr('id'));
        });
    }
    
    /**
     * Make an element commentable in Confluence
     * This is a placeholder - actual implementation would depend on Confluence's API
     */
    function makeElementCommentable(elementId) {
        if (elementId && window.AJS && window.AJS.Confluence && window.AJS.Confluence.CommentDisplayManager) {
            // Example of how this might work with Confluence's API
            try {
                window.AJS.Confluence.CommentDisplayManager.registerCommentTarget(elementId);
            } catch (e) {
                console.error('Error registering comment target: ' + e.message);
            }
        }
    }
    
    // Initialize the plugin
    initialize();
});