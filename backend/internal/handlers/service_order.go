package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/emaildoissa/service-order-management/backend/internal/models"
	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

type ServiceOrderHandler struct {
	client *firestore.Client
	ctx    context.Context
}

func NewServiceOrderHandler(ctx context.Context, client *firestore.Client) *ServiceOrderHandler {
	return &ServiceOrderHandler{
		ctx:    ctx,
		client: client,
	}
}

func (h *ServiceOrderHandler) CreateServiceOrder(w http.ResponseWriter, r *http.Request) {
	var order models.ServiceOrder
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Buscar o nome do cliente para adicionar à OS
	customerDoc, err := h.client.Collection("customers").Doc(order.CustomerID).Get(h.ctx)
	if err != nil {
		http.Error(w, "Cliente não encontrado", http.StatusNotFound)
		return
	}
	var customer models.Customer
	if err := customer.FromFirestore(customerDoc); err != nil {
		http.Error(w, "Erro ao processar dados do cliente", http.StatusInternalServerError)
		return
	}
	order.CustomerName = customer.Name // Adiciona o nome do cliente

	if err := validate.Struct(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	order.Status = "Aguardando Avaliação"
	order.CreatedAt = time.Now()
	docRef, _, err := h.client.Collection("service_orders").Add(h.ctx, order)
	if err != nil {
		http.Error(w, "Erro ao criar ordem de serviço", http.StatusInternalServerError)
		return
	}
	order.ID = docRef.ID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func (h *ServiceOrderHandler) GetCustomerServiceOrders(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["customerId"]
	log.Printf("🔎 Buscando ordens para cliente: %s", customerID)
	if customerID == "" {
		http.Error(w, "customerId obrigatório", http.StatusBadRequest)
		return
	}
	iter := h.client.Collection("service_orders").
		Where("customer_id", "==", customerID).
		OrderBy("created_at", firestore.Desc).
		Documents(h.ctx)
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

func (h *ServiceOrderHandler) UpdateServiceOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID := vars["id"]
	log.Printf("🔄 Atualizando OS: %s", orderID)
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
	var firestoreUpdates []firestore.Update
	for key, value := range updates {
		switch key {
		case "equipment_type", "equipment_brand", "equipment_model",
			"reported_defect", "observations", "accessories", "status":
			firestoreUpdates = append(firestoreUpdates, firestore.Update{Path: key, Value: value})
		}
	}
	if len(firestoreUpdates) == 0 {
		http.Error(w, "Nenhum campo válido para atualização foi fornecido", http.StatusBadRequest)
		return
	}
	_, err := h.client.Collection("service_orders").Doc(orderID).Update(h.ctx, firestoreUpdates)
	if err != nil {
		log.Printf("❌ Erro ao atualizar OS: %v", err)
		http.Error(w, "Erro ao atualizar", http.StatusInternalServerError)
		return
	}
	log.Printf("✅ OS %s atualizada com sucesso", orderID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OS atualizada"})
}

func (h *ServiceOrderHandler) CloseServiceOrder(w http.ResponseWriter, r *http.Request) {
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
	if closeRequest.ServiceValue < 40.0 {
		http.Error(w, "Valor mínimo do serviço é R$ 40,00", http.StatusBadRequest)
		return
	}
	now := time.Now()
	_, err := h.client.Collection("service_orders").Doc(orderID).Update(h.ctx, []firestore.Update{
		{Path: "status", Value: "Finalizado"},
		{Path: "work_description", Value: closeRequest.WorkDescription},
		{Path: "service_value", Value: closeRequest.ServiceValue},
		{Path: "closed_at", Value: now},
		{Path: "warranty_days", Value: closeRequest.WarrantyDays}, // ADICIONADO
	})
	if err != nil {
		log.Printf("❌ Erro ao fechar OS: %v", err)
		http.Error(w, "Erro ao fechar ordem", http.StatusInternalServerError)
		return
	}
	doc, err := h.client.Collection("service_orders").Doc(orderID).Get(h.ctx)
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
