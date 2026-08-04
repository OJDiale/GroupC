import { useState } from "react";
import { EyeIcon, EyeOff } from "lucide-react";

interface AuthInputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Shared text/password field for the auth pages: label above, 4px #c4c4c4
 * border, #effdff background, 20px radius, centered light-gray text, and
 * (for type="password") a far-right eye toggle.
 */
export default function AuthInput({ label, name, type = "text", placeholder, required = true, className = "" }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedPlaceholder = placeholder ?? `Enter ${label}`;

  const fieldClasses = "w-full h-12 px-4 bg-auth-input-bg border-4 border-auth-border rounded-[20px] text-center text-black placeholder:text-gray-400 focus:outline-none";

  return (
    <div className={className}>
      <label htmlFor={name} className="block mb-1 font-medium text-brand-ink">
        {label}
      </label>
      {isPassword ? (
        <div className="relative">
          <input
            id={name}
            name={name}
            type={showPassword ? "text" : "password"}
            required={required}
            placeholder={resolvedPlaceholder}
            className={`${fieldClasses} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-ink"
          >
            {showPassword ? <EyeIcon size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={resolvedPlaceholder}
          className={fieldClasses}
        />
      )}
    </div>
  );
}
