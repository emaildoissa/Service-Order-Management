import { useState, useEffect } from "react";
import { customerAPI, Customer } from "../api";

import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Typography,
  Paper
} from "@mui/material";
import CustomerForm from "../components/CustomerForm";

export default function CustomersPage() {
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [novo, setNovo] = useState(false);

  const buscarClientes = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.search(busca);
      setClientes(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarClientes();
    // eslint-disable-next-line
  }, []);

  const handleBusca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
  };

  const realizarBusca = () => {
    buscarClientes();
  };

  const abrirEdicao = async (cliente: Customer) => {
    console.log("Abrindo edição para cliente:", cliente);
    
    // Se o cliente não tem todos os dados, buscar do backend
    if (!cliente.endereco && cliente.id) {
      try {
        console.log("Buscando dados completos do cliente ID:", cliente.id);
        const response = await customerAPI.get(cliente.id);
        const clienteCompleto = response.data;
        console.log("Dados completos recebidos:", clienteCompleto);
        
        setSelected(clienteCompleto);
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error);
        setSelected(cliente); // usa os dados que temos
      }
    } else {
      setSelected(cliente);
    }
    
    setNovo(false);
    setShowForm(true);
  };

  const abrirNovo = () => {
    setSelected(null);
    setNovo(true);
    setShowForm(true);
  };

  const fecharForm = () => {
    setShowForm(false);
    setSelected(null);
    setNovo(false);
  };

  const handleSalvo = (cliente: Customer) => {
    console.log("Cliente salvo, recarregando lista:", cliente);
    fecharForm();
    buscarClientes(); // Recarrega a lista
  };

  return (
    <Paper sx={{ maxWidth: 600, margin: "32px auto", p: 3 }}>
      <Typography variant="h5">Clientes</Typography>
      <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2 }}>
        <TextField
          label="Buscar cliente"
          value={busca}
          onChange={handleBusca}
          size="small"
          fullWidth
        />
        <Button variant="contained" onClick={realizarBusca}>
          Buscar
        </Button>
        <Button variant="outlined" color="success" onClick={abrirNovo}>
          Novo Cliente
        </Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {clientes.length === 0 ? (
            <Typography sx={{ mt: 2 }}>Nenhum cliente encontrado.</Typography>
          ) : (
            clientes.map((cliente) => (
              <ListItem
                key={cliente.id}
                sx={{ 
                  border: '1px solid #eee', 
                  borderRadius: 1, 
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
                onClick={() => abrirEdicao(cliente)}
              >
                <ListItemText
                  primary={cliente.name}
                  secondary={cliente.phone_number || ""}
                />
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirEdicao(cliente);
                  }}
                >
                  Editar
                </Button>
              </ListItem>
            ))
          )}
        </List>
      )}

      {showForm && (
        <CustomerForm
          open={showForm}
          initialCustomer={novo ? undefined : selected!}
          onClose={fecharForm}
          onSaved={handleSalvo}
        />
      )}
    </Paper>
  );
}