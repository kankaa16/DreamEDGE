package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Match struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Team1     string        `bson:"team1" json:"team1"`
	Team2     string        `bson:"team2" json:"team2"`
	Venue     string        `bson:"venue" json:"venue"`
	Format    string        `bson:"format" json:"format"`
	Status    string        `bson:"status" json:"status"`
	Date      time.Time     `bson:"date" json:"date"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}

//models in go
// - Team1 → Go field name.
// - string → Data type.
// - bson:"team1" → Field name when stored in MongoDB.
// - json:"team1" → Field name when sent through API responses.
