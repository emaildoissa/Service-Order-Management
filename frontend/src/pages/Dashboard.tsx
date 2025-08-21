import { useEffect, useState } from "react";
import { api, Customer, ServiceOrder, FinancialSummary } from "../api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableRow,
} from "@mui/material";
import CloseOrderModal from "../components/CloseOrderModal";

export default function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [openOrders, setOpenOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const calcularDiasEmAberto = (createdAt: string) => {
    if (!createdAt) return 0;
    
    const dataAbertura = new Date(createdAt);
    const hoje = new Date();
    
    // Usar UTC para evitar problemas de fuso horário
    const utc1 = Date.UTC(dataAbertura.getFullYear(), dataAbertura.getMonth(), dataAbertura.getDate());
    const utc2 = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const dias = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    return dias >= 0 ? dias : 0;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || customerId;
  };

  const reloadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, ordersRes, customersRes] = await Promise.all([
        api.get("/financials/summary"),
        api.get("/open-orders"),
        api.get("/customers"),
      ]);
      setSummary(summaryRes.data);
      setOpenOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard - OS Abertas
      </Typography>
      
      <Box display="flex" gap={2} flexWrap="wrap" mb={4}>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="textSecondary">OS Abertas</Typography>
            <Typography variant="h5">{summary?.open_orders ?? 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="textSecondary">Faturamento Total</Typography>
            <Typography variant="h5">
              R$ {summary?.total_revenue?.toFixed(2) ?? "0,00"}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="textSecondary">Ticket Médio</Typography>
            <Typography variant="h5">
              R$ {summary?.average_ticket?.toFixed(2) ?? "0,00"}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="textSecondary">OS Fechadas</Typography>
            <Typography variant="h5">{summary?.closed_orders ?? 0}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" gutterBottom>
        Ordens de Serviço Abertas ({openOrders.length})
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Equipamento</TableCell>
            <TableCell>Marca</TableCell>
            <TableCell>Data Abertura</TableCell>
            <TableCell>Dias em Aberto</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {openOrders.map((os) => {
            const diasAberto = calcularDiasEmAberto(os.created_at);
            
            return (
              <TableRow key={os.id || Math.random()}>
                <TableCell>{getCustomerName(os.customer_id)}</TableCell>
                <TableCell>{os.equipment_type || "N/A"}</TableCell>
                <TableCell>{os.equipment_brand || "N/A"}</TableCell>
                <TableCell>
                  {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : "Data não informada"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={diasAberto === 0 ? "Hoje" : `${diasAberto} dias`}
                    color={diasAberto > 7 ? "error" : diasAberto > 3 ? "warning" : "success"}
                  />
                </TableCell>
                <TableCell>
                  <Chip label={os.status || "unknown"} color="warning" />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedOrder(os);
                      setShowOrderModal(true);
                    }}
                  >
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedOrder && (
        <CloseOrderModal
          order={selectedOrder}
          open={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          onClosed={reloadData}
          onSaved={reloadData}
        />
      )}
    </Box>
  );
}
