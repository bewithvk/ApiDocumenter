package com.example.confluence.rest;

import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.example.confluence.model.ApiSpecVersion;
import com.example.confluence.service.ApiSpecVersionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

/**
 * REST resource for API spec version management.
 */
@Component
@Path("/versions")
public class ApiSpecVersionResource {

    private static final Logger log = LoggerFactory.getLogger(ApiSpecVersionResource.class);
    
    private final ApiSpecVersionService apiSpecVersionService;
    
    @Inject
    public ApiSpecVersionResource(ApiSpecVersionService apiSpecVersionService) {
        this.apiSpecVersionService = apiSpecVersionService;
    }
    
    /**
     * Save a new version of an API specification.
     *
     * @param apiSpecVersion The version to save
     * @return The saved version with ID
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveVersion(ApiSpecVersion apiSpecVersion) {
        try {
            ApiSpecVersion savedVersion = apiSpecVersionService.saveVersion(apiSpecVersion);
            return Response.status(Response.Status.CREATED).entity(savedVersion).build();
        } catch (Exception e) {
            log.error("Error saving API spec version", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error saving API spec version: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Get a specific version.
     *
     * @param versionId The ID of the version to retrieve
     * @return The version details
     */
    @GET
    @Path("/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getVersion(@PathParam("versionId") String versionId) {
        try {
            ApiSpecVersion version = apiSpecVersionService.getVersion(versionId);
            if (version != null) {
                return Response.ok(version).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("Version not found with ID: " + versionId)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error retrieving API spec version", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error retrieving API spec version: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Get all versions for a page.
     *
     * @param pageId The ID of the Confluence page
     * @return List of versions
     */
    @GET
    @Path("/page/{pageId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getVersionsForPage(@PathParam("pageId") Long pageId) {
        try {
            List<ApiSpecVersion> versions = apiSpecVersionService.getVersionsForPage(pageId);
            return Response.ok(versions).build();
        } catch (Exception e) {
            log.error("Error retrieving API spec versions for page", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error retrieving API spec versions: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Get the current active version for a page.
     *
     * @param pageId The ID of the Confluence page
     * @return The current version
     */
    @GET
    @Path("/page/{pageId}/current")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCurrentVersion(@PathParam("pageId") Long pageId) {
        try {
            ApiSpecVersion version = apiSpecVersionService.getCurrentVersion(pageId);
            if (version != null) {
                return Response.ok(version).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("No current version found for page: " + pageId)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error retrieving current API spec version", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error retrieving current API spec version: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Set a version as the active version.
     *
     * @param versionId The ID of the version to set as active
     * @return The active version
     */
    @PUT
    @Path("/{versionId}/activate")
    @Produces(MediaType.APPLICATION_JSON)
    public Response setActiveVersion(@PathParam("versionId") String versionId) {
        try {
            ApiSpecVersion version = apiSpecVersionService.setActiveVersion(versionId);
            if (version != null) {
                return Response.ok(version).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("Version not found with ID: " + versionId)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error setting active API spec version", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error setting active API spec version: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Delete a version.
     *
     * @param versionId The ID of the version to delete
     * @return Success or failure response
     */
    @DELETE
    @Path("/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteVersion(@PathParam("versionId") String versionId) {
        try {
            boolean success = apiSpecVersionService.deleteVersion(versionId);
            if (success) {
                return Response.ok().entity("{\"success\": true}").build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("Version not found with ID: " + versionId)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error deleting API spec version", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error deleting API spec version: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Compare two versions.
     *
     * @param version1Id The ID of the first version
     * @param version2Id The ID of the second version
     * @return Comparison result
     */
    @GET
    @Path("/compare/{version1Id}/{version2Id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response compareVersions(
            @PathParam("version1Id") String version1Id,
            @PathParam("version2Id") String version2Id) {
        try {
            Map<String, Object> comparison = apiSpecVersionService.compareVersions(version1Id, version2Id);
            return Response.ok(comparison).build();
        } catch (Exception e) {
            log.error("Error comparing API spec versions", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error comparing API spec versions: " + e.getMessage())
                    .build();
        }
    }
}