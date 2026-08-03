// Single source of truth for the backend base URL. Override for local dev
// by setting VITE_API_BASE_URL in .env.local (see .env.local.example).
// Falls back to the deployed Render backend when unset, so a production
// build with no env file still points at the live API.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://mapper-backend-brkn.onrender.com";
