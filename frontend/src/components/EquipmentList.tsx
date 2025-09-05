// frontend/src/components/EquipmentList.tsx
import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper, CircularProgress, Divider } from "@mui/material";
import { equipmentAPI, Equipment } from "../api";

interface Props {
  customerId: string;
  onSelectEquipment: (equipment: Equipment) => void;
  onAddNew: () => void;
}

export default function EquipmentList({ customerId, onSelectEquipment, onAddNew }: Props) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    equipmentAPI.listByCustomer(customerId)
      .then(res => setEquipments(res.data || []))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Selecione um Equipamento</Typography>
      
      {equipments.length === 0 ? (
        <Typography sx={{ my: 2, fontStyle: 'italic' }}>Nenhum equipamento cadastrado para este cliente.</Typography>
      ) : (
        equipments.map(equip => (
          <Paper key={equip.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{equip.type} {equip.brand} {equip.model}</Typography>
              <Typography variant="body2" color="textSecondary">S/N: {equip.serial_number || 'Não informado'}</Typography>
            </Box>
            <Button variant="contained" onClick={() => onSelectEquipment(equip)}>
              Criar OS para este
            </Button>
          </Paper>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      <Button variant="outlined" onClick={onAddNew}>
        + Cadastrar Novo Equipamento
      </Button>
    </Box>
  );
}