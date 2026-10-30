package routes

import (
	"dreamedge/server/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {

	api := router.Group("/api")

	//matches routes
	api.GET("/matches", handlers.GetAllMatches)
	api.GET("/matches/:id", handlers.GetMatchByID)
	api.POST("/matches", handlers.CreateMatch)
	api.PUT("/matches:id", handlers.UpdateFunc)
	api.DELETE("/match:id", handlers.DeleteFunc)

	//player routes
	api.GET("/matches/:id/players", handlers.GetPlayersByMatchID)
	api.GET("/players/:id", handlers.GetPlayerByID)
	api.POST("/players", handlers.CreatePlayer)
	api.PUT("/players/:id", handlers.UpdatePlayer)
	api.DELETE("/players/:id", handlers.DeletePlayer)

	//player stats routes
	api.GET("/matches/:id/player-stats", handlers.GetPlayerStatsByMatchID)
	api.GET("/player-stats/:matchID/:playerID", handlers.GetPlayerStats)
	api.POST("/player-stats", handlers.CreatePlayerStats)
	api.PUT("/player-stats/:matchID/:playerID", handlers.UpdatePlayerStats)
}
