package handlers

import (
	"context"
	"net/http"
	"time"

	"dreamedge/server/internal/models"
	"dreamedge/server/internal/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetAllMatches(c *gin.Context) {

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	matches, err := repository.GetAllMatches(ctx)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch matches",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"matches": matches,
	})
}

func GetMatchByID(c *gin.Context) {
	id := c.Param("id")

	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"msg":     "invalid match id requested",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	match, err := repository.GetMatchByID(ctx, objectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"msg":     "match not found",
		})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Match created successfully",
		"match":   match,
	})

}

func CreateMatch(c *gin.Context) {

	var match models.Match

	err := c.ShouldBindJSON(&match)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	match.ID = bson.NewObjectID()
	match.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	err = repository.CreateMatch(ctx, match)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create match",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Match created successfully",
		"match":   match,
	})
}

func DeleteFunc(c *gin.Context) {
	id := c.Param("id")
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"msg":     "invalid id!!",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	deleted, err := repository.DeleteMatch(ctx, objectID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "failed to delete match..",
		})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Match not found",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Match deleted successfully",
	})

}

func UpdateFunc(c *gin.Context) {

	id := c.Param("id")
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"msg":     "invalid id!!",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	updated, err := repository.UpdateMatch(ctx, objectID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "failed to delete match..",
		})
		return
	}

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Match not found",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Match deleted successfully",
	})

}
