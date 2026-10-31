package autopsy

import (
	"sort"

	"dreamedge/server/internal/engine"
)

type PlayerPerformance struct {
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

type Performer struct {
	PlayerID     string  `json:"player_id"`
	Name         string  `json:"name"`
	Points       float64 `json:"points"`
	Contribution float64 `json:"contribution"`
}

type TeamPerformance struct {
	TotalPoints         float64     `json:"total_points"`
	BattingPoints       float64     `json:"batting_points"`
	BowlingPoints       float64     `json:"bowling_points"`
	FieldingPoints      float64     `json:"fielding_points"`
	OtherPoints         float64     `json:"other_points"`
	TopPerformers       []Performer `json:"top_performers"`
	BottomPerformers    []Performer `json:"bottom_performers"`
	TopPlayerDependency float64     `json:"top_player_dependency"`
	StrongestDepartment string      `json:"strongest_department"`
	WeakestDepartment   string      `json:"weakest_department"`
}

func AnalyzeTeamPerformance(players []PlayerPerformance) TeamPerformance {
	result := TeamPerformance{
		TopPerformers:    []Performer{},
		BottomPerformers: []Performer{},
	}

	if len(players) == 0 {
		return result
	}

	performers := make([]Performer, 0, len(players))

	for _, player := range players {
		// Apply captain/vice-captain multiplier to each department.
		result.BattingPoints += player.Breakdown.BattingPoints * player.Multiplier
		result.BowlingPoints += player.Breakdown.BowlingPoints * player.Multiplier
		result.FieldingPoints += player.Breakdown.FieldingPoints * player.Multiplier
		result.OtherPoints += player.Breakdown.OtherPoints * player.Multiplier

		result.TotalPoints += player.FinalPoints

		performers = append(performers, Performer{
			PlayerID: player.PlayerID,
			Name:     player.Name,
			Points:   player.FinalPoints,
		})
	}

	// Calculate each player's percentage contribution.
	for i := range performers {
		if result.TotalPoints > 0 {
			performers[i].Contribution =
				(performers[i].Points / result.TotalPoints) * 100
		}
	}

	// Sort from highest to lowest points.
	sort.Slice(performers, func(i, j int) bool {
		return performers[i].Points > performers[j].Points
	})

	// Keep the top 3 performers.
	topCount := 3
	if len(performers) < topCount {
		topCount = len(performers)
	}

	result.TopPerformers = append(
		result.TopPerformers,
		performers[:topCount]...,
	)

	// Keep the bottom 3 performers.
	bottomCount := 3
	if len(performers) < bottomCount {
		bottomCount = len(performers)
	}

	start := len(performers) - bottomCount
	result.BottomPerformers = append(
		result.BottomPerformers,
		performers[start:]...,
	)

	// Measure how dependent the team was on its highest scorer.
	if result.TotalPoints > 0 {
		result.TopPlayerDependency =
			(performers[0].Points / result.TotalPoints) * 100
	}

	// Identify strongest and weakest cricket departments.
	departments := []struct {
		name   string
		points float64
	}{
		{"batting", result.BattingPoints},
		{"bowling", result.BowlingPoints},
		{"fielding", result.FieldingPoints},
	}

	strongest := departments[0]
	weakest := departments[0]

	for _, department := range departments[1:] {
		if department.points > strongest.points {
			strongest = department
		}

		if department.points < weakest.points {
			weakest = department
		}
	}

	result.StrongestDepartment = strongest.name
	result.WeakestDepartment = weakest.name

	return result
}
