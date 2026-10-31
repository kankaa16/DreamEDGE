package engine

import (
	"fmt"
	"strings"

	"dreamedge/server/internal/models"
)

type ScoreBreakdown struct {
	BattingPoints  float64 `json:"batting_points"`
	BowlingPoints  float64 `json:"bowling_points"`
	FieldingPoints float64 `json:"fielding_points"`
	OtherPoints    float64 `json:"other_points"`
	TotalPoints    float64 `json:"total_points"`
}

// Common scoring constants.
const (
	runPoint          = 1.0
	fourBonus         = 4.0
	sixBonus          = 6.0
	wicketPoint       = 30.0
	bowledLBWBonus    = 8.0
	dotBallPoint      = 1.0
	maidenOverBonus   = 12.0
	catchPoint        = 8.0
	threeCatchBonus   = 4.0
	stumpingPoint     = 12.0
	directRunOutPoint = 12.0
	indirectRunOut    = 6.0
	announcedBonus    = 4.0
	duckPenalty       = 2.0
)

type scoringRules struct {
	minBallsFaced  int
	minBallsBowled int
	strikeRate     func(float64) float64
	economyRate    func(float64) float64
	bonus25        bool
	bonus75        bool
}

// CalculatePoints chooses the scoring rules based on the match format.
func CalculatePoints(
	format string,
	stats models.PlayerStats,
	role string,
) (ScoreBreakdown, error) {
	switch strings.ToUpper(strings.TrimSpace(format)) {
	case "T20":
		return CalculateT20Points(stats, role)
	case "ODI":
		return CalculateODIPoints(stats, role)
	default:
		return ScoreBreakdown{}, fmt.Errorf("unsupported match format: %s", format)
	}
}

// CalculateT20Points calculates base T20 fantasy points.
func CalculateT20Points(
	stats models.PlayerStats,
	role string,
) (ScoreBreakdown, error) {
	return calculatePoints(stats, role, scoringRules{
		minBallsFaced:  5,
		minBallsBowled: 12,
		strikeRate:     calculateT20StrikeRatePoints,
		economyRate:    calculateT20EconomyPoints,
		bonus25:        true,
		bonus75:        true,
	})
}

// CalculateODIPoints calculates base ODI fantasy points.
func CalculateODIPoints(
	stats models.PlayerStats,
	role string,
) (ScoreBreakdown, error) {
	return calculatePoints(stats, role, scoringRules{
		minBallsFaced:  20,
		minBallsBowled: 30,
		strikeRate:     calculateODIStrikeRatePoints,
		economyRate:    calculateODIEconomyPoints,
		bonus25:        false,
		bonus75:        false,
	})
}

// Shared scoring calculation. Format-specific thresholds are passed through rules.
func calculatePoints(
	stats models.PlayerStats,
	role string,
	rules scoringRules,
) (ScoreBreakdown, error) {
	var result ScoreBreakdown

	if stats.BallsFaced < 0 ||
		stats.BallsBowled < 0 ||
		stats.Runs < 0 ||
		stats.Wickets < 0 ||
		stats.Fours < 0 ||
		stats.Sixes < 0 ||
		stats.DotBalls < 0 ||
		stats.MaidenOvers < 0 ||
		stats.Catches < 0 ||
		stats.DirectRunOuts < 0 ||
		stats.IndirectRunOuts < 0 ||
		stats.BowledLBW < 0 {
		return result, fmt.Errorf("player statistics cannot be negative")
	}

	// Batting points.
	result.BattingPoints += float64(stats.Runs) * runPoint
	result.BattingPoints += float64(stats.Fours) * fourBonus
	result.BattingPoints += float64(stats.Sixes) * sixBonus

	// Award only the highest applicable milestone bonus.
	switch {
	case stats.Runs >= 100:
		result.BattingPoints += 16
	case rules.bonus75 && stats.Runs >= 75:
		result.BattingPoints += 12
	case stats.Runs >= 50:
		result.BattingPoints += 8
	case rules.bonus25 && stats.Runs >= 25:
		result.BattingPoints += 4
	}

	// Duck penalty applies only to dismissed batters, wicketkeepers and all-rounders.
	normalizedRole := strings.ToLower(strings.TrimSpace(role))

	isEligibleForDuckPenalty :=
		normalizedRole == "batter" ||
			normalizedRole == "wicketkeeper" ||
			normalizedRole == "wicket-keeper" ||
			normalizedRole == "all-rounder"

	if stats.WasDismissed &&
		stats.Runs == 0 &&
		isEligibleForDuckPenalty {
		result.BattingPoints -= duckPenalty
	}

	// Format-specific strike-rate points.
	if stats.BallsFaced >= rules.minBallsFaced {
		result.BattingPoints += rules.strikeRate(stats.StrikeRate)
	}

	// Bowling points.
	result.BowlingPoints += float64(stats.DotBalls) * dotBallPoint
	result.BowlingPoints += float64(stats.Wickets) * wicketPoint
	result.BowlingPoints += float64(stats.BowledLBW) * bowledLBWBonus
	result.BowlingPoints += float64(stats.MaidenOvers) * maidenOverBonus

	switch {
	case stats.Wickets >= 5:
		result.BowlingPoints += 12
	case stats.Wickets >= 4:
		result.BowlingPoints += 8
	case stats.Wickets >= 3:
		result.BowlingPoints += 4
	}

	// Format-specific economy-rate points.
	if stats.BallsBowled >= rules.minBallsBowled {
		economy := float64(stats.RunsConceded) * 6 /
			float64(stats.BallsBowled)

		result.BowlingPoints += rules.economyRate(economy)
	}

	// Fielding points.
	result.FieldingPoints += float64(stats.Catches) * catchPoint

	if stats.Catches >= 3 {
		result.FieldingPoints += threeCatchBonus
	}

	result.FieldingPoints += float64(stats.Stumpings) * stumpingPoint
	result.FieldingPoints += float64(stats.DirectRunOuts) * directRunOutPoint
	result.FieldingPoints += float64(stats.IndirectRunOuts) * indirectRunOut

	// Announced lineup points.
	if stats.WasAnnounced {
		result.OtherPoints += announcedBonus
	}

	result.TotalPoints =
		result.BattingPoints +
			result.BowlingPoints +
			result.FieldingPoints +
			result.OtherPoints

	return result, nil
}

func calculateT20StrikeRatePoints(strikeRate float64) float64 {
	switch {
	case strikeRate > 170:
		return 6
	case strikeRate > 150:
		return 4
	case strikeRate >= 130:
		return 2
	case strikeRate >= 60 && strikeRate <= 70:
		return -2
	case strikeRate >= 50 && strikeRate < 60:
		return -4
	case strikeRate < 50:
		return -6
	default:
		return 0
	}
}

func calculateT20EconomyPoints(economy float64) float64 {
	switch {
	case economy < 5:
		return 6
	case economy < 6:
		return 4
	case economy <= 7:
		return 2
	case economy >= 10 && economy <= 11:
		return -2
	case economy > 11 && economy <= 12:
		return -4
	case economy > 12:
		return -6
	default:
		return 0
	}
}

func calculateODIStrikeRatePoints(strikeRate float64) float64 {
	switch {
	case strikeRate > 140:
		return 6
	case strikeRate > 120:
		return 4
	case strikeRate >= 100:
		return 2
	case strikeRate >= 50 && strikeRate < 60:
		return -2
	case strikeRate >= 40 && strikeRate < 50:
		return -4
	case strikeRate < 40:
		return -6
	default:
		return 0
	}
}

func calculateODIEconomyPoints(economy float64) float64 {
	switch {
	case economy < 2.5:
		return 6
	case economy < 3.5:
		return 4
	case economy < 4.5:
		return 2
	case economy >= 7 && economy < 8:
		return -2
	case economy >= 8 && economy < 9:
		return -4
	case economy >= 9:
		return -6
	default:
		return 0
	}
}
