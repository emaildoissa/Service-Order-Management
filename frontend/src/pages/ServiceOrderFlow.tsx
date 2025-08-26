import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Paper, Typography } from "@mui/material";
import CustomerSearch from "../components/CustomerSearch";
import CustomerForm from "../components/CustomerForm";
import ServiceOrderForm from "../components/ServiceOrderForm";
import ServiceOrderList from "../components/ServiceOrderList";
import CloseOrderModal from "../components/CloseOrderModal";
import OrderDetailsModal from "../components/OrderDetailsModal"; // Importe o modal de detalhes
import { Customer, ServiceOrder } from "../api";

export default function ServiceOrderFlow() {
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false); // Novo estado
  const [editCustomer, setEditCustomer] = useState<Partial<Customer> | null>(null);
  const [tempName, setTempName] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // Novo estado

  const resetFlow = () => {
    setSelectedCustomer(null);
    setShowCustomerModal(false);
    setShowNewOrderForm(false);
    setEditCustomer(null);
    setTempName("");
  };

  const handleOpenDetails = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
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
    setEditCustomer(null);
    setTempName("");
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowNewOrderForm(false);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  const handleOrderCreated = (order: ServiceOrder) => {
    alert(`✅ OS criada com sucesso para ${selectedCustomer?.name}!`);
    setShowNewOrderForm(false); // Volta para a lista
    // Forçar recarregamento da lista
    setSelectedCustomer(prev => prev ? { ...prev } : null);
  };

  const reloadOrders = () => {
    setShowCloseModal(false);
    setShowDetailsModal(false);
    setSelectedOrder(null);
    // Forçar recarregamento da lista
    setSelectedCustomer(prev => prev ? { ...prev } : null);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      {selectedCustomer && (
        <Button onClick={resetFlow} sx={{ mb: 2 }}>
          ← Buscar Outro Cliente
        </Button>
      )}

      {!selectedCustomer && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Iniciar Atendimento</Typography>
          <CustomerSearch
            onSelect={handleCustomerSelected}
            onCreateRequest={handleCreateRequest}
          />
        </Paper>
      )}

      {selectedCustomer && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">
                  Cliente: {selectedCustomer.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">{selectedCustomer.phone_number}</Typography>
              </Box>
              <Box>
                  <Button onClick={handleEditCustomer} variant="outlined" size="small" sx={{ mr: 2 }}>
                    Editar Dados
                  </Button>
                  <Button onClick={() => setShowNewOrderForm(true)} variant="contained">
                    + Nova OS
                  </Button>
              </Box>
          </Box>

          {showNewOrderForm ? (
             <ServiceOrderForm customer={selectedCustomer} onCreated={handleOrderCreated} />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>Histórico de Ordens de Serviço:</Typography>
              <ServiceOrderList
                customerId={selectedCustomer.id!}
                onCloseRequest={handleCloseRequest}
                onOpenOrder={handleOpenDetails}
              />
            </>
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
        <>
            <OrderDetailsModal
              order={selectedOrder}
              open={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              onSaved={reloadOrders}
            />
            <CloseOrderModal
              order={selectedOrder}
              open={showCloseModal}
              onClose={() => setShowCloseModal(false)}
              onClosed={reloadOrders}
              onSaved={reloadOrders}
            />
        </>
      )}
    </Box>
  );
}