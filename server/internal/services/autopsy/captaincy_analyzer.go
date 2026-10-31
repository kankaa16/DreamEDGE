package autopsy

type CaptaincyAnalysis struct {
	CurrentCaptain     string  `json:"current_captain"`
	CurrentViceCaptain string  `json:"current_vice_captain"`
	CurrentPoints      float64 `json:"current_points"`

	BestCaptain        string  `json:"best_captain"`
	BestViceCaptain    string  `json:"best_vice_captain"`
	BestPossiblePoints float64 `json:"best_possible_points"`

	PointsLost            float64 `json:"points_lost"`
	CurrentCaptainOptimal bool    `json:"current_captain_optimal"`
	CurrentPairOptimal    bool    `json:"current_pair_optimal"`
}

func AnalyzeCaptaincy(players []PlayerPerformance) CaptaincyAnalysis {
	result := CaptaincyAnalysis{}

	if len(players) < 2 {
		return result
	}

	basePoints := 0.0
	currentCaptainBase := 0.0
	currentViceBase := 0.0

	for _, player := range players {
		basePoints += player.Breakdown.TotalPoints

		if player.IsCaptain {
			result.CurrentCaptain = player.Name
			currentCaptainBase = player.Breakdown.TotalPoints
		}

		if player.IsViceCaptain {
			result.CurrentViceCaptain = player.Name
			currentViceBase = player.Breakdown.TotalPoints
		}
	}

	result.CurrentPoints = basePoints +
		currentCaptainBase +
		(0.5 * currentViceBase)

	bestScore := -1.0
	bestCaptainBase := 0.0

	// Try every possible captain and vice-captain pair.
	for i := 0; i < len(players); i++ {
		for j := 0; j < len(players); j++ {
			if i == j {
				continue
			}

			captainPoints := players[i].Breakdown.TotalPoints
			vicePoints := players[j].Breakdown.TotalPoints

			possiblePoints := basePoints +
				captainPoints +
				(0.5 * vicePoints)

			if possiblePoints > bestScore {
				bestScore = possiblePoints
				result.BestCaptain = players[i].Name
				result.BestViceCaptain = players[j].Name
				bestCaptainBase = captainPoints
			}
		}
	}

	result.BestPossiblePoints = bestScore
	result.PointsLost = bestScore - result.CurrentPoints

	result.CurrentCaptainOptimal =
		currentCaptainBase == bestCaptainBase

	result.CurrentPairOptimal =
		result.CurrentCaptain == result.BestCaptain &&
			result.CurrentViceCaptain == result.BestViceCaptain

	return result
}
