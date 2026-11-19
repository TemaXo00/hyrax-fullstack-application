import { useAuthStore } from '@org/api-client';
import { type Component } from 'vue';
import {
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
} from 'vue-router';

export function createAppRouter(history: RouterHistory): Router {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        component: (): Promise<Component> =>
          import('@org/client-pages').then((module) => module.AppShell),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'Game',
            component: (): Promise<Component> =>
              import('@org/client-pages').then((module) => module.GamePage),
          },
          {
            path: 'shop',
            name: 'Shop',
            component: (): Promise<Component> =>
              import('@org/client-pages').then((module) => module.ShopPage),
          },
          {
            path: 'achievements',
            name: 'Achievements',
            component: (): Promise<Component> =>
              import('@org/client-pages').then(
                (module) => module.AchievementsPage,
              ),
          },
          {
            path: 'leaderboard',
            name: 'Leaderboard',
            component: (): Promise<Component> =>
              import('@org/client-pages').then(
                (module) => module.LeaderboardPage,
              ),
          },
          {
            path: 'profile',
            name: 'Profile',
            component: (): Promise<Component> =>
              import('@org/client-pages').then((module) => module.ProfilePage),
          },
        ],
      },
      {
        path: '/login',
        name: 'Login',
        component: (): Promise<Component> =>
          import('@org/client-pages').then((module) => module.LoginView),
        meta: { guestOnly: true },
      },
      {
        path: '/register',
        name: 'Register',
        component: (): Promise<Component> =>
          import('@org/client-pages').then((module) => module.RegisterView),
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

  return router;
}

const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL));

export default router;
