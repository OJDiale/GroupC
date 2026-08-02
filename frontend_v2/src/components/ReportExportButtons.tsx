import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { downloadReport } from "@/lib/reportExport";

interface ReportExportButtonsProps {
  /** API path including any active filter/sort query params, WITHOUT format=. */
  basePath: string;
  /** Base filename, no extension. */
  filename: string;
}

export default function ReportExportButtons({ basePath, filename }: ReportExportButtonsProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const joiner = basePath.includes("?") ? "&" : "?";

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      await downloadReport(`${basePath}${joiner}format=${format}`, `${filename}.${format}`);
    } catch {
      toast.error(`Could not export ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport("csv")}
        disabled={exporting !== null}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-brand-border text-sm font-semibold hover:border-brand-blue/40 disabled:opacity-50"
      >
        <Download size={14} /> {exporting === "csv" ? "Exporting…" : "CSV"}
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={exporting !== null}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-brand-border text-sm font-semibold hover:border-brand-blue/40 disabled:opacity-50"
      >
        <FileText size={14} /> {exporting === "pdf" ? "Exporting…" : "PDF"}
      </button>
    </div>
  );
}
