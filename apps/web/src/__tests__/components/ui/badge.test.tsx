import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PrescriptionStatus } from '@prescriptions/shared';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Admin</Badge>);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('applies default variant by default', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-slate-100');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText('OK');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByText('Warn')).toHaveClass('bg-yellow-100');
  });

  it('applies danger variant', () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-100');
  });

  it('applies info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100');
  });

  it('forwards extra className', () => {
    render(<Badge className="my-class">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('my-class');
  });
});

describe('StatusBadge', () => {
  it('renders "Pendiente" for PENDING status', () => {
    render(<StatusBadge status={PrescriptionStatus.PENDING} />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders "Consumida" for CONSUMED status', () => {
    render(<StatusBadge status={PrescriptionStatus.CONSUMED} />);
    expect(screen.getByText('Consumida')).toBeInTheDocument();
  });

  it('uses warning variant for PENDING', () => {
    render(<StatusBadge status={PrescriptionStatus.PENDING} />);
    expect(screen.getByText('Pendiente')).toHaveClass('bg-yellow-100');
  });

  it('uses success variant for CONSUMED', () => {
    render(<StatusBadge status={PrescriptionStatus.CONSUMED} />);
    expect(screen.getByText('Consumida')).toHaveClass('bg-green-100');
  });
});
