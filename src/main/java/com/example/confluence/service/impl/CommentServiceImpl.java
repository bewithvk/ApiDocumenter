package com.example.confluence.service.impl;

import com.atlassian.activeobjects.external.ActiveObjects;
import org.springframework.stereotype.Component;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.example.confluence.model.Comment;
import com.example.confluence.service.CommentService;
import com.example.confluence.ao.CommentEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of the CommentService interface.
 * 
 * Note: This implementation uses Active Objects for persistence. In a development
 * environment without AO, it falls back to an in-memory storage approach.
 */
@Component
@Named
public class CommentServiceImpl implements CommentService {

    private static final Logger log = LoggerFactory.getLogger(CommentServiceImpl.class);
    
    private final ActiveObjects ao;
    
    // In-memory storage for development without Active Objects
    private static final Map<String, Comment> commentStore = new HashMap<>();

    @Inject
    public CommentServiceImpl(@ComponentImport ActiveObjects ao) {
        this.ao = ao;
    }

    @Override
    public Comment getComment(String commentId) {
        if (commentId == null) {
            return null;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            CommentEntity entity = ao.get(CommentEntity.class, Integer.parseInt(commentId));
            if (entity != null) {
                return convertToComment(entity);
            }
            return null;
        }
        
        // Fall back to in-memory storage
        return commentStore.get(commentId);
    }

    @Override
    public List<Comment> getComments(long pageId, String elementId) {
        if (elementId == null) {
            return Collections.emptyList();
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            CommentEntity[] entities = ao.find(CommentEntity.class, 
                    "PAGE_ID = ? AND ELEMENT_ID = ? AND PARENT_ID IS NULL", 
                    pageId, elementId);
            
            List<Comment> comments = Arrays.stream(entities)
                    .map(this::convertToComment)
                    .collect(Collectors.toList());
            
            // Load replies for each comment
            comments.forEach(this::loadReplies);
            
            return comments;
        }
        
        // Fall back to in-memory storage
        return commentStore.values().stream()
                .filter(c -> c.getPageId() != null && c.getPageId() == pageId && 
                        elementId.equals(c.getElementId()) && c.getParentId() == null)
                .sorted(Comparator.comparing(Comment::getTimestamp))
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, List<Comment>> getAllCommentsForPage(long pageId) {
        Map<String, List<Comment>> result = new HashMap<>();
        
        // Check if we have Active Objects available
        if (ao != null) {
            CommentEntity[] entities = ao.find(CommentEntity.class, 
                    "PAGE_ID = ? AND PARENT_ID IS NULL", 
                    pageId);
            
            // Group by element ID
            Arrays.stream(entities)
                    .map(this::convertToComment)
                    .forEach(comment -> {
                        result.computeIfAbsent(comment.getElementId(), k -> new ArrayList<>()).add(comment);
                        loadReplies(comment);
                    });
            
            return result;
        }
        
        // Fall back to in-memory storage
        commentStore.values().stream()
                .filter(c -> c.getPageId() != null && c.getPageId() == pageId && c.getParentId() == null)
                .forEach(comment -> {
                    result.computeIfAbsent(comment.getElementId(), k -> new ArrayList<>()).add(comment);
                    
                    // Also add any replies
                    List<Comment> replies = commentStore.values().stream()
                            .filter(r -> comment.getId().equals(r.getParentId()))
                            .sorted(Comparator.comparing(Comment::getTimestamp))
                            .collect(Collectors.toList());
                    
                    comment.setReplies(replies);
                });
        
        return result;
    }

    @Override
    public Comment addComment(Comment comment) {
        if (comment == null) {
            throw new IllegalArgumentException("Comment cannot be null");
        }
        
        // Generate a unique ID if not provided
        if (comment.getId() == null) {
            comment.setId(generateUniqueId());
        }
        
        // Set the timestamp if not provided
        if (comment.getTimestamp() == null) {
            comment.setTimestamp(System.currentTimeMillis());
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                CommentEntity entity = ao.create(CommentEntity.class);
                entity.setPageId(comment.getPageId());
                entity.setElementId(comment.getElementId());
                entity.setContent(comment.getContent());
                entity.setTimestamp(comment.getTimestamp());
                entity.setAuthorUsername(comment.getAuthorUsername());
                entity.setAuthorName(comment.getAuthorName());
                entity.setAuthorAvatarUrl(comment.getAuthorAvatarUrl());
                
                if (comment.getParentId() != null) {
                    entity.setParentId(Integer.parseInt(comment.getParentId()));
                }
                
                entity.save();
                
                // Update the comment with the new ID
                comment.setId(String.valueOf(entity.getID()));
                
                return comment;
            } catch (Exception e) {
                log.error("Error adding comment", e);
                throw new RuntimeException("Error adding comment", e);
            }
        }
        
        // Fall back to in-memory storage
        commentStore.put(comment.getId(), comment);
        
        return comment;
    }

    @Override
    public Comment updateComment(Comment comment) {
        if (comment == null || comment.getId() == null) {
            throw new IllegalArgumentException("Comment cannot be null and must have an ID");
        }
        
        // Set the last modified time
        if (comment.getLastModified() == null) {
            comment.setLastModified(System.currentTimeMillis());
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                CommentEntity entity = ao.get(CommentEntity.class, Integer.parseInt(comment.getId()));
                if (entity != null) {
                    entity.setContent(comment.getContent());
                    entity.setLastModified(comment.getLastModified());
                    entity.save();
                    return comment;
                }
                return null;
            } catch (Exception e) {
                log.error("Error updating comment", e);
                throw new RuntimeException("Error updating comment", e);
            }
        }
        
        // Fall back to in-memory storage
        if (commentStore.containsKey(comment.getId())) {
            Comment existingComment = commentStore.get(comment.getId());
            existingComment.setContent(comment.getContent());
            existingComment.setLastModified(comment.getLastModified());
            return existingComment;
        }
        
        return null;
    }

    @Override
    public boolean deleteComment(String commentId) {
        if (commentId == null) {
            return false;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                CommentEntity entity = ao.get(CommentEntity.class, Integer.parseInt(commentId));
                if (entity != null) {
                    // Also delete any replies
                    CommentEntity[] replies = ao.find(CommentEntity.class, "PARENT_ID = ?", entity.getID());
                    for (CommentEntity reply : replies) {
                        ao.delete(reply);
                    }
                    
                    // Delete the comment
                    ao.delete(entity);
                    return true;
                }
                return false;
            } catch (Exception e) {
                log.error("Error deleting comment", e);
                throw new RuntimeException("Error deleting comment", e);
            }
        }
        
        // Fall back to in-memory storage
        if (commentStore.containsKey(commentId)) {
            // Also remove any replies
            List<String> replyIds = commentStore.values().stream()
                    .filter(c -> commentId.equals(c.getParentId()))
                    .map(Comment::getId)
                    .collect(Collectors.toList());
            
            replyIds.forEach(commentStore::remove);
            
            // Remove the comment
            commentStore.remove(commentId);
            return true;
        }
        
        return false;
    }

    @Override
    public Comment addReply(String parentId, Comment reply) {
        if (parentId == null || reply == null) {
            throw new IllegalArgumentException("Parent ID and reply cannot be null");
        }
        
        // Set the parent ID on the reply
        reply.setParentId(parentId);
        
        // First, check if the parent comment exists
        Comment parent = getComment(parentId);
        if (parent == null) {
            throw new IllegalArgumentException("Parent comment not found");
        }
        
        // Add the reply
        Comment addedReply = addComment(reply);
        
        // Update the parent's replies collection in memory
        parent.addReply(addedReply);
        
        return addedReply;
    }
    
    /**
     * Convert an Active Objects entity to a Comment object
     * 
     * @param entity The entity to convert
     * @return The Comment object
     */
    private Comment convertToComment(CommentEntity entity) {
        Comment comment = new Comment();
        comment.setId(String.valueOf(entity.getID()));
        comment.setPageId(entity.getPageId());
        comment.setElementId(entity.getElementId());
        comment.setContent(entity.getContent());
        comment.setTimestamp(entity.getTimestamp());
        comment.setLastModified(entity.getLastModified());
        comment.setAuthorUsername(entity.getAuthorUsername());
        comment.setAuthorName(entity.getAuthorName());
        comment.setAuthorAvatarUrl(entity.getAuthorAvatarUrl());
        
        if (entity.getParentId() != null) {
            comment.setParentId(String.valueOf(entity.getParentId()));
        }
        
        return comment;
    }
    
    /**
     * Load replies for a comment
     * 
     * @param comment The comment to load replies for
     */
    private void loadReplies(Comment comment) {
        if (comment == null || comment.getId() == null) {
            return;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            CommentEntity[] replies = ao.find(CommentEntity.class, 
                    "PARENT_ID = ?", 
                    Integer.parseInt(comment.getId()));
            
            comment.setReplies(Arrays.stream(replies)
                    .map(this::convertToComment)
                    .sorted(Comparator.comparing(Comment::getTimestamp))
                    .collect(Collectors.toList()));
        } else {
            // Fall back to in-memory storage
            List<Comment> replies = commentStore.values().stream()
                    .filter(c -> comment.getId().equals(c.getParentId()))
                    .sorted(Comparator.comparing(Comment::getTimestamp))
                    .collect(Collectors.toList());
            
            comment.setReplies(replies);
        }
    }
    
    /**
     * Generate a unique ID for a comment
     * 
     * @return A unique ID
     */
    private String generateUniqueId() {
        return UUID.randomUUID().toString();
    }
}