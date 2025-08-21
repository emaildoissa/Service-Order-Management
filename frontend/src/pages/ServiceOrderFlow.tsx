import { useState } from "react";
import { Button, Box, Paper, Typography } from "@mui/material";
import CustomerSearch from "../components/CustomerSearch";
import CustomerForm from "../components/CustomerForm";
import ServiceOrderForm from "../components/ServiceOrderForm";
import ServiceOrderList from "../components/ServiceOrderList";
import CloseOrderModal from "../components/CloseOrderModal";
import { Customer, orderAPI, ServiceOrder } from "../api";

export default function ServiceOrderFlow() {
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

  // Criar novo cliente
  const handleCreateRequest = (name: string) => {
    setTempName(name);
    setEditCustomer({ name });
    setShowCustomerModal(true);
  };

  // Salvar cliente novo ou editado
  const handleCustomerSaved = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setShowCustomerDetails(false);
    setEditCustomer(null);
    setTempName("");
  };

  // Selecionar cliente já cadastrado
  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(false);
  };

  // Clicar no botão editar (define editCustomer)
  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  const handleOrderCreated = (order: ServiceOrder) => {
    alert(`✅ OS criada!\nID: ${order.id}`);
    setShowCustomerDetails(true);
  };

  const handleOrderClosed = () => {
    alert("✅ OS fechada com sucesso!");
    setShowCloseModal(false);
    setSelectedOrder(null);
  };

  const reloadOrdersList = async () => {
    if (selectedCustomer?.id) {
      try {
        await orderAPI.listByCustomer(selectedCustomer.id);
      } catch (error) {
        console.error("Erro ao recarregar OS:", error);
      }
    }
  };

  return (
    <Box>
      {/* Cabeçalho de navegação */}
      {selectedCustomer && (
        <Button onClick={resetFlow} sx={{ mb: 2 }}>
          ← Novo Atendimento
        </Button>
      )}

      {/* Busca de cliente */}
      {!selectedCustomer && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Novo Atendimento</Typography>
          <CustomerSearch
            onSelect={handleCustomerSelected}
            onCreateRequest={handleCreateRequest}
          />
        </Paper>
      )}

      {/* Formulário de OS */}
      {selectedCustomer && !showCustomerDetails && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">
            Cliente: {selectedCustomer.name}
            <Button onClick={handleEditCustomer} sx={{ ml: 2 }}>
              Editar Cliente
            </Button>
          </Typography>
          <Typography variant="body2">{selectedCustomer.phone_number}</Typography>
          <ServiceOrderForm customer={selectedCustomer} onCreated={handleOrderCreated} />
        </Paper>
      )}

      {/* Lista e detalhes do cliente */}
      {selectedCustomer && showCustomerDetails && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">{selectedCustomer.name}</Typography>
          <Typography variant="body2">{selectedCustomer.phone_number}</Typography>
          <Button onClick={() => setShowCustomerDetails(false)} sx={{ mt: 1, mb: 1 }}>
            Nova OS
          </Button>
          <Typography variant="subtitle2">Ordens de Serviço:</Typography>
          <ServiceOrderList
            customerId={selectedCustomer.id!}
            onCloseRequest={handleCloseRequest}
            onOpenOrder={handleOpenOrder}
          />
        </Paper>
      )}

      {/* Modal: Cadastrar ou editar cliente */}
      <CustomerForm
        open={showCustomerModal}
        initialCustomer={editCustomer || (tempName ? { name: tempName } : undefined)}
        onClose={() => setShowCustomerModal(false)}
        onSaved={handleCustomerSaved}
      />

      {/* Modal: Fechar ou editar OS */}
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
