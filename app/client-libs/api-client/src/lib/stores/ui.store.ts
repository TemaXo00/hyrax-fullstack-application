import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AlertTone = 'success' | 'error' | 'info';

export interface AppAlert {
  id: number;
  tone: AlertTone;
  message: string;
}

export const useUiStore = defineStore('ui', () => {
  const alerts = ref<AppAlert[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let lastId = 0;

  function dismiss(id: number): void {
    const timer = timers.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }

    alerts.value = alerts.value.filter((alert) => alert.id !== id);
  }

  function push(message: string, tone: AlertTone = 'info'): void {
    const id = ++lastId;

    alerts.value = [...alerts.value.slice(-2), { id, tone, message }];

    timers.set(
      id,
      setTimeout(() => dismiss(id), 4200),
    );
  }

  function notify(message: string): void {
    push(message, 'success');
  }

  function fail(message: string): void {
    push(message, 'error');
  }

  function clear(): void {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    alerts.value = [];
  }

  return { alerts, push, notify, fail, dismiss, clear };
});
