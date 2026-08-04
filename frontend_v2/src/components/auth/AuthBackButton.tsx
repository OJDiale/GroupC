import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

interface AuthBackButtonProps {
  to: string;
}

/** Left-facing arrow, transparent bg, grays on hover. Sits top-left of the auth content column. */
export default function AuthBackButton({ to }: AuthBackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => navigate(to)}
      className="inline-flex items-center justify-center size-10 rounded-full bg-transparent text-auth-arrow hover:bg-gray-200 transition-colors"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
