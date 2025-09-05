// backend/internal/handlers/financial.go
package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sort"

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

	summary := models.FinancialSummary{
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
	log.Printf("📅 Gerando relatório de faturamento por período")

	iter := h.client.Collection("service_orders").
		Where("status", "==", "Finalizado").
		OrderBy("closed_at", firestore.Asc).
		Documents(h.ctx)
	defer iter.Stop()

	revenueMap := make(map[string]*models.PeriodRevenue)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("❌ Erro ao buscar OS fechadas para relatório: %v", err)
			http.Error(w, "Erro na busca de OS fechadas", http.StatusInternalServerError)
			return
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			continue
		}

		if order.ClosedAt == nil {
			continue
		}

		periodKey := order.ClosedAt.Format("2006-01")

		if _, ok := revenueMap[periodKey]; !ok {
			revenueMap[periodKey] = &models.PeriodRevenue{
				Period:  periodKey,
				Revenue: 0,
				Orders:  0,
			}
		}

		revenueMap[periodKey].Revenue += order.ServiceValue
		revenueMap[periodKey].Orders++
	}

	periods := make([]models.PeriodRevenue, 0, len(revenueMap))
	for _, periodData := range revenueMap {
		periods = append(periods, *periodData)
	}

	sort.Slice(periods, func(i, j int) bool {
		return periods[i].Period > periods[j].Period
	})

	log.Printf("✅ Relatório gerado com %d períodos", len(periods))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(periods)
}

func (h *FinancialHandler) GetOpenOrders(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔍 Listando OS abertas")

	iter := h.client.Collection("service_orders").
		Where("status", "in", openStatuses).
		OrderBy("created_at", firestore.Desc).
		Documents(h.ctx)
	defer iter.Stop()

	orders := make([]models.ServiceOrder, 0)
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

	if orders == nil {
		orders = make([]models.ServiceOrder, 0)
	}

	log.Printf("✅ Encontradas %d OS abertas", len(orders))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
