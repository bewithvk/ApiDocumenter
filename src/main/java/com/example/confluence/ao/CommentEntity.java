package com.example.confluence.ao;

import net.java.ao.Entity;
import net.java.ao.Preload;
import net.java.ao.schema.NotNull;
import net.java.ao.schema.StringLength;
import net.java.ao.schema.Table;

/**
 * Active Objects entity for storing comments and annotations.
 */
@Preload
@Table("OPENAPI_COMMENT")
public interface CommentEntity extends Entity {

    @NotNull
    Long getPageId();
    void setPageId(Long pageId);
    
    @NotNull
    String getElementId();
    void setElementId(String elementId);
    
    @NotNull
    @StringLength(StringLength.UNLIMITED)
    String getContent();
    void setContent(String content);
    
    @NotNull
    Long getTimestamp();
    void setTimestamp(Long timestamp);
    
    Long getLastModified();
    void setLastModified(Long lastModified);
    
    @NotNull
    String getAuthorUsername();
    void setAuthorUsername(String authorUsername);
    
    @NotNull
    String getAuthorName();
    void setAuthorName(String authorName);
    
    String getAuthorAvatarUrl();
    void setAuthorAvatarUrl(String authorAvatarUrl);
    
    Long getParentId(); // For replies, the ID of the parent comment
    void setParentId(Long parentId);
    
    Integer getHighlightStartOffset(); // For annotation highlighting
    void setHighlightStartOffset(Integer highlightStartOffset);
    
    Integer getHighlightEndOffset(); // For annotation highlighting
    void setHighlightEndOffset(Integer highlightEndOffset);
}