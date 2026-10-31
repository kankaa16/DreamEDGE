package main

import (
	"context"
	"log"
	"os"

	"dreamedge/server/internal/config"
	"dreamedge/server/internal/database"
	"dreamedge/server/internal/repository"
	"dreamedge/server/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	//load env
	if err := config.LoadConfig(); err != nil {
		log.Fatal("Failed to load config: ", err)
	}

	//connect to mongo
	client, db, err := database.ConnectDB(config.MongoURI, config.MongoDatabase)
	if err != nil {
		log.Fatal("MongoDB connection failed: ", err)
	}
	defer client.Disconnect(context.Background())

	log.Println("MongoDB connected successfully")

	//init repositories
	repository.InitMatchRepo(db)
	repository.InitPlayerRepo(db)
	repository.InitPlayerStatsRepo(db)
	repository.InitFantasyTeamRepo(db)

	//seed data
	if err := database.SeedDemoData(db); err != nil {
		log.Fatal("Demo data seeding failed: ", err)
	}

	log.Println("Demo data initialized")

	//init Gin
	gin.SetMode(config.GinMode)
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"https://dream-edge-six.vercel.app",
		},
		AllowMethods: []string{
			"GET", "POST", "PUT", "DELETE", "OPTIONS",
		},
		AllowHeaders: []string{
			"Origin", "Content-Type", "Accept", "Authorization",
		},
	}))

	//setup routes
	routes.SetupRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = config.Port
	}
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf("DreamEDGE server working on port %s", port)

	if err := router.Run("0.0.0.0:" + port); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}
