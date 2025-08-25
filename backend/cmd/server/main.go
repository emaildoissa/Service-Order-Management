package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/emaildoissa/service-order-management/backend/internal/database"
	"github.com/emaildoissa/service-order-management/backend/internal/handlers"

	gorillahandlers "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado")
	}

	credentialsPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if credentialsPath == "" {
		credentialsPath = "configs/firebase-credentials.json"
	}

	ctx := context.Background()
	client, err := database.InitFirebase(ctx, credentialsPath)
	if err != nil {
		log.Fatal("Erro ao inicializar Firebase:", err)
	}
	defer client.Close()

	r := mux.NewRouter()

	// Injeção de Dependência
	customerHandler := handlers.NewCustomerHandler(ctx, client)
	serviceOrderHandler := handlers.NewServiceOrderHandler(ctx, client)
	financialHandler := handlers.NewFinancialHandler(ctx, client)

	api := r.PathPrefix("/api").Subrouter()

	// Rotas de Clientes
	api.HandleFunc("/customers", customerHandler.CreateCustomer).Methods("POST")
	api.HandleFunc("/customers", customerHandler.SearchCustomers).Methods("GET")
	api.HandleFunc("/customers/{id}", customerHandler.GetCustomerByID).Methods("GET")
	api.HandleFunc("/customers/{id}", customerHandler.UpdateCustomer).Methods("PUT")
	api.HandleFunc("/cep/{cep}", handlers.BuscarCEP).Methods("GET")

	// Rotas de Ordens de Serviço
	api.HandleFunc("/service-orders", serviceOrderHandler.CreateServiceOrder).Methods("POST")
	api.HandleFunc("/customers/{customerId}/service-orders", serviceOrderHandler.GetCustomerServiceOrders).Methods("GET")
	api.HandleFunc("/service-orders/{id}", serviceOrderHandler.UpdateServiceOrder).Methods("PUT")
	api.HandleFunc("/service-orders/{id}/close", serviceOrderHandler.CloseServiceOrder).Methods("PUT")

	// Rotas Financeiras
	api.HandleFunc("/financials/summary", financialHandler.GetFinancialSummary).Methods("GET")
	api.HandleFunc("/financials/by-period", financialHandler.GetRevenueByPeriod).Methods("GET")
	api.HandleFunc("/open-orders", financialHandler.GetOpenOrders).Methods("GET")

	// CORS
	corsHandler := gorillahandlers.CORS(
		gorillahandlers.AllowedOrigins([]string{"http://localhost:3000"}),
		gorillahandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		gorillahandlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		gorillahandlers.AllowCredentials(),
	)(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Servidor rodando na porta %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
