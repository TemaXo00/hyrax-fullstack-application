<script setup lang="ts">
defineProps<{
  image: string;
  alt: string;
  pouncing?: boolean;
}>();
</script>

<template>
  <img
    :src="image"
    :alt="alt"
    :class="[
      'pointer-events-none h-auto w-[62%] max-w-[290px] select-none object-contain drop-shadow-[0_16px_18px_rgba(92,68,42,0.18)] transition-transform duration-150 sm:w-[58%]',
      pouncing ? 'pet-pounce' : '',
    ]"
    draggable="false"
  >
</template>

<style scoped>
.pet-pounce {
  animation: pet-pounce 0.32s ease;
}

@keyframes pet-pounce {
  0% {
    transform: scale(1) translateY(0);
  }
  35% {
    transform: scale(1.045, 0.96) translateY(3px);
  }
  70% {
    transform: scale(0.985, 1.025) translateY(-3px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}
</style>
