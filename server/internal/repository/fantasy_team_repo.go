package repository

import (
	"context"

	"dreamedge/server/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var fantasyTeamCollection *mongo.Collection

// initialize fantasy team collection
func InitFantasyTeamRepo(db *mongo.Database) {
	fantasyTeamCollection = db.Collection("fantasy_teams")
}

// create a fantasy team
func CreateFantasyTeam(ctx context.Context, team models.FantasyTeam) error {
	_, err := fantasyTeamCollection.InsertOne(ctx, team)
	return err
}

// get a fantasy team by ID
func GetFantasyTeamByID(ctx context.Context, id bson.ObjectID) (models.FantasyTeam, error) {
	var team models.FantasyTeam

	err := fantasyTeamCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&team)
	if err != nil {
		return team, err
	}

	return team, nil
}

// get all fantasy teams belonging to a match
func GetFantasyTeamsByMatchID(ctx context.Context, matchID bson.ObjectID) ([]models.FantasyTeam, error) {
	var teams []models.FantasyTeam

	cursor, err := fantasyTeamCollection.Find(ctx, bson.M{"match_id": matchID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &teams)
	if err != nil {
		return nil, err
	}

	return teams, nil
}

// update a fantasy team
func UpdateFantasyTeam(ctx context.Context, id bson.ObjectID, team models.FantasyTeam) (bool, error) {
	update := bson.M{
		"$set": bson.M{
			"team_name":        team.TeamName,
			"selected_players": team.SelectedPlayers,
			"captain_id":       team.CaptainID,
			"vice_captain_id":  team.ViceCaptainID,
			"updated_at":       team.UpdatedAt,
		},
	}

	result, err := fantasyTeamCollection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)

	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}

// delete a fantasy team
func DeleteFantasyTeam(ctx context.Context, id bson.ObjectID) (bool, error) {
	result, err := fantasyTeamCollection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}

func GetAllFantasyTeams(ctx context.Context) ([]models.FantasyTeam, error) {
	var teams []models.FantasyTeam

	cursor, err := fantasyTeamCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &teams); err != nil {
		return nil, err
	}

	return teams, nil
}
