package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Player struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	MatchID      bson.ObjectID `bson:"match_id" json:"match_id"`
	Name         string        `bson:"name" json:"name"`
	Team         string        `bson:"team" json:"team"`
	Role         string        `bson:"role" json:"role"`
	Country      string        `bson:"country" json:"country"`
	BattingStyle string        `bson:"batting_style" json:"batting_style"`
	BowlingStyle string        `bson:"bowling_style" json:"bowling_style"`
	CreatedAt    time.Time     `bson:"created_at" json:"created_at"`
}
