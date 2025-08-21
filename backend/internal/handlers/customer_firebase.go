package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/emaildoissa/service-order-management/backend/internal/database"
	"github.com/emaildoissa/service-order-management/backend/internal/models"
	"github.com/go-playground/validator"

	"github.com/gorilla/mux"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

var validate = validator.New() // fora das funções
func CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var customer models.Customer

	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	customer.CreatedAt = time.Now()
	customer.UpdatedAt = time.Now()

	// Adiciona no Firestore
	docRef, _, err := database.FirestoreClient.Collection("customers").Add(database.Ctx, customer)
	if err != nil {
		http.Error(w, "Erro ao salvar cliente", http.StatusInternalServerError)
		return
	}

	customer.ID = docRef.ID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customer)
}

func SearchCustomers(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")

	query := database.FirestoreClient.Collection("customers").OrderBy("name", firestore.Asc)

	// No Firestore, busca exata por enquanto (ou use Algolia para busca avançada)
	if search != "" {
		query = query.Where("name", ">=", search).Where("name", "<=", search+"\uf8ff")
	}

	iter := query.Documents(database.Ctx)
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
func GetCustomerByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["id"]

	doc, err := database.FirestoreClient.Collection("customers").Doc(customerID).Get(database.Ctx)
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

// BuscarCEP retorna dados de endereço pelo CEP via ViaCEP
func BuscarCEP(w http.ResponseWriter, r *http.Request) {
	// Pega CEP da URL
	vars := mux.Vars(r)
	cep := vars["cep"]

	log.Printf("🔍 Buscando CEP: %s", cep)

	// Busca dados do CEP
	endereco, err := models.BuscarEnderecoViaCEP(cep)
	if err != nil {
		log.Printf("❌ Erro ao buscar CEP: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("✅ CEP encontrado: %s - %s", endereco.Logradouro, endereco.Bairro)

	// Retorna dados formatados
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

// UpdateCustomer atualiza um cliente pelo ID
func UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	customerID := vars["id"]

	var customer models.Customer
	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	customer.UpdatedAt = time.Now()

	// Atualiza documento no Firestore
	_, err := database.FirestoreClient.Collection("customers").Doc(customerID).Set(database.Ctx, customer)
	if err != nil {
		log.Printf("Erro ao atualizar cliente: %v", err)
		http.Error(w, "Erro ao atualizar cliente", http.StatusInternalServerError)
		return
	}

	customer.ID = customerID

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customer)
}
