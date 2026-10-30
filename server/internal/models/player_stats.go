package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// player statistics for a particular match
type PlayerStats struct {
	ID       bson.ObjectID `bson:"_id,omitempty" json:"id"`
	MatchID  bson.ObjectID `bson:"match_id" json:"match_id"`
	PlayerID bson.ObjectID `bson:"player_id" json:"player_id"`

	//batting stats
	Runs       int     `bson:"runs" json:"runs"`
	BallsFaced int     `bson:"balls_faced" json:"balls_faced"`
	Fours      int     `bson:"fours" json:"fours"`
	Sixes      int     `bson:"sixes" json:"sixes"`
	StrikeRate float64 `bson:"strike_rate" json:"strike_rate"`

	//bowling stats
	Overs        float64 `bson:"overs" json:"overs"`
	Wickets      int     `bson:"wickets" json:"wickets"`
	RunsConceded int     `bson:"runs_conceded" json:"runs_conceded"`
	Economy      float64 `bson:"economy" json:"economy"`

	//fielding stats
	Catches   int `bson:"catches" json:"catches"`
	RunOuts   int `bson:"run_outs" json:"run_outs"`
	Stumpings int `bson:"stumpings" json:"stumpings"`

	//fantasy points calculated by our scoring engine
	FantasyPoints float64 `bson:"fantasy_points" json:"fantasy_points"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}
