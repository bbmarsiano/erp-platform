import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
export const useSuppliers = () => useQuery({
    queryKey: ['scm', 'suppliers'],
    queryFn: () => api.get('/api/scm/suppliers').then((r) => r.data.data)
});
export const useCreateSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/scm/suppliers', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'suppliers'] })
    });
};
export const usePurchaseOrders = (filters) => useQuery({
    queryKey: ['scm', 'orders', filters?.status, filters?.supplierId],
    queryFn: () => api.get('/api/scm/orders', { params: filters }).then((r) => r.data.data)
});
export const usePurchaseOrder = (id) => useQuery({
    enabled: Boolean(id),
    queryKey: ['scm', 'orders', id],
    queryFn: () => api.get(`/api/scm/orders/${id}`).then((r) => r.data.data)
});
export const useCreatePurchaseOrder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/scm/orders', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'orders'] })
    });
};
export const useAddPurchaseOrderLine = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args) => api.post(`/api/scm/orders/${args.id}/lines`, args).then((r) => r.data.data),
        onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['scm', 'orders', vars.id] })
    });
};
export const useSendPurchaseOrder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/scm/orders/${id}/send`).then((r) => r.data.data),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: ['scm', 'orders'] });
            qc.invalidateQueries({ queryKey: ['scm', 'orders', id] });
        }
    });
};
export const useDeliveries = () => useQuery({
    queryKey: ['scm', 'deliveries'],
    queryFn: () => api.get('/api/scm/deliveries').then((r) => r.data.data)
});
export const useDelivery = (id) => useQuery({
    enabled: Boolean(id),
    queryKey: ['scm', 'deliveries', id],
    queryFn: () => api.get(`/api/scm/deliveries/${id}`).then((r) => r.data.data)
});
export const useCreateDelivery = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/scm/deliveries', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'deliveries'] })
    });
};
export const useAddDeliveryLine = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args) => api.post(`/api/scm/deliveries/${args.id}/lines`, args).then((r) => r.data.data),
        onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['scm', 'deliveries', vars.id] })
    });
};
export const useConfirmDelivery = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/scm/deliveries/${id}/confirm`).then((r) => r.data.data),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: ['scm', 'deliveries'] });
            qc.invalidateQueries({ queryKey: ['scm', 'deliveries', id] });
            qc.invalidateQueries({ queryKey: ['wms', 'receipts'] });
            qc.invalidateQueries({ queryKey: ['wms', 'stock'] });
            qc.invalidateQueries({ queryKey: ['scm', 'orders'] });
        }
    });
};
