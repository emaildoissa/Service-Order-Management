// frontend/src/components/EquipmentForm.tsx
import { useState } from "react";
import { Button, MenuItem, TextField, Typography, Box, CircularProgress } from "@mui/material";
import { equipmentAPI, Equipment, Customer } from "../api";

interface Props {
  customer: Customer;
  onSaved: (equipment: Equipment) => void;
  onCancel: () => void;
}

export default function EquipmentForm({ customer, onSaved, onCancel }: Props) {
  const [equipment, setEquipment] = useState<Partial<Equipment>>({
    owner_id: customer.id!,
    owner_name: customer.name,
    type: "notebook",
  });
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field: keyof Equipment) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEquipment(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await equipmentAPI.create(equipment);
      onSaved(response.data);
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);
      alert("Falha ao salvar equipamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Cadastrar Novo Equipamento para {customer.name}
      </Typography>
      
      <TextField select label="Tipo de Equipamento" value={equipment.type} onChange={handleFieldChange('type')} fullWidth margin="dense">
        <MenuItem value="notebook">Notebook</MenuItem>
        <MenuItem value="pc">PC (Desktop)</MenuItem>
        <MenuItem value="monitor">Monitor</MenuItem>
        <MenuItem value="outro">Outro</MenuItem>
      </TextField>
      <TextField label="Marca" value={equipment.brand || ""} onChange={handleFieldChange('brand')} fullWidth required margin="dense" />
      <TextField label="Modelo" value={equipment.model || ""} onChange={handleFieldChange('model')} fullWidth margin="dense" />
      <TextField label="Número de Série (opcional)" value={equipment.serial_number || ""} onChange={handleFieldChange('serial_number')} fullWidth margin="dense" />
      
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Especificações (opcional)</Typography>
      <TextField label="Processador" value={equipment.processor || ""} onChange={handleFieldChange('processor')} fullWidth margin="dense" placeholder="Ex: Intel Core i5-8250U" />
      <TextField label="Memória RAM" value={equipment.memory_size || ""} onChange={handleFieldChange('memory_size')} fullWidth margin="dense" placeholder="Ex: 8GB DDR4" />
      <TextField label="Tipo de Armazenamento" value={equipment.hd_type || ""} onChange={handleFieldChange('hd_type')} fullWidth margin="dense" select>
        <MenuItem value=""></MenuItem>
        <MenuItem value="HDD">HDD (Disco Rígido)</MenuItem>
        <MenuItem value="SSD">SSD</MenuItem>
        <MenuItem value="SSD M.2">SSD M.2</MenuItem>
        <MenuItem value="eMMC">eMMC</MenuItem>
      </TextField>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" disabled={loading || !equipment.brand} onClick={handleSubmit}>
          {loading ? "Salvando..." : "Salvar Equipamento"}
        </Button>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}