package main

import (
	"context"
	"log"

	"dreamedge/server/internal/config"
	"dreamedge/server/internal/database"
	"dreamedge/server/internal/repository"
	"dreamedge/server/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// load env
	err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	// connect to mongo
	client, db, err := database.ConnectDB(config.MongoURI, config.MongoDatabase)
	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	//initialize match collection
	repository.InitMatchRepo(db)

	//initialize gin
	gin.SetMode(config.GinMode)
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))

	//register routes
	routes.SetupRoutes(router)

	//start server
	log.Printf("server working on http://localhost:%v", config.Port)

	err = router.Run(":" + config.Port)
	if err != nil {
		log.Fatal(err)
	}
}
