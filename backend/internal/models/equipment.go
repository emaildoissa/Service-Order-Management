package models

import (
	"time"

	"cloud.google.com/go/firestore"
)

type Equipment struct {
	ID           string    `json:"id" firestore:"-"`
	OwnerID      string    `json:"owner_id" firestore:"owner_id" validate:"required"`
	OwnerName    string    `json:"owner_name" firestore:"owner_name"`
	SerialNumber string    `json:"serial_number,omitempty" firestore:"serial_number,omitempty"`
	Type         string    `json:"type" firestore:"type" validate:"required"`
	Brand        string    `json:"brand" firestore:"brand" validate:"required"`
	Model        string    `json:"model,omitempty" firestore:"model,omitempty"`
	Processor    string    `json:"processor,omitempty" firestore:"processor,omitempty"`
	MemorySize   string    `json:"memory_size,omitempty" firestore:"memory_size,omitempty"`
	HDType       string    `json:"hd_type,omitempty" firestore:"hd_type,omitempty"`
	CreatedAt    time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" firestore:"updated_at"`
}

func (e *Equipment) FromFirestore(doc *firestore.DocumentSnapshot) error {
	e.ID = doc.Ref.ID
	return doc.DataTo(e)
}
