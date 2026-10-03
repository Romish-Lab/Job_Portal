import { ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

export const PageHeader = ({ icon, title, description, action }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
};
