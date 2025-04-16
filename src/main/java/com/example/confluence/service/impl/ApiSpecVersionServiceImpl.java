package com.example.confluence.service.impl;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.example.confluence.ao.ApiSpecVersionEntity;
import com.example.confluence.model.ApiSpecVersion;
import com.example.confluence.service.ApiSpecVersionService;
import com.example.confluence.util.OpenApiDiffUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of the ApiSpecVersionService interface.
 */
@Component
@Named
public class ApiSpecVersionServiceImpl implements ApiSpecVersionService {

    private static final Logger log = LoggerFactory.getLogger(ApiSpecVersionServiceImpl.class);
    
    private final ActiveObjects ao;
    
    // In-memory storage for development without Active Objects
    private static final Map<String, ApiSpecVersion> versionStore = new HashMap<>();

    @Inject
    public ApiSpecVersionServiceImpl(@ComponentImport ActiveObjects ao) {
        this.ao = ao;
    }

    @Override
    public ApiSpecVersion saveVersion(ApiSpecVersion apiSpecVersion) {
        if (apiSpecVersion == null) {
            throw new IllegalArgumentException("API spec version cannot be null");
        }
        
        // Generate a unique ID if not provided
        if (apiSpecVersion.getId() == null) {
            apiSpecVersion.setId(generateUniqueId());
        }
        
        // Set the creation date if not provided
        if (apiSpecVersion.getCreatedDate() == null) {
            apiSpecVersion.setCreatedDate(new Date());
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                ApiSpecVersionEntity entity = ao.create(ApiSpecVersionEntity.class);
                entity.setPageId(apiSpecVersion.getPageId());
                entity.setTitle(apiSpecVersion.getTitle());
                entity.setContent(apiSpecVersion.getContent());
                entity.setVersion(apiSpecVersion.getVersion());
                entity.setAuthor(apiSpecVersion.getAuthor());
                entity.setCreatedDate(apiSpecVersion.getCreatedDate());
                entity.setComment(apiSpecVersion.getComment());
                
                // If this is the first version for this page, make it active
                ApiSpecVersionEntity[] existingVersions = ao.find(ApiSpecVersionEntity.class, 
                        "PAGE_ID = ?", apiSpecVersion.getPageId());
                
                if (existingVersions.length == 0) {
                    entity.setIsActive(true);
                } else {
                    entity.setIsActive(false);
                }
                
                entity.save();
                
                // Update the version with the new ID
                apiSpecVersion.setId(String.valueOf(entity.getID()));
                
                return apiSpecVersion;
            } catch (Exception e) {
                log.error("Error saving API spec version", e);
                throw new RuntimeException("Error saving API spec version", e);
            }
        }
        
        // Fall back to in-memory storage
        versionStore.put(apiSpecVersion.getId(), apiSpecVersion);
        
        return apiSpecVersion;
    }

    @Override
    public ApiSpecVersion getVersion(String versionId) {
        if (versionId == null) {
            return null;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            ApiSpecVersionEntity entity = ao.get(ApiSpecVersionEntity.class, Integer.parseInt(versionId));
            if (entity != null) {
                return convertToApiSpecVersion(entity);
            }
            return null;
        }
        
        // Fall back to in-memory storage
        return versionStore.get(versionId);
    }

    @Override
    public List<ApiSpecVersion> getVersionsForPage(Long pageId) {
        if (pageId == null) {
            return Collections.emptyList();
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            ApiSpecVersionEntity[] entities = ao.find(ApiSpecVersionEntity.class, 
                    "PAGE_ID = ? ORDER BY CREATED_DATE DESC", pageId);
            
            return Arrays.stream(entities)
                    .map(this::convertToApiSpecVersion)
                    .collect(Collectors.toList());
        }
        
        // Fall back to in-memory storage
        return versionStore.values().stream()
                .filter(v -> v.getPageId() != null && v.getPageId().equals(pageId))
                .sorted(Comparator.comparing(ApiSpecVersion::getCreatedDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public ApiSpecVersion getCurrentVersion(Long pageId) {
        if (pageId == null) {
            return null;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            ApiSpecVersionEntity[] entities = ao.find(ApiSpecVersionEntity.class, 
                    "PAGE_ID = ? AND IS_ACTIVE = ?", pageId, true);
            
            if (entities.length > 0) {
                return convertToApiSpecVersion(entities[0]);
            }
            return null;
        }
        
        // Fall back to in-memory storage
        List<ApiSpecVersion> versions = getVersionsForPage(pageId);
        if (!versions.isEmpty()) {
            return versions.get(0); // In memory implementation, just return the newest version
        }
        return null;
    }

    @Override
    public ApiSpecVersion setActiveVersion(String versionId) {
        if (versionId == null) {
            return null;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                ApiSpecVersionEntity entity = ao.get(ApiSpecVersionEntity.class, Integer.parseInt(versionId));
                if (entity != null) {
                    // First, set all versions for this page as inactive
                    ApiSpecVersionEntity[] entities = ao.find(ApiSpecVersionEntity.class, 
                            "PAGE_ID = ?", entity.getPageId());
                    
                    for (ApiSpecVersionEntity e : entities) {
                        e.setIsActive(false);
                        e.save();
                    }
                    
                    // Then set the selected version as active
                    entity.setIsActive(true);
                    entity.save();
                    
                    return convertToApiSpecVersion(entity);
                }
                return null;
            } catch (Exception e) {
                log.error("Error setting active API spec version", e);
                throw new RuntimeException("Error setting active API spec version", e);
            }
        }
        
        // Fall back to in-memory storage - not implementing active version for in-memory
        return getVersion(versionId);
    }

    @Override
    public boolean deleteVersion(String versionId) {
        if (versionId == null) {
            return false;
        }
        
        // Check if we have Active Objects available
        if (ao != null) {
            try {
                ApiSpecVersionEntity entity = ao.get(ApiSpecVersionEntity.class, Integer.parseInt(versionId));
                if (entity != null) {
                    boolean wasActive = entity.getIsActive();
                    Long pageId = entity.getPageId();
                    
                    ao.delete(entity);
                    
                    // If this was the active version, set the most recent remaining version as active
                    if (wasActive) {
                        ApiSpecVersionEntity[] remaining = ao.find(ApiSpecVersionEntity.class, 
                                "PAGE_ID = ? ORDER BY CREATED_DATE DESC", pageId);
                        
                        if (remaining.length > 0) {
                            remaining[0].setIsActive(true);
                            remaining[0].save();
                        }
                    }
                    
                    return true;
                }
                return false;
            } catch (Exception e) {
                log.error("Error deleting API spec version", e);
                throw new RuntimeException("Error deleting API spec version", e);
            }
        }
        
        // Fall back to in-memory storage
        if (versionStore.containsKey(versionId)) {
            versionStore.remove(versionId);
            return true;
        }
        
        return false;
    }

    @Override
    public Map<String, Object> compareVersions(String version1Id, String version2Id) {
        if (version1Id == null || version2Id == null) {
            throw new IllegalArgumentException("Both version IDs must be provided");
        }
        
        ApiSpecVersion version1 = getVersion(version1Id);
        ApiSpecVersion version2 = getVersion(version2Id);
        
        if (version1 == null || version2 == null) {
            throw new IllegalArgumentException("Both versions must exist");
        }
        
        // Create the base result with version info
        Map<String, Object> result = new HashMap<>();
        result.put("version1", version1);
        result.put("version2", version2);
        
        // Use the diff utility to identify changes
        Map<String, Object> diffResult = OpenApiDiffUtil.compareSpecs(
                version1.getContent(), 
                version2.getContent());
        
        // Add the diff results
        result.put("diff", diffResult);
        
        // Add a HTML representation of the differences
        result.put("diffHtml", OpenApiDiffUtil.generateDiffHtml(
                version1.getContent(), 
                version2.getContent()));
        
        return result;
    }
    
    /**
     * Convert an Active Objects entity to an ApiSpecVersion object
     * 
     * @param entity The entity to convert
     * @return The ApiSpecVersion object
     */
    private ApiSpecVersion convertToApiSpecVersion(ApiSpecVersionEntity entity) {
        ApiSpecVersion version = new ApiSpecVersion();
        version.setId(String.valueOf(entity.getID()));
        version.setPageId(entity.getPageId());
        version.setTitle(entity.getTitle());
        version.setContent(entity.getContent());
        version.setVersion(entity.getVersion());
        version.setAuthor(entity.getAuthor());
        version.setCreatedDate(entity.getCreatedDate());
        version.setComment(entity.getComment());
        
        return version;
    }
    
    /**
     * Generate a unique ID for a version
     * 
     * @return A unique ID
     */
    private String generateUniqueId() {
        return UUID.randomUUID().toString();
    }
}