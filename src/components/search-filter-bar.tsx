"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterSpec = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

type SearchFilterBarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder?: string;
  filters?: FilterSpec[];
  totalLabel?: string;
  totalCount?: number;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function SearchFilterBar({
  query,
  onQueryChange,
  placeholder = "Suche…",
  filters = [],
  totalLabel = "Treffer",
  totalCount,
  leading,
  trailing,
}: SearchFilterBarProps) {
  const anyFilterActive = filters.some((f) => f.value !== "");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 p-3">
        {leading}
        <div className="relative min-w-[220px] flex-1">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label="Suche"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Suche leeren"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {trailing}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-2">
          {filters.map((f) => (
            <FilterSelect key={f.name} filter={f} />
          ))}
          {anyFilterActive && (
            <button
              type="button"
              onClick={() => filters.forEach((f) => f.onChange(""))}
              className="ml-1 text-xs text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
          {typeof totalCount === "number" && (
            <div className="ml-auto">
              <Badge variant="gray">
                {totalCount} {totalLabel}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ filter }: { filter: FilterSpec }) {
  const active = filter.value !== "";
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs transition",
        active
          ? "border-blue-300 bg-blue-50 text-blue-800"
          : "border-zinc-200 bg-white text-zinc-700"
      )}
    >
      <span>{filter.label}:</span>
      <select
        value={filter.value}
        onChange={(e) => filter.onChange(e.target.value)}
        className="bg-transparent outline-none"
      >
        <option value="">(alle)</option>
        {filter.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
