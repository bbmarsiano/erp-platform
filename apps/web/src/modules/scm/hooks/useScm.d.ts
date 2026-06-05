export declare const useSuppliers: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateSupplier: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    code: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
}, unknown>;
export declare const usePurchaseOrders: (filters?: {
    status?: string;
    supplierId?: string;
}) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const usePurchaseOrder: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreatePurchaseOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    supplierId: string;
    warehouseId: string;
    expectedDate?: string;
    note?: string;
}, unknown>;
export declare const useAddPurchaseOrderLine: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    productId: string;
    quantity: number;
    unitPrice?: number;
    unit?: string;
}, unknown>;
export declare const useSendPurchaseOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useDeliveries: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useDelivery: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateDelivery: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    purchaseOrderId?: string;
    warehouseId: string;
    supplierName?: string;
    deliveryDate?: string;
    note?: string;
}, unknown>;
export declare const useAddDeliveryLine: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    productId: string;
    locationId: string;
    quantity: number;
    lotNumber?: string;
    expiryDate?: string;
}, unknown>;
export declare const useConfirmDelivery: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
