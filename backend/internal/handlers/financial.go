package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/emaildoissa/service-order-management/backend/internal/database"
	"github.com/emaildoissa/service-order-management/backend/internal/models"

	"google.golang.org/api/iterator"
)

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

type CustomerRevenue struct {
	CustomerID   string  `json:"customer_id"`
	CustomerName string  `json:"customer_name"`
	Revenue      float64 `json:"revenue"`
	Orders       int     `json:"orders"`
}

// Resumo financeiro geral
func GetFinancialSummary(w http.ResponseWriter, r *http.Request) {
	log.Printf("📊 Gerando resumo financeiro")

	// Buscar todas as OS fechadas
	iter := database.FirestoreClient.Collection("service_orders").
		Where("status", "==", "closed").
		Documents(database.Ctx)
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
			http.Error(w, "Erro na busca", http.StatusInternalServerError)
			return
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			continue
		}

		totalRevenue += order.ServiceValue
		closedOrders++
	}

	// Contar OS abertas
	openIter := database.FirestoreClient.Collection("service_orders").
		Where("status", "==", "open").
		Documents(database.Ctx)
	defer openIter.Stop()

	openOrders := 0
	for {
		_, err := openIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
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

// Faturamento por período (mês)
func GetRevenueByPeriod(w http.ResponseWriter, r *http.Request) {
	log.Printf("📈 Gerando relatório por período")

	iter := database.FirestoreClient.Collection("service_orders").
		Where("status", "==", "closed").
		Documents(database.Ctx) // ← SEM OrderBy
	defer iter.Stop()

	periodMap := make(map[string]*PeriodRevenue)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("❌ Erro ao buscar OS: %v", err)
			continue
		}

		var order models.ServiceOrder
		if err := order.FromFirestore(doc); err != nil {
			continue
		}

		if order.ClosedAt != nil {
			period := order.ClosedAt.Format("2006-01")

			if _, exists := periodMap[period]; !exists {
				periodMap[period] = &PeriodRevenue{
					Period:  period,
					Revenue: 0,
					Orders:  0,
				}
			}

			periodMap[period].Revenue += order.ServiceValue
			periodMap[period].Orders++
		}
	}

	var periods []PeriodRevenue
	for _, p := range periodMap {
		periods = append(periods, *p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(periods)
}

// OS abertas (dashboard principal)
func GetOpenOrders(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔍 Listando OS abertas")

	iter := database.FirestoreClient.Collection("service_orders").
		Where("status", "==", "open").
		Documents(database.Ctx) // ← SEM OrderBy
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
