import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: { guest: true },
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/RegisterView.vue'),
            meta: { guest: true },
        },
        {
            path: '/',
            component: () => import('@/layouts/AppLayout.vue'),
            meta: { auth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/DashboardView.vue'),
                },
                {
                    path: 'payments',
                    name: 'payments',
                    component: () => import('@/views/PaymentsView.vue'),
                },
                {
                    path: 'payouts',
                    name: 'payouts',
                    component: () => import('@/views/PayoutsView.vue'),
                },
                {
                    path: 'balance',
                    name: 'balance',
                    component: () => import('@/views/BalanceView.vue'),
                },
                {
                    path: 'webhooks',
                    name: 'webhooks',
                    component: () => import('@/views/WebhooksView.vue'),
                },
                {
                    path: 'simulation',
                    name: 'simulation',
                    component: () => import('@/views/SimulationView.vue'),
                },
            ],
        },
        {
            path: '/demo/checkout',
            name: 'demo-checkout',
            component: () => import('@/views/DemoCheckout.vue'),
        },
    ],
});

router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();

    if (to.meta.auth && !auth.isAuthenticated) {
        next({ name: 'login' });
        return;
    }

    if (to.meta.guest && auth.isAuthenticated) {
        next({ name: 'dashboard' });
        return;
    }

    if (auth.isAuthenticated && !auth.project) {
        try {
            await auth.fetchMe();
        } catch (error) {
            next({ name: 'login' });
            return;
        }
    }

    next();
});

export default router;
