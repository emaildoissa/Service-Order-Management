import axios, { AxiosResponse } from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Tipos - Interface que mapeia os campos do backend
export interface Customer {
  id?: string;
  name: string;
  phone_number?: string;
  // Campos como vêm do backend
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  house_number?: string;
  // Campos como são usados no frontend (manter compatibilidade)
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface ServiceOrder {
  id?: string;
  customer_id: string;
  equipment_type: string;
  equipment_brand: string;
  equipment_model?: string;
  status?: string;
  service_value?: number;
  work_description?: string;
  created_at: string;
  closed_at?: string;
}

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

// Função helper para converter dados do backend para frontend
export const mapBackendToFrontend = (backendCustomer: any): Customer => {
  return {
    id: backendCustomer.id,
    name: backendCustomer.name || '',
    phone_number: backendCustomer.phone_number || '',
    // Mapear campos do backend para frontend
    endereco: backendCustomer.address || '',
    bairro: backendCustomer.neighborhood || '', 
    cidade: backendCustomer.city || '',
    estado: backendCustomer.state || '',
    cep: backendCustomer.zip_code || '',
    house_number: backendCustomer.house_number || '',
    // Manter também os originais se existirem
    address: backendCustomer.address,
    neighborhood: backendCustomer.neighborhood,
    city: backendCustomer.city,
    state: backendCustomer.state,
    zip_code: backendCustomer.zip_code
  };
};

// Função helper para converter dados do frontend para backend
export const mapFrontendToBackend = (frontendCustomer: Customer) => {
  return {
    id: frontendCustomer.id,
    name: frontendCustomer.name,
    phone_number: frontendCustomer.phone_number || '',
    // Enviar no formato que o backend espera
    address: frontendCustomer.endereco || frontendCustomer.address || '',
    neighborhood: frontendCustomer.bairro || frontendCustomer.neighborhood || '',
    city: frontendCustomer.cidade || frontendCustomer.city || '',
    state: frontendCustomer.estado || frontendCustomer.state || '',
    zip_code: frontendCustomer.cep || frontendCustomer.zip_code || '',
    house_number: frontendCustomer.house_number || ''
  };
};

// API para cliente
export const customerAPI = {
  create: (c: Customer) => {
    const backendData = mapFrontendToBackend(c);
    return api.post('/customers', backendData);
  },
  
  update: (id: string, c: Partial<Customer>) => {
    const backendData = mapFrontendToBackend(c as Customer);
    return api.put(`/customers/${id}`, backendData);
  },
  
  search: (q: string) => 
    api.get('/customers', { params: { search: q } }).then(response => ({
      ...response,
      data: response.data?.map(mapBackendToFrontend) || []
    })),
    
  get: (id: string) => 
    api.get(`/customers/${id}`).then(response => ({
      ...response,
      data: mapBackendToFrontend(response.data)
    })),
};

export const orderAPI = {
  create: (o: ServiceOrder) => api.post('/service-orders', o),
  listByCustomer: (customerId: string) => api.get(`/customers/${customerId}/service-orders`),
  close: (id: string, body: { work_description: string; service_value: number }) =>
    api.put(`/service-orders/${id}/close`, body),
};

// API financeira
export const financialAPI = {
  getSummary: () => api.get('/financials/summary'),
  getByPeriod: () => api.get('/financials/by-period'),
  getOpenOrders: () => api.get('/open-orders'),
};