import axios, { AxiosResponse } from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

export interface Customer {
  id?: string;
  name: string;
  phone_number?: string;
  address?: string;
  zip_code?: string;
  house_number?: string;
}

export interface ServiceOrder {
  id?: string;
  customer_id: string;
  equipment_type: string;
  equipment_brand: string;
  equipment_model?: string;
  status?: string;
}

// 👈 CORRIJA: Tipagem explícita do retorno como Promise<AxiosResponse<T>>
export const customerAPI = {
  create: (c: Customer): Promise<AxiosResponse<Customer>> => api.post('/customers', c),
  search: (q: string): Promise<AxiosResponse<Customer[]>> => api.get('/customers', { params: { search: q } }),
  get: (id: string): Promise<AxiosResponse<Customer>> => api.get(`/customers/${id}`),
};

export const orderAPI = {
  create: (o: ServiceOrder): Promise<AxiosResponse<ServiceOrder>> => api.post('/service-orders', o),
  listByCustomer: (customerId: string): Promise<AxiosResponse<ServiceOrder[]>> =>
    api.get(`/customers/${customerId}/service-orders`),
  close: (id: string, body: { work_description: string; service_value: number }): Promise<AxiosResponse<void>> =>
    api.put(`/service-orders/${id}/close`, body),
};
export interface FinancialSummary {
  total_revenue: number;
  total_orders: number;
  open_orders: number;
  closed_orders: number;
  average_ticket: number;
}
export interface PeriodRevenue {
  period: string;
  revenue: number;
  orders: number;
}
export const financialAPI = {
  getSummary: (): Promise<AxiosResponse<FinancialSummary>> => 
    api.get('/financials/summary'),
  getByPeriod: (): Promise<AxiosResponse<PeriodRevenue[]>> => 
    api.get('/financials/by-period'),
  getOpenOrders: (): Promise<AxiosResponse<ServiceOrder[]>> => 
    api.get('/open-orders'),
};