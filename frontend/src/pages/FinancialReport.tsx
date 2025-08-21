import { useEffect, useState } from "react";
import { financialAPI, PeriodRevenue, FinancialSummary } from "../api";
import { 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Card, 
  CardContent 
} from "@mui/material";

export default function FinancialReport() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [periods, setPeriods] = useState<PeriodRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      financialAPI.getSummary(),
      financialAPI.getByPeriod()
    ]).then(([summaryRes, periodsRes]) => {
      setSummary(summaryRes.data);
      setPeriods(periodsRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando relatório...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Relatório Financeiro
      </Typography>

      {/* Resumo geral */}
      <Card style={{ marginBottom: "30px" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Resumo Geral
          </Typography>
          <Typography>
            <strong>Faturamento Total:</strong> R$ {summary?.total_revenue.toFixed(2)}
          </Typography>
          <Typography>
            <strong>Ordens Fechadas:</strong> {summary?.closed_orders}
          </Typography>
          <Typography>
            <strong>Ticket Médio:</strong> R$ {summary?.average_ticket.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      {/* Faturamento por período */}
      <Typography variant="h5" gutterBottom>
        Faturamento por Mês
      </Typography>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Período</TableCell>
            <TableCell>Faturamento</TableCell>
            <TableCell>Ordens</TableCell>
            <TableCell>Ticket Médio</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period.period}>
              <TableCell>{period.period}</TableCell>
              <TableCell>R$ {period.revenue.toFixed(2)}</TableCell>
              <TableCell>{period.orders}</TableCell>
              <TableCell>
                R$ {(period.revenue / period.orders).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
