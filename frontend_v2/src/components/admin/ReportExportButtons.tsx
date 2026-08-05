import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { downloadReport } from '@/lib/reportExport';

interface ReportExportButtonsProps {
  /** API path including any active filter/sort query params, WITHOUT format=. */
  basePath: string;
  /** Base filename, no extension. */
  filename: string;
  onError?: (message: string) => void;
}

export default function ReportExportButtons({ basePath, filename, onError }: ReportExportButtonsProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const joiner = basePath.includes('?') ? '&' : '?';

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(format);
    try {
      await downloadReport(`${basePath}${joiner}format=${format}`, `${filename}.${format}`);
    } catch (e) {
      onError?.(`Could not export ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting !== null}
        className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28 disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" /> {exporting === 'csv' ? 'Exporting…' : 'CSV'}
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={exporting !== null}
        className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28 disabled:opacity-50"
      >
        <FileText className="w-3.5 h-3.5" /> {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
      </button>
    </>
  );
}
