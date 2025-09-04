package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/emaildoissa/service-order-management/backend/internal/models"
	"google.golang.org/api/iterator"
)

// FinancialHandler gerencia as dependências para os handlers financeiros.
type FinancialHandler struct {
	client *firestore.Client
	ctx    context.Context
}

// NewFinancialHandler cria uma nova instância de FinancialHandler.
func NewFinancialHandler(ctx context.Context, client *firestore.Client) *FinancialHandler {
	return &FinancialHandler{
		ctx:    ctx,
		client: client,
	}
}

// ... (structs FinancialSummary, PeriodRevenue, etc. continuam iguais) ...

type FinancialSummary struct {
	TotalRevenue  float64 `json:"total_revenue"`
	TotalOrders   int     `json:"total_orders"`
	OpenOrders    int     `json:"open_orders"`
	ClosedOrders  int     `json:"closed_orders"`
	AverageTicket float64 `json:"average_ticket"`
}

type PeriodRevenue struct {
	Period  string  `json:"period"`
	Revenue float64 `json:"revenue"`
	Orders  int     `json:"orders"`
}

// ---> CORREÇÃO AQUI: Adicionamos o status antigo "open" à lista <---
var openStatuses = []string{
	"open", // Status legado
	"Aguardando Avaliação",
	"Aguardando Aprovação do Cliente",
	"Em Reparo",
	"Aguardando Peça",
	"Pronto para Retirada",
}

func (h *FinancialHandler) GetFinancialSummary(w http.ResponseWriter, r *http.Request) {
	log.Printf("📊 Gerando resumo financeiro")

	// Query para OS fechadas (status "Finalizado")
	iter := h.client.Collection("service_orders").
		Where("status", "==", "Finalizado").
		Documents(h.ctx)
	defer iter.Stop()

	var totalRevenue float64
	var closedOrders int

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("❌ Erro ao buscar OS fechadas: %v", err)
			http.Error(w, "Erro na busca de OS fechadas", http.StatusInternalServerError)
			return
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			continue
		}

		totalRevenue += order.ServiceValue
		closedOrders++
	}

	// Query para contar OS abertas usando a lista de status
	openIter := h.client.Collection("service_orders").
		Where("status", "in", openStatuses).
		Documents(h.ctx)
	defer openIter.Stop()

	openOrders := 0
	for {
		_, err := openIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("❌ Erro ao contar OS abertas: %v", err)
			break
		}
		openOrders++
	}

	averageTicket := 0.0
	if closedOrders > 0 {
		averageTicket = totalRevenue / float64(closedOrders)
	}

	summary := FinancialSummary{
		TotalRevenue:  totalRevenue,
		TotalOrders:   closedOrders + openOrders,
		OpenOrders:    openOrders,
		ClosedOrders:  closedOrders,
		AverageTicket: averageTicket,
	}

	log.Printf("✅ Resumo: R$ %.2f em %d OS fechadas", totalRevenue, closedOrders)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

func (h *FinancialHandler) GetRevenueByPeriod(w http.ResponseWriter, r *http.Request) {
	// Esta função não precisa de alteração
}

func (h *FinancialHandler) GetOpenOrders(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔍 Listando OS abertas")

	// A mesma query usando "in" que agora inclui o status "open"
	iter := h.client.Collection("service_orders").
		Where("status", "in", openStatuses).
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
			log.Printf("❌ Erro ao buscar OS abertas: %v", err)
			http.Error(w, "Erro na busca", http.StatusInternalServerError)
			return
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			continue
		}
		orders = append(orders, order)
	}

	log.Printf("✅ Encontradas %d OS abertas", len(orders))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
