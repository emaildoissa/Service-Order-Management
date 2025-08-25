package models

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"time"

	"cloud.google.com/go/firestore"
)

type Customer struct {
	ID   string `json:"id" firestore:"-"`
	Name string `json:"name" firestore:"name" validate:"required,min=2"`
	// ---> ADICIONE ESTA LINHA <---
	NameNormalized string    `json:"-" firestore:"name_normalized"`
	PhoneNumber    string    `json:"phone_number" firestore:"phone_number"`
	Address        string    `json:"address" firestore:"address"`
	Neighborhood   string    `json:"neighborhood" firestore:"neighborhood"`
	City           string    `json:"city" firestore:"city"`
	State          string    `json:"state" firestore:"state"`
	ZipCode        string    `json:"zip_code" firestore:"zip_code"`
	HouseNumber    string    `json:"house_number" firestore:"house_number"`
	CreatedAt      time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" firestore:"updated_at"`
}

// O resto do arquivo continua igual...

// ViaCEPResponse representa a resposta da API do ViaCEP
type ViaCEPResponse struct {
	Cep         string `json:"cep"`
	Logradouro  string `json:"logradouro"`
	Complemento string `json:"complemento"`
	Bairro      string `json:"bairro"`
	Localidade  string `json:"localidade"`
	Uf          string `json:"uf"`
	Erro        bool   `json:"erro,omitempty"`
}

// LimparCEP remove formatação do CEP (deixa só números)
func LimparCEP(cep string) string {
	re := regexp.MustCompile(`\D`)
	return re.ReplaceAllString(cep, "")
}

// BuscarEnderecoViaCEP consulta a API do ViaCEP e retorna dados do endereço
func BuscarEnderecoViaCEP(cep string) (*ViaCEPResponse, error) {
	cepLimpo := LimparCEP(cep)
	if len(cepLimpo) != 8 {
		return nil, fmt.Errorf("CEP deve ter 8 dígitos")
	}
	url := fmt.Sprintf("https://viacep.com.br/ws/%s/json/", cepLimpo)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar ViaCEP: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CEP não encontrado")
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta: %w", err)
	}
	var viaCEP ViaCEPResponse
	if err := json.Unmarshal(body, &viaCEP); err != nil {
		return nil, fmt.Errorf("erro ao decodificar JSON: %w", err)
	}
	if viaCEP.Erro {
		return nil, fmt.Errorf("CEP não encontrado")
	}
	return &viaCEP, nil
}

func (c *Customer) FromFirestore(doc *firestore.DocumentSnapshot) error {
	c.ID = doc.Ref.ID
	return doc.DataTo(c)
}
