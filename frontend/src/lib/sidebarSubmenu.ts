import type { ComponentType } from "react";

export type SidebarSubmenuItem<T extends string = string> = {
  key: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarSubmenuGroup<T extends string = string> = {
  label: string;
  items: SidebarSubmenuItem<T>[];
};

/** Build grouped sidebar submenus from section definitions and group key lists. */
export function buildSidebarSubmenuGroups<T extends string>(
  sections: SidebarSubmenuItem<T>[],
  groups: { label: string; keys: T[] }[],
): SidebarSubmenuGroup<T>[] {
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s])) as Record<T, SidebarSubmenuItem<T>>;
  return groups
    .map((g) => ({
      label: g.label,
      items: g.keys.map((k) => byKey[k]).filter(Boolean),
    }))
    .filter((g) => g.items.length > 0);
}
