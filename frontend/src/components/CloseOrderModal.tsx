// src/components/CloseOrderModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { ServiceOrder, api, orderAPI } from "../api"; // Importe o orderAPI

interface Props {
  order: ServiceOrder;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  onSaved?: () => void;
}

const TIPOS_SERVICO = [
  "Conserto",
  "Manutenção",
  "Limpeza",
  "Upgrade",
  "Instalação",
  "Outro",
];

export default function CloseOrderModal({
  order,
  open,
  onClose,
  onClosed,
  onSaved,
}: Props) {
  const [tipoServico, setTipoServico] = useState(
    order.equipment_type || "Conserto"
  );
  const [descricao, setDescricao] = useState(order.work_description || "");
  const [valor, setValor] = useState(order.service_value || 40);
  const [garantia, setGarantia] = useState(order.warranty_days || 90);
  const [saving, setSaving] = useState(false);

  // Salvar alterações parciais (sem fechar OS) - PUT para atualizar ordem
  const handleSave = async () => {
    if (!order.id) return;

    setSaving(true);
    try {
      await api.put(`/service-orders/${order.id}`, {
        equipment_type: tipoServico,
        work_description: descricao,
        service_value: valor,
        warranty_days: garantia,
      });
      console.log("✅ Ordem salva com sucesso");
      onClose();

      // Chamar callback para atualizar lista
      if (onSaved) onSaved(); // ← USE A NOVA PROP AQUI
    } catch (error) {
      console.error("❌ Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
    // Não fecha o modal, apenas mantém campos salvos
  };

  // Fechar a OS (atualiza status para closed) - PUT para /close
  const handleCloseOrder = async () => {
    if (!order.id) return;

    setSaving(true);
    try {
      // CORREÇÃO AQUI: Adicionando "warranty_days" ao objeto enviado
      await orderAPI.close(order.id, {
        work_description: descricao,
        service_value: valor,
        warranty_days: garantia,
      });
      console.log("✅ OS fechada com sucesso");
      onClose();
      if (onClosed) onClosed();
    } catch (error) {
      console.error("❌ Erro ao fechar OS:", error);
      alert("Falha ao fechar a OS. Verifique os campos e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Quando a ordem muda, atualiza campos do formulário
  useEffect(() => {
    if (open) {
      setTipoServico(order.equipment_type || "Conserto");
      setDescricao(order.work_description || "");
      setValor(order.service_value || 40);
      setGarantia(order.warranty_days || 90);
    }
  }, [order, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Fechar OS - {order.equipment_type} {order.equipment_brand || ""}
      </DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          label="Tipo de Serviço"
          value={tipoServico}
          onChange={(e) => setTipoServico(e.target.value)}
          margin="normal"
          disabled={saving}
        >
          {TIPOS_SERVICO.map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {tipo}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Descrição do trabalho realizado *"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          margin="normal"
          disabled={saving}
          placeholder="Descreva o serviço realizado..."
        />

        <TextField
          label="Valor do serviço (R$) *"
          type="number"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          fullWidth
          margin="normal"
          disabled={saving}
          inputProps={{ min: 40, step: 10 }}
          helperText="Valor mínimo: R$ 40,00"
        />

        <TextField
          label="Garantia (dias)"
          type="number"
          value={garantia}
          onChange={(e) => setGarantia(Number(e.target.value))}
          fullWidth
          margin="normal"
          disabled={saving}
          inputProps={{ min: 0, step: 10 }}
          helperText="Padrão: 90 dias. Use 0 para sem garantia."
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          color="info"
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          Salvar
        </Button>

        <Button
          onClick={handleCloseOrder}
          disabled={saving || !descricao.trim() || valor < 40}
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          Fechar OS
        </Button>
      </DialogActions>
    </Dialog>
  );
}