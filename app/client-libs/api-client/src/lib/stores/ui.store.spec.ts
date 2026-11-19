import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUiStore } from './ui.store';

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ui store', () => {
  it('pushes alerts with a tone and auto-dismisses them', () => {
    const store = useUiStore();

    store.push('Привет', 'info');

    expect(store.alerts).toHaveLength(1);
    expect(store.alerts[0]).toMatchObject({ message: 'Привет', tone: 'info' });

    vi.advanceTimersByTime(4200);

    expect(store.alerts).toHaveLength(0);
  });

  it('keeps at most three alerts', () => {
    const store = useUiStore();

    store.push('one');
    store.push('two');
    store.push('three');
    store.push('four');

    expect(store.alerts.map((alert) => alert.message)).toEqual([
      'two',
      'three',
      'four',
    ]);
  });

  it('dismisses a single alert and clears all', () => {
    const store = useUiStore();

    store.notify('one');
    store.fail('two');

    const id = store.alerts[0]!.id;

    store.dismiss(id);

    expect(store.alerts).toHaveLength(1);

    store.clear();

    expect(store.alerts).toHaveLength(0);
  });

  it('does not dismiss again when the alert is already gone', () => {
    const store = useUiStore();

    store.push('one');
    store.dismiss(999);

    expect(store.alerts).toHaveLength(1);
  });
});
