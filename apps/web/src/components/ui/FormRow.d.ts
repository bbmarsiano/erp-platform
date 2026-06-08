interface FormRowProps {
    children: React.ReactNode;
    columns?: number;
    gap?: number;
}
export declare function FormRow({ children, columns, gap }: FormRowProps): import("react/jsx-runtime").JSX.Element;
interface FormFieldProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
}
export declare function FormField({ label, children, required }: FormFieldProps): import("react/jsx-runtime").JSX.Element;
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}
export declare function Input(props: InputProps): import("react/jsx-runtime").JSX.Element;
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
}
export declare function Select(props: SelectProps): import("react/jsx-runtime").JSX.Element;
export {};
