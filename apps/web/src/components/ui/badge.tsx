import { cn } from '@/lib/utils';
import { PrescriptionStatus } from '@prescriptions/shared';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <Badge variant={status === PrescriptionStatus.PENDING ? 'warning' : 'success'}>
      {status === PrescriptionStatus.PENDING ? 'Pendiente' : 'Consumida'}
    </Badge>
  );
}
