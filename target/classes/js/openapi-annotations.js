/**
 * OpenAPI Documentation Annotation System
 * Provides collaborative annotation and team commenting functionality for OpenAPI documentation
 */
AJS.toInit(function($) {
    'use strict';
    
    // Configuration
    const config = {
        selectors: {
            container: '.openapi-spec-container',
            endpoint: '.endpoint',
            parameter: '.parameters-table tr[id]',
            response: '.response',
            property: '.schema-table tr[id]',
            commentable: '.commentable-section',
            commentIndicator: '.comment-indicator',
            commentHighlight: '.comment-highlight',
            commentPanel: '.comments-panel',
            commentForm: '.comment-form',
            commentList: '.comment-list',
            commentItem: '.comment-item'
        },
        classes: {
            hasComments: 'has-comments',
            commentable: 'commentable-section',
            commentHighlight: 'comment-highlight',
            active: 'active',
            collapsed: 'collapsed'
        },
        urls: {
            getComments: AJS.contextPath() + '/rest/comments/1.0/page/',
            addComment: AJS.contextPath() + '/rest/comments/1.0/add',
            updateComment: AJS.contextPath() + '/rest/comments/1.0/',
            deleteComment: AJS.contextPath() + '/rest/comments/1.0/',
            addReply: AJS.contextPath() + '/rest/comments/1.0/'
        },
        templates: {
            commentIndicator: '<span class="comment-indicator" title="View comments">{{count}}</span>',
            commentPanel: `
                <div class="comments-panel">
                    <div class="comments-panel-header">
                        <h4>Comments on {{elementName}}</h4>
                        <button class="aui-button aui-button-link comments-panel-close">
                            <span class="aui-icon aui-icon-small aui-iconfont-close-dialog"></span>
                        </button>
                    </div>
                    <div class="comment-list">
                        {{commentItems}}
                    </div>
                    <div class="comment-form">
                        <div class="comment-form-avatar">
                            <img src="{{userAvatar}}" alt="{{userName}}">
                        </div>
                        <div class="comment-form-body">
                            <textarea class="textarea" placeholder="Add a comment..."></textarea>
                            <div class="comment-form-actions">
                                <button class="aui-button aui-button-primary submit-comment" data-element-id="{{elementId}}">Comment</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            commentItem: `
                <div class="comment-item" data-comment-id="{{commentId}}">
                    <div class="comment-item-avatar">
                        <img src="{{authorAvatar}}" alt="{{authorName}}">
                    </div>
                    <div class="comment-item-content">
                        <div class="comment-item-header">
                            <span class="comment-item-author">{{authorName}}</span>
                            <span class="comment-item-time">{{timeAgo}}</span>
                            {{deleteButton}}
                        </div>
                        <div class="comment-item-body">{{content}}</div>
                        <div class="comment-item-actions">
                            <button class="aui-button aui-button-link reply-comment">Reply</button>
                        </div>
                        <div class="comment-item-replies">
                            {{replies}}
                        </div>
                    </div>
                </div>
            `,
            deleteButton: `
                <button class="aui-button aui-button-link delete-comment" title="Delete this comment">
                    <span class="aui-icon aui-icon-small aui-iconfont-delete"></span>
                </button>
            `,
            noComments: '<div class="comment-empty-state">No comments yet. Be the first to add one!</div>'
        }
    };

    /**
     * Initialize the annotation system
     */
    function initialize() {
        const $container = $(config.selectors.container);
        if ($container.length === 0) return;
        
        makeElementsCommentable();
        loadExistingComments();
        setupEventHandlers();
    }
    
    /**
     * Make elements commentable by adding CSS classes and registering with Confluence when available
     */
    function makeElementsCommentable() {
        // Make endpoints commentable
        $(config.selectors.endpoint).each(function() {
            makeElementCommentable($(this));
        });
        
        // Make parameters commentable
        $(config.selectors.parameter).each(function() {
            makeElementCommentable($(this));
        });
        
        // Make responses commentable
        $(config.selectors.response).each(function() {
            makeElementCommentable($(this));
        });
        
        // Make schema properties commentable
        $(config.selectors.property).each(function() {
            makeElementCommentable($(this));
        });
    }
    
    /**
     * Make a specific element commentable
     * @param {JQuery} $element - The element to make commentable
     */
    function makeElementCommentable($element) {
        if (!$element.attr('id')) {
            $element.attr('id', 'openapi-element-' + generateUniqueId());
        }
        
        $element.addClass(config.classes.commentable);
        
        // Register with Confluence commenting system if available
        if (window.AJS && window.AJS.Confluence && window.AJS.Confluence.CommentDisplayManager) {
            try {
                window.AJS.Confluence.CommentDisplayManager.registerCommentTarget($element.attr('id'));
            } catch (e) {
                console.error('Error registering comment target: ' + e.message);
            }
        }
    }
    
    /**
     * Load existing comments for all commentable elements
     */
    function loadExistingComments() {
        const pageId = getPageId();
        if (!pageId) return;
        
        // Fetch all comments for this page
        $.ajax({
            url: config.urls.getComments + pageId,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                // Process the comments for each element
                for (let elementId in response) {
                    if (response.hasOwnProperty(elementId)) {
                        updateCommentIndicator(elementId, response[elementId].length);
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error loading comments: ' + textStatus + ' - ' + errorThrown);
                
                // Fallback to local storage for development
                $(config.selectors.commentable).each(function() {
                    const elementId = $(this).attr('id');
                    const comments = getStoredComments(pageId, elementId);
                    updateCommentIndicator(elementId, comments.length);
                });
            }
        });
    }
    
    /**
     * Load comments for a specific element
     * @param {string} elementId - The ID of the element to load comments for
     * @param {function} callback - Callback function to execute with the comments
     */
    function loadCommentsForElement(elementId, callback) {
        const pageId = getPageId();
        if (!pageId || !elementId) {
            callback([]);
            return;
        }
        
        // Fetch comments for this element from the server
        $.ajax({
            url: config.urls.getComments + pageId + '/element/' + elementId,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                callback(response);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error loading comments for element: ' + textStatus + ' - ' + errorThrown);
                
                // Fallback to local storage for development
                const comments = getStoredComments(pageId, elementId);
                callback(comments);
            }
        });
    }
    
    /**
     * Update the comment indicator for an element
     * @param {string} elementId - The ID of the element
     * @param {number} count - The number of comments
     */
    function updateCommentIndicator(elementId, count) {
        const $element = $('#' + elementId);
        
        // Remove existing indicators
        $element.find(config.selectors.commentIndicator).remove();
        
        // If there are comments, add the indicator and mark the element
        if (count > 0) {
            $element.addClass(config.classes.hasComments);
            
            const $indicator = $(
                config.templates.commentIndicator.replace('{{count}}', count)
            );
            
            if ($element.is(config.selectors.endpoint)) {
                $element.find('.endpoint-header').append($indicator);
            } else {
                $element.append($indicator);
            }
        } else {
            $element.removeClass(config.classes.hasComments);
        }
    }
    
    /**
     * Set up event handlers for the annotation system
     */
    function setupEventHandlers() {
        const $container = $(config.selectors.container);
        
        // Comment indicator click (view comments)
        $container.on('click', config.selectors.commentIndicator, function(e) {
            e.stopPropagation();
            const $element = $(this).closest(config.selectors.commentable);
            showCommentsPanel($element);
        });
        
        // Add click handler for commentable elements
        $container.on('click', config.selectors.commentable, function(e) {
            // Only handle direct clicks on the commentable element (not its children)
            if (e.target === this || $(e.target).closest(config.selectors.commentIndicator).length > 0) {
                showCommentsPanel($(this));
            }
        });
        
        // Close comments panel
        $('body').on('click', '.comments-panel-close', function() {
            closeCommentsPanel();
        });
        
        // Submit a new comment
        $('body').on('click', '.submit-comment', function() {
            const elementId = $(this).data('element-id');
            const content = $(this).closest(config.selectors.commentForm).find('textarea').val();
            
            if (content.trim() === '') return;
            
            addComment(elementId, content);
            
            // Clear the textarea
            $(this).closest(config.selectors.commentForm).find('textarea').val('');
        });
        
        // Delete a comment
        $('body').on('click', '.delete-comment', function() {
            const commentId = $(this).closest(config.selectors.commentItem).data('comment-id');
            
            // Confirm deletion
            if (confirm('Are you sure you want to delete this comment?')) {
                deleteComment(commentId);
            }
        });
        
        // Reply to a comment
        $('body').on('click', '.reply-comment', function() {
            const $commentItem = $(this).closest(config.selectors.commentItem);
            const commentId = $commentItem.data('comment-id');
            
            // Check if reply form already exists
            if ($commentItem.find('.reply-form').length === 0) {
                // Add a reply form
                const $replyForm = $(
                    '<div class="reply-form">' +
                    '<textarea class="textarea" placeholder="Write a reply..."></textarea>' +
                    '<div class="reply-form-actions">' +
                    '<button class="aui-button aui-button-primary submit-reply" data-parent-id="' + commentId + '">Reply</button>' +
                    '<button class="aui-button aui-button-link cancel-reply">Cancel</button>' +
                    '</div>' +
                    '</div>'
                );
                
                $commentItem.find('.comment-item-actions').after($replyForm);
                $replyForm.find('textarea').focus();
            }
        });
        
        // Cancel reply
        $('body').on('click', '.cancel-reply', function() {
            $(this).closest('.reply-form').remove();
        });
        
        // Submit reply
        $('body').on('click', '.submit-reply', function() {
            const parentId = $(this).data('parent-id');
            const content = $(this).closest('.reply-form').find('textarea').val();
            
            if (content.trim() === '') return;
            
            addReply(parentId, content);
            
            // Remove the reply form
            $(this).closest('.reply-form').remove();
        });
        
        // Close panel when clicking outside
        $(document).on('click', function(e) {
            if ($(e.target).closest(config.selectors.commentPanel).length === 0 && 
                $(e.target).closest(config.selectors.commentable).length === 0) {
                closeCommentsPanel();
            }
        });
    }
    
    /**
     * Show the comments panel for an element
     * @param {JQuery} $element - The element to show comments for
     */
    function showCommentsPanel($element) {
        // Close any open panels first
        closeCommentsPanel();
        
        const elementId = $element.attr('id');
        if (!elementId) return;
        
        // Load comments for this element
        loadCommentsForElement(elementId, function(comments) {
            // Create the comments panel
            const $panel = createCommentsPanel(elementId, $element.data('name') || getElementName($element), comments);
            
            // Position the panel
            positionCommentsPanel($panel, $element);
            
            // Add the panel to the page
            $('body').append($panel);
            
            // Highlight the element
            $element.addClass(config.classes.commentHighlight);
            
            // Focus the textarea
            $panel.find('textarea').focus();
        });
    }
    
    /**
     * Create a comments panel for an element
     * @param {string} elementId - The ID of the element
     * @param {string} elementName - The name of the element
     * @param {Array} comments - The comments for the element
     * @returns {JQuery} The comments panel
     */
    function createCommentsPanel(elementId, elementName, comments) {
        const currentUser = getCurrentUser();
        let commentItems = '';
        
        if (comments && comments.length > 0) {
            comments.forEach(function(comment) {
                const canDelete = comment.authorUsername === currentUser.username || isAdmin();
                const deleteButton = canDelete ? config.templates.deleteButton : '';
                
                // Process replies
                let repliesHtml = '';
                if (comment.replies && comment.replies.length > 0) {
                    comment.replies.forEach(function(reply) {
                        const canDeleteReply = reply.authorUsername === currentUser.username || isAdmin();
                        const replyDeleteButton = canDeleteReply ? config.templates.deleteButton : '';
                        
                        repliesHtml += config.templates.commentItem
                            .replace(/{{commentId}}/g, reply.id)
                            .replace(/{{authorName}}/g, reply.authorName)
                            .replace(/{{authorAvatar}}/g, reply.authorAvatarUrl || getDefaultAvatar())
                            .replace(/{{content}}/g, reply.content)
                            .replace(/{{timeAgo}}/g, getTimeAgo(reply.timestamp))
                            .replace(/{{deleteButton}}/g, replyDeleteButton)
                            .replace(/{{replies}}/g, '');
                    });
                }
                
                commentItems += config.templates.commentItem
                    .replace(/{{commentId}}/g, comment.id)
                    .replace(/{{authorName}}/g, comment.authorName)
                    .replace(/{{authorAvatar}}/g, comment.authorAvatarUrl || getDefaultAvatar())
                    .replace(/{{content}}/g, comment.content)
                    .replace(/{{timeAgo}}/g, getTimeAgo(comment.timestamp))
                    .replace(/{{deleteButton}}/g, deleteButton)
                    .replace(/{{replies}}/g, repliesHtml);
            });
        } else {
            commentItems = config.templates.noComments;
        }
        
        const $panel = $(
            config.templates.commentPanel
                .replace(/{{elementId}}/g, elementId)
                .replace(/{{elementName}}/g, elementName)
                .replace(/{{commentItems}}/g, commentItems)
                .replace(/{{userAvatar}}/g, currentUser.avatar || getDefaultAvatar())
                .replace(/{{userName}}/g, currentUser.name)
        );
        
        return $panel;
    }
    
    /**
     * Position the comments panel next to an element
     * @param {JQuery} $panel - The panel to position
     * @param {JQuery} $element - The element to position the panel next to
     */
    function positionCommentsPanel($panel, $element) {
        const elementOffset = $element.offset();
        const elementWidth = $element.outerWidth();
        const windowWidth = $(window).width();
        const panelWidth = 300; // Fixed panel width
        
        let left = elementOffset.left + elementWidth;
        let top = elementOffset.top;
        
        // If the panel would overflow the window, position it to the left of the element
        if (left + panelWidth > windowWidth - 20) {
            left = Math.max(20, elementOffset.left - panelWidth);
        }
        
        $panel.css({
            position: 'absolute',
            top: top + 'px',
            left: left + 'px',
            width: panelWidth + 'px',
            zIndex: 1000
        });
    }
    
    /**
     * Close the comments panel
     */
    function closeCommentsPanel() {
        $(config.selectors.commentPanel).remove();
        $(config.selectors.commentHighlight).removeClass(config.classes.commentHighlight);
    }
    
    /**
     * Add a comment to an element
     * @param {string} elementId - The ID of the element
     * @param {string} content - The content of the comment
     */
    function addComment(elementId, content) {
        const pageId = getPageId();
        if (!pageId || !elementId) return;
        
        const currentUser = getCurrentUser();
        
        // Create a comment object
        const comment = {
            elementId: elementId,
            pageId: pageId,
            content: content,
            authorUsername: currentUser.username,
            authorName: currentUser.name,
            authorAvatarUrl: currentUser.avatar || getDefaultAvatar()
        };
        
        // Send to server
        $.ajax({
            url: config.urls.addComment,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(comment),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Update the UI
                    loadExistingComments();
                    
                    // If the comments panel is open, refresh it
                    const $panel = $(config.selectors.commentPanel);
                    if ($panel.length > 0) {
                        // Close and reopen the panel to refresh the comments
                        closeCommentsPanel();
                        showCommentsPanel($('#' + elementId));
                    }
                } else {
                    alert('Error adding comment: ' + response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error adding comment: ' + textStatus + ' - ' + errorThrown);
                
                // Fallback to local storage for development
                const comments = getStoredComments(pageId, elementId);
                
                // Generate a unique ID
                comment.id = generateUniqueId();
                comment.timestamp = new Date().getTime();
                
                comments.push(comment);
                storeComments(pageId, elementId, comments);
                
                // Update the UI
                updateCommentIndicator(elementId, comments.length);
                
                // If the comments panel is open, refresh it
                const $panel = $(config.selectors.commentPanel);
                if ($panel.length > 0) {
                    closeCommentsPanel();
                    showCommentsPanel($('#' + elementId));
                }
            }
        });
    }
    
    /**
     * Add a reply to a comment
     * @param {string} parentId - The ID of the parent comment
     * @param {string} content - The content of the reply
     */
    function addReply(parentId, content) {
        const currentUser = getCurrentUser();
        
        // Create a reply object
        const reply = {
            content: content,
            authorUsername: currentUser.username,
            authorName: currentUser.name,
            authorAvatarUrl: currentUser.avatar || getDefaultAvatar()
        };
        
        // Send to server
        $.ajax({
            url: config.urls.addReply + parentId + '/reply',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reply),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Find the element this comment belongs to
                    const elementId = $('#' + config.selectors.commentItem + '[data-comment-id="' + parentId + '"]')
                        .closest(config.selectors.commentPanel)
                        .find('.submit-comment')
                        .data('element-id');
                    
                    // If the comments panel is open, refresh it
                    const $panel = $(config.selectors.commentPanel);
                    if ($panel.length > 0 && elementId) {
                        closeCommentsPanel();
                        showCommentsPanel($('#' + elementId));
                    }
                } else {
                    alert('Error adding reply: ' + response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error adding reply: ' + textStatus + ' - ' + errorThrown);
                
                // Fallback to local storage for development
                // This is more complex for replies since we need to find the parent comment
                const pageId = getPageId();
                if (!pageId) return;
                
                // Find all elements on the page
                let found = false;
                $(config.selectors.commentable).each(function() {
                    if (found) return;
                    
                    const elementId = $(this).attr('id');
                    const comments = getStoredComments(pageId, elementId);
                    
                    // Find the parent comment
                    for (let i = 0; i < comments.length; i++) {
                        if (comments[i].id === parentId) {
                            // Add the reply
                            if (!comments[i].replies) {
                                comments[i].replies = [];
                            }
                            
                            reply.id = generateUniqueId();
                            reply.timestamp = new Date().getTime();
                            reply.parentId = parentId;
                            
                            comments[i].replies.push(reply);
                            storeComments(pageId, elementId, comments);
                            
                            // Refresh the UI
                            const $panel = $(config.selectors.commentPanel);
                            if ($panel.length > 0) {
                                closeCommentsPanel();
                                showCommentsPanel($('#' + elementId));
                            }
                            
                            found = true;
                            break;
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Delete a comment
     * @param {string} commentId - The ID of the comment to delete
     */
    function deleteComment(commentId) {
        // Send delete request to server
        $.ajax({
            url: config.urls.deleteComment + commentId,
            type: 'DELETE',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Refresh comments
                    loadExistingComments();
                    
                    // Find the element this comment belongs to
                    const $commentItem = $(config.selectors.commentItem + '[data-comment-id="' + commentId + '"]');
                    const elementId = $commentItem.closest(config.selectors.commentPanel)
                        .find('.submit-comment')
                        .data('element-id');
                    
                    // If the comments panel is open, refresh it
                    if (elementId) {
                        closeCommentsPanel();
                        showCommentsPanel($('#' + elementId));
                    }
                } else {
                    alert('Error deleting comment: ' + response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error deleting comment: ' + textStatus + ' - ' + errorThrown);
                
                // Fallback to local storage for development
                const pageId = getPageId();
                if (!pageId) return;
                
                // Find the element and comment
                let found = false;
                $(config.selectors.commentable).each(function() {
                    if (found) return;
                    
                    const elementId = $(this).attr('id');
                    const comments = getStoredComments(pageId, elementId);
                    
                    // Check if it's a top-level comment
                    for (let i = 0; i < comments.length; i++) {
                        if (comments[i].id === commentId) {
                            // Remove the comment
                            comments.splice(i, 1);
                            storeComments(pageId, elementId, comments);
                            
                            // Update the UI
                            updateCommentIndicator(elementId, comments.length);
                            
                            // If the comments panel is open, refresh it
                            const $panel = $(config.selectors.commentPanel);
                            if ($panel.length > 0) {
                                closeCommentsPanel();
                                showCommentsPanel($('#' + elementId));
                            }
                            
                            found = true;
                            break;
                        }
                        
                        // Check if it's a reply
                        if (comments[i].replies) {
                            for (let j = 0; j < comments[i].replies.length; j++) {
                                if (comments[i].replies[j].id === commentId) {
                                    // Remove the reply
                                    comments[i].replies.splice(j, 1);
                                    storeComments(pageId, elementId, comments);
                                    
                                    // If the comments panel is open, refresh it
                                    const $panel = $(config.selectors.commentPanel);
                                    if ($panel.length > 0) {
                                        closeCommentsPanel();
                                        showCommentsPanel($('#' + elementId));
                                    }
                                    
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Get the current Confluence page ID
     * @returns {string|null} The page ID or null if not found
     */
    function getPageId() {
        if (window.AJS && window.AJS.Meta && window.AJS.Meta.get) {
            return window.AJS.Meta.get('page-id');
        }
        
        // For development without Confluence
        return window.location.pathname.replace(/\//g, '_');
    }
    
    /**
     * Get information about the current user
     * @returns {Object} User information
     */
    function getCurrentUser() {
        if (window.AJS && window.AJS.Meta && window.AJS.Meta.get) {
            return {
                username: window.AJS.Meta.get('remote-user'),
                name: window.AJS.Meta.get('current-user-fullname') || window.AJS.Meta.get('remote-user'),
                avatar: window.AJS.Meta.get('current-user-avatar-url')
            };
        }
        
        // For development without Confluence
        return {
            username: 'developer',
            name: 'Developer User',
            avatar: null
        };
    }
    
    /**
     * Check if the current user is an admin
     * @returns {boolean} True if the user is an admin
     */
    function isAdmin() {
        if (window.AJS && window.AJS.Meta && window.AJS.Meta.get) {
            return window.AJS.Meta.get('is-admin') === 'true';
        }
        
        // For development
        return false;
    }
    
    /**
     * Get a human-readable name for an element
     * @param {JQuery} $element - The element
     * @returns {string} The element name
     */
    function getElementName($element) {
        if ($element.is(config.selectors.endpoint)) {
            const method = $element.find('.http-method').text();
            const path = $element.find('.endpoint-path').text();
            return method + ' ' + path;
        } else if ($element.is(config.selectors.parameter)) {
            return 'Parameter: ' + $element.find('td:first').text();
        } else if ($element.is(config.selectors.response)) {
            return 'Response: ' + $element.find('.status-code').text();
        } else if ($element.is(config.selectors.property)) {
            return 'Property: ' + $element.find('td:first').text();
        } else {
            return 'Element ' + $element.attr('id');
        }
    }
    
    /**
     * Get stored comments for an element
     * @param {string} pageId - The ID of the page
     * @param {string} elementId - The ID of the element
     * @returns {Array} The comments
     */
    function getStoredComments(pageId, elementId) {
        try {
            const key = 'openapi-comments-' + pageId + '-' + elementId;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error retrieving stored comments: ' + e.message);
            return [];
        }
    }
    
    /**
     * Store comments for an element
     * @param {string} pageId - The ID of the page
     * @param {string} elementId - The ID of the element
     * @param {Array} comments - The comments to store
     */
    function storeComments(pageId, elementId, comments) {
        try {
            const key = 'openapi-comments-' + pageId + '-' + elementId;
            localStorage.setItem(key, JSON.stringify(comments));
        } catch (e) {
            console.error('Error storing comments: ' + e.message);
        }
    }
    
    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    function generateUniqueId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Get a default avatar URL
     * @returns {string} The default avatar URL
     */
    function getDefaultAvatar() {
        return AJS.contextPath() + '/images/icons/profilepics/default.png';
    }
    
    /**
     * Get a human-readable time ago string
     * @param {number} timestamp - The timestamp
     * @returns {string} The time ago string
     */
    function getTimeAgo(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date().getTime();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return days + (days === 1 ? ' day ago' : ' days ago');
        } else if (hours > 0) {
            return hours + (hours === 1 ? ' hour ago' : ' hours ago');
        } else if (minutes > 0) {
            return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
        } else {
            return 'just now';
        }
    }
    
    // Initialize when the DOM is ready
    $(document).ready(function() {
        initialize();
    });
});