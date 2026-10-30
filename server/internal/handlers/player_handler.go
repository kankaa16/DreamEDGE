package handlers

import (
	"context"
	"net/http"
	"time"

	"dreamedge/server/internal/models"
	"dreamedge/server/internal/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// get all players belonging to a match
func GetPlayersByMatchID(c *gin.Context) {
	id := c.Param("id")

	matchID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid match ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	players, err := repository.GetPlayersByMatchID(ctx, matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch players",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"players": players,
	})
}

// get a single player
func GetPlayerByID(c *gin.Context) {
	id := c.Param("id")

	playerID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid player ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	player, err := repository.GetPlayerByID(ctx, playerID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Player not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch player",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"player":  player,
	})
}

func CreatePlayer(c *gin.Context) {
	var player models.Player

	if err := c.ShouldBindJSON(&player); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	//generate player ID and creation time
	player.ID = bson.NewObjectID()
	player.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	err := repository.CreatePlayer(ctx, player)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create player",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Player created successfully",
		"player":  player,
	})
}

func UpdatePlayer(c *gin.Context) {
	id := c.Param("id")

	playerID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid player ID",
		})
		return
	}

	var player models.Player

	if err := c.ShouldBindJSON(&player); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	updated, err := repository.UpdatePlayer(ctx, playerID, player)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update player",
		})
		return
	}

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Player not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player updated successfully",
	})
}

func DeletePlayer(c *gin.Context) {
	id := c.Param("id")

	playerID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid player ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	deleted, err := repository.DeletePlayer(ctx, playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete player",
		})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Player not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player deleted successfully",
	})
}
