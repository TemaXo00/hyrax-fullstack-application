import './tailwind.css';
import {
  setUnauthorizedHandler,
  useAchievementsStore,
  useAuthStore,
  useDailyRewardStore,
  useLeaderboardStore,
  usePetStore,
  useShopStore,
  useUiStore,
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

setUnauthorizedHandler(() => {
  auth.clearSession();
  usePetStore(pinia).reset();
  useShopStore(pinia).reset();
  useAchievementsStore(pinia).reset();
  useDailyRewardStore(pinia).reset();
  useLeaderboardStore(pinia).reset();
  useUiStore(pinia).clear();

  const currentRoute = router.currentRoute.value;

  if (currentRoute.meta.requiresAuth) {
    void router.push({
      name: 'Login',
      query: { redirect: currentRoute.fullPath },
    });
  }
});

app.mount('#root');
