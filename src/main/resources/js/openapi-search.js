/**
 * OpenAPI Documentation Search and Filtering
 * Provides interactive filtering and searching within API specifications
 */
(function($) {
    'use strict';

    /**
     * Namespace for search and filtering functionality
     */
    var ApiSearch = {
        
        /**
         * Initialize the search and filtering system
         */
        initialize: function() {
            console.log('Initializing API search and filtering system');
            this.createSearchUI();
            this.setupEventHandlers();
            this.indexContent();
        },
        
        /**
         * Create the search UI components
         */
        createSearchUI: function() {
            $('.openapi-spec-container').each(function() {
                var container = $(this);
                
                // Create search toolbar
                var searchToolbar = $('<div class="api-search-toolbar">' +
                    '<div class="search-field-container">' +
                    '<input type="text" class="api-search-field" placeholder="Search endpoints, parameters, descriptions...">' +
                    '<button class="api-search-clear">×</button>' +
                    '</div>' +
                    '<div class="filter-container">' +
                    '<label><input type="checkbox" class="filter-get" checked> GET</label>' +
                    '<label><input type="checkbox" class="filter-post" checked> POST</label>' +
                    '<label><input type="checkbox" class="filter-put" checked> PUT</label>' +
                    '<label><input type="checkbox" class="filter-delete" checked> DELETE</label>' +
                    '<label><input type="checkbox" class="filter-patch" checked> PATCH</label>' +
                    '<label><input type="checkbox" class="filter-options" checked> OPTIONS</label>' +
                    '<label><input type="checkbox" class="filter-head" checked> HEAD</label>' +
                    '</div>' +
                    '<div class="view-toggle">' +
                    '<button class="toggle-deprecated">Toggle Deprecated</button>' +
                    '<button class="expand-all">Expand All</button>' +
                    '<button class="collapse-all">Collapse All</button>' +
                    '</div>' +
                    '</div>');
                
                // Add search metadata display
                var searchMeta = $('<div class="api-search-meta">' +
                    '<span class="api-search-count"></span>' +
                    '<span class="api-search-message"></span>' +
                    '</div>');
                
                // Insert the search UI at the top of the container
                container.prepend(searchMeta);
                container.prepend(searchToolbar);
                
                // Make endpoints collapsible if they aren't already
                if (!container.hasClass('collapsible-initialized')) {
                    ApiSearch.makeEndpointsCollapsible(container);
                    container.addClass('collapsible-initialized');
                }
            });
        },
        
        /**
         * Make endpoints collapsible
         */
        makeEndpointsCollapsible: function(container) {
            var endpoints = container.find('.endpoint');
            
            endpoints.each(function() {
                var endpoint = $(this);
                var header = endpoint.find('.endpoint-header');
                var details = endpoint.find('.endpoint-details');
                
                // Add a toggle button to the header
                header.append('<span class="endpoint-toggle"></span>');
                
                // Set initial state (expanded)
                endpoint.addClass('expanded');
                
                // Make the header clickable
                header.on('click', function(e) {
                    // Don't toggle if they clicked on a link inside the header
                    if ($(e.target).is('a') || $(e.target).parents('a').length > 0) {
                        return;
                    }
                    
                    if (endpoint.hasClass('expanded')) {
                        endpoint.removeClass('expanded').addClass('collapsed');
                        details.slideUp(200);
                    } else {
                        endpoint.removeClass('collapsed').addClass('expanded');
                        details.slideDown(200);
                    }
                });
            });
        },
        
        /**
         * Set up event handlers for the search system
         */
        setupEventHandlers: function() {
            // Search field input
            $(document).on('input', '.api-search-field', function() {
                var query = $(this).val().trim();
                var container = $(this).closest('.openapi-spec-container');
                ApiSearch.performSearch(container, query);
            });
            
            // Clear search button
            $(document).on('click', '.api-search-clear', function() {
                var container = $(this).closest('.openapi-spec-container');
                container.find('.api-search-field').val('');
                ApiSearch.performSearch(container, '');
            });
            
            // HTTP method filters
            $(document).on('change', '.filter-get, .filter-post, .filter-put, .filter-delete, .filter-patch, .filter-options, .filter-head', function() {
                var container = $(this).closest('.openapi-spec-container');
                ApiSearch.applyMethodFilters(container);
            });
            
            // Toggle deprecated endpoints
            $(document).on('click', '.toggle-deprecated', function() {
                var container = $(this).closest('.openapi-spec-container');
                container.toggleClass('hide-deprecated');
                ApiSearch.applyDeprecatedFilter(container);
            });
            
            // Expand all endpoints
            $(document).on('click', '.expand-all', function() {
                var container = $(this).closest('.openapi-spec-container');
                ApiSearch.expandAllEndpoints(container);
            });
            
            // Collapse all endpoints
            $(document).on('click', '.collapse-all', function() {
                var container = $(this).closest('.openapi-spec-container');
                ApiSearch.collapseAllEndpoints(container);
            });
        },
        
        /**
         * Index the content for faster searching
         */
        indexContent: function() {
            $('.openapi-spec-container').each(function() {
                var container = $(this);
                var endpoints = container.find('.endpoint');
                
                endpoints.each(function() {
                    var endpoint = $(this);
                    var headerText = endpoint.find('.endpoint-header').text().toLowerCase();
                    var detailsText = endpoint.find('.endpoint-details').text().toLowerCase();
                    var searchText = headerText + ' ' + detailsText;
                    
                    // Store the search text as data on the endpoint element
                    endpoint.data('searchText', searchText);
                    
                    // Store the HTTP method
                    var methodMatch = endpoint.find('.http-method').text().trim().toLowerCase();
                    endpoint.data('method', methodMatch);
                    
                    // Check if deprecated
                    var isDeprecated = endpoint.find('.deprecated-badge').length > 0;
                    endpoint.data('deprecated', isDeprecated);
                    if (isDeprecated) {
                        endpoint.addClass('deprecated-endpoint');
                    }
                });
            });
        },
        
        /**
         * Perform search on the API documentation
         */
        performSearch: function(container, query) {
            var endpoints = container.find('.endpoint');
            var visibleCount = 0;
            
            if (query === '') {
                // Clear search, show all endpoints (respecting method filters)
                endpoints.removeClass('search-hidden');
                container.find('.api-search-message').text('');
                container.find('.api-search-meta').hide();
                
                // Re-apply method filters
                this.applyMethodFilters(container);
                return;
            }
            
            // Convert query to lowercase for case-insensitive matching
            query = query.toLowerCase();
            
            // Filter endpoints by search query
            endpoints.each(function() {
                var endpoint = $(this);
                var searchText = endpoint.data('searchText');
                
                if (searchText.indexOf(query) !== -1) {
                    endpoint.removeClass('search-hidden');
                    endpoint.addClass('expanded').removeClass('collapsed');
                    endpoint.find('.endpoint-details').show();
                    
                    // Highlight search terms
                    ApiSearch.highlightSearchTerms(endpoint, query);
                    
                    visibleCount++;
                } else {
                    endpoint.addClass('search-hidden');
                }
            });
            
            // Update search metadata
            container.find('.api-search-count').text(visibleCount + ' of ' + endpoints.length + ' endpoints match');
            container.find('.api-search-message').text(visibleCount > 0 ? 
                'Showing search results for "' + query + '"' : 
                'No endpoints found matching "' + query + '"');
            container.find('.api-search-meta').show();
            
            // Re-apply method filters
            this.applyMethodFilters(container);
        },
        
        /**
         * Highlight search terms in the endpoint content
         */
        highlightSearchTerms: function(endpoint, query) {
            // Remove any existing highlights
            endpoint.find('.search-highlight').each(function() {
                var element = $(this);
                element.replaceWith(element.text());
            });
            
            // Don't highlight for very short queries
            if (query.length < 3) {
                return;
            }
            
            // Function to highlight text in an element
            var highlightInElement = function(element) {
                var html = element.html();
                
                // Skip if this is a complex element with children
                if (element.children().length > 0) {
                    element.children().each(function() {
                        highlightInElement($(this));
                    });
                    return;
                }
                
                var text = element.text();
                var lcText = text.toLowerCase();
                var index = lcText.indexOf(query);
                
                if (index >= 0) {
                    var before = text.substring(0, index);
                    var match = text.substring(index, index + query.length);
                    var after = text.substring(index + query.length);
                    
                    var newHtml = before + '<span class="search-highlight">' + match + '</span>' + after;
                    element.html(newHtml);
                }
            };
            
            // Apply highlighting to text elements
            endpoint.find('.endpoint-path, .operation-id, .summary, .description, td').each(function() {
                highlightInElement($(this));
            });
        },
        
        /**
         * Apply HTTP method filters
         */
        applyMethodFilters: function(container) {
            var endpoints = container.find('.endpoint:not(.search-hidden)');
            var methods = {
                'get': container.find('.filter-get').is(':checked'),
                'post': container.find('.filter-post').is(':checked'),
                'put': container.find('.filter-put').is(':checked'),
                'delete': container.find('.filter-delete').is(':checked'),
                'patch': container.find('.filter-patch').is(':checked'),
                'options': container.find('.filter-options').is(':checked'),
                'head': container.find('.filter-head').is(':checked')
            };
            
            endpoints.each(function() {
                var endpoint = $(this);
                var method = endpoint.data('method');
                
                if (methods[method]) {
                    endpoint.removeClass('method-hidden');
                } else {
                    endpoint.addClass('method-hidden');
                }
            });
            
            // Also apply deprecated filter if active
            if (container.hasClass('hide-deprecated')) {
                this.applyDeprecatedFilter(container);
            }
        },
        
        /**
         * Apply deprecated endpoints filter
         */
        applyDeprecatedFilter: function(container) {
            var endpoints = container.find('.endpoint:not(.search-hidden):not(.method-hidden)');
            
            if (container.hasClass('hide-deprecated')) {
                endpoints.each(function() {
                    var endpoint = $(this);
                    if (endpoint.data('deprecated')) {
                        endpoint.addClass('deprecated-hidden');
                    } else {
                        endpoint.removeClass('deprecated-hidden');
                    }
                });
            } else {
                endpoints.removeClass('deprecated-hidden');
            }
        },
        
        /**
         * Expand all endpoints
         */
        expandAllEndpoints: function(container) {
            var endpoints = container.find('.endpoint:not(.search-hidden):not(.method-hidden):not(.deprecated-hidden)');
            
            endpoints.each(function() {
                var endpoint = $(this);
                endpoint.removeClass('collapsed').addClass('expanded');
                endpoint.find('.endpoint-details').slideDown(200);
            });
        },
        
        /**
         * Collapse all endpoints
         */
        collapseAllEndpoints: function(container) {
            var endpoints = container.find('.endpoint:not(.search-hidden):not(.method-hidden):not(.deprecated-hidden)');
            
            endpoints.each(function() {
                var endpoint = $(this);
                endpoint.removeClass('expanded').addClass('collapsed');
                endpoint.find('.endpoint-details').slideUp(200);
            });
        }
    };
    
    // Initialize when the document is ready
    $(document).ready(function() {
        ApiSearch.initialize();
    });
    
    // Export to global scope for testing
    window.ApiSearch = ApiSearch;
    
})(AJS.$ || jQuery);