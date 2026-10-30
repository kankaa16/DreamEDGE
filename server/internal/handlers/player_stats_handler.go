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

// get stats of all players in a match
func GetPlayerStatsByMatchID(c *gin.Context) {
	matchID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stats, err := repository.GetPlayerStatsByMatchID(ctx, matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// get stats of a particular player in a match
func GetPlayerStats(c *gin.Context) {
	matchID, err := bson.ObjectIDFromHex(c.Param("matchID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	playerID, err := bson.ObjectIDFromHex(c.Param("playerID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stats, err := repository.GetPlayerStats(ctx, matchID, playerID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Player stats not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// create player stats
func CreatePlayerStats(c *gin.Context) {
	var stats models.PlayerStats

	if err := c.ShouldBindJSON(&stats); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	stats.ID = bson.NilObjectID
	stats.CreatedAt = time.Now()
	stats.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := repository.CreatePlayerStats(ctx, stats)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Player stats created successfully"})
}

// update player stats
func UpdatePlayerStats(c *gin.Context) {
	matchID, err := bson.ObjectIDFromHex(c.Param("matchID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	playerID, err := bson.ObjectIDFromHex(c.Param("playerID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	var stats models.PlayerStats
	if err := c.ShouldBindJSON(&stats); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	stats.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updated, err := repository.UpdatePlayerStats(ctx, matchID, playerID, stats)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Player stats not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Player stats updated successfully"})
}
