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
    },
    {
      path: '/about',
      name: 'AboutPage',
      component: (): Promise<Component> =>
        import('@org/about-page').then((m) => m.AboutPage),
    },
  ],
});

export default router;
