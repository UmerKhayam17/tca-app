import { useMemo, useState } from "react";
import { matchesPanelSearch } from "@/lib/panelSearch";

export function usePanelListSearch<T>(
  items: T[],
  getValues: (item: T) => (string | number | null | undefined | boolean)[]
) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((item) => matchesPanelSearch(search, ...getValues(item)));
    // getValues is a stable scanner per screen; omit from deps to avoid churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search]);

  return { search, setSearch, filtered };
}
