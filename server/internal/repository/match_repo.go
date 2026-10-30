package repository

import (
	"context"

	"dreamedge/server/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var matchCollection *mongo.Collection

func InitMatchRepo(db *mongo.Database) {
	matchCollection = db.Collection("matches")
}

func GetAllMatches(ctx context.Context) ([]models.Match, error) {

	var matches []models.Match
	//cursor contains the MongoDB query results.
	cursor, err := matchCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)
	//cursor.all takes all the documents from the cursor and stores them in matches.
	err = cursor.All(ctx, &matches)
	if err != nil {
		return nil, err
	}

	return matches, nil
}

func GetMatchByID(ctx context.Context, id bson.ObjectID) (models.Match, error) {

	var match models.Match

	err := matchCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&match)
	if err != nil {
		return match, err
	}

	return match, nil
}

func CreateMatch(ctx context.Context, match models.Match) error {
	_, err := matchCollection.InsertOne(ctx, match)
	return err
}

func UpdateMatch(ctx context.Context, id bson.ObjectID) (bool, error) {
	var match models.Match
	update := bson.M{
		"$set": bson.M{
			"team1":  match.Team1,
			"team2":  match.Team2,
			"venue":  match.Venue,
			"format": match.Format,
			"status": match.Status,
			"date":   match.Date,
		},
	}

	result, err := matchCollection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)

	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}

func DeleteMatch(ctx context.Context, id bson.ObjectID) (bool, error) {
	result, err := matchCollection.DeleteOne(ctx, bson.M{"_id": id})

	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}
