import axios, { AxiosResponse } from "axios";
import { ServiceOrder } from "./index";

// Altere para importar sua baseURL se preferir, senão usa a instancia padrão do axios
const api = axios.create({
  baseURL: "/api",
});

export const orderAPI = {
  // Listar ordens por cliente
  listByCustomer: (customerId: string): Promise<AxiosResponse<ServiceOrder[]>> =>
    api.get(`/customers/${customerId}/service-orders`),

  // Criar nova ordem de serviço (exemplo; ajuste conforme seu backend)
  create: (order: Partial<ServiceOrder>): Promise<AxiosResponse<ServiceOrder>> =>
    api.post("/service-orders", order),

  // Atualizar (editar) ordem existente
  update: (id: string, body: Partial<ServiceOrder>): Promise<AxiosResponse<ServiceOrder>> =>
    api.put(`/service-orders/${id}`, body),

  // Fechar ordem de serviço
  close: (
    id: string,
    body: { work_description: string; service_value: number }
  ): Promise<AxiosResponse<void>> =>
    api.put(`/service-orders/${id}/close`, body),
};
