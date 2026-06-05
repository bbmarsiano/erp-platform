import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
// Warehouses
export const useWarehouses = () => useQuery({
    queryKey: ['wms', 'warehouses'],
    queryFn: () => api.get('/api/wms/warehouses').then((r) => r.data.data)
});
export const useCreateWarehouse = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/wms/warehouses', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'warehouses'] })
    });
};
export const useWarehouseLocations = (warehouseId) => useQuery({
    enabled: Boolean(warehouseId),
    queryKey: ['wms', 'warehouses', warehouseId, 'locations'],
    queryFn: () => api.get(`/api/wms/warehouses/${warehouseId}/locations`).then((r) => r.data.data)
});
// Stock
export const useStock = (warehouseId) => useQuery({
    queryKey: ['wms', 'stock', warehouseId],
    queryFn: () => api.get('/api/wms/stock', { params: { warehouseId } }).then((r) => r.data.data)
});
// Receipts
export const useReceipts = () => useQuery({
    queryKey: ['wms', 'receipts'],
    queryFn: () => api.get('/api/wms/receipts').then((r) => r.data.data)
});
export const useReceipt = (id) => useQuery({
    enabled: Boolean(id),
    queryKey: ['wms', 'receipts', id],
    queryFn: () => api.get(`/api/wms/receipts/${id}`).then((r) => r.data.data)
});
export const useCreateReceipt = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/wms/receipts', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'receipts'] })
    });
};
export const useUpdateReceiptDraft = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args) => api.put(`/api/wms/receipts/${args.id}`, args).then((r) => r.data.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['wms', 'receipts'] });
            qc.invalidateQueries({ queryKey: ['wms', 'receipts', vars.id] });
        }
    });
};
export const useConfirmReceipt = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/wms/receipts/${id}/confirm`).then((r) => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['wms', 'receipts'] });
            qc.invalidateQueries({ queryKey: ['wms', 'stock'] });
        }
    });
};
export const useCancelReceipt = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/wms/receipts/${id}/cancel`).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'receipts'] })
    });
};
// Issues
export const useIssues = () => useQuery({
    queryKey: ['wms', 'issues'],
    queryFn: () => api.get('/api/wms/issues').then((r) => r.data.data)
});
export const useIssue = (id) => useQuery({
    enabled: Boolean(id),
    queryKey: ['wms', 'issues', id],
    queryFn: () => api.get(`/api/wms/issues/${id}`).then((r) => r.data.data)
});
export const useCreateIssue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/api/wms/issues', data).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'issues'] })
    });
};
export const useUpdateIssueDraft = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args) => api.put(`/api/wms/issues/${args.id}`, args).then((r) => r.data.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['wms', 'issues'] });
            qc.invalidateQueries({ queryKey: ['wms', 'issues', vars.id] });
        }
    });
};
export const useConfirmIssue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/wms/issues/${id}/confirm`).then((r) => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['wms', 'issues'] });
            qc.invalidateQueries({ queryKey: ['wms', 'stock'] });
        }
    });
};
export const useCancelIssue = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/api/wms/issues/${id}/cancel`).then((r) => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'issues'] })
    });
};
// Reports
export const useLowStock = () => useQuery({
    queryKey: ['wms', 'reports', 'low-stock'],
    queryFn: () => api.get('/api/wms/reports/low-stock').then((r) => r.data.data)
});
export const useStockSummary = () => useQuery({
    queryKey: ['wms', 'reports', 'stock-summary'],
    queryFn: () => api.get('/api/wms/reports/stock-summary').then((r) => r.data.data)
});
