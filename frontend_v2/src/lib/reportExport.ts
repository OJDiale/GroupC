// Shared CSV/PDF download helper for the 4 admin/analyst reports. These
// endpoints require a Bearer token, so a plain <a href> link won't work —
// the browser doesn't attach localStorage's JWT to a normal navigation.
// Instead we fetch with the auth header, turn the response into a blob,
// and trigger a download via a temporary object URL.
import { API_BASE_URL } from "./apiConfig";

const CONFIG = {
  API_BASE_URL,
};

export async function downloadReport(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Export failed. Please try again.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
