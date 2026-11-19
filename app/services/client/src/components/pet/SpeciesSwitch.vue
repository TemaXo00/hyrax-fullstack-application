<script setup lang="ts">
import { PET_SPECIES, PET_SPECIES_META } from '@org/api-client';

import type { PetSpecies } from '@org/api-client';

defineProps<{
  species: PetSpecies;
}>();

defineEmits<{ change: [species: PetSpecies] }>();
</script>

<template>
  <div class="rounded-[22px] border border-ink/10 bg-paper/75 p-1.5">
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="kind in PET_SPECIES"
        :key="kind"
        type="button"
        :class="[
          'flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left transition',
          species === kind
            ? 'bg-cream shadow-[0_2px_0_rgba(88,70,45,0.12)]'
            : 'hover:bg-cream/60',
        ]"
        @click="$emit('change', kind)"
      >
        <img
          :src="PET_SPECIES_META[kind].image"
          :alt="PET_SPECIES_META[kind].label"
          class="size-9 rounded-full object-contain"
        >
        <span
          :class="[
            'text-xs font-bold leading-tight',
            species === kind ? 'text-ink' : 'text-muted',
          ]"
        >
          {{ PET_SPECIES_META[kind].label }}
        </span>
      </button>
    </div>
  </div>
</template>
