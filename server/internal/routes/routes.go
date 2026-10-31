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

	//fantasy team routes
	api.POST("/teams", handlers.CreateFantasyTeam)
	api.GET("/teams/:id", handlers.GetFantasyTeamByID)
	api.GET("/matches/:id/teams", handlers.GetFantasyTeamsByMatchID)
	api.PUT("/teams/:id", handlers.UpdateFantasyTeam)
	api.DELETE("/teams/:id", handlers.DeleteFantasyTeam)
	api.GET("/teams/:id/autopsy", handlers.GetFantasyTeamAutopsy)

	// fantasy coach
	api.GET("/fantasy-coach", handlers.GetFantasyCoach)

}
