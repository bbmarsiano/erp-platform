interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md';
    disabled?: boolean;
    type?: 'button' | 'submit';
    icon?: React.ReactNode;
}
export declare function Button({ children, onClick, variant, size, disabled, type, icon }: ButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
