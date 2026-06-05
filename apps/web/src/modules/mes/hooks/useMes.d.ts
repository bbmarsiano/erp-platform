export declare const useBoms: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useBom: (productId: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateBom: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    productId: string;
    version?: string;
}, unknown>;
export declare const useAddBomItem: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    componentId: string;
    quantity: number;
    unit?: string;
    note?: string;
}, unknown>;
export declare const useWorkOrders: (status?: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useWorkOrder: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateWorkOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    productId: string;
    bomId?: string;
    warehouseId: string;
    outputLocationId: string;
    plannedQty: number;
    note?: string;
}, unknown>;
export declare const useReleaseWorkOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useStartWorkOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare const useCompleteWorkOrder: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
