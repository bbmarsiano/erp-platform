export declare const useRegisters: () => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateRegister: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    code: string;
    name: string;
    warehouseId: string;
    locationId: string;
}, unknown>;
export declare const useSales: (filters?: {
    date?: string;
    registerId?: string;
}) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useSale: (id: string) => import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare const useCreateSale: () => import("@tanstack/react-query").UseMutationResult<any, Error, {
    cashRegisterId: string;
    paymentMethod: "CASH" | "CARD" | "MIXED";
    lines: Array<{
        productId: string;
        locationId: string;
        quantity: number;
        unitPrice: number;
    }>;
}, unknown>;
export declare const useRefundSale: () => import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
