// frontend/src/components/OrderDetailsModal.tsx
import {
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button,
  Typography, Box, CircularProgress, FormGroup, FormControlLabel, Checkbox,
  MenuItem
} from "@mui/material";
import { useState, useEffect } from "react";
import { api, ServiceOrder } from "../api";

interface Props {
  order: ServiceOrder;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const COMMON_ACCESSORIES = ["Carregador", "Cabo de Força", "Mouse", "Bolsa/Case"];

export default function OrderDetailsModal({ order, open, onClose, onSaved }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceOrder>>(order);
  const [accessories, setAccessories] = useState<Record<string, boolean>>({});
  const [otherAccessory, setOtherAccessory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData(order);
      
      const accessoriesList = order.accessories?.split(', ').filter(Boolean) || [];
      const commonAccs: Record<string, boolean> = {};
      let otherAccs = '';

      accessoriesList.forEach(acc => {
        if (COMMON_ACCESSORIES.includes(acc)) {
          commonAccs[acc] = true;
        } else {
          otherAccs = acc;
        }
      });

      setAccessories(commonAccs);
      setOtherAccessory(otherAccs);
    }
  }, [order, open]);

  const handleFieldChange = (field: keyof ServiceOrder) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  const handleAccessoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccessories({
      ...accessories,
      [event.target.name]: event.target.checked,
    });
  };
  
  const buildAccessoriesString = (): string => {
    const selected = COMMON_ACCESSORIES.filter(acc => accessories[acc]);
    if (otherAccessory.trim()) {
      selected.push(otherAccessory.trim());
    }
    return selected.join(', ');
  }

  const handleSave = async () => {
    if (!order.id) return;
    setSaving(true);
    try {
      const updatedData = {
        ...formData,
        accessories: buildAccessoriesString(),
      };
      await api.put(`/service-orders/${order.id}`, updatedData);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar a OS:", error);
      alert("Falha ao salvar a OS.");
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalhes da OS - #{order.id?.substring(0, 6).toUpperCase()}</DialogTitle>
      <DialogContent>
        <TextField
          label="Tipo de Equipamento"
          value={formData.equipment_type || ""}
          onChange={handleFieldChange('equipment_type')}
          fullWidth margin="dense" select disabled={!isEditing}
        >
          <MenuItem value="notebook">Notebook</MenuItem>
          <MenuItem value="pc">PC (Desktop)</MenuItem>
          <MenuItem value="monitor">Monitor</MenuItem>
        </TextField>
        <TextField label="Marca" value={formData.equipment_brand || ""} onChange={handleFieldChange('equipment_brand')} fullWidth margin="dense" disabled={!isEditing} />
        <TextField label="Modelo" value={formData.equipment_model || ""} onChange={handleFieldChange('equipment_model')} fullWidth margin="dense" disabled={!isEditing} />

        <TextField
          label="Defeito Relatado pelo Cliente"
          value={formData.reported_defect || ""}
          onChange={handleFieldChange('reported_defect')}
          fullWidth multiline rows={3} margin="normal" disabled={!isEditing}
        />
        <TextField
          label="Observações (Avarias, etc)"
          value={formData.observations || ""}
          onChange={handleFieldChange('observations')}
          fullWidth multiline rows={2} margin="dense" disabled={!isEditing}
        />
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Acessórios</Typography>
        <FormGroup row>
          {COMMON_ACCESSORIES.map(acc => (
            <FormControlLabel
              key={acc}
              control={<Checkbox checked={accessories[acc] || false} onChange={handleAccessoryChange} name={acc} />}
              label={acc}
              disabled={!isEditing}
            />
          ))}
        </FormGroup>
        <TextField
          label="Outros Acessórios"
          value={otherAccessory}
          onChange={(e) => setOtherAccessory(e.target.value)}
          fullWidth margin="dense" variant="standard" disabled={!isEditing}
        />
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleCancel}>
          {isEditing ? "Cancelar" : "Fechar"}
        </Button>
        {isEditing ? (
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>
            Salvar Alterações
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="contained">
            Editar
          </Button>
        )}
      </DialogActions>
    </Dialog> // <-- TAG DE FECHAMENTO ADICIONADA
  );
}