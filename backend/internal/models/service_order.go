package models

import (
	"time"

	"cloud.google.com/go/firestore"
)

type ServiceOrder struct {
	ID              string     `json:"id" firestore:"-"`
	CustomerID      string     `json:"customer_id" firestore:"customer_id" validate:"required"`
	CustomerName    string     `json:"customer_name" firestore:"customer_name"`
	EquipmentID     string     `json:"equipment_id" firestore:"equipment_id" validate:"required"`
	EquipmentType   string     `json:"equipment_type" firestore:"equipment_type" validate:"required,oneof=notebook pc monitor"`
	EquipmentBrand  string     `json:"equipment_brand" firestore:"equipment_brand" validate:"required"`
	EquipmentModel  string     `json:"equipment_model" firestore:"equipment_model"`
	Status          string     `json:"status" firestore:"status"`
	WorkDescription string     `json:"work_description" firestore:"work_description"`
	ServiceValue    float64    `json:"service_value" firestore:"service_value"`
	CreatedAt       time.Time  `json:"created_at" firestore:"created_at"`
	ClosedAt        *time.Time `json:"closed_at" firestore:"closed_at"`
	ReportedDefect  string     `json:"reported_defect" firestore:"reported_defect" validate:"required"`
	Accessories     string     `json:"accessories" firestore:"accessories"`
	Observations    string     `json:"observations" firestore:"observations"`
	WarrantyDays    int        `json:"warranty_days" firestore:"warranty_days"`
	/* HDType          string     `json:"hd_type,omitempty" firestore:"hd_type,omitempty"`
	MemorySize      string     `json:"memory_size,omitempty" firestore:"memory_size,omitempty"`
	Processor       string     `json:"processor,omitempty" firestore:"processor,omitempty"` */
}

type CloseOrderRequest struct {
	WorkDescription string  `json:"work_description" validate:"required"`
	ServiceValue    float64 `json:"service_value" validate:"required,min=0"`
	WarrantyDays    int     `json:"warranty_days" validate:"required,min=0"`
}

func (so *ServiceOrder) FromFirestore(doc *firestore.DocumentSnapshot) error {
	so.ID = doc.Ref.ID
	return doc.DataTo(so)
}
