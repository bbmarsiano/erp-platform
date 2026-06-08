interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
    width?: number | string;
}
interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    keyField?: keyof T;
}
export declare function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, emptyMessage, keyField }: TableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
