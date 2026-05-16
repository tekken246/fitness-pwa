import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SetEntryRow } from '@/components/workout/set-entry-row';
import type { SetEntryView } from '@/lib/types';

const baseSet: SetEntryView = {
  id: 'set_1',
  position: 1,
  targetReps: 10,
  targetLabel: '10',
  weight: null,
  reps: null,
  unit: 'lb',
  rpe: null,
  completed: false,
};

describe('SetEntryRow', () => {
  it('emits numeric set changes', () => {
    const onChange = vi.fn();
    render(<SetEntryRow set={baseSet} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Set 1 weight'), { target: { value: '135' } });
    fireEvent.change(screen.getByLabelText('Set 1 reps'), { target: { value: '8' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseSet, weight: 135 });
    expect(onChange).toHaveBeenCalledWith({ ...baseSet, reps: 8 });
  });

  it('toggles set completion', () => {
    const onChange = vi.fn();
    render(<SetEntryRow set={baseSet} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Log' }));

    expect(onChange).toHaveBeenCalledWith({ ...baseSet, completed: true });
  });
});
