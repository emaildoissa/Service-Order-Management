// frontend/src/pages/ServiceOrderFlow.tsx
import { useState } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import CustomerSearch from "../components/CustomerSearch";
import CustomerForm from "../components/CustomerForm";
import EquipmentList from "../components/EquipmentList";
import EquipmentForm from "../components/EquipmentForm";
import ServiceOrderForm from "../components/ServiceOrderForm";
import { Customer, ServiceOrder, Equipment } from "../api";

// Enum para controlar o estado do fluxo
enum FlowStep {
  SELECT_CUSTOMER,
  SELECT_EQUIPMENT,
  CREATE_EQUIPMENT,
  CREATE_ORDER,
}

export default function ServiceOrderFlow() {
  const [step, setStep] = useState<FlowStep>(FlowStep.SELECT_CUSTOMER);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Estados para os modais
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer> | null>(null);

  const resetFlow = () => {
    setStep(FlowStep.SELECT_CUSTOMER);
    setSelectedCustomer(null);
    setSelectedEquipment(null);
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep(FlowStep.SELECT_EQUIPMENT);
  };

  const handleEquipmentSelected = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStep(FlowStep.CREATE_ORDER);
  };
  
  const handleEquipmentSaved = (equipment: Equipment) => {
    // Após salvar, já seleciona o equipamento para a OS
    setSelectedEquipment(equipment);
    setStep(FlowStep.CREATE_ORDER);
  }

  const handleOrderCreated = (order: ServiceOrder) => {
    alert(`✅ OS criada com sucesso para ${selectedCustomer?.name}!`);
    // Volta para a tela de seleção de equipamento do mesmo cliente
    setSelectedEquipment(null);
    setStep(FlowStep.SELECT_EQUIPMENT);
  };
  
  // Funções para modais de cliente
  const handleCreateRequest = (name: string) => {
    setEditCustomer({ name });
    setShowCustomerModal(true);
  };

  const handleCustomerSaved = (customer: Customer) => {
    setShowCustomerModal(false);
    setEditCustomer(null);
    handleCustomerSelected(customer);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  const renderStep = () => {
    switch(step) {
      case FlowStep.SELECT_CUSTOMER:
        return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Iniciar Atendimento</Typography>
            <CustomerSearch onSelect={handleCustomerSelected} onCreateRequest={handleCreateRequest} />
          </Paper>
        );

      case FlowStep.SELECT_EQUIPMENT:
        return (
          <EquipmentList 
            customerId={selectedCustomer!.id!}
            onSelectEquipment={handleEquipmentSelected}
            onAddNew={() => setStep(FlowStep.CREATE_EQUIPMENT)}
          />
        );
      
      case FlowStep.CREATE_EQUIPMENT:
        return (
          <EquipmentForm 
            customer={selectedCustomer!}
            onSaved={handleEquipmentSaved}
            onCancel={() => setStep(FlowStep.SELECT_EQUIPMENT)}
          />
        );

      case FlowStep.CREATE_ORDER:
        return (
          <ServiceOrderForm 
            equipment={selectedEquipment!}
            onCreated={handleOrderCreated}
            onCancel={() => setStep(FlowStep.SELECT_EQUIPMENT)}
          />
        );

      default:
        return null;
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', p: 2 }}>
      {selectedCustomer && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Button onClick={resetFlow} sx={{ mb: 1 }}>← Trocar Cliente</Button>
              <Typography variant="h6">Cliente: {selectedCustomer.name}</Typography>
              <Typography variant="body2" color="textSecondary">{selectedCustomer.phone_number}</Typography>
            </Box>
            <Button onClick={handleEditCustomer} variant="outlined" size="small">
              Editar Dados do Cliente
            </Button>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        {renderStep()}
      </Paper>

      {showCustomerModal && (
        <CustomerForm
          open={showCustomerModal}
          initialCustomer={editCustomer || undefined}
          onClose={() => setShowCustomerModal(false)}
          onSaved={handleCustomerSaved}
        />
      )}
    </Box>
  );
}