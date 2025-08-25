import { useEffect, useState } from "react";
import { orderAPI, ServiceOrder } from "../api";
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Chip, CircularProgress, Typography } from "@mui/material";

interface Props {
  customerId: string;
  onCloseRequest(os: ServiceOrder): void;
  onOpenOrder(os: ServiceOrder): void;
}

export default function ServiceOrderList({ customerId, onCloseRequest, onOpenOrder }: Props) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    orderAPI.listByCustomer(customerId).then((res) => {
      setOrders(res.data);
      setLoading(false);
    });
  }, [customerId]);

  if (loading) return <CircularProgress />;

  if (orders.length === 0) {
    return <Typography sx={{ mt: 2, fontStyle: 'italic' }}>Nenhuma ordem de serviço encontrada para este cliente.</Typography>;
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>Equipamento</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Defeito Relatado</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Data Abertura</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((os) => (
          <TableRow key={os.id}>
            <TableCell>{os.equipment_type} {os.equipment_brand}</TableCell>
            <TableCell>{os.reported_defect}</TableCell>
            <TableCell>
              {new Date(os.created_at).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>
              <Chip 
                color={os.status === "closed" || os.status === "Finalizado" ? "success" : "warning"} 
                label={os.status} 
                size="small"
              />
            </TableCell>
            <TableCell>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => onOpenOrder(os)}
                sx={{ mr: 1 }}
              >
                Detalhes
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}