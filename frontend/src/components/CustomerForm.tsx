import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { customerAPI, Customer, mapBackendToFrontend } from "../api";
import { useAsync } from "../hooks/useAsync";

interface Props {
  initialCustomer?: Partial<Customer>;
  open: boolean;
  onClose(): void;
  onSaved(cust: Customer): void;
}

const emptyCustomer: Omit<Customer, 'id'> = {
  name: "",
  cep: "",
  endereco: "",
  bairro: "",
  cidade: "",
  estado: "",
  phone_number: "",
};

export default function CustomerForm({ initialCustomer, open, onClose, onSaved }: Props) {
  // Inicializa o estado corretamente
  const [customer, setCustomer] = useState<Customer>(() => ({
    ...emptyCustomer,
    ...initialCustomer
  } as Customer));

  const { loading, run, error } = useAsync<Customer>();

  // Atualiza estado quando o dialog abre ou o cliente inicial muda
  useEffect(() => {
    if (open) {
      setCustomer({
        ...emptyCustomer,
        ...initialCustomer
      } as Customer);
    }
  }, [initialCustomer, open]);

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (!response.ok) {
          throw new Error('Erro na resposta da API');
        }
        
        const data = await response.json();
        
        if (!data.erro) {
          setCustomer(prev => ({
            ...prev,
            endereco: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || ""
          }));
        } else {
          alert("CEP não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        alert("Erro ao buscar CEP");
      }
    }
  };

  const formatarCEP = (value: string) => {
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    return cepLimpo.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  };

  const handleSave = async () => {
    // Validação client-side
    const camposObrigatorios = ['name', 'cep', 'endereco', 'bairro', 'cidade', 'estado'];
    const camposVazios = camposObrigatorios.filter(campo => 
      !customer[campo as keyof Customer] || 
      String(customer[campo as keyof Customer]).trim() === ''
    );

    if (camposVazios.length > 0) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      let savedCustomer: Customer;
      
      if (customer.id) {
        // Edição
        console.log("Enviando dados para edição:", customer);
        
        const response = await run(() => 
          customerAPI.update(customer.id!, customer).then(res => res.data)
        );
        savedCustomer = response!;
      } else {
        // Criação
        console.log("Enviando dados para criação:", customer);
        
        const response = await run(() =>
          customerAPI.create(customer).then(res => res.data)
        );
        savedCustomer = response!;
      }

      console.log("Cliente salvo:", savedCustomer);
      onSaved(savedCustomer);
      onClose();
      
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      // O erro já será exibido pelo useAsync
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cepFormatado = formatarCEP(value);
    
    setCustomer(prev => ({ ...prev, cep: cepFormatado }));
    
    // Só busca CEP se tiver 8 dígitos
    if (cepFormatado.replace(/\D/g, '').length === 8) {
      buscarCEP(cepFormatado);
    }
  };

  const handleFieldChange = (field: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Debug: mostrar dados carregados
  useEffect(() => {
    if (open && initialCustomer) {
      console.log("Dados iniciais do cliente:", initialCustomer);
      console.log("Estado atual do customer:", customer);
    }
  }, [open, initialCustomer, customer]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {customer.id ? "Editar Cliente" : "Novo Cliente"}
      </DialogTitle>
      <DialogContent>
        <TextField 
          label="Nome" 
          value={customer.name || ""} 
          onChange={handleFieldChange('name')}
          fullWidth 
          required 
          margin="dense"
          variant="outlined"
          autoFocus
        />
        <TextField 
          label="Telefone" 
          value={customer.phone_number || ""} 
          onChange={handleFieldChange('phone_number')}
          fullWidth 
          margin="dense"
          variant="outlined"
          placeholder="(11) 99999-9999"
        />
        <TextField 
          label="CEP" 
          value={customer.cep || ""} 
          onChange={handleCEPChange}
          fullWidth 
          margin="dense"
          variant="outlined"
          placeholder="00000-000" 
          inputProps={{ maxLength: 9 }}
          required
        />
        <TextField 
          label="Endereço" 
          value={customer.endereco || ""} 
          onChange={handleFieldChange('endereco')}
          fullWidth 
          margin="dense"
          variant="outlined"
          required
        />
        <TextField 
          label="Bairro" 
          value={customer.bairro || ""} 
          onChange={handleFieldChange('bairro')}
          fullWidth 
          margin="dense"
          variant="outlined"
          required
        />
        <TextField 
          label="Cidade" 
          value={customer.cidade || ""} 
          onChange={handleFieldChange('cidade')}
          fullWidth 
          margin="dense"
          variant="outlined"
          required
        />
        <TextField 
          label="Estado" 
          value={customer.estado || ""} 
          onChange={handleFieldChange('estado')}
          fullWidth 
          margin="dense"
          variant="outlined"
          inputProps={{ maxLength: 2 }} 
          placeholder="SP"
          required
        />
        {error && (
          <div style={{ 
            color: "red", 
            marginTop: "16px",
            padding: "8px",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
            fontSize: "0.875rem"
          }}>
            {error}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          variant="contained"
          color="primary"
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}