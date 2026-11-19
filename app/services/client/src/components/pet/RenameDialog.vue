<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '../ui/AppButton.vue';
import ModalDialog from '../ui/ModalDialog.vue';

const props = defineProps<{
  initialName: string;
  busy: boolean;
}>();

const emit = defineEmits<{
  save: [name: string];
  close: [];
}>();

const name = ref(props.initialName);
const touched = ref(false);

function submit(): void {
  touched.value = true;

  const value = name.value.trim();

  if (value.length < 1 || value.length > 70) {
    return;
  }

  emit('save', value);
}
</script>

<template>
  <ModalDialog
    :open="true"
    title="Имя питомца"
    description="Короткое имя до 70 символов."
    @close="$emit('close')"
  >
    <form @submit.prevent="submit">
      <label class="block">
        <span class="sr-only">Имя питомца</span>
        <input
          v-model="name"
          type="text"
          maxlength="70"
          autofocus
          class="w-full rounded-2xl border border-ink/20 bg-cream/70 px-4 py-3 text-base font-semibold text-ink outline-none transition placeholder:text-muted/60 focus:border-moss focus:bg-paper"
          placeholder="Например, Авава"
        >
      </label>
      <p
        v-if="touched && name.trim().length === 0"
        class="mt-2 text-xs font-medium text-clay"
      >
        Имя не может быть пустым.
      </p>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <AppButton
          variant="soft"
          @click="$emit('close')"
        >
          Отмена
        </AppButton>
        <AppButton
          type="submit"
          :loading="busy"
        >
          Сохранить
        </AppButton>
      </div>
    </form>
  </ModalDialog>
</template>
