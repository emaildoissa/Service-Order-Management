package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/emaildoissa/service-order-management/backend/internal/database"

	"github.com/emaildoissa/service-order-management/backend/internal/models"

	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

func CreateServiceOrder(w http.ResponseWriter, r *http.Request) {
	//var validate = validator.New()
	var order models.ServiceOrder

	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if err := validate.Struct(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	order.Status = "open"
	order.CreatedAt = time.Now()

	docRef, _, err := database.FirestoreClient.Collection("service_orders").Add(database.Ctx, order)
	if err != nil {
		http.Error(w, "Erro ao criar ordem de serviço", http.StatusInternalServerError)
		return
	}

	order.ID = docRef.ID

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func GetCustomerServiceOrders(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["customerId"]

	// Log para debug
	log.Printf("🔎 Buscando ordens para cliente: %s", customerID)

	if customerID == "" {
		http.Error(w, "customerId obrigatório", http.StatusBadRequest)
		return
	}

	iter := database.FirestoreClient.Collection("service_orders").
		Where("customer_id", "==", customerID).
		OrderBy("created_at", firestore.Desc).
		Documents(database.Ctx)
	defer iter.Stop()

	var orders []models.ServiceOrder

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("❌ Erro ao buscar documentos: %v", err)
			http.Error(w, "Erro na busca", http.StatusInternalServerError)
			return
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			log.Printf("⚠️  Erro ao converter documento: %v", err)
			continue
		}
		orders = append(orders, order)
	}

	log.Printf("✅ Encontradas %d ordens", len(orders))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// UpdateServiceOrder atualiza uma OS (sem fechar)
func UpdateServiceOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID := vars["id"]

	log.Printf("🔄 Atualizando OS: %s", orderID)

	var updates struct {
		EquipmentType   string  `json:"equipment_type"`
		WorkDescription string  `json:"work_description"`
		ServiceValue    float64 `json:"service_value"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Atualizar no Firestore
	_, err := database.FirestoreClient.Collection("service_orders").Doc(orderID).Update(database.Ctx, []firestore.Update{
		{Path: "equipment_type", Value: updates.EquipmentType},
		{Path: "work_description", Value: updates.WorkDescription},
		{Path: "service_value", Value: updates.ServiceValue},
	})

	if err != nil {
		log.Printf("❌ Erro ao atualizar OS: %v", err)
		http.Error(w, "Erro ao atualizar", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ OS %s atualizada com sucesso", orderID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OS atualizada"})
}

func CloseServiceOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID := vars["id"]

	log.Printf("🔒 Fechando OS: %s", orderID)

	if orderID == "" {
		http.Error(w, "orderID obrigatório", http.StatusBadRequest)
		return
	}

	var closeRequest models.CloseOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&closeRequest); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if err := validate.Struct(&closeRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 👈 REGRA DE NEGÓCIO: Valor mínimo R$ 40
	if closeRequest.ServiceValue < 40.0 {
		http.Error(w, "Valor mínimo do serviço é R$ 40,00", http.StatusBadRequest)
		return
	}

	now := time.Now()

	_, err := database.FirestoreClient.Collection("service_orders").Doc(orderID).Update(database.Ctx, []firestore.Update{
		{Path: "status", Value: "closed"},
		{Path: "work_description", Value: closeRequest.WorkDescription},
		{Path: "service_value", Value: closeRequest.ServiceValue},
		{Path: "closed_at", Value: now},
	})

	if err != nil {
		log.Printf("❌ Erro ao fechar OS: %v", err)
		http.Error(w, "Erro ao fechar ordem", http.StatusInternalServerError)
		return
	}

	// Busca OS atualizada
	doc, err := database.FirestoreClient.Collection("service_orders").Doc(orderID).Get(database.Ctx)
	if err != nil {
		http.Error(w, "Erro ao buscar ordem atualizada", http.StatusInternalServerError)
		return
	}

	var order models.ServiceOrder
	order.FromFirestore(doc)

	log.Printf("✅ OS fechada: %s - R$ %.2f", orderID, closeRequest.ServiceValue)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}
