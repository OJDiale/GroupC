import { useEffect } from "react";

const SITE_NAME = "Mapper";

/** Sets document.title consistently across every route (Phase 7 UI audit). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
