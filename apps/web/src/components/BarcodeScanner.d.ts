export interface ScanResult {
    id: string;
    code: string;
    name: string;
    barcode: string;
    unit: string;
    price?: number;
    totalStock: number;
    stockItems?: Array<{
        id: string;
        quantity: number;
        locationId: string;
        location?: {
            id: string;
            code: string;
            warehouse?: {
                name: string;
            };
        };
    }>;
}
interface BarcodeScannerProps {
    onProductFound: (product: ScanResult) => void;
    onClose: () => void;
    title?: string;
}
export declare function BarcodeScanner({ onProductFound, onClose, title }: BarcodeScannerProps): import("react/jsx-runtime").JSX.Element;
export {};
