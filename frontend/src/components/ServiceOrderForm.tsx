import { Button, Checkbox, FormControlLabel, FormGroup, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { orderAPI, ServiceOrder, Customer } from "../api";

interface Props {
  customer: Customer;
  onCreated(order: ServiceOrder): void;
}

const COMMON_ACCESSORIES = ["Carregador", "Cabo de Força", "Mouse", "Bolsa/Case"];

export default function ServiceOrderForm({ customer, onCreated }: Props) {
  const [order, setOrder] = useState<Partial<ServiceOrder>>({
    customer_id: customer.id!,
    equipment_type: "notebook",
    equipment_brand: "",
    equipment_model: "",
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
    const finalOrder: ServiceOrder = {
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
        Nova OS para {customer.name}
      </Typography>
      
      {/* Dados do Equipamento */}
      <TextField
        select
        label="Tipo de Equipamento"
        value={order.equipment_type}
        onChange={handleFieldChange('equipment_type')}
        fullWidth
        margin="dense"
      >
        <MenuItem value="notebook">Notebook</MenuItem>
        <MenuItem value="pc">PC (Desktop)</MenuItem>
        <MenuItem value="monitor">Monitor</MenuItem>
      </TextField>
      <TextField
        label="Marca"
        value={order.equipment_brand}
        onChange={handleFieldChange('equipment_brand')}
        fullWidth
        required
        margin="dense"
      />
      <TextField
        label="Modelo"
        value={order.equipment_model}
        onChange={handleFieldChange('equipment_model')}
        fullWidth
        margin="dense"
      />
      
      {/* Defeito e Observações */}
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
      
      {/* Acessórios */}
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
      <Button variant="contained" disabled={loading} onClick={handleSubmit} sx={{ mt: 3 }}>
        {loading ? "Salvando..." : "Criar Ordem de Serviço"}
      </Button>
    </>
  );
}