import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** Bottom-right Previous/Next pager shared by every paginated admin table. */
export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-3 px-1 py-3">
      <span className="text-xs text-brand-muted">
        Page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border text-xs font-semibold text-brand-muted hover:text-brand-ink hover:border-brand-ink disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border text-xs font-semibold text-brand-muted hover:text-brand-ink hover:border-brand-ink disabled:opacity-40 disabled:pointer-events-none"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
