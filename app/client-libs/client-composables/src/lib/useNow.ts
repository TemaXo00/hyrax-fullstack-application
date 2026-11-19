import { onMounted, onUnmounted, ref, type Ref } from 'vue';

export function useNow(intervalMs = 1000): Ref<number> {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now();
    }, intervalMs);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  return now;
}
