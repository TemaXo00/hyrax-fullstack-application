import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useNow } from './useNow';

function mountNow(interval = 1000) {
  return mount(
    defineComponent({
      setup() {
        const now = useNow(interval);

        return () => h('span', String(now.value));
      },
    }),
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useNow', () => {
  it('starts with the current timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const wrapper = mountNow();

    expect(wrapper.text()).toBe(String(Date.now()));
  });

  it('updates the timestamp on the interval', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const wrapper = mountNow(500);
    const start = Date.now();

    vi.advanceTimersByTime(500);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe(String(start + 500));
  });

  it('clears the interval on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const wrapper = mountNow();
    const clear = vi.spyOn(globalThis, 'clearInterval');

    wrapper.unmount();

    expect(clear).toHaveBeenCalled();
  });
});
