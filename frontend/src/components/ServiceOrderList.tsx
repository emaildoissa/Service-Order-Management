import { useEffect, useState } from "react";
import { orderAPI, ServiceOrder } from "../api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

interface Props {
  customerId: string;
  onCloseRequest(os: ServiceOrder): void;
  onOpenOrder(os: ServiceOrder): void;
}

export default function ServiceOrderList({
  customerId,
  onCloseRequest,
  onOpenOrder,
}: Props) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    orderAPI
      .listByCustomer(customerId)
      .then((res) => {
        setOrders(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [customerId]);

  /**
   * Verifica se uma OS ainda está na garantia.
   * @param closeDate Data de fechamento da OS.
   * @param warrantyDays Dias de garantia definidos para a OS.
   * @returns `true` se estiver na garantia, `false` caso contrário.
   */
  const checkWarranty = (
    closeDate?: string,
    warrantyDays?: number
  ): boolean => {
    if (!closeDate || !warrantyDays || warrantyDays === 0) {
      return false;
    }

    const closedAt = new Date(closeDate);
    const warrantyExpiresAt = new Date(closedAt);
    warrantyExpiresAt.setDate(closedAt.getDate() + warrantyDays);

    return new Date() < warrantyExpiresAt;
  };

  if (loading) return <CircularProgress />;

  if (orders.length === 0) {
    return (
      <Typography sx={{ mt: 2, fontStyle: "italic" }}>
        Nenhuma ordem de serviço encontrada para este cliente.
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: "bold" }}>Equipamento</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Defeito Relatado</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Data Abertura</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Data Fechamento</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Valor</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Garantia</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((os) => {
          const isClosed = os.status === "Finalizado";
          const inWarranty = checkWarranty(os.closed_at, os.warranty_days);

          return (
            <TableRow key={os.id}>
              <TableCell>
                {os.equipment_type} {os.equipment_brand}
              </TableCell>
              <TableCell>{os.reported_defect}</TableCell>
              <TableCell>
                {new Date(os.created_at).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                {os.closed_at
                  ? new Date(os.closed_at).toLocaleDateString("pt-BR")
                  : "-"}
              </TableCell>
              <TableCell>
                {os.service_value ? `R$ ${os.service_value.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell>
                <Chip
                  color={isClosed ? "success" : "warning"}
                  label={os.status}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {isClosed && (
                  <Chip
                    label={inWarranty ? "Em Garantia" : "Fora de Garantia"}
                    color={inWarranty ? "success" : "default"}
                    size="small"
                    variant="outlined"
                  />
                )}
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
                {!isClosed && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onCloseRequest(os)}
                  >
                    Fechar OS
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}