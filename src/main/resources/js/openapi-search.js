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
                    '<input type="text" class="api-search-field" placeholder="Search or use operators like method:get path:/users..." title="Press Ctrl+F (or Cmd+F) to focus, Esc to clear search">' +
                    '<button class="api-search-clear" title="Clear search">×</button>' +
                    '<span class="search-tips" title="Click for search help">?</span>' +
                    '</div>' +
                    '<div class="filter-container">' +
                    '<label><input type="checkbox" class="filter-get" checked> GET</label>' +
                    '<label><input type="checkbox" class="filter-post" checked> POST</label>' +
                    '<label><input type="checkbox" class="filter-put" checked> PUT</label>' +
                    '<label><input type="checkbox" class="filter-delete" checked> DELETE</label>' +
                    '<label><input type="checkbox" class="filter-patch" checked> PATCH</label>' +
                    '<label><input type="checkbox" class="filter-options" checked> OPTIONS</label>' +
                    '<label><input type="checkbox" class="filter-head" checked> HEAD</label>' +
                    '<select class="filter-tags" title="Filter by tags">' +
                    '<option value="">All Tags</option>' +
                    '</select>' +
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
                
                // Add a help tooltip for keyboard shortcuts and search operators
                if (typeof AJS !== 'undefined' && AJS.tipsy) {
                    searchToolbar.find('.search-tips').tipsy({
                        gravity: 's',
                        html: true,
                        title: function() {
                            return '<div class="search-shortcuts-help">' +
                                '<p><strong>Keyboard Shortcuts:</strong></p>' +
                                '<ul>' +
                                '<li><strong>Ctrl+F</strong> or <strong>Cmd+F</strong>: Focus search</li>' +
                                '<li><strong>Escape</strong>: Clear search</li>' +
                                '</ul>' +
                                '<p><strong>Advanced Search Operators:</strong></p>' +
                                '<ul>' +
                                '<li><strong>method:</strong>get|post|put|delete|patch</li>' +
                                '<li><strong>path:</strong>/some/endpoint</li>' +
                                '<li><strong>param:</strong>parameter_name</li>' +
                                '<li><strong>type:</strong>string|integer|array|object</li>' +
                                '<li><strong>status:</strong>200|404|500</li>' +
                                '<li><strong>deprecated:</strong>true|false</li>' +
                                '<li><strong>required:</strong>true|false</li>' +
                                '<li><strong>tag:</strong>tag_name</li>' +
                                '<li><strong>format:</strong>uuid|date-time|email|etc</li>' +
                                '<li><strong>summary:</strong>search in summary text</li>' +
                                '</ul>' +
                                '<p><em>Example: <code>method:get path:/users</code></em></p>' +
                                '</div>';
                        }
                    });
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
            
            // Tag filter
            $(document).on('change', '.filter-tags', function() {
                var container = $(this).closest('.openapi-spec-container');
                var selectedTag = $(this).val();
                ApiSearch.applyTagFilter(container, selectedTag);
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
            
            // Add keyboard shortcuts
            $(document).on('keydown', function(e) {
                // Focus search field on Ctrl+F or Command+F
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
                    // Check if we're in an OpenAPI documentation container
                    var $container = $('.openapi-spec-container:visible');
                    if ($container.length > 0) {
                        e.preventDefault(); // Prevent browser's default search
                        var $searchField = $container.find('.api-search-field:first');
                        if ($searchField.length > 0) {
                            $searchField.focus();
                            $searchField.select(); // Select all text in the field if any
                        }
                    }
                }
                
                // Clear search on Escape
                if (e.keyCode === 27) {
                    var $searchField = $('.api-search-field:focus');
                    if ($searchField.length > 0) {
                        var $container = $searchField.closest('.openapi-spec-container');
                        $searchField.val('');
                        ApiSearch.performSearch($container, '');
                        $searchField.blur(); // Remove focus
                    }
                }
            });
        },
        
        /**
         * Index the content for faster searching
         */
        indexContent: function() {
            $('.openapi-spec-container').each(function() {
                var container = $(this);
                var endpoints = container.find('.endpoint');
                var allTags = new Set();
                
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
                    
                    // Collect tags for the tag filter dropdown
                    var tags = endpoint.data('tags');
                    if (tags) {
                        tags.split(',').forEach(function(tag) {
                            allTags.add(tag.trim());
                        });
                    }
                });
                
                // Populate the tag filter dropdown if we have tags
                if (allTags.size > 0) {
                    var tagDropdown = container.find('.filter-tags');
                    var tagArray = Array.from(allTags).sort();
                    
                    tagArray.forEach(function(tag) {
                        tagDropdown.append('<option value="' + tag + '">' + tag + '</option>');
                    });
                    
                    // Show the tag filter
                    container.find('.filter-tags').closest('select').show();
                }
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
            
            // Check for advanced search operators
            var advancedSearch = this.parseAdvancedQuery(query);
            var useAdvancedSearch = advancedSearch.hasOperators;
            
            // Convert query to lowercase for case-insensitive matching if not using advanced search
            if (!useAdvancedSearch) {
                query = query.toLowerCase();
            }
            
            // Filter endpoints by search query
            endpoints.each(function() {
                var endpoint = $(this);
                var match = false;
                
                if (useAdvancedSearch) {
                    // Use advanced search logic
                    match = ApiSearch.matchAdvancedSearch(endpoint, advancedSearch);
                } else {
                    // Use simple text search
                    var searchText = endpoint.data('searchText');
                    match = searchText.indexOf(query) !== -1;
                }
                
                if (match) {
                    endpoint.removeClass('search-hidden');
                    endpoint.addClass('expanded').removeClass('collapsed');
                    endpoint.find('.endpoint-details').show();
                    
                    // Highlight search terms (for non-operator part if advanced search)
                    if (useAdvancedSearch && advancedSearch.freeText) {
                        ApiSearch.highlightSearchTerms(endpoint, advancedSearch.freeText);
                    } else if (!useAdvancedSearch) {
                        ApiSearch.highlightSearchTerms(endpoint, query);
                    }
                    
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
         * Parse an advanced search query with operators
         * Supports operators like method:get, path:/users, etc.
         */
        parseAdvancedQuery: function(query) {
            var result = {
                hasOperators: false,
                freeText: '',
                operators: {}
            };
            
            // Define supported operators
            var supportedOperators = [
                'method', 'path', 'param', 'type', 'response', 'deprecated',
                'status', 'code', 'tag', 'tags', 'required', 'summary', 'format'
            ];
            
            // Look for operator:value patterns
            var parts = query.split(/\s+/);
            var freeTextParts = [];
            
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                var match = part.match(/^([a-z]+):(.+)$/i);
                
                if (match && supportedOperators.indexOf(match[1].toLowerCase()) !== -1) {
                    // This is an operator
                    var operator = match[1].toLowerCase();
                    var value = match[2].toLowerCase();
                    
                    // Handle special values
                    if (value === 'true' || value === 'yes') {
                        value = true;
                    } else if (value === 'false' || value === 'no') {
                        value = false;
                    }
                    
                    result.operators[operator] = value;
                    result.hasOperators = true;
                } else {
                    // This is free text
                    freeTextParts.push(part);
                }
            }
            
            result.freeText = freeTextParts.join(' ').toLowerCase();
            
            return result;
        },
        
        /**
         * Match an endpoint against advanced search criteria
         */
        matchAdvancedSearch: function(endpoint, search) {
            var operators = search.operators;
            var freeText = search.freeText;
            
            // First check free text if exists
            if (freeText && endpoint.data('searchText').indexOf(freeText) === -1) {
                return false;
            }
            
            // Check each operator
            for (var op in operators) {
                var value = operators[op];
                var match = false;
                
                switch (op) {
                    case 'method':
                        // Match HTTP method
                        match = endpoint.data('method') === value;
                        break;
                        
                    case 'path':
                        // Match path
                        var path = endpoint.find('.endpoint-path').text().toLowerCase();
                        match = path.indexOf(value) !== -1;
                        break;
                        
                    case 'param':
                    case 'parameter':
                        // Match parameter name
                        match = endpoint.find('.parameters-table td:first-child').text().toLowerCase().indexOf(value) !== -1;
                        break;
                        
                    case 'type':
                        // Match parameter or response type
                        match = endpoint.find('td:nth-child(2), td:nth-child(3)').text().toLowerCase().indexOf(value) !== -1;
                        break;
                        
                    case 'response':
                    case 'status':
                    case 'code':
                        // Match response status code
                        match = endpoint.find('.status-code').text().toLowerCase().indexOf(value) !== -1;
                        break;
                        
                    case 'deprecated':
                        // Match deprecated status
                        var isDeprecated = endpoint.data('deprecated');
                        match = (value === true && isDeprecated) || (value === false && !isDeprecated);
                        break;
                        
                    case 'required':
                        // Match required parameters
                        if (value === true) {
                            match = endpoint.find('td:nth-child(4)').text().toLowerCase().indexOf('yes') !== -1;
                        } else {
                            match = endpoint.find('td:nth-child(4)').text().toLowerCase().indexOf('no') !== -1;
                        }
                        break;
                        
                    case 'tag':
                    case 'tags':
                        // Match against API tags
                        var tags = endpoint.data('tags');
                        if (tags) {
                            match = tags.toLowerCase().indexOf(value) !== -1;
                        }
                        break;
                        
                    case 'summary':
                        // Match against endpoint summary
                        var summary = endpoint.data('summary');
                        if (summary) {
                            match = summary.toLowerCase().indexOf(value) !== -1;
                        }
                        break;
                        
                    case 'format':
                        // Match parameter format
                        match = endpoint.find('[data-format]').filter(function() {
                            return $(this).data('format').toLowerCase().indexOf(value) !== -1;
                        }).length > 0;
                        break;
                }
                
                if (!match) {
                    return false;
                }
            }
            
            return true;
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
        },
        
        /**
         * Apply tag filter
         */
        applyTagFilter: function(container, selectedTag) {
            var endpoints = container.find('.endpoint:not(.search-hidden):not(.method-hidden):not(.deprecated-hidden)');
            
            if (selectedTag) {
                endpoints.each(function() {
                    var endpoint = $(this);
                    var tags = endpoint.data('tags');
                    
                    if (tags && tags.indexOf(selectedTag) !== -1) {
                        endpoint.removeClass('tag-hidden');
                    } else {
                        endpoint.addClass('tag-hidden');
                    }
                });
            } else {
                // No tag selected, show all
                endpoints.removeClass('tag-hidden');
            }
        }
    };
    
    // Initialize when the document is ready
    $(document).ready(function() {
        ApiSearch.initialize();
    });
    
    // Export to global scope for testing
    window.ApiSearch = ApiSearch;
    
})(AJS.$ || jQuery);