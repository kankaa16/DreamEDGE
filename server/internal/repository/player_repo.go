package repository

import (
	"context"

	"dreamedge/server/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var playerCollection *mongo.Collection

// initialize player collection
func InitPlayerRepo(db *mongo.Database) {
	playerCollection = db.Collection("players")
}

// get all players belonging to a particular match
func GetPlayersByMatchID(ctx context.Context, matchID bson.ObjectID) ([]models.Player, error) {
	var players []models.Player

	cursor, err := playerCollection.Find(ctx, bson.M{"match_id": matchID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	//store all cursor results inside players
	err = cursor.All(ctx, &players)
	if err != nil {
		return nil, err
	}

	return players, nil
}

// get a single player using player ID
func GetPlayerByID(ctx context.Context, id bson.ObjectID) (models.Player, error) {
	var player models.Player

	err := playerCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&player)
	if err != nil {
		return player, err
	}

	return player, nil
}

// create a new player
func CreatePlayer(ctx context.Context, player models.Player) error {
	_, err := playerCollection.InsertOne(ctx, player)
	return err
}

// update an existing player
func UpdatePlayer(ctx context.Context, id bson.ObjectID, player models.Player) (bool, error) {
	update := bson.M{
		"$set": bson.M{
			"match_id":      player.MatchID,
			"name":          player.Name,
			"team":          player.Team,
			"role":          player.Role,
			"country":       player.Country,
			"batting_style": player.BattingStyle,
			"bowling_style": player.BowlingStyle,
		},
	}

	result, err := playerCollection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)

	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}

// delete a player
func DeletePlayer(ctx context.Context, id bson.ObjectID) (bool, error) {
	result, err := playerCollection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}
