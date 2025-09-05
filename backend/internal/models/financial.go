// backend/internal/models/financial.go
package models

// FinancialSummary representa o resumo financeiro para o Dashboard.
type FinancialSummary struct {
	TotalRevenue  float64 `json:"total_revenue"`
	TotalOrders   int     `json:"total_orders"`
	OpenOrders    int     `json:"open_orders"`
	ClosedOrders  int     `json:"closed_orders"`
	AverageTicket float64 `json:"average_ticket"`
}

// PeriodRevenue representa os dados de faturação para um período.
type PeriodRevenue struct {
	Period  string  `json:"period"`
	Revenue float64 `json:"revenue"`
	Orders  int     `json:"orders"`
}
