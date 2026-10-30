package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

var (
	Port          string
	GinMode       string
	MongoURI      string
	MongoDatabase string
	GeminiAPIKey  string
)

func LoadConfig() error {

	godotenv.Load()

	Port = os.Getenv("PORT")
	GinMode = os.Getenv("GIN_MODE")
	MongoURI = os.Getenv("MONGODB_URI")
	MongoDatabase = os.Getenv("MONGODB_DATABASE")
	GeminiAPIKey = os.Getenv("GEMINI_API_KEY")

	if Port == "" {
		Port = "8080"
	}

	if GinMode == "" {
		GinMode = "debug"
	}

	if MongoURI == "" {
		return fmt.Errorf("MongoDB URI is missing")
	}

	if MongoDatabase == "" {
		MongoDatabase = "dreamedge"
	}

	return nil
}
