// backend/internal/handlers/equipment.go
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

type EquipmentHandler struct {
	client *firestore.Client
	ctx    context.Context
}

func NewEquipmentHandler(ctx context.Context, client *firestore.Client) *EquipmentHandler {
	return &EquipmentHandler{
		ctx:    ctx,
		client: client,
	}
}

// CreateEquipment cria um novo equipamento para um cliente
func (h *EquipmentHandler) CreateEquipment(w http.ResponseWriter, r *http.Request) {
	var equipment models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&equipment); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Busca o nome do cliente para denormalizar
	customerDoc, err := h.client.Collection("customers").Doc(equipment.OwnerID).Get(h.ctx)
	if err != nil {
		http.Error(w, "Cliente proprietário não encontrado", http.StatusNotFound)
		return
	}
	equipment.OwnerName = customerDoc.Data()["name"].(string)

	equipment.CreatedAt = time.Now()
	equipment.UpdatedAt = time.Now()

	if err := validate.Struct(equipment); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	docRef, _, err := h.client.Collection("equipments").Add(h.ctx, equipment)
	if err != nil {
		log.Printf("Erro ao salvar equipamento: %v", err)
		http.Error(w, "Erro ao salvar equipamento", http.StatusInternalServerError)
		return
	}
	equipment.ID = docRef.ID

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(equipment)
}

// GetEquipmentsByCustomer busca todos os equipamentos de um cliente
func (h *EquipmentHandler) GetEquipmentsByCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["customerId"]

	iter := h.client.Collection("equipments").
		Where("owner_id", "==", customerID).
		OrderBy("created_at", firestore.Desc).
		Documents(h.ctx)
	defer iter.Stop()

	equipments := make([]models.Equipment, 0)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			http.Error(w, "Erro na busca de equipamentos", http.StatusInternalServerError)
			return
		}
		var equip models.Equipment
		if err := equip.FromFirestore(doc); err != nil {
			continue
		}
		equipments = append(equipments, equip)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(equipments)
}
