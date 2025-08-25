package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/emaildoissa/service-order-management/backend/internal/models"
	"github.com/go-playground/validator"

	"github.com/gorilla/mux"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

var validate = validator.New()

type CustomerHandler struct {
	client *firestore.Client
	ctx    context.Context
}

func NewCustomerHandler(ctx context.Context, client *firestore.Client) *CustomerHandler {
	return &CustomerHandler{
		ctx:    ctx,
		client: client,
	}
}

func (h *CustomerHandler) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var customer models.Customer
	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
	if err := validate.Struct(customer); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	customer.CreatedAt = time.Now()
	customer.UpdatedAt = time.Now()
	customer.NameNormalized = strings.ToLower(customer.Name)
	docRef, _, err := h.client.Collection("customers").Add(h.ctx, customer)
	if err != nil {
		log.Printf("Erro ao salvar cliente: %v", err)
		http.Error(w, "Erro ao salvar cliente", http.StatusInternalServerError)
		return
	}
	customer.ID = docRef.ID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(customer)
}

func (h *CustomerHandler) SearchCustomers(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	query := h.client.Collection("customers").OrderBy("name_normalized", firestore.Asc)
	if search != "" {
		searchNormalized := strings.ToLower(search)
		query = query.Where("name_normalized", ">=", searchNormalized).Where("name_normalized", "<=", searchNormalized+"\uf8ff")
	}
	iter := query.Documents(h.ctx)
	defer iter.Stop()
	var customers []models.Customer
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			http.Error(w, "Erro na busca", http.StatusInternalServerError)
			return
		}
		var customer models.Customer
		customer.FromFirestore(doc)
		customers = append(customers, customer)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customers)
}

func (h *CustomerHandler) GetCustomerByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["id"]
	doc, err := h.client.Collection("customers").Doc(customerID).Get(h.ctx)
	if err != nil {
		http.Error(w, "Cliente não encontrado", http.StatusNotFound)
		return
	}
	var customer models.Customer
	if err := customer.FromFirestore(doc); err != nil {
		http.Error(w, "Erro ao processar dados", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customer)
}

func (h *CustomerHandler) UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["id"]
	var customerData models.Customer
	if err := json.NewDecoder(r.Body).Decode(&customerData); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
	if err := validate.Struct(customerData); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	updates := []firestore.Update{
		{Path: "name", Value: customerData.Name},
		{Path: "name_normalized", Value: strings.ToLower(customerData.Name)},
		{Path: "phone_number", Value: customerData.PhoneNumber},
		{Path: "address", Value: customerData.Address},
		{Path: "neighborhood", Value: customerData.Neighborhood},
		{Path: "city", Value: customerData.City},
		{Path: "state", Value: customerData.State},
		{Path: "zip_code", Value: customerData.ZipCode},
		{Path: "house_number", Value: customerData.HouseNumber},
		{Path: "updated_at", Value: time.Now()},
	}
	_, err := h.client.Collection("customers").Doc(customerID).Update(h.ctx, updates)
	if err != nil {
		log.Printf("Erro ao atualizar cliente: %v", err)
		http.Error(w, "Erro ao atualizar cliente", http.StatusInternalServerError)
		return
	}
	customerData.ID = customerID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customerData)
}

func BuscarCEP(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	cep := vars["cep"]
	log.Printf("🔍 Buscando CEP: %s", cep)
	endereco, err := models.BuscarEnderecoViaCEP(cep)
	if err != nil {
		log.Printf("❌ Erro ao buscar CEP: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("✅ CEP encontrado: %s - %s", endereco.Logradouro, endereco.Bairro)
	response := map[string]string{
		"cep":          endereco.Cep,
		"address":      endereco.Logradouro,
		"neighborhood": endereco.Bairro,
		"city":         endereco.Localidade,
		"state":        endereco.Uf,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
