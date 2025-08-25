import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- IMPORTAR O HOOK
import { Button, Box, Paper, Typography } from "@mui/material";
import CustomerSearch from "../components/CustomerSearch";
import CustomerForm from "../components/CustomerForm";
import ServiceOrderForm from "../components/ServiceOrderForm";
import ServiceOrderList from "../components/ServiceOrderList";
import CloseOrderModal from "../components/CloseOrderModal";
import { Customer, orderAPI, ServiceOrder } from "../api";

export default function ServiceOrderFlow() {
  const navigate = useNavigate(); // <-- INICIALIZAR O HOOK

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer> | null>(null);
  const [tempName, setTempName] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const resetFlow = () => {
    setSelectedCustomer(null);
    setShowCustomerModal(false);
    setShowCustomerDetails(false);
    setEditCustomer(null);
    setTempName("");
  };

  const handleOpenOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowCloseModal(true);
  };

  const handleCloseRequest = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowCloseModal(true);
  };

  const handleCreateRequest = (name: string) => {
    setTempName(name);
    setEditCustomer({ name });
    setShowCustomerModal(true);
  };

  const handleCustomerSaved = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setShowCustomerDetails(false);
    setEditCustomer(null);
    setTempName("");
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(false); 
  };
  
  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  // ---> FUNÇÃO MODIFICADA <---
  const handleOrderCreated = (order: ServiceOrder) => {
    alert(`✅ OS criada com sucesso para ${selectedCustomer?.name}!`);
    navigate('/'); // Redireciona para o Dashboard
  };

  const reloadOrdersList = async () => {
    // Esta função pode ser otimizada no futuro,
    // por agora, a lógica de recarregar a lista no dashboard já existe.
    setShowCloseModal(false);
    setSelectedOrder(null);
    // Força o componente de lista a recarregar quando reabrir
    setShowCustomerDetails(false); 
    setTimeout(() => setShowCustomerDetails(true), 50);
  };

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', p: 2 }}>
      {selectedCustomer && (
        <Button onClick={resetFlow} sx={{ mb: 2 }}>
          ← Buscar Outro Cliente
        </Button>
      )}

      {!selectedCustomer && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Iniciar Novo Atendimento</Typography>
          <CustomerSearch
            onSelect={handleCustomerSelected}
            onCreateRequest={handleCreateRequest}
          />
        </Paper>
      )}
      
      {/* Container para as duas visualizações do cliente */}
      {selectedCustomer && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">
                  Cliente: {selectedCustomer.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">{selectedCustomer.phone_number}</Typography>
              </Box>
              <Button onClick={handleEditCustomer} variant="outlined" size="small">
                Editar Dados
              </Button>
          </Box>
          <hr style={{margin: '16px 0'}}/>

          {/* Alterna entre criar nova OS e ver a lista */}
          {showCustomerDetails ? (
            <>
              <Button onClick={() => setShowCustomerDetails(false)} sx={{ mb: 2 }} variant="contained">
                + Nova OS para este Cliente
              </Button>
              <Typography variant="h6" gutterBottom>Ordens de Serviço:</Typography>
              <ServiceOrderList
                customerId={selectedCustomer.id!}
                onCloseRequest={handleCloseRequest}
                onOpenOrder={handleOpenOrder}
              />
            </>
          ) : (
             <ServiceOrderForm customer={selectedCustomer} onCreated={handleOrderCreated} />
          )}
        </Paper>
      )}


      {showCustomerModal && (
        <CustomerForm
          open={showCustomerModal}
          initialCustomer={editCustomer || (tempName ? { name: tempName } : undefined)}
          onClose={() => setShowCustomerModal(false)}
          onSaved={handleCustomerSaved}
        />
      )}

      {selectedOrder && (
        <CloseOrderModal
          order={selectedOrder}
          open={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onClosed={reloadOrdersList}
          onSaved={reloadOrdersList}
        />
      )}
    </Box>
  );
}