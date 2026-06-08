interface UseBarcodeOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeout?: number;
    active?: boolean;
}
export declare function useBarcodeScannerInput({ onScan, minLength, timeout, active }: UseBarcodeOptions): void;
export declare function useCameraScanner({ onScan, active, elementId }: {
    onScan: (barcode: string) => void;
    active?: boolean;
    elementId?: string;
}): {
    supported: boolean;
};
export {};
