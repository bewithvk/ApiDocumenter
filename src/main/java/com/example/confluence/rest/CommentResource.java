package com.example.confluence.rest;

import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.user.UserManager;
import com.example.confluence.service.CommentService;
import com.example.confluence.model.Comment;
import com.example.confluence.model.CommentResponse;

import javax.inject.Inject;
import javax.inject.Named;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.*;

/**
 * REST resource for handling comments and annotations
 */
@Path("/comments")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Named
public class CommentResource {

    private final CommentService commentService;
    private final UserManager userManager;

    @Inject
    public CommentResource(CommentService commentService, UserManager userManager) {
        this.commentService = commentService;
        this.userManager = userManager;
    }

    /**
     * Get comments for a specific element on a page
     *
     * @param pageId    The ID of the page
     * @param elementId The ID of the element
     * @return List of comments
     */
    @GET
    @Path("/page/{pageId}/element/{elementId}")
    @AnonymousAllowed
    public Response getComments(@PathParam("pageId") long pageId, @PathParam("elementId") String elementId) {
        try {
            List<Comment> comments = commentService.getComments(pageId, elementId);
            return Response.ok(comments).build();
        } catch (Exception e) {
            return createErrorResponse("Error retrieving comments: " + e.getMessage());
        }
    }

    /**
     * Get all comments for a page
     *
     * @param pageId The ID of the page
     * @return Map of element IDs to lists of comments
     */
    @GET
    @Path("/page/{pageId}")
    @AnonymousAllowed
    public Response getAllCommentsForPage(@PathParam("pageId") long pageId) {
        try {
            Map<String, List<Comment>> comments = commentService.getAllCommentsForPage(pageId);
            return Response.ok(comments).build();
        } catch (Exception e) {
            return createErrorResponse("Error retrieving comments: " + e.getMessage());
        }
    }

    /**
     * Add a comment to an element
     *
     * @param commentRequest The comment data
     * @return The created comment
     */
    @POST
    @Path("/add")
    public Response addComment(Comment commentRequest) {
        try {
            // Get the current user
            ConfluenceUser user = AuthenticatedUserThreadLocal.get();
            if (user == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Collections.singletonMap("error", "User not authenticated"))
                        .build();
            }

            // Set the author information
            commentRequest.setAuthorUsername(user.getName());
            commentRequest.setAuthorName(user.getFullName());
            commentRequest.setAuthorAvatarUrl(getUserAvatarUrl(user));
            commentRequest.setTimestamp(System.currentTimeMillis());

            // Add the comment
            Comment addedComment = commentService.addComment(commentRequest);

            // Create a success response
            CommentResponse response = new CommentResponse(true, "Comment added successfully", addedComment);
            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (Exception e) {
            return createErrorResponse("Error adding comment: " + e.getMessage());
        }
    }

    /**
     * Update a comment
     *
     * @param commentId      The ID of the comment to update
     * @param commentRequest The updated comment data
     * @return The updated comment
     */
    @PUT
    @Path("/{commentId}")
    public Response updateComment(@PathParam("commentId") String commentId, Comment commentRequest) {
        try {
            // Get the current user
            ConfluenceUser user = AuthenticatedUserThreadLocal.get();
            if (user == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Collections.singletonMap("error", "User not authenticated"))
                        .build();
            }

            // Verify the user is allowed to update this comment (must be the author or an admin)
            Comment existingComment = commentService.getComment(commentId);
            if (existingComment == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Collections.singletonMap("error", "Comment not found"))
                        .build();
            }

            if (!isAllowedToModify(user, existingComment)) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Collections.singletonMap("error", "You are not allowed to update this comment"))
                        .build();
            }

            // Update the comment
            commentRequest.setId(commentId);
            commentRequest.setLastModified(System.currentTimeMillis());
            Comment updatedComment = commentService.updateComment(commentRequest);

            // Create a success response
            CommentResponse response = new CommentResponse(true, "Comment updated successfully", updatedComment);
            return Response.ok(response).build();
        } catch (Exception e) {
            return createErrorResponse("Error updating comment: " + e.getMessage());
        }
    }

    /**
     * Delete a comment
     *
     * @param commentId The ID of the comment to delete
     * @return Success response
     */
    @DELETE
    @Path("/{commentId}")
    public Response deleteComment(@PathParam("commentId") String commentId) {
        try {
            // Get the current user
            ConfluenceUser user = AuthenticatedUserThreadLocal.get();
            if (user == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Collections.singletonMap("error", "User not authenticated"))
                        .build();
            }

            // Verify the user is allowed to delete this comment
            Comment existingComment = commentService.getComment(commentId);
            if (existingComment == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Collections.singletonMap("error", "Comment not found"))
                        .build();
            }

            if (!isAllowedToModify(user, existingComment)) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Collections.singletonMap("error", "You are not allowed to delete this comment"))
                        .build();
            }

            // Delete the comment
            commentService.deleteComment(commentId);

            // Create a success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Comment deleted successfully");
            return Response.ok(response).build();
        } catch (Exception e) {
            return createErrorResponse("Error deleting comment: " + e.getMessage());
        }
    }

    /**
     * Add a reply to a comment
     *
     * @param commentId   The ID of the parent comment
     * @param replyRequest The reply data
     * @return The created reply
     */
    @POST
    @Path("/{commentId}/reply")
    public Response addReply(@PathParam("commentId") String commentId, Comment replyRequest) {
        try {
            // Get the current user
            ConfluenceUser user = AuthenticatedUserThreadLocal.get();
            if (user == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Collections.singletonMap("error", "User not authenticated"))
                        .build();
            }

            // Set the reply metadata
            replyRequest.setParentId(commentId);
            replyRequest.setAuthorUsername(user.getName());
            replyRequest.setAuthorName(user.getFullName());
            replyRequest.setAuthorAvatarUrl(getUserAvatarUrl(user));
            replyRequest.setTimestamp(System.currentTimeMillis());

            // Add the reply
            Comment addedReply = commentService.addReply(commentId, replyRequest);

            // Create a success response
            CommentResponse response = new CommentResponse(true, "Reply added successfully", addedReply);
            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (Exception e) {
            return createErrorResponse("Error adding reply: " + e.getMessage());
        }
    }

    /**
     * Check if a user is allowed to modify a comment
     *
     * @param user    The user
     * @param comment The comment
     * @return true if the user is allowed to modify the comment
     */
    private boolean isAllowedToModify(ConfluenceUser user, Comment comment) {
        // The user can modify their own comments
        if (user.getName().equals(comment.getAuthorUsername())) {
            return true;
        }

        // Admins can modify any comment
        return userManager.isSystemAdmin(user) || userManager.isAdmin(user);
    }

    /**
     * Get a user's avatar URL
     *
     * @param user The user
     * @return The avatar URL
     */
    private String getUserAvatarUrl(ConfluenceUser user) {
        // In a real implementation, we would get the user's avatar URL from Confluence
        // For now, we'll return a placeholder
        return "/images/icons/profilepics/default.png";
    }

    /**
     * Create an error response
     *
     * @param message The error message
     * @return The response
     */
    private Response createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        return Response.status(Response.Status.BAD_REQUEST).entity(errorResponse).build();
    }
}