package com.example.confluence.ao;

import net.java.ao.Entity;
import net.java.ao.Preload;
import net.java.ao.schema.NotNull;
import net.java.ao.schema.StringLength;
import net.java.ao.schema.Table;

import java.util.Date;

/**
 * Active Objects entity for storing API specification versions.
 */
@Preload
@Table("OPENAPI_SPEC_VERSION")
public interface ApiSpecVersionEntity extends Entity {

    @NotNull
    Long getPageId();
    void setPageId(Long pageId);
    
    String getTitle();
    void setTitle(String title);
    
    @StringLength(StringLength.UNLIMITED)
    String getContent();
    void setContent(String content);
    
    String getVersion();
    void setVersion(String version);
    
    String getAuthor();
    void setAuthor(String author);
    
    Date getCreatedDate();
    void setCreatedDate(Date createdDate);
    
    @StringLength(1024)
    String getComment();
    void setComment(String comment);
    
    // Flag to mark the current active version for a page
    Boolean getIsActive();
    void setIsActive(Boolean isActive);
}