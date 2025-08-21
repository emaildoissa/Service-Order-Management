package database

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

var (
	FirestoreClient *firestore.Client
	Ctx             context.Context
)

func InitFirebase(credentialsPath string) error {
	Ctx = context.Background()

	sa := option.WithCredentialsFile(credentialsPath)
	app, err := firebase.NewApp(Ctx, nil, sa)
	if err != nil {
		log.Printf("Erro ao inicializar Firebase: %v", err)
		return err
	}

	FirestoreClient, err = app.Firestore(Ctx)
	if err != nil {
		log.Printf("Erro ao conectar Firestore: %v", err)
		return err
	}

	log.Println("✅ Conectado ao Firebase Firestore")
	return nil
}

func Close() {
	if FirestoreClient != nil {
		FirestoreClient.Close()
	}
}
