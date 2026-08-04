interface AuthButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Gradient submit button shared by all auth pages: navy -> teal, white bold centered text. */
export default function AuthButton({ children, disabled, className = "" }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full h-12 rounded-[20px] border border-auth-button-border bg-gradient-to-r from-auth-navy to-auth-teal text-white font-bold text-center transition-opacity ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:opacity-90"} ${className}`}
    >
      {children}
    </button>
  );
}
