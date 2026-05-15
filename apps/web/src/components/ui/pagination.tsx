import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-slate-500">
        {from}–{to} de {total} resultados
      </p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          ‹
        </PageButton>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = totalPages <= 7 ? i + 1 : getPageNum(i, page, totalPages);
          return (
            <PageButton key={p} onClick={() => onPageChange(p)} active={p === page}>
              {p}
            </PageButton>
          );
        })}
        <PageButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          ›
        </PageButton>
      </div>
    </div>
  );
}

function getPageNum(index: number, current: number, total: number): number {
  if (index === 0) return 1;
  if (index === 6) return total;
  const mid = Math.min(Math.max(current, 4), total - 3);
  return mid - 2 + index;
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-8 h-8 text-sm rounded-md font-medium transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}
