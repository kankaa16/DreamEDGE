package autopsy

import (
	"math"
	"sort"

	"dreamedge/server/internal/engine"
)

type SelectionCandidate struct {
	PlayerID  string                `json:"player_id"`
	Name      string                `json:"name"`
	Team      string                `json:"team"`
	Role      string                `json:"role"`
	Points    float64               `json:"points"`
	Breakdown engine.ScoreBreakdown `json:"breakdown"`
	Selected  bool                  `json:"selected"`
}

type SelectionReplacement struct {
	OutPlayer    string  `json:"out_player"`
	OutPoints    float64 `json:"out_points"`
	InPlayer     string  `json:"in_player"`
	InPoints     float64 `json:"in_points"`
	PointsGained float64 `json:"points_gained"`
}

type MissedOpportunity struct {
	PlayerID       string  `json:"player_id"`
	Name           string  `json:"name"`
	Team           string  `json:"team"`
	Role           string  `json:"role"`
	Points         float64 `json:"points"`
	Category       string  `json:"category"`
	BattingPoints  float64 `json:"batting_points"`
	BowlingPoints  float64 `json:"bowling_points"`
	FieldingPoints float64 `json:"fielding_points"`
	Reason         string  `json:"reason"`
}

type OpportunityCategory struct {
	Count       int     `json:"count"`
	TotalPoints float64 `json:"total_points"`
}

type SelectionAnalysis struct {
	SelectedPoints           float64                        `json:"selected_points"`
	BestPossiblePoints       float64                        `json:"best_possible_points"`
	PointsMissed             float64                        `json:"points_missed"`
	IsOptimal                bool                           `json:"is_optimal"`
	SelectedPlayers          []SelectionCandidate           `json:"selected_players"`
	BestPossibleXI           []SelectionCandidate           `json:"best_possible_xi"`
	Replacements             []SelectionReplacement         `json:"replacements"`
	MissedOpportunities      []MissedOpportunity            `json:"missed_opportunities"`
	BiggestMissedOpportunity *MissedOpportunity             `json:"biggest_missed_opportunity"`
	MissedByCategory         map[string]OpportunityCategory `json:"missed_by_category"`
}

type selectionLimits struct {
	minWK   int
	maxWK   int
	minBAT  int
	maxBAT  int
	minAR   int
	maxAR   int
	minBOWL int
	maxBOWL int
	maxTeam int
}

func AnalyzeSelection(candidates []SelectionCandidate) SelectionAnalysis {
	limits := selectionLimits{
		minWK:   1,
		maxWK:   4,
		minBAT:  3,
		maxBAT:  6,
		minAR:   1,
		maxAR:   4,
		minBOWL: 3,
		maxBOWL: 6,
		maxTeam: 7,
	}

	selected := make([]SelectionCandidate, 0)
	pool := make([]SelectionCandidate, 0)

	for _, player := range candidates {
		pool = append(pool, player)
		if player.Selected {
			selected = append(selected, player)
		}
	}

	result := SelectionAnalysis{
		SelectedPlayers:     selected,
		BestPossibleXI:      make([]SelectionCandidate, 0),
		Replacements:        make([]SelectionReplacement, 0),
		MissedOpportunities: make([]MissedOpportunity, 0),
		MissedByCategory:    make(map[string]OpportunityCategory),
	}

	for _, player := range selected {
		result.SelectedPoints += player.Points
	}

	if len(selected) != 11 || len(pool) < 11 {
		return result
	}

	sort.Slice(pool, func(i, j int) bool {
		return pool[i].Points > pool[j].Points
	})

	bestPoints := math.Inf(-1)
	current := make([]SelectionCandidate, 0, 11)
	var bestXI []SelectionCandidate

	var search func(
		index int,
		points float64,
		teams map[string]int,
		wk, bat, ar, bowl int,
	)

	search = func(index int, points float64, teams map[string]int, wk, bat, ar, bowl int) {
		if len(current) == 11 {
			if wk < limits.minWK || wk > limits.maxWK ||
				bat < limits.minBAT || bat > limits.maxBAT ||
				ar < limits.minAR || ar > limits.maxAR ||
				bowl < limits.minBOWL || bowl > limits.maxBOWL {
				return
			}

			if points > bestPoints {
				bestPoints = points
				bestXI = append([]SelectionCandidate(nil), current...)
			}
			return
		}

		if index >= len(pool) || len(pool)-index < 11-len(current) {
			return
		}

		player := pool[index]

		// Try including this player.
		if teams[player.Team] < limits.maxTeam {
			nextWK, nextBAT := wk, bat
			nextAR, nextBOWL := ar, bowl

			switch player.Role {
			case "Wicketkeeper":
				nextWK++
			case "Batter":
				nextBAT++
			case "All-rounder":
				nextAR++
			case "Bowler":
				nextBOWL++
			}

			if nextWK <= limits.maxWK &&
				nextBAT <= limits.maxBAT &&
				nextAR <= limits.maxAR &&
				nextBOWL <= limits.maxBOWL {

				current = append(current, player)
				teams[player.Team]++

				search(index+1, points+player.Points, teams,
					nextWK, nextBAT, nextAR, nextBOWL)

				teams[player.Team]--
				current = current[:len(current)-1]
			}
		}

		// Try excluding this player.
		search(index+1, points, teams, wk, bat, ar, bowl)
	}

	search(0, 0, make(map[string]int), 0, 0, 0, 0)

	if len(bestXI) != 11 {
		return result
	}

	result.BestPossibleXI = bestXI
	result.BestPossiblePoints = bestPoints
	result.PointsMissed = bestPoints - result.SelectedPoints
	result.IsOptimal = result.PointsMissed <= 0

	selectedIDs := make(map[string]bool)
	bestIDs := make(map[string]bool)

	for _, player := range selected {
		selectedIDs[player.PlayerID] = true
	}

	for _, player := range bestXI {
		bestIDs[player.PlayerID] = true
	}

	var outgoing, incoming []SelectionCandidate

	for _, player := range selected {
		if !bestIDs[player.PlayerID] {
			outgoing = append(outgoing, player)
		}
	}

	for _, player := range bestXI {
		if !selectedIDs[player.PlayerID] {
			incoming = append(incoming, player)
		}
	}

	// Sort outgoing players from lowest to highest points.
	sort.Slice(outgoing, func(i, j int) bool {
		return outgoing[i].Points < outgoing[j].Points
	})

	// Track incoming players that have already been paired.
	usedIncoming := make(map[string]bool)

	for _, out := range outgoing {
		bestIndex := -1
		bestGain := 0.0

		for i, in := range incoming {
			if usedIncoming[in.PlayerID] {
				continue
			}

			// Only suggest replacements with the same role.
			if out.Role != in.Role {
				continue
			}

			gain := in.Points - out.Points

			if gain > bestGain {
				bestGain = gain
				bestIndex = i
			}
		}

		if bestIndex == -1 {
			continue
		}

		in := incoming[bestIndex]
		usedIncoming[in.PlayerID] = true

		result.Replacements = append(result.Replacements, SelectionReplacement{
			OutPlayer:    out.Name,
			OutPoints:    out.Points,
			InPlayer:     in.Name,
			InPoints:     in.Points,
			PointsGained: bestGain,
		})
	}

	// Find the best unselected players who fit into the optimal XI.
	missed := incoming

	sort.Slice(missed, func(i, j int) bool {
		return missed[i].Points > missed[j].Points
	})

	for i, player := range missed {
		if i >= 5 {
			break
		}

		category := opportunityCategory(player)

		opportunity := MissedOpportunity{
			PlayerID:       player.PlayerID,
			Name:           player.Name,
			Team:           player.Team,
			Role:           player.Role,
			Points:         player.Points,
			Category:       category,
			BattingPoints:  player.Breakdown.BattingPoints,
			BowlingPoints:  player.Breakdown.BowlingPoints,
			FieldingPoints: player.Breakdown.FieldingPoints,
			Reason:         opportunityReason(player, category),
		}

		result.MissedOpportunities = append(result.MissedOpportunities, opportunity)

		summary := result.MissedByCategory[category]
		summary.Count++
		summary.TotalPoints += player.Points
		result.MissedByCategory[category] = summary
	}

	if len(result.MissedOpportunities) > 0 {
		result.BiggestMissedOpportunity = &result.MissedOpportunities[0]
	}

	return result
}

func opportunityCategory(player SelectionCandidate) string {
	batting := player.Breakdown.BattingPoints
	bowling := player.Breakdown.BowlingPoints

	if player.Role == "All-rounder" && batting > 0 && bowling > 0 {
		return "all_rounder"
	}

	if batting >= bowling {
		return "batting"
	}

	return "bowling"
}

func opportunityReason(player SelectionCandidate, category string) string {
	switch category {
	case "batting":
		return "Generated most of their fantasy points through batting."
	case "bowling":
		return "Generated most of their fantasy points through bowling."
	case "all_rounder":
		return "Contributed fantasy points through both batting and bowling."
	default:
		return "Generated fantasy points through their match performance."
	}
}
