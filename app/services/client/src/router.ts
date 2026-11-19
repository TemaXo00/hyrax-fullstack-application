import { useAuthStore } from '@org/api-client';
import { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: (): Promise<Component> => import('./layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Game',
          component: (): Promise<Component> => import('./pages/GamePage.vue'),
        },
        {
          path: 'shop',
          name: 'Shop',
          component: (): Promise<Component> => import('./pages/ShopPage.vue'),
        },
        {
          path: 'achievements',
          name: 'Achievements',
          component: (): Promise<Component> =>
            import('./pages/AchievementsPage.vue'),
        },
        {
          path: 'leaderboard',
          name: 'Leaderboard',
          component: (): Promise<Component> =>
            import('./pages/LeaderboardPage.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: (): Promise<Component> => import('./pages/ProfilePage.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: (): Promise<Component> => import('./views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: (): Promise<Component> => import('./views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  await auth.ensureInitialized();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'Game' };
  }

  return true;
});

export default router;
