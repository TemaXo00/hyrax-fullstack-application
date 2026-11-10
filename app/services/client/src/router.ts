import { useAuthStore } from '@org/api-client';
import { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: (): Promise<Component> =>
        import('@org/home-page').then((m) => m.HomePage),
      meta: { requiresAuth: true },
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
      path: '/about',
      name: 'AboutPage',
      component: (): Promise<Component> =>
        import('@org/about-page').then((m) => m.AboutPage),
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  await auth.ensureInitialized();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'HomePage' };
  }

  return true;
});

export default router;
