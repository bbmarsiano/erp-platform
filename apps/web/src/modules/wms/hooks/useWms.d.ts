export declare const useWarehouses: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateWarehouse: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    code: string;
    name: string;
    address?: string;
}, unknown>;
export declare const useWarehouseLocations: (warehouseId?: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useStock: (warehouseId?: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useReceipts: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useReceipt: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateReceipt: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    warehouseId: string;
    supplierName?: string;
    note?: string;
}, unknown>;
export declare const useUpdateReceiptDraft: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    supplierName?: string;
    note?: string;
    lines?: Array<{
        productId: string;
        locationId: string;
        quantity: number;
        lotNumber?: string;
    }>;
}, unknown>;
export declare const useConfirmReceipt: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useCancelReceipt: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useIssues: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useIssue: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateIssue: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    warehouseId: string;
    destination?: string;
    note?: string;
}, unknown>;
export declare const useUpdateIssueDraft: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    destination?: string;
    note?: string;
    lines?: Array<{
        productId: string;
        locationId: string;
        quantity: number;
        lotNumber?: string;
    }>;
}, unknown>;
export declare const useConfirmIssue: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useCancelIssue: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useLowStock: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useStockSummary: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
