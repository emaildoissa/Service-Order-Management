import { Button, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { orderAPI, ServiceOrder, Customer } from "../api";

interface Props {
  customer: Customer;
  onCreated(order: ServiceOrder): void;
}

export default function ServiceOrderForm({ customer, onCreated }: Props) {
 const [order, setOrder] = useState<ServiceOrder>({
  customer_id: customer.id!,
  equipment_type: "notebook",
  equipment_brand: "",
  equipment_model: "",
  status: "open",                          // ← ADICIONE
  created_at: new Date().toISOString(),    // ← ADICIONE  
});

  const { loading, run, error } = useAsync<ServiceOrder>();

  const handleSubmit = () => {
    run(() => orderAPI.create(order).then(res => res.data)).then((res) => {
      if (res) onCreated(res);
    });
  };

  return (
    <>
      <h3>Nova OS para {customer.name}</h3>
      <TextField
        select
        label="Tipo"
        value={order.equipment_type}
        onChange={(e) => setOrder({ ...order, equipment_type: e.target.value })}
        fullWidth
        margin="dense"
      >
        <MenuItem value="notebook">Notebook</MenuItem>
        <MenuItem value="pc">PC</MenuItem>
        <MenuItem value="monitor">Monitor</MenuItem>
      </TextField>
      <TextField
        label="Marca"
        value={order.equipment_brand}
        onChange={(e) => setOrder({ ...order, equipment_brand: e.target.value })}
        fullWidth
        margin="dense"
      />
      <TextField
        label="Modelo"
        value={order.equipment_model}
        onChange={(e) => setOrder({ ...order, equipment_model: e.target.value })}
        fullWidth
        margin="dense"
      />
      {error && <span style={{ color: "red" }}>{error}</span>}
      <Button variant="contained" disabled={loading} onClick={handleSubmit}>
        Salvar OS
      </Button>
    </>
  );
}
