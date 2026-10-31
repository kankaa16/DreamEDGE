package engine

import (
	"testing"

	"dreamedge/server/internal/models"
)

func TestCalculateT20Points(t *testing.T) {
	tests := []struct {
		name     string
		stats    models.PlayerStats
		role     string
		expected float64
	}{
		{
			name: "batter scores fifty",
			stats: models.PlayerStats{
				Runs:         55,
				BallsFaced:   30,
				Fours:        5,
				Sixes:        2,
				StrikeRate:   183.33,
				WasAnnounced: true,
			},
			role:     "Batter",
			expected: 105,
		},
		{
			name: "bowler takes three wickets",
			stats: models.PlayerStats{
				Wickets:      3,
				BowledLBW:    1,
				DotBalls:     10,
				MaidenOvers:  1,
				BallsBowled:  18,
				RunsConceded: 24,
			},
			role:     "Bowler",
			expected: 124,
		},
		{
			name: "player earns fielding points",
			stats: models.PlayerStats{
				Catches:         3,
				Stumpings:       1,
				DirectRunOuts:   1,
				IndirectRunOuts: 1,
			},
			role:     "Wicketkeeper",
			expected: 58,
		},
		{
			name: "batter gets duck penalty",
			stats: models.PlayerStats{
				Runs:         0,
				WasDismissed: true,
			},
			role:     "Batter",
			expected: -2,
		},
		{
			name: "not dismissed batter gets no duck penalty",
			stats: models.PlayerStats{
				Runs: 0,
			},
			role:     "Batter",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := CalculateT20Points(tt.stats, tt.role)

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if result.TotalPoints != tt.expected {
				t.Errorf(
					"expected %.2f points, got %.2f",
					tt.expected,
					result.TotalPoints,
				)
			}
		})
	}
}

func TestCalculateT20PointsRejectsNegativeStats(t *testing.T) {
	stats := models.PlayerStats{
		Runs: -10,
	}

	_, err := CalculateT20Points(stats, "Batter")

	if err == nil {
		t.Error("expected an error for negative statistics")
	}
}
