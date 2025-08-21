import { useState } from "react";
import ServiceOrderList from "../components/ServiceOrderList";
import CloseOrderModal from "../components/CloseOrderModal";
import { Customer, ServiceOrder } from "../api";
import { Typography, Paper } from "@mui/material";

interface Props {
  customer: Customer;
}

export default function CustomerDetailsPage({ customer }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Ao clicar em "Fechar" na lista
  const handleCloseRequest = (order: ServiceOrder) => {
    setSelectedOrder(order);      // passa ordem para o modal
    setModalOpen(true);
  };

  // Ao clicar em "Abrir" na lista
  const handleOpenOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{customer.name}</Typography>
      <Typography variant="body2">{customer.phone_number}</Typography>

      <ServiceOrderList
        customerId={customer.id!}
        onCloseRequest={handleCloseRequest}
        onOpenOrder={handleOpenOrder}
      />

      
    </Paper>
  );
}
