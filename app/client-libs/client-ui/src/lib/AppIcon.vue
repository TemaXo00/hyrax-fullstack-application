<script setup lang="ts">
withDefaults(
  defineProps<{
    name:
      | 'coin'
      | 'paw'
      | 'bowl'
      | 'leaf'
      | 'bag'
      | 'trophy'
      | 'user'
      | 'star'
      | 'lock'
      | 'check'
      | 'pencil'
      | 'arrow-left'
      | 'arrow-right'
      | 'sparkles'
      | 'clock'
      | 'home'
      | 'chart'
      | 'settings'
      | 'close'
      | 'heart'
      | 'plus';
    size?: number;
    strokeWidth?: number;
  }>(),
  { size: 20, strokeWidth: 1.8 },
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'coin'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4v9.2" />
      <path
        d="M14.4 9.1c-.5-.8-1.4-1.2-2.4-1.2-1.4 0-2.3.7-2.3 1.7s.9 1.4 2.5 1.8c1.7.4 2.5.9 2.5 2 0 1.2-1 1.9-2.6 1.9-1.2 0-2.2-.5-2.8-1.4"
      />
    </template>
    <template v-else-if="name === 'paw'">
      <ellipse cx="7" cy="9" rx="1.7" ry="2.1" />
      <ellipse cx="11" cy="7.2" rx="1.7" ry="2.1" />
      <ellipse cx="15.4" cy="8" rx="1.7" ry="2.1" />
      <ellipse cx="18" cy="11.4" rx="1.6" ry="1.9" />
      <path
        d="M7.4 15.7c0-2.2 2-4 4.6-4s4.6 1.8 4.6 4c0 1.8-1.3 2.9-3.1 2.9-.8 0-1.1-.3-1.5-.3s-.7.3-1.5.3c-1.8 0-3.1-1.1-3.1-2.9Z"
      />
    </template>
    <template v-else-if="name === 'bowl'">
      <path d="M4 12h16" />
      <path d="M5 12c.4 3.2 3 5.5 7 5.5s6.6-2.3 7-5.5" />
      <path d="M9 8.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M5 19c0-7 4.5-12 14-13-1 9.5-6 14-14 13Z" />
      <path d="M8.5 15.5C11 13 14 11 17 10" />
    </template>
    <template v-else-if="name === 'bag'">
      <path d="M5.5 8h13l1 11.5h-15L5.5 8Z" />
      <path d="M9 8V6.8C9 5.3 10.3 4 12 4s3 1.3 3 2.8V8" />
    </template>
    <template v-else-if="name === 'trophy'">
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5v1.2A3.3 3.3 0 0 0 8.8 10.5" />
      <path d="M16 6h2.5v1.2a3.3 3.3 0 0 1-3.3 3.3" />
      <path d="M12 12.5V16" />
      <path d="M8.5 20h7" />
      <path d="M9.5 16h5l.7 4h-6.4l.7-4Z" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
    </template>
    <template v-else-if="name === 'star'">
      <path
        d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z"
      />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="6" y="10.5" width="12" height="9" rx="2.2" />
      <path d="M8.8 10.5V8a3.2 3.2 0 0 1 6.4 0v2.5" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12.5 4.3 4.3L19 7" />
    </template>
    <template v-else-if="name === 'pencil'">
      <path d="m4.5 19.5 1-4L16 5l3 3L8.5 18.5l-4 1Z" />
      <path d="m13.5 7.5 3 3" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <path d="M19 12H5" />
      <path d="m10.5 6.5-5.5 5.5 5.5 5.5" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="M5 12h14" />
      <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
    </template>
    <template v-else-if="name === 'sparkles'">
      <path
        d="M12 3.5 13.4 8l4.5 1.4-4.5 1.4L12 15.3l-1.4-4.5L6.1 9.4 10.6 8 12 3.5Z"
      />
      <path
        d="m18.5 14 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"
      />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="m4 11 8-6.5 8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M10 20v-5h4v5" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M9 15v-3" />
      <path d="M13 15V8" />
      <path d="M17 15v-5" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.3 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
      />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m6.5 6.5 11 11" />
      <path d="m17.5 6.5-11 11" />
    </template>
    <template v-else-if="name === 'heart'">
      <path
        d="M12 19.5S4.5 15 4.5 9.6A4.1 4.1 0 0 1 12 6.9a4.1 4.1 0 0 1 7.5 2.7c0 5.4-7.5 9.9-7.5 9.9Z"
      />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </template>
  </svg>
</template>
