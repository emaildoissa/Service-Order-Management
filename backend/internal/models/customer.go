package models

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

type Customer struct {
	ID           string    `json:"id" firestore:"-"`
	Name         string    `json:"name" firestore:"name" validate:"required,min=2"`
	PhoneNumber  string    `json:"phone_number" firestore:"phone_number"`
	Address      string    `json:"address" firestore:"address"`
	Neighborhood string    `json:"neighborhood" firestore:"neighborhood"`
	City         string    `json:"city" firestore:"city"`
	State        string    `json:"state" firestore:"state"`
	ZipCode      string    `json:"zip_code" firestore:"zip_code"`
	HouseNumber  string    `json:"house_number" firestore:"house_number"`
	CreatedAt    time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" firestore:"updated_at"`
}

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
	// Limpa o CEP (remove traços, espaços, etc)
	cepLimpo := LimparCEP(cep)

	// Valida se tem 8 dígitos
	if len(cepLimpo) != 8 {
		return nil, fmt.Errorf("CEP deve ter 8 dígitos")
	}

	// Monta URL da API ViaCEP
	url := fmt.Sprintf("https://viacep.com.br/ws/%s/json/", cepLimpo)

	// Faz a requisição HTTP
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar ViaCEP: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CEP não encontrado")
	}

	// Lê a resposta
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta: %w", err)
	}

	// Decodifica JSON
	var viaCEP ViaCEPResponse
	if err := json.Unmarshal(body, &viaCEP); err != nil {
		return nil, fmt.Errorf("erro ao decodificar JSON: %w", err)
	}

	// Verifica se o CEP existe (ViaCEP retorna erro: true quando não encontra)
	if viaCEP.Erro {
		return nil, fmt.Errorf("CEP não encontrado")
	}

	return &viaCEP, nil
}

// AtualizarEnderecoPorCEP busca endereço pelo CEP e atualiza os campos do cliente
func (c *Customer) AtualizarEnderecoPorCEP(cep, numero string) error {
	endereco, err := BuscarEnderecoViaCEP(cep)
	if err != nil {
		return err
	}

	// Atualiza campos do cliente
	c.ZipCode = strings.ReplaceAll(endereco.Cep, "-", "")
	c.Address = endereco.Logradouro
	c.Neighborhood = endereco.Bairro
	c.City = endereco.Localidade
	c.State = endereco.Uf
	c.HouseNumber = numero
	c.UpdatedAt = time.Now()

	return nil
}

func (c *Customer) FromFirestore(doc *firestore.DocumentSnapshot) error {
	c.ID = doc.Ref.ID
	return doc.DataTo(c)
}
