package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type FantasyTeam struct {
	ID              bson.ObjectID   `bson:"_id,omitempty" json:"id"`
	MatchID         bson.ObjectID   `bson:"match_id" json:"match_id"`
	TeamName        string          `bson:"team_name" json:"team_name"`
	SelectedPlayers []bson.ObjectID `bson:"selected_players" json:"selected_players"`
	CaptainID       bson.ObjectID   `bson:"captain_id" json:"captain_id"`
	ViceCaptainID   bson.ObjectID   `bson:"vice_captain_id" json:"vice_captain_id"`
	CreatedAt       time.Time       `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time       `bson:"updated_at" json:"updated_at"`
}
