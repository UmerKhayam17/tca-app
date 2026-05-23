import type { ReactNode } from "react";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { cn } from "@/lib/utils";

/** Standard toolbar row: search on the left, actions on the right. */
export default function PanelToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between",
        className
      )}
    >
      <PanelSearchBar value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      {children ? <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div> : null}
    </div>
  );
}
