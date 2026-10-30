package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func ConnectDB(uri string, dbname string) (*mongo.Client, *mongo.Database, error) {
	clientOptions := options.Client().ApplyURI(uri)
	//creates the client
	client, err := mongo.Connect(clientOptions)
	if err != nil {
		return nil, nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		client.Disconnect(context.Background())
		return nil, nil, fmt.Errorf("mongo connection failed!!!! : %v", err)
	}
	//select the db
	db := client.Database(dbname)
	fmt.Println("mongo connected...")

	return client, db, err
}
