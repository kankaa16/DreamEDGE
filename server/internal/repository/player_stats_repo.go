package repository

import (
	"context"

	"dreamedge/server/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var playerStatsCollection *mongo.Collection

// initialize player stats collection
func InitPlayerStatsRepo(db *mongo.Database) {
	playerStatsCollection = db.Collection("player_stats")
}

// get stats of all players in a match
func GetPlayerStatsByMatchID(ctx context.Context, matchID bson.ObjectID) ([]models.PlayerStats, error) {
	var stats []models.PlayerStats

	cursor, err := playerStatsCollection.Find(ctx, bson.M{"match_id": matchID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &stats)
	if err != nil {
		return nil, err
	}

	return stats, nil
}

// get stats of a particular player in a match
func GetPlayerStats(ctx context.Context, matchID bson.ObjectID, playerID bson.ObjectID) (models.PlayerStats, error) {
	var stats models.PlayerStats

	err := playerStatsCollection.FindOne(ctx, bson.M{
		"match_id":  matchID,
		"player_id": playerID,
	}).Decode(&stats)

	if err != nil {
		return stats, err
	}

	return stats, nil
}

// create player stats
func CreatePlayerStats(ctx context.Context, stats models.PlayerStats) error {
	_, err := playerStatsCollection.InsertOne(ctx, stats)
	return err
}

// update player stats
func UpdatePlayerStats(ctx context.Context, matchID bson.ObjectID, playerID bson.ObjectID, stats models.PlayerStats) (bool, error) {
	update := bson.M{
		"$set": bson.M{
			"runs":           stats.Runs,
			"balls_faced":    stats.BallsFaced,
			"fours":          stats.Fours,
			"sixes":          stats.Sixes,
			"strike_rate":    stats.StrikeRate,
			"overs":          stats.Overs,
			"wickets":        stats.Wickets,
			"runs_conceded":  stats.RunsConceded,
			"economy":        stats.Economy,
			"catches":        stats.Catches,
			"run_outs":       stats.RunOuts,
			"stumpings":      stats.Stumpings,
			"fantasy_points": stats.FantasyPoints,
			"updated_at":     stats.UpdatedAt,
		},
	}

	result, err := playerStatsCollection.UpdateOne(
		ctx,
		bson.M{
			"match_id":  matchID,
			"player_id": playerID,
		},
		update,
	)

	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}
