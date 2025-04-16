package com.example.confluence.model;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * Response model for comment-related operations.
 */
@XmlRootElement
public class CommentResponse {

    @XmlElement
    private boolean success;
    
    @XmlElement
    private String message;
    
    @XmlElement
    private Comment comment;
    
    @XmlElement
    private String error;

    // Constructors
    public CommentResponse() {
        // Required for JAXB
    }
    
    public CommentResponse(boolean success, String message, Comment comment) {
        this.success = success;
        this.message = message;
        this.comment = comment;
    }
    
    public CommentResponse(boolean success, String error) {
        this.success = success;
        this.error = error;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}