/**
 * OpenAPI Documentation Version Comparison
 * Provides functionality for managing and comparing different versions of API specifications
 */
(function($) {
    'use strict';

    /**
     * Namespace for version comparison functionality
     */
    var ApiVersions = {
        
        /**
         * Initialize the version comparison system
         */
        initialize: function() {
            console.log('Initializing API version comparison system');
            this.setupEventHandlers();
            this.loadVersionHistory();
        },
        
        /**
         * Set up event handlers for the version system
         */
        setupEventHandlers: function() {
            // Save new version button
            $(document).on('click', '.save-api-version', function(e) {
                e.preventDefault();
                ApiVersions.saveCurrentVersion();
            });
            
            // Show version history button
            $(document).on('click', '.show-api-versions', function(e) {
                e.preventDefault();
                ApiVersions.showVersionHistory();
            });
            
            // Compare versions button
            $(document).on('click', '.compare-api-versions', function(e) {
                e.preventDefault();
                var version1Id = $('.version1-select').val();
                var version2Id = $('.version2-select').val();
                if (version1Id && version2Id) {
                    ApiVersions.compareVersions(version1Id, version2Id);
                } else {
                    alert('Please select two versions to compare');
                }
            });
            
            // Set active version button
            $(document).on('click', '.set-active-version', function(e) {
                e.preventDefault();
                var versionId = $(this).data('version-id');
                ApiVersions.setActiveVersion(versionId);
            });
            
            // Delete version button
            $(document).on('click', '.delete-api-version', function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
                    var versionId = $(this).data('version-id');
                    ApiVersions.deleteVersion(versionId);
                }
            });
            
            // Close version history modal
            $(document).on('click', '.close-version-history', function(e) {
                e.preventDefault();
                ApiVersions.closeVersionHistory();
            });
        },
        
        /**
         * Get the current page ID
         */
        getPageId: function() {
            // In Confluence, we can get the page ID from the URL or meta tag
            var pageId = $('meta[name="ajs-page-id"]').attr('content');
            if (!pageId) {
                var match = window.location.pathname.match(/\/pages\/viewpage\.action\?pageId=(\d+)/);
                if (match) {
                    pageId = match[1];
                }
            }
            return pageId;
        },
        
        /**
         * Load the version history for the current page
         */
        loadVersionHistory: function() {
            var pageId = this.getPageId();
            if (!pageId) {
                console.error('Could not determine page ID');
                return;
            }
            
            $.ajax({
                url: AJS.contextPath() + '/rest/versions/1.0/page/' + pageId,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    ApiVersions.versions = data;
                    ApiVersions.updateVersionBadge(data.length);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading version history:', error);
                }
            });
        },
        
        /**
         * Update the version badge count
         */
        updateVersionBadge: function(count) {
            var badge = $('.api-version-badge');
            if (badge.length === 0) {
                // If badge doesn't exist, create it
                $('.openapi-spec-container').each(function() {
                    var container = $(this);
                    container.append('<div class="api-version-controls">' +
                        '<button class="save-api-version aui-button">Save Version</button>' +
                        '<button class="show-api-versions aui-button">Versions <span class="api-version-badge">' + count + '</span></button>' +
                        '</div>');
                });
            } else {
                badge.text(count);
            }
        },
        
        /**
         * Save the current version of the API specification
         */
        saveCurrentVersion: function() {
            var pageId = this.getPageId();
            if (!pageId) {
                alert('Could not determine page ID');
                return;
            }
            
            // Show the save dialog
            var dialog = this.createVersionDialog('Save New Version', 
                '<form id="save-version-form">' +
                '<div class="field-group">' +
                '<label for="version-number">Version Number</label>' +
                '<input class="text" type="text" id="version-number" name="version" />' +
                '</div>' +
                '<div class="field-group">' +
                '<label for="version-comment">Comment</label>' +
                '<textarea class="textarea" id="version-comment" name="comment"></textarea>' +
                '</div>' +
                '<div class="buttons-container">' +
                '<button class="aui-button aui-button-primary submit-version">Save</button>' +
                '<button class="aui-button cancel-version">Cancel</button>' +
                '</div>' +
                '</form>');
            
            // Handle save button click
            dialog.find('.submit-version').on('click', function(e) {
                e.preventDefault();
                
                var version = dialog.find('#version-number').val();
                var comment = dialog.find('#version-comment').val();
                
                if (!version) {
                    alert('Please enter a version number');
                    return;
                }
                
                // Get the current spec content
                var specContainer = $('.openapi-spec-container');
                var specHtml = specContainer.html();
                var title = $('h2.api-title').text() || 'API Documentation';
                
                $.ajax({
                    url: AJS.contextPath() + '/rest/versions/1.0',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        pageId: pageId,
                        title: title,
                        content: specHtml,
                        version: version,
                        author: AJS.params.remoteUser,
                        comment: comment
                    }),
                    success: function(data) {
                        dialog.remove();
                        ApiVersions.loadVersionHistory();
                        alert('Version saved successfully');
                    },
                    error: function(xhr, status, error) {
                        console.error('Error saving version:', error);
                        alert('Error saving version: ' + error);
                    }
                });
            });
            
            // Handle cancel button click
            dialog.find('.cancel-version').on('click', function(e) {
                e.preventDefault();
                dialog.remove();
            });
        },
        
        /**
         * Show the version history dialog
         */
        showVersionHistory: function() {
            var pageId = this.getPageId();
            if (!pageId) {
                alert('Could not determine page ID');
                return;
            }
            
            $.ajax({
                url: AJS.contextPath() + '/rest/versions/1.0/page/' + pageId,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    var versionsHtml = '<div class="version-list-container">' +
                        '<table class="aui">' +
                        '<thead>' +
                        '<tr>' +
                        '<th>Version</th>' +
                        '<th>Created</th>' +
                        '<th>Author</th>' +
                        '<th>Comment</th>' +
                        '<th>Actions</th>' +
                        '</tr>' +
                        '</thead>' +
                        '<tbody>';
                    
                    if (data && data.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            var version = data[i];
                            var date = new Date(version.createdDate);
                            var dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                            
                            versionsHtml += '<tr>' +
                                '<td>' + version.version + '</td>' +
                                '<td>' + dateStr + '</td>' +
                                '<td>' + version.author + '</td>' +
                                '<td>' + (version.comment || '') + '</td>' +
                                '<td>' +
                                '<button class="aui-button aui-button-subtle set-active-version" data-version-id="' + version.id + '">Set Active</button> ' +
                                '<button class="aui-button aui-button-subtle delete-api-version" data-version-id="' + version.id + '">Delete</button>' +
                                '</td>' +
                                '</tr>';
                        }
                    } else {
                        versionsHtml += '<tr><td colspan="5">No versions found</td></tr>';
                    }
                    
                    versionsHtml += '</tbody></table></div>';
                    
                    // Add comparison controls
                    if (data && data.length > 1) {
                        versionsHtml += '<div class="version-compare-container">' +
                            '<h4>Compare Versions</h4>' +
                            '<div class="field-group">' +
                            '<label for="version1-select">Version 1</label>' +
                            '<select id="version1-select" class="version1-select">';
                        
                        for (var i = 0; i < data.length; i++) {
                            versionsHtml += '<option value="' + data[i].id + '">' + data[i].version + '</option>';
                        }
                        
                        versionsHtml += '</select></div>' +
                            '<div class="field-group">' +
                            '<label for="version2-select">Version 2</label>' +
                            '<select id="version2-select" class="version2-select">';
                        
                        for (var i = 0; i < data.length; i++) {
                            versionsHtml += '<option value="' + data[i].id + '"' + (i === 1 ? ' selected' : '') + '>' + data[i].version + '</option>';
                        }
                        
                        versionsHtml += '</select></div>' +
                            '<div class="buttons-container">' +
                            '<button class="aui-button aui-button-primary compare-api-versions">Compare</button>' +
                            '</div></div>';
                    }
                    
                    var dialog = ApiVersions.createVersionDialog('Version History', versionsHtml);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading version history:', error);
                    alert('Error loading version history: ' + error);
                }
            });
        },
        
        /**
         * Compare two versions of the API specification
         */
        compareVersions: function(version1Id, version2Id) {
            $.ajax({
                url: AJS.contextPath() + '/rest/versions/1.0/compare/' + version1Id + '/' + version2Id,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    var version1 = data.version1;
                    var version2 = data.version2;
                    
                    // Create a diff view
                    var diffHtml = '<div class="version-diff">' +
                        '<h3>Comparing version ' + version1.version + ' with version ' + version2.version + '</h3>' +
                        '<div class="diff-container">' +
                        '<div class="diff-header">' +
                        '<div class="diff-old">Version ' + version1.version + ' (' + new Date(version1.createdDate).toLocaleDateString() + ')</div>' +
                        '<div class="diff-new">Version ' + version2.version + ' (' + new Date(version2.createdDate).toLocaleDateString() + ')</div>' +
                        '</div>' +
                        '<div class="diff-content">' +
                        '<iframe id="diff-frame-1" class="diff-frame"></iframe>' +
                        '<iframe id="diff-frame-2" class="diff-frame"></iframe>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    
                    var dialog = ApiVersions.createVersionDialog('Version Comparison', diffHtml, true);
                    
                    // Set the content of the iframes
                    var iframe1 = document.getElementById('diff-frame-1');
                    var iframe2 = document.getElementById('diff-frame-2');
                    
                    iframe1.onload = function() {
                        var doc = iframe1.contentDocument || iframe1.contentWindow.document;
                        doc.open();
                        doc.write('<html><head><link rel="stylesheet" href="' + AJS.contextPath() + '/download/resources/com.example.confluence.openapi-documentation:openapi-documentation-resources/openapi-documentation.css"></head><body>' + version1.content + '</body></html>');
                        doc.close();
                    };
                    
                    iframe2.onload = function() {
                        var doc = iframe2.contentDocument || iframe2.contentWindow.document;
                        doc.open();
                        doc.write('<html><head><link rel="stylesheet" href="' + AJS.contextPath() + '/download/resources/com.example.confluence.openapi-documentation:openapi-documentation-resources/openapi-documentation.css"></head><body>' + version2.content + '</body></html>');
                        doc.close();
                    };
                    
                    iframe1.src = 'about:blank';
                    iframe2.src = 'about:blank';
                },
                error: function(xhr, status, error) {
                    console.error('Error comparing versions:', error);
                    alert('Error comparing versions: ' + error);
                }
            });
        },
        
        /**
         * Set a version as the active version
         */
        setActiveVersion: function(versionId) {
            $.ajax({
                url: AJS.contextPath() + '/rest/versions/1.0/' + versionId + '/activate',
                type: 'PUT',
                success: function(data) {
                    // Reload the page to show the active version
                    window.location.reload();
                },
                error: function(xhr, status, error) {
                    console.error('Error setting active version:', error);
                    alert('Error setting active version: ' + error);
                }
            });
        },
        
        /**
         * Delete a version
         */
        deleteVersion: function(versionId) {
            $.ajax({
                url: AJS.contextPath() + '/rest/versions/1.0/' + versionId,
                type: 'DELETE',
                success: function(data) {
                    ApiVersions.loadVersionHistory();
                    ApiVersions.showVersionHistory();
                },
                error: function(xhr, status, error) {
                    console.error('Error deleting version:', error);
                    alert('Error deleting version: ' + error);
                }
            });
        },
        
        /**
         * Create a dialog for version management
         */
        createVersionDialog: function(title, content, wide) {
            // Close any existing dialogs
            $('.version-dialog').remove();
            
            var dialogWidth = wide ? '80%' : '50%';
            
            var dialog = $('<div class="version-dialog">' +
                '<div class="version-dialog-header">' +
                '<h2>' + title + '</h2>' +
                '<button class="close-version-history">×</button>' +
                '</div>' +
                '<div class="version-dialog-content">' + content + '</div>' +
                '</div>');
            
            dialog.css({
                'position': 'fixed',
                'top': '50%',
                'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'width': dialogWidth,
                'max-height': '80%',
                'overflow-y': 'auto',
                'background': '#fff',
                'border-radius': '4px',
                'box-shadow': '0 0 10px rgba(0, 0, 0, 0.5)',
                'z-index': '10000'
            });
            
            dialog.find('.version-dialog-header').css({
                'padding': '10px',
                'border-bottom': '1px solid #ccc',
                'display': 'flex',
                'justify-content': 'space-between',
                'align-items': 'center'
            });
            
            dialog.find('.version-dialog-content').css({
                'padding': '10px'
            });
            
            dialog.find('.close-version-history').css({
                'background': 'none',
                'border': 'none',
                'font-size': '24px',
                'cursor': 'pointer'
            });
            
            // Add styles for the diff view
            if (wide) {
                $('<style>')
                    .text('.diff-container { display: flex; flex-direction: column; } ' +
                          '.diff-header { display: flex; justify-content: space-between; padding: 10px 0; } ' +
                          '.diff-content { display: flex; height: 600px; } ' +
                          '.diff-frame { flex: 1; border: 1px solid #ccc; margin: 0 5px; }')
                    .appendTo(dialog);
            }
            
            // Add overlay
            var overlay = $('<div class="version-dialog-overlay"></div>').css({
                'position': 'fixed',
                'top': 0,
                'left': 0,
                'right': 0,
                'bottom': 0,
                'background': 'rgba(0, 0, 0, 0.5)',
                'z-index': '9999'
            });
            
            // Add to document
            $('body').append(overlay).append(dialog);
            
            // Handle overlay click
            overlay.on('click', function() {
                ApiVersions.closeVersionHistory();
            });
            
            return dialog;
        },
        
        /**
         * Close the version history dialog
         */
        closeVersionHistory: function() {
            $('.version-dialog-overlay, .version-dialog').remove();
        }
    };
    
    // Initialize when the document is ready
    $(document).ready(function() {
        ApiVersions.initialize();
    });
    
    // Export to global scope for testing
    window.ApiVersions = ApiVersions;
    
})(AJS.$ || jQuery);