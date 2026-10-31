package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"dreamedge/server/internal/engine"
	"dreamedge/server/internal/models"
	"dreamedge/server/internal/repository"
	autopsyservice "dreamedge/server/internal/services/autopsy"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type AutopsyPlayer struct {
	PlayerID      string                `json:"player_id"`
	Name          string                `json:"name"`
	Team          string                `json:"team"`
	Role          string                `json:"role"`
	IsCaptain     bool                  `json:"is_captain"`
	IsViceCaptain bool                  `json:"is_vice_captain"`
	Multiplier    float64               `json:"multiplier"`
	Breakdown     engine.ScoreBreakdown `json:"breakdown"`
	FinalPoints   float64               `json:"final_points"`
}

type AutopsyResponse struct {
	TeamID            string                           `json:"team_id"`
	TeamName          string                           `json:"team_name"`
	MatchID           string                           `json:"match_id"`
	Match             string                           `json:"match"`
	Format            string                           `json:"format"`
	IsDemo            bool                             `json:"is_demo"`
	Players           []AutopsyPlayer                  `json:"players"`
	BasePoints        float64                          `json:"base_points"`
	TotalPoints       float64                          `json:"total_points"`
	CaptainPoints     float64                          `json:"captain_points"`
	ViceCaptainPoints float64                          `json:"vice_captain_points"`
	Performance       autopsyservice.TeamPerformance   `json:"performance"`
	Captaincy         autopsyservice.CaptaincyAnalysis `json:"captaincy"`
	Selection         autopsyservice.SelectionAnalysis `json:"selection"`
}

// get the performance analysis of a saved fantasy team
func GetFantasyTeamAutopsy(c *gin.Context) {
	teamID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fantasy team ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// fetch the saved fantasy team
	team, err := repository.GetFantasyTeamByID(ctx, teamID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fantasy team not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// fetch the associated match
	match, err := repository.GetMatchByID(ctx, team.MatchID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !strings.EqualFold(match.Status, "completed") {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Autopsy is available only after the match is completed",
		})
		return
	}

	if match.Result == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Match result is not available yet",
		})
		return
	}

	format := strings.ToUpper(strings.TrimSpace(match.Format))

	if format != "T20" && format != "ODI" {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Autopsy currently supports T20 and ODI matches only",
		})
		return
	}

	response := AutopsyResponse{
		TeamID:   team.ID.Hex(),
		TeamName: team.TeamName,
		MatchID:  match.ID.Hex(),
		Match:    match.Team1 + " vs " + match.Team2,
		Format:   match.Format,
		IsDemo:   match.Result.IsDemo,
		Players:  make([]AutopsyPlayer, 0, len(team.SelectedPlayers)),
	}

	// fetch every player and every available scorecard for this match
	allPlayers, err := repository.GetPlayersByMatchID(ctx, team.MatchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	allStats, err := repository.GetPlayerStatsByMatchID(ctx, team.MatchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	playersByID := make(map[bson.ObjectID]models.Player, len(allPlayers))
	for _, player := range allPlayers {
		playersByID[player.ID] = player
	}

	statsByPlayerID := make(map[bson.ObjectID]models.PlayerStats, len(allStats))
	for _, stats := range allStats {
		statsByPlayerID[stats.PlayerID] = stats
	}

	selectedIDs := make(map[bson.ObjectID]bool, len(team.SelectedPlayers))
	for _, playerID := range team.SelectedPlayers {
		selectedIDs[playerID] = true
	}

	// calculate the points for every player who has match statistics
	selectionCandidates := make([]autopsyservice.SelectionCandidate, 0, len(allPlayers))

	for _, player := range allPlayers {
		stats, exists := statsByPlayerID[player.ID]
		if !exists {
			// players without a scorecard cannot be compared
			continue
		}

		breakdown, scoreErr := engine.CalculatePoints(
			format,
			stats,
			player.Role,
		)
		if scoreErr != nil {
			// selected players are validated separately below
			if selectedIDs[player.ID] {
				c.JSON(http.StatusUnprocessableEntity, gin.H{
					"error":  scoreErr.Error(),
					"player": player.Name,
				})
				return
			}
			continue
		}

		selectionCandidates = append(selectionCandidates, autopsyservice.SelectionCandidate{
			PlayerID:  player.ID.Hex(),
			Name:      player.Name,
			Team:      player.Team,
			Role:      player.Role,
			Points:    breakdown.TotalPoints,
			Breakdown: breakdown,
			Selected:  selectedIDs[player.ID],
		})
	}

	// prepare player data for team-level analysis
	performancePlayers := make([]autopsyservice.PlayerPerformance, 0, len(team.SelectedPlayers))

	// calculate points and multipliers for the selected XI
	for _, playerID := range team.SelectedPlayers {
		player, exists := playersByID[playerID]
		if !exists {
			c.JSON(http.StatusConflict, gin.H{
				"error":     "A selected player could not be found in this match",
				"player_id": playerID.Hex(),
			})
			return
		}

		stats, exists := statsByPlayerID[playerID]
		if !exists {
			c.JSON(http.StatusConflict, gin.H{
				"error":  "Statistics are missing for a selected player",
				"player": player.Name,
			})
			return
		}

		breakdown, err := engine.CalculatePoints(
			format,
			stats,
			player.Role,
		)
		if err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error":  err.Error(),
				"player": player.Name,
			})
			return
		}

		isCaptain := playerID == team.CaptainID
		isViceCaptain := playerID == team.ViceCaptainID

		multiplier := 1.0
		if isCaptain {
			multiplier = 2.0
		} else if isViceCaptain {
			multiplier = 1.5
		}

		finalPoints := breakdown.TotalPoints * multiplier

		response.BasePoints += breakdown.TotalPoints
		response.TotalPoints += finalPoints

		if isCaptain {
			response.CaptainPoints = finalPoints
		}

		if isViceCaptain {
			response.ViceCaptainPoints = finalPoints
		}

		response.Players = append(response.Players, AutopsyPlayer{
			PlayerID:      playerID.Hex(),
			Name:          player.Name,
			Team:          player.Team,
			Role:          player.Role,
			IsCaptain:     isCaptain,
			IsViceCaptain: isViceCaptain,
			Multiplier:    multiplier,
			Breakdown:     breakdown,
			FinalPoints:   finalPoints,
		})

		performancePlayers = append(performancePlayers, autopsyservice.PlayerPerformance{
			PlayerID:      playerID.Hex(),
			Name:          player.Name,
			Team:          player.Team,
			Role:          player.Role,
			IsCaptain:     isCaptain,
			IsViceCaptain: isViceCaptain,
			Multiplier:    multiplier,
			Breakdown:     breakdown,
			FinalPoints:   finalPoints,
		})
	}

	// analyze overall team performance
	response.Performance = autopsyservice.AnalyzeTeamPerformance(performancePlayers)

	// analyze captain and vice-captain choices
	response.Captaincy = autopsyservice.AnalyzeCaptaincy(performancePlayers)

	// compare the selected XI against all other players in this match
	response.Selection = autopsyservice.AnalyzeSelection(selectionCandidates)

	c.JSON(http.StatusOK, gin.H{
		"autopsy": response,
	})
}
