package com.example.confluence.service;

import com.example.confluence.model.ApiSpecVersion;

import java.util.List;
import java.util.Map;

/**
 * Service for managing API specification versions.
 */
public interface ApiSpecVersionService {

    /**
     * Save a new version of an API specification.
     *
     * @param apiSpecVersion The API specification version to save
     * @return The saved API specification version with ID
     */
    ApiSpecVersion saveVersion(ApiSpecVersion apiSpecVersion);
    
    /**
     * Get a specific version of an API specification.
     *
     * @param versionId The ID of the version to retrieve
     * @return The API specification version or null if not found
     */
    ApiSpecVersion getVersion(String versionId);
    
    /**
     * Get all versions of an API specification for a given page.
     *
     * @param pageId The ID of the Confluence page
     * @return List of API specification versions
     */
    List<ApiSpecVersion> getVersionsForPage(Long pageId);
    
    /**
     * Get the current active version of an API specification for a given page.
     *
     * @param pageId The ID of the Confluence page
     * @return The current active API specification version or null if none exists
     */
    ApiSpecVersion getCurrentVersion(Long pageId);
    
    /**
     * Set a specific version as the current active version.
     *
     * @param versionId The ID of the version to set as active
     * @return The activated API specification version
     */
    ApiSpecVersion setActiveVersion(String versionId);
    
    /**
     * Delete a specific version of an API specification.
     *
     * @param versionId The ID of the version to delete
     * @return true if successful, false otherwise
     */
    boolean deleteVersion(String versionId);
    
    /**
     * Compare two versions of an API specification.
     *
     * @param version1Id The ID of the first version
     * @param version2Id The ID of the second version
     * @return A map containing the differences between the two versions
     */
    Map<String, Object> compareVersions(String version1Id, String version2Id);
}