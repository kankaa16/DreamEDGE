package database

import (
	"context"
	"fmt"
	"time"

	"dreamedge/server/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type demoPlayer struct {
	Name         string
	Role         string
	BattingStyle string
	BowlingStyle string
}

type demoFixture struct {
	Team1  string
	Team2  string
	Venue  string
	Format string
	Status string
	Date   time.Time
}

var demoSquads = map[string][]demoPlayer{
	"Mumbai Indians": {
		{"Rohit Sharma", "Batter", "Right-hand", ""},
		{"Suryakumar Yadav", "Batter", "Right-hand", ""},
		{"Tilak Varma", "Batter", "Left-hand", ""},
		{"Hardik Pandya", "All-rounder", "Right-hand", "Right-arm medium"},
		{"Jasprit Bumrah", "Bowler", "Right-hand", "Right-arm fast"},
		{"Ishan Kishan", "Wicketkeeper", "Left-hand", ""},
		{"Tim David", "Batter", "Right-hand", ""},
		{"Naman Dhir", "All-rounder", "Right-hand", "Right-arm medium"},
		{"Piyush Chawla", "Bowler", "Right-hand", "Leg spin"},
		{"Akash Madhwal", "Bowler", "Right-hand", "Right-arm fast"},
		{"Nehal Wadhera", "Batter", "Left-hand", ""},
	},
	"Chennai Super Kings": {
		{"Ruturaj Gaikwad", "Batter", "Right-hand", ""},
		{"MS Dhoni", "Wicketkeeper", "Right-hand", ""},
		{"Ravindra Jadeja", "All-rounder", "Left-hand", "Left-arm orthodox"},
		{"Shivam Dube", "All-rounder", "Left-hand", "Right-arm medium"},
		{"Deepak Chahar", "Bowler", "Right-hand", "Right-arm medium"},
		{"Matheesha Pathirana", "Bowler", "Right-hand", "Right-arm fast"},
		{"Ajinkya Rahane", "Batter", "Right-hand", ""},
		{"Moeen Ali", "All-rounder", "Left-hand", "Right-arm off-break"},
		{"Tushar Deshpande", "Bowler", "Right-hand", "Right-arm medium"},
		{"Devon Conway", "Wicketkeeper", "Left-hand", ""},
		{"Maheesh Theekshana", "Bowler", "Right-hand", "Off spin"},
	},
	"Royal Challengers Bengaluru": {
		{"Virat Kohli", "Batter", "Right-hand", ""},
		{"Faf du Plessis", "Batter", "Right-hand", ""},
		{"Glenn Maxwell", "All-rounder", "Right-hand", "Off spin"},
		{"Rajat Patidar", "Batter", "Right-hand", ""},
		{"Dinesh Karthik", "Wicketkeeper", "Right-hand", ""},
		{"Cameron Green", "All-rounder", "Right-hand", "Right-arm fast"},
		{"Mohammed Siraj", "Bowler", "Right-hand", "Right-arm fast"},
		{"Karn Sharma", "Bowler", "Right-hand", "Leg spin"},
		{"Yash Dayal", "Bowler", "Left-hand", "Left-arm fast"},
		{"Mahipal Lomror", "All-rounder", "Left-hand", "Left-arm orthodox"},
		{"Anuj Rawat", "Wicketkeeper", "Left-hand", ""},
	},
	"Rajasthan Royals": {
		{"Sanju Samson", "Wicketkeeper", "Right-hand", ""},
		{"Yashasvi Jaiswal", "Batter", "Left-hand", ""},
		{"Jos Buttler", "Wicketkeeper", "Right-hand", ""},
		{"Riyan Parag", "All-rounder", "Right-hand", "Leg spin"},
		{"Shimron Hetmyer", "Batter", "Left-hand", ""},
		{"Ravichandran Ashwin", "All-rounder", "Right-hand", "Off spin"},
		{"Trent Boult", "Bowler", "Left-hand", "Left-arm fast"},
		{"Yuzvendra Chahal", "Bowler", "Right-hand", "Leg spin"},
		{"Avesh Khan", "Bowler", "Right-hand", "Right-arm fast"},
		{"Sandeep Sharma", "Bowler", "Right-hand", "Right-arm medium"},
		{"Dhruv Jurel", "Wicketkeeper", "Right-hand", ""},
	},
	"England": {
		{"Jos Buttler", "Wicketkeeper", "Right-hand", ""},
		{"Jonny Bairstow", "Wicketkeeper", "Right-hand", ""},
		{"Joe Root", "Batter", "Right-hand", "Off spin"},
		{"Harry Brook", "Batter", "Right-hand", ""},
		{"Ben Stokes", "All-rounder", "Left-hand", "Right-arm fast"},
		{"Moeen Ali", "All-rounder", "Left-hand", "Off spin"},
		{"Liam Livingstone", "All-rounder", "Right-hand", "Leg spin"},
		{"Chris Woakes", "All-rounder", "Right-hand", "Right-arm medium"},
		{"Jofra Archer", "Bowler", "Right-hand", "Right-arm fast"},
		{"Mark Wood", "Bowler", "Right-hand", "Right-arm fast"},
		{"Adil Rashid", "Bowler", "Right-hand", "Leg spin"},
	},
	"South Africa": {
		{"Quinton de Kock", "Wicketkeeper", "Left-hand", ""},
		{"Temba Bavuma", "Batter", "Right-hand", ""},
		{"Aiden Markram", "All-rounder", "Right-hand", "Off spin"},
		{"Rassie van der Dussen", "Batter", "Right-hand", ""},
		{"David Miller", "Batter", "Left-hand", ""},
		{"Heinrich Klaasen", "Wicketkeeper", "Right-hand", ""},
		{"Marco Jansen", "All-rounder", "Left-hand", "Left-arm fast"},
		{"Keshav Maharaj", "Bowler", "Left-hand", "Left-arm orthodox"},
		{"Kagiso Rabada", "Bowler", "Left-hand", "Right-arm fast"},
		{"Anrich Nortje", "Bowler", "Right-hand", "Right-arm fast"},
		{"Tabraiz Shamsi", "Bowler", "Left-hand", "Left-arm wrist spin"},
	},
	"Australia": {
		{"Travis Head", "Batter", "Left-hand", ""},
		{"David Warner", "Batter", "Left-hand", ""},
		{"Steve Smith", "Batter", "Right-hand", ""},
		{"Marnus Labuschagne", "Batter", "Right-hand", ""},
		{"Glenn Maxwell", "All-rounder", "Right-hand", "Off spin"},
		{"Mitchell Marsh", "All-rounder", "Right-hand", "Right-arm medium"},
		{"Alex Carey", "Wicketkeeper", "Left-hand", ""},
		{"Pat Cummins", "Bowler", "Right-hand", "Right-arm fast"},
		{"Mitchell Starc", "Bowler", "Left-hand", "Left-arm fast"},
		{"Josh Hazlewood", "Bowler", "Right-hand", "Right-arm fast"},
		{"Adam Zampa", "Bowler", "Right-hand", "Leg spin"},
	},
	"New Zealand": {
		{"Devon Conway", "Wicketkeeper", "Left-hand", ""},
		{"Kane Williamson", "Batter", "Right-hand", ""},
		{"Daryl Mitchell", "All-rounder", "Right-hand", "Right-arm medium"},
		{"Rachin Ravindra", "All-rounder", "Left-hand", "Left-arm orthodox"},
		{"Glenn Phillips", "Wicketkeeper", "Right-hand", "Off spin"},
		{"Tom Latham", "Wicketkeeper", "Left-hand", ""},
		{"Mitchell Santner", "All-rounder", "Left-hand", "Left-arm orthodox"},
		{"Tim Southee", "Bowler", "Right-hand", "Right-arm fast"},
		{"Trent Boult", "Bowler", "Left-hand", "Left-arm fast"},
		{"Lockie Ferguson", "Bowler", "Right-hand", "Right-arm fast"},
		{"Ish Sodhi", "Bowler", "Right-hand", "Leg spin"},
	},
}

// seed demo matches without duplicating existing matches
func SeedDemoData(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	fixtures := []demoFixture{
		{
			Team1:  "Mumbai Indians",
			Team2:  "Chennai Super Kings",
			Venue:  "Wankhede Stadium",
			Format: "T20",
			Status: "upcoming",
			Date:   time.Date(2026, 11, 2, 19, 30, 0, 0, time.UTC),
		},
		{
			Team1:  "Royal Challengers Bengaluru",
			Team2:  "Rajasthan Royals",
			Venue:  "M. Chinnaswamy Stadium",
			Format: "T20",
			Status: "live",
			Date:   time.Date(2026, 10, 31, 14, 0, 0, 0, time.UTC),
		},
		{
			Team1:  "England",
			Team2:  "South Africa",
			Venue:  "Lord's",
			Format: "ODI",
			Status: "completed",
			Date:   time.Date(2026, 10, 20, 10, 0, 0, 0, time.UTC),
		},
		{
			Team1:  "Australia",
			Team2:  "New Zealand",
			Venue:  "Sydney Cricket Ground",
			Format: "ODI",
			Status: "completed",
			Date:   time.Date(2026, 10, 25, 10, 0, 0, 0, time.UTC),
		},
	}

	for _, fixture := range fixtures {
		if err := seedOneMatch(ctx, db, fixture); err != nil {
			return err
		}
	}

	fmt.Println("Demo data seeded successfully!")
	return nil
}

func seedOneMatch(ctx context.Context, db *mongo.Database, fixture demoFixture) error {
	matchCollection := db.Collection("matches")
	playerCollection := db.Collection("players")
	statsCollection := db.Collection("player_stats")

	//check whether this match already exists
	var existing models.Match
	err := matchCollection.FindOne(ctx, bson.M{
		"team1":  fixture.Team1,
		"team2":  fixture.Team2,
		"format": fixture.Format,
	}).Decode(&existing)

	if err == nil {
		fmt.Println("Skipping existing match:", fixture.Team1, "vs", fixture.Team2)
		return nil
	}

	if err != mongo.ErrNoDocuments {
		return err
	}

	match := models.Match{
		ID:        bson.NewObjectID(),
		Team1:     fixture.Team1,
		Team2:     fixture.Team2,
		Venue:     fixture.Venue,
		Format:    fixture.Format,
		Status:    fixture.Status,
		Date:      fixture.Date,
		CreatedAt: time.Now(),
	}

	_, err = matchCollection.InsertOne(ctx, match)
	if err != nil {
		return err
	}

	teams := []string{fixture.Team1, fixture.Team2}

	for _, team := range teams {
		squad, ok := demoSquads[team]
		if !ok {
			return fmt.Errorf("demo squad missing for %s", team)
		}

		for i, p := range squad {
			player := models.Player{
				ID:           bson.NewObjectID(),
				MatchID:      match.ID,
				Name:         p.Name,
				Team:         team,
				Role:         p.Role,
				Country:      team,
				BattingStyle: p.BattingStyle,
				BowlingStyle: p.BowlingStyle,
				CreatedAt:    time.Now(),
			}

			_, err = playerCollection.InsertOne(ctx, player)
			if err != nil {
				return err
			}

			//upcoming matches have no scorecard yet
			if fixture.Status == "upcoming" {
				continue
			}

			stats := createDemoStats(match.ID, player.ID, i, p.Role)

			_, err = statsCollection.InsertOne(ctx, stats)
			if err != nil {
				return err
			}
		}
	}

	fmt.Println("Created match:", fixture.Team1, "vs", fixture.Team2)
	return nil
}

// generate illustrative statistics for demo matches
func createDemoStats(matchID, playerID bson.ObjectID, index int, role string) models.PlayerStats {
	runs := 0
	balls := 0
	fours := 0
	sixes := 0
	wickets := 0
	overs := 0.0
	conceded := 0
	catches := 0

	if role == "Batter" || role == "Wicketkeeper" || role == "All-rounder" {
		runs = 12 + (index*7)%55
		balls = 10 + (index*3)%35
		fours = runs / 12
		sixes = runs / 30
	}

	if role == "Bowler" || role == "All-rounder" {
		overs = 2 + float64(index%3)
		wickets = index % 4
		conceded = 12 + (index*5)%30
	}

	if index%4 == 0 {
		catches = 1
	}

	strikeRate := 0.0
	if balls > 0 {
		strikeRate = float64(runs) / float64(balls) * 100
	}

	economy := 0.0
	if overs > 0 {
		economy = float64(conceded) / overs
	}

	points := float64(runs + wickets*25 + catches*8)

	now := time.Now()

	return models.PlayerStats{
		ID:            bson.NewObjectID(),
		MatchID:       matchID,
		PlayerID:      playerID,
		Runs:          runs,
		BallsFaced:    balls,
		Fours:         fours,
		Sixes:         sixes,
		StrikeRate:    strikeRate,
		Overs:         overs,
		Wickets:       wickets,
		RunsConceded:  conceded,
		Economy:       economy,
		Catches:       catches,
		RunOuts:       0,
		Stumpings:     0,
		FantasyPoints: points,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}
