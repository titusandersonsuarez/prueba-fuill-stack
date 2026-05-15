import { cn, formatDate, formatDateTime } from '@/lib/utils';

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('drops falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('returns empty string with no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('returns em dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-06-15');
    expect(result).not.toBe('—');
    expect(result).toContain('2024');
  });

  it('accepts Date objects', () => {
    const d = new Date('2023-12-25T12:00:00Z');
    const result = formatDate(d);
    expect(result).not.toBe('—');
    expect(result).toContain('2023');
  });
});

describe('formatDateTime', () => {
  it('returns em dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('returns em dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('returns a string containing the year for a valid datetime', () => {
    const result = formatDateTime('2024-03-10T14:30:00Z');
    expect(result).not.toBe('—');
    expect(result).toContain('2024');
  });
});
