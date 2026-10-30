package routes

import (
	"dreamedge/server/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {

	api := router.Group("/api")

	api.GET("/matches", handlers.GetAllMatches)
	api.GET("/matches/:id", handlers.GetMatchByID)
	api.POST("/matches", handlers.CreateMatch)
	api.PUT("/matches:id", handlers.UpdateFunc)
	api.DELETE("/match:id", handlers.DeleteFunc)
}
