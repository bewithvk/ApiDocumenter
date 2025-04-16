package com.example.confluence.model;

import java.util.Date;

/**
 * Represents a version of an API specification.
 */
public class ApiSpecVersion {

    private String id;
    private Long pageId;
    private String title;
    private String content;
    private String version;
    private String author;
    private Date createdDate;
    private String comment;

    public ApiSpecVersion() {
        // Default constructor
    }

    /**
     * Constructor with all fields
     */
    public ApiSpecVersion(String id, Long pageId, String title, String content, String version, String author, Date createdDate, String comment) {
        this.id = id;
        this.pageId = pageId;
        this.title = title;
        this.content = content;
        this.version = version;
        this.author = author;
        this.createdDate = createdDate;
        this.comment = comment;
    }

    // Getters and setters
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}