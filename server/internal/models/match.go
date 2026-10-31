package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type MatchResult struct {
	Winner     string `bson:"winner" json:"winner"`
	Loser      string `bson:"loser" json:"loser"`
	Margin     string `bson:"margin" json:"margin"`
	ResultType string `bson:"result_type" json:"result_type"`

	Team1Score string `bson:"team1_score" json:"team1_score"`
	Team2Score string `bson:"team2_score" json:"team2_score"`

	Team1Overs string `bson:"team1_overs" json:"team1_overs"`
	Team2Overs string `bson:"team2_overs" json:"team2_overs"`

	PlayerOfMatch string `bson:"player_of_match" json:"player_of_match"`

	IsDemo bool `bson:"is_demo" json:"is_demo"`
}

type Match struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Team1     string        `bson:"team1" json:"team1"`
	Team2     string        `bson:"team2" json:"team2"`
	Venue     string        `bson:"venue" json:"venue"`
	Format    string        `bson:"format" json:"format"`
	Status    string        `bson:"status" json:"status"`
	Date      time.Time     `bson:"date" json:"date"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	Result    *MatchResult  `bson:"result,omitempty" json:"result,omitempty"`
}

//models in go
// - Team1 → Go field name.
// - string → Data type.
// - bson:"team1" → Field name when stored in MongoDB.
// - json:"team1" → Field name when sent through API responses.
