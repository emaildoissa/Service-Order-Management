package database

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func InitFirebase(ctx context.Context, credentialsPath string) (*firestore.Client, error) {
	sa := option.WithCredentialsFile(credentialsPath)
	app, err := firebase.NewApp(ctx, nil, sa)
	if err != nil {
		log.Printf("Erro ao inicializar Firebase App: %v", err)
		return nil, err
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Printf("Erro ao conectar com o Firestore: %v", err)
		return nil, err
	}

	log.Println("✅ Conectado ao Firebase Firestore")
	return client, nil
}
