package main

import (
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

	if err := database.InitFirebase(credentialsPath); err != nil {
		log.Fatal("Erro ao inicializar Firebase:", err)
	}
	defer database.Close()

	r := mux.NewRouter()

	// Subrouter para /api
	api := r.PathPrefix("/api").Subrouter()

	// ROTAS ORIGINAIS
	api.HandleFunc("/customers", handlers.CreateCustomer).Methods("POST", "OPTIONS")
	api.HandleFunc("/customers", handlers.SearchCustomers).Methods("GET", "OPTIONS")
	api.HandleFunc("/customers/{id}", handlers.GetCustomerByID).Methods("GET", "OPTIONS")
	api.HandleFunc("/service-orders", handlers.CreateServiceOrder).Methods("POST", "OPTIONS")
	api.HandleFunc("/customers/{customerId}/service-orders", handlers.GetCustomerServiceOrders).Methods("GET", "OPTIONS")
	api.HandleFunc("/service-orders/{id}/close", handlers.CloseServiceOrder).Methods("PUT", "OPTIONS")
	api.HandleFunc("/service-orders/{id}", handlers.UpdateServiceOrder).Methods("PUT", "OPTIONS")
	api.HandleFunc("/cep/{cep}", handlers.BuscarCEP).Methods("GET", "OPTIONS")
	api.HandleFunc("/customers/{id}", handlers.UpdateCustomer).Methods("PUT", "OPTIONS")

	// 👈 ROTAS FINANCEIRAS (ADICIONADAS)
	api.HandleFunc("/financials/summary", handlers.GetFinancialSummary).Methods("GET", "OPTIONS")
	api.HandleFunc("/open-orders", handlers.GetOpenOrders).Methods("GET", "OPTIONS")

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
	log.Printf("🌐 CORS configurado para http://localhost:3000")
	log.Printf("📊 Rotas financeiras ativas: /api/financials/summary, /api/open-orders")

	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
