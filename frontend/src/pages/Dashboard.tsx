import { useEffect, useState } from "react";
import { api, Customer, ServiceOrder, FinancialSummary } from "../api";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Table,
  TableBody, TableCell, TableHead, Typography, TableRow, Tooltip
  // Removi o Grid da importação
} from "@mui/material";
import CloseOrderModal from "../components/CloseOrderModal";
import OrderDetailsModal from "../components/OrderDetailsModal";

export default function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [openOrders, setOpenOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Cliente não encontrado";
  };

  const reloadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, ordersRes, customersRes] = await Promise.all([
        api.get("/financials/summary"),
        api.get("/open-orders"),
        api.get("/customers"),
      ]);
      setSummary(summaryRes.data);
      setOpenOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Erro ao carregar dashboard. Verifique o console do backend para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleOpenDetails = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const handleOpenCloseModal = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setCloseModalOpen(true);
  };

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* ---> SEÇÃO DE CARDS REFEITA COM BOX E FLEXBOX <--- */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>OS Abertas</Typography>
            <Typography variant="h5">{summary?.open_orders ?? 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Faturamento Total</Typography>
            <Typography variant="h5">
              R$ {summary?.total_revenue?.toFixed(2).replace('.', ',') ?? "0,00"}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Ticket Médio</Typography>
            <Typography variant="h5">
              R$ {summary?.average_ticket?.toFixed(2).replace('.', ',') ?? "0,00"}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>OS Fechadas</Typography>
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
            <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Equipamento</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Defeito Relatado</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Acessórios</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Data Abertura</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {openOrders.map((os) => (
              <TableRow key={os.id} hover>
                <TableCell>{getCustomerName(os.customer_id)}</TableCell>
                <TableCell>{`${os.equipment_type} ${os.equipment_brand}`}</TableCell>
                <TableCell>
                  <Tooltip title={os.reported_defect || 'Não informado'}>
                    <Typography noWrap sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {os.reported_defect}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={os.accessories || 'Nenhum'}>
                    <Typography noWrap sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {os.accessories || 'N/A'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : "N/A"}
                </TableCell>
                <TableCell>
                  <Chip label={os.status || "unknown"} color="warning" size="small" />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenDetails(os)}>
                    Detalhes
                  </Button>
                  <Button size="small" variant="contained" color="primary" onClick={() => handleOpenCloseModal(os)}>
                    Fechar OS
                  </Button>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          onSaved={reloadData}
        />
      )}

      {selectedOrder && (
        <CloseOrderModal
          order={selectedOrder}
          open={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          onClosed={reloadData}
        />
      )}
    </Box>
  );
}