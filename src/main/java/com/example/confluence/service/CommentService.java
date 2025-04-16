package com.example.confluence.service;

import com.example.confluence.model.Comment;

import java.util.List;
import java.util.Map;

/**
 * Service interface for managing comments and annotations.
 */
public interface CommentService {

    /**
     * Get a comment by ID
     * 
     * @param commentId The ID of the comment
     * @return The comment, or null if not found
     */
    Comment getComment(String commentId);
    
    /**
     * Get all comments for a specific element on a page
     * 
     * @param pageId The ID of the page
     * @param elementId The ID of the element
     * @return List of comments
     */
    List<Comment> getComments(long pageId, String elementId);
    
    /**
     * Get all comments for a page, grouped by element ID
     * 
     * @param pageId The ID of the page
     * @return Map of element IDs to lists of comments
     */
    Map<String, List<Comment>> getAllCommentsForPage(long pageId);
    
    /**
     * Add a new comment
     * 
     * @param comment The comment to add
     * @return The added comment with its ID
     */
    Comment addComment(Comment comment);
    
    /**
     * Update a comment
     * 
     * @param comment The comment with updated content
     * @return The updated comment
     */
    Comment updateComment(Comment comment);
    
    /**
     * Delete a comment
     * 
     * @param commentId The ID of the comment to delete
     * @return true if the comment was deleted
     */
    boolean deleteComment(String commentId);
    
    /**
     * Add a reply to a comment
     * 
     * @param parentId The ID of the parent comment
     * @param reply The reply to add
     * @return The added reply with its ID
     */
    Comment addReply(String parentId, Comment reply);
}