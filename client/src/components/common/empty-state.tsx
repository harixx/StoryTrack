import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12" data-testid="empty-state">
      <div className="mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2" data-testid="empty-state-title">
        {title}
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto" data-testid="empty-state-description">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} data-testid="empty-state-action">
          {action.label}
        </Button>
      )}
    </div>
  );
}