package com.example.confluence.model;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.ArrayList;
import java.util.List;

/**
 * Model class for a comment or annotation.
 */
@XmlRootElement
public class Comment {

    @XmlElement
    private String id;
    
    @XmlElement
    private Long pageId;
    
    @XmlElement
    private String elementId;
    
    @XmlElement
    private String content;
    
    @XmlElement
    private Long timestamp;
    
    @XmlElement
    private Long lastModified;
    
    @XmlElement
    private String authorUsername;
    
    @XmlElement
    private String authorName;
    
    @XmlElement
    private String authorAvatarUrl;
    
    @XmlElement
    private String parentId; // For replies, the ID of the parent comment
    
    @XmlElement
    private List<Comment> replies = new ArrayList<>();
    
    @XmlElement
    private Integer highlightStartOffset; // For annotation highlighting
    
    @XmlElement
    private Integer highlightEndOffset; // For annotation highlighting

    // Constructors
    public Comment() {
        // Required for JAXB
    }
    
    public Comment(String id, Long pageId, String elementId, String content, Long timestamp, String authorUsername, String authorName) {
        this.id = id;
        this.pageId = pageId;
        this.elementId = elementId;
        this.content = content;
        this.timestamp = timestamp;
        this.authorUsername = authorUsername;
        this.authorName = authorName;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getPageId() {
        return pageId;
    }

    public void setPageId(Long pageId) {
        this.pageId = pageId;
    }

    public String getElementId() {
        return elementId;
    }

    public void setElementId(String elementId) {
        this.elementId = elementId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public Long getLastModified() {
        return lastModified;
    }

    public void setLastModified(Long lastModified) {
        this.lastModified = lastModified;
    }

    public String getAuthorUsername() {
        return authorUsername;
    }

    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorAvatarUrl() {
        return authorAvatarUrl;
    }

    public void setAuthorAvatarUrl(String authorAvatarUrl) {
        this.authorAvatarUrl = authorAvatarUrl;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public List<Comment> getReplies() {
        return replies;
    }

    public void setReplies(List<Comment> replies) {
        this.replies = replies;
    }

    public void addReply(Comment reply) {
        if (this.replies == null) {
            this.replies = new ArrayList<>();
        }
        this.replies.add(reply);
    }

    public Integer getHighlightStartOffset() {
        return highlightStartOffset;
    }

    public void setHighlightStartOffset(Integer highlightStartOffset) {
        this.highlightStartOffset = highlightStartOffset;
    }

    public Integer getHighlightEndOffset() {
        return highlightEndOffset;
    }

    public void setHighlightEndOffset(Integer highlightEndOffset) {
        this.highlightEndOffset = highlightEndOffset;
    }

    @Override
    public String toString() {
        return "Comment{" +
                "id='" + id + '\'' +
                ", pageId=" + pageId +
                ", elementId='" + elementId + '\'' +
                ", content='" + content + '\'' +
                ", timestamp=" + timestamp +
                ", authorUsername='" + authorUsername + '\'' +
                ", authorName='" + authorName + '\'' +
                ", replies=" + (replies != null ? replies.size() : 0) +
                '}';
    }
}