package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"dreamedge/server/internal/models"
	"dreamedge/server/internal/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// validate selected players and captain choices
func validateFantasyTeam(ctx context.Context, team models.FantasyTeam) error {
	if len(team.SelectedPlayers) != 11 {
		return errors.New("exactly 11 players must be selected")
	}

	if team.CaptainID == team.ViceCaptainID {
		return errors.New("captain and vice-captain must be different")
	}

	selected := make(map[bson.ObjectID]bool)

	for _, id := range team.SelectedPlayers {
		if selected[id] {
			return errors.New("duplicate players are not allowed")
		}
		selected[id] = true
	}

	if !selected[team.CaptainID] {
		return errors.New("captain must be one of the selected players")
	}

	if !selected[team.ViceCaptainID] {
		return errors.New("vice-captain must be one of the selected players")
	}

	//check whether all selected players belong to this match
	matchPlayers, err := repository.GetPlayersByMatchID(ctx, team.MatchID)
	if err != nil {
		return err
	}

	validPlayers := make(map[bson.ObjectID]bool)

	for _, player := range matchPlayers {
		validPlayers[player.ID] = true
	}

	for _, id := range team.SelectedPlayers {
		if !validPlayers[id] {
			return errors.New("all selected players must belong to this match")
		}
	}

	return nil
}

// create a fantasy team
func CreateFantasyTeam(c *gin.Context) {
	var team models.FantasyTeam

	if err := c.ShouldBindJSON(&team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if team.MatchID.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Match ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := validateFantasyTeam(ctx, team)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team.ID = bson.NilObjectID
	team.CreatedAt = time.Now()
	team.UpdatedAt = time.Now()

	err = repository.CreateFantasyTeam(ctx, team)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Fantasy team created successfully",
	})
}

// get a fantasy team by ID
func GetFantasyTeamByID(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	team, err := repository.GetFantasyTeamByID(ctx, id)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fantasy team not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"team": team})
}

// get all fantasy teams belonging to a match
func GetFantasyTeamsByMatchID(c *gin.Context) {
	matchID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	teams, err := repository.GetFantasyTeamsByMatchID(ctx, matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"teams": teams})
}

// update an existing fantasy team
func UpdateFantasyTeam(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	//fetch existing team
	existingTeam, err := repository.GetFantasyTeamByID(ctx, id)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fantasy team not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var team models.FantasyTeam
	if err := c.ShouldBindJSON(&team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//keep the original match ID
	team.MatchID = existingTeam.MatchID

	err = validateFantasyTeam(ctx, team)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team.UpdatedAt = time.Now()

	updated, err := repository.UpdateFantasyTeam(ctx, id, team)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fantasy team not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Fantasy team updated successfully",
	})
}

// delete a fantasy team
func DeleteFantasyTeam(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	deleted, err := repository.DeleteFantasyTeam(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fantasy team not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Fantasy team deleted successfully",
	})
}
