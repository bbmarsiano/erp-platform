type StockRow = {
    id: string;
    quantity: number;
    product: {
        code: string;
        name: string;
        minStock: number;
        unit?: string;
    };
    location: {
        code: string;
        name: string;
        warehouse: {
            name: string;
        };
    };
};
export declare function StockTable({ rows }: {
    rows: StockRow[];
}): import("react/jsx-runtime").JSX.Element;
export {};
