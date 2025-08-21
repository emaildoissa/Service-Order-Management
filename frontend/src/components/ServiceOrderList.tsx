import { useEffect, useState } from "react";
import { orderAPI, ServiceOrder } from "../api";
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Chip, CircularProgress } from "@mui/material";

interface Props {
  customerId: string;
  onCloseRequest(os: ServiceOrder): void;
  onOpenOrder(os: ServiceOrder): void;  // ← Nova prop para abrir OS
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

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tipo</TableCell>
          <TableCell>Marca</TableCell>
          <TableCell>Status</TableCell>
           <TableCell>Ações</TableCell>
          
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((os) => (
          <TableRow key={os.id}>
            <TableCell>{os.equipment_type}</TableCell>
            <TableCell>{os.equipment_brand}</TableCell>
            <TableCell>
              <Chip color={os.status === "closed" ? "success" : "warning"} label={os.status} />
            </TableCell>
            <TableCell>
              <Button 
                size="small" 
                variant="outlined"
                color="primary"
                onClick={() => onOpenOrder(os)}
                sx={{ mr: 1 }}
              >
                Abrir
              </Button>
              
              {/* Botão para fechar OS (só aparece se estiver aberta) */}
              <Button 
                size="small" 
                variant="contained"
                color="secondary"
                onClick={() => onCloseRequest(os)}
                disabled={os.status === "closed"}
              >
                {os.status === "closed" ? "Fechada" : "Fechar"}
              </Button>
              
            </TableCell>
            
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
