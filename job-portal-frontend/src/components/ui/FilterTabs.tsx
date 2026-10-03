import { ReactNode } from "react";

interface FilterTabsProps {
  filters: {
    id: string;
    label: string;
    count?: number;
  }[];
  activeFilter: string;
  onChange: (filterId: string) => void;
}

export const FilterTabs = ({ filters, activeFilter, onChange }: FilterTabsProps) => {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeFilter === filter.id
              ? "bg-emerald-500 text-white"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {filter.label} {filter.count !== undefined && `(${filter.count})`}
        </button>
      ))}
    </div>
  );
};
