import './tailwind.css';
import {
  setUnauthorizedHandler,
  useAuthStore,
  useGameStore,
} from '@org/api-client';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

const auth = useAuthStore(pinia);
const game = useGameStore(pinia);

setUnauthorizedHandler(() => {
  auth.clearSession();
  game.reset();

  const currentRoute = router.currentRoute.value;

  if (currentRoute.meta.requiresAuth) {
    void router.push({
      name: 'Login',
      query: { redirect: currentRoute.fullPath },
    });
  }
});

app.mount('#root');
