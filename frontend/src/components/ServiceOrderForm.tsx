// frontend/src/components/ServiceOrderForm.tsx
import { Button, Checkbox, FormControlLabel, FormGroup, TextField, Typography, Box } from "@mui/material";
import { useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { orderAPI, ServiceOrder, Equipment } from "../api";

interface Props {
  equipment: Equipment;
  onCreated: (order: ServiceOrder) => void;
  onCancel: () => void;
}

const COMMON_ACCESSORIES = ["Carregador", "Cabo de Força", "Mouse", "Bolsa/Case"];

export default function ServiceOrderForm({ equipment, onCreated, onCancel }: Props) {
  const [order, setOrder] = useState<Partial<ServiceOrder>>({
    customer_id: equipment.owner_id,
    equipment_id: equipment.id!,
    status: "Aguardando Avaliação",
  });
  
  const [accessories, setAccessories] = useState<Record<string, boolean>>({});
  const [otherAccessory, setOtherAccessory] = useState("");
  
  const { loading, run, error } = useAsync<ServiceOrder>();

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

  const handleSubmit = () => {
    const finalOrder = {
      ...order,
      accessories: buildAccessoriesString(),
      created_at: new Date().toISOString(),
    } as ServiceOrder;

    run(() => orderAPI.create(finalOrder).then(res => res.data)).then((res) => {
      if (res) onCreated(res);
    });
  };

  const handleFieldChange = (field: keyof ServiceOrder) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrder(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Nova OS para {equipment.type} {equipment.brand} ({equipment.owner_name})
      </Typography>
      
      <TextField
        label="Defeito Relatado pelo Cliente"
        value={order.reported_defect || ""}
        onChange={handleFieldChange('reported_defect')}
        fullWidth
        required
        multiline
        rows={3}
        margin="normal"
      />
      <TextField
        label="Observações (ex: avarias, estado geral)"
        value={order.observations || ""}
        onChange={handleFieldChange('observations')}
        fullWidth
        multiline
        rows={2}
        margin="dense"
        placeholder="Arranhão na tampa, adesivado, etc."
      />
      
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Acessórios Deixados</Typography>
      <FormGroup row>
        {COMMON_ACCESSORIES.map(acc => (
          <FormControlLabel
            key={acc}
            control={<Checkbox checked={accessories[acc] || false} onChange={handleAccessoryChange} name={acc} />}
            label={acc}
          />
        ))}
      </FormGroup>
      <TextField
        label="Outros Acessórios"
        value={otherAccessory}
        onChange={(e) => setOtherAccessory(e.target.value)}
        fullWidth
        margin="dense"
        variant="standard"
      />

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" disabled={loading || !order.reported_defect} onClick={handleSubmit}>
          {loading ? "Salvando..." : "Criar Ordem de Serviço"}
        </Button>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </Box>
    </>
  );
}