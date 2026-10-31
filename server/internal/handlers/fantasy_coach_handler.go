package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"time"

	"dreamedge/server/internal/ai"
	"dreamedge/server/internal/engine"
	"dreamedge/server/internal/repository"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type FantasyCoachResponse struct {
	MatchesAnalysed     int      `json:"matches_analysed"`
	SelectionControl    *float64 `json:"selection_control,omitempty"`
	CaptaincyEfficiency *float64 `json:"captaincy_efficiency,omitempty"`
	BestDepartment      string   `json:"best_department,omitempty"`
	PointsMissed        *float64 `json:"points_missed,omitempty"`
	StrongPicks         *int     `json:"strong_picks,omitempty"`
	Report              string   `json:"report"`
	IsDemo              bool     `json:"is_demo"`
	Message             string   `json:"message,omitempty"`
}

type playerCandidate struct {
	ID     string
	Role   string
	Points float64
}

type coachMetrics struct {
	SelectionControl    float64
	CaptaincyEfficiency float64
	PointsMissed        float64
	StrongPicks         int
	BestDepartment      string
	HasSelectionData    bool
	HasCaptaincyData    bool
}

func GetFantasyCoach(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	teams, err := repository.GetAllFantasyTeams(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch fantasy teams",
		})
		return
	}

	if len(teams) == 0 {
		c.JSON(http.StatusOK, FantasyCoachResponse{
			MatchesAnalysed: 0,
			Message:         "No fantasy teams found. Create a fantasy team to get started.",
		})
		return
	}

	autopsies := make([]AutopsyResponse, 0)
	isDemo := false

	var (
		totalSelectionControl float64
		selectionCount        int

		totalCaptaincyEfficiency float64
		captaincyCount           int

		totalPointsMissed float64
		totalStrongPicks  int

		departmentPoints = make(map[string]float64)
	)

	for _, team := range teams {
		recorder := httptest.NewRecorder()
		autopsyContext, _ := gin.CreateTestContext(recorder)

		autopsyContext.Request = httptest.NewRequest(
			http.MethodGet,
			"/api/teams/"+team.ID.Hex()+"/autopsy",
			nil,
		)

		autopsyContext.Params = gin.Params{
			{
				Key:   "id",
				Value: team.ID.Hex(),
			},
		}

		GetFantasyTeamAutopsy(autopsyContext)

		if recorder.Code != http.StatusOK {
			continue
		}

		var result struct {
			Autopsy AutopsyResponse `json:"autopsy"`
		}

		if err := json.Unmarshal(recorder.Body.Bytes(), &result); err != nil {
			continue
		}

		autopsy := result.Autopsy
		autopsies = append(autopsies, autopsy)

		if autopsy.IsDemo {
			isDemo = true
		}

		metrics := calculateCoachMetrics(ctx, team.MatchID, autopsy)

		if metrics.HasSelectionData {
			totalSelectionControl += metrics.SelectionControl
			totalPointsMissed += metrics.PointsMissed
			selectionCount++
		}

		if metrics.HasCaptaincyData {
			totalCaptaincyEfficiency += metrics.CaptaincyEfficiency
			captaincyCount++
		}

		totalStrongPicks += metrics.StrongPicks

		// Aggregate points by player department.
		for _, player := range autopsy.Players {
			department := normalizeDepartment(player.Role)
			if department != "" {
				departmentPoints[department] += player.Breakdown.TotalPoints
			}
		}
	}

	if len(autopsies) == 0 {
		c.JSON(http.StatusOK, FantasyCoachResponse{
			MatchesAnalysed: 0,
			Message:         "No completed matches with available results were found.",
		})
		return
	}

	// Generate the AI coaching report.
	reportCtx, reportCancel := context.WithTimeout(ctx, 35*time.Second)
	defer reportCancel()

	report, err := ai.GenerateFantasyCoachReport(
		reportCtx,
		autopsies,
	)

	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":   "Failed to generate Fantasy Coach insights",
			"details": err.Error(),
		})
		return
	}

	response := FantasyCoachResponse{
		MatchesAnalysed: len(autopsies),
		Report:          report,
		IsDemo:          isDemo,
	}

	if selectionCount > 0 {
		selectionControl := totalSelectionControl / float64(selectionCount)
		response.SelectionControl = &selectionControl

		pointsMissed := totalPointsMissed
		response.PointsMissed = &pointsMissed
	}

	if captaincyCount > 0 {
		captaincyEfficiency := totalCaptaincyEfficiency / float64(captaincyCount)
		response.CaptaincyEfficiency = &captaincyEfficiency
	}

	strongPicks := totalStrongPicks
	response.StrongPicks = &strongPicks

	response.BestDepartment = getBestDepartment(departmentPoints)

	c.JSON(http.StatusOK, response)
}

// calculateCoachMetrics calculates metrics for one saved team.
func calculateCoachMetrics(
	ctx context.Context,
	matchID bson.ObjectID,
	autopsy AutopsyResponse,
) coachMetrics {
	var metrics coachMetrics

	// --------------------------------------------------
	// 1. Strong picks
	// Definition: selected players who scored above the
	// average base points of the selected team.
	// --------------------------------------------------

	if len(autopsy.Players) > 0 {
		average := autopsy.BasePoints / float64(len(autopsy.Players))

		for _, player := range autopsy.Players {
			if player.Breakdown.TotalPoints > average {
				metrics.StrongPicks++
			}
		}
	}

	// --------------------------------------------------
	// 2. Captaincy efficiency
	// Compare actual captain/vice-captain bonus against
	// the best possible captaincy bonus within the XI.
	// --------------------------------------------------

	baseScores := make([]float64, 0, len(autopsy.Players))

	for _, player := range autopsy.Players {
		baseScores = append(baseScores, player.Breakdown.TotalPoints)
	}

	if len(baseScores) >= 2 {
		sort.Sort(sort.Reverse(sort.Float64Slice(baseScores)))

		optimalBonus := baseScores[0] + (baseScores[1] * 0.5)
		actualBonus := autopsy.TotalPoints - autopsy.BasePoints

		if optimalBonus > 0 {
			efficiency := (actualBonus / optimalBonus) * 100

			if efficiency < 0 {
				efficiency = 0
			}
			if efficiency > 100 {
				efficiency = 100
			}

			metrics.CaptaincyEfficiency = efficiency
			metrics.HasCaptaincyData = true
		}
	}

	// --------------------------------------------------
	// 3. Selection control and points missed
	// Fetch every eligible player and their match stats.
	// --------------------------------------------------

	players, err := repository.GetPlayersByMatchID(ctx, matchID)
	if err != nil || len(players) == 0 {
		return metrics
	}

	allStats, err := repository.GetPlayerStatsByMatchID(ctx, matchID)
	if err != nil || len(allStats) == 0 {
		return metrics
	}

	statsByPlayer := make(map[string]struct {
		Points float64
	}, len(allStats))

	// Calculate actual fantasy points for every player.
	for _, player := range players {
		for _, stats := range allStats {
			if stats.PlayerID != player.ID {
				continue
			}

			breakdown, err := engine.CalculateT20Points(stats, player.Role)
			if err != nil {
				continue
			}

			statsByPlayer[player.ID.Hex()] = struct {
				Points float64
			}{
				Points: breakdown.TotalPoints,
			}

			break
		}
	}

	candidates := make([]playerCandidate, 0, len(statsByPlayer))

	for _, player := range players {
		result, exists := statsByPlayer[player.ID.Hex()]
		if !exists {
			continue
		}

		candidates = append(candidates, playerCandidate{
			ID:     player.ID.Hex(),
			Role:   player.Role,
			Points: result.Points,
		})
	}

	if len(candidates) == 0 {
		return metrics
	}

	// Sort all eligible players by their actual fantasy points.
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Points > candidates[j].Points
	})

	// First version: top 11 players, without applying
	// fantasy-team composition constraints.
	bestXI := 0.0

	limit := 11
	if len(candidates) < limit {
		limit = len(candidates)
	}

	for i := 0; i < limit; i++ {
		bestXI += candidates[i].Points
	}

	if bestXI <= 0 {
		return metrics
	}

	selectedPoints := autopsy.BasePoints

	control := (selectedPoints / bestXI) * 100

	if control < 0 {
		control = 0
	}
	if control > 100 {
		control = 100
	}

	missed := bestXI - selectedPoints
	if missed < 0 {
		missed = 0
	}

	metrics.SelectionControl = control
	metrics.PointsMissed = missed
	metrics.HasSelectionData = true

	return metrics
}

// Convert player roles into dashboard departments.
func normalizeDepartment(role string) string {
	role = strings.ToLower(strings.TrimSpace(role))

	switch {
	case strings.Contains(role, "all"):
		return "All-rounders"

	case strings.Contains(role, "wicket"),
		role == "wk",
		role == "keeper":
		return "Wicketkeepers"

	case strings.Contains(role, "bowl"):
		return "Bowlers"

	case strings.Contains(role, "bat"):
		return "Batters"

	default:
		return ""
	}
}

func getBestDepartment(points map[string]float64) string {
	bestDepartment := ""
	highestPoints := -1.0

	for department, total := range points {
		if total > highestPoints {
			highestPoints = total
			bestDepartment = department
		}
	}

	return bestDepartment
}
