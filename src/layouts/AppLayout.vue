<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Icon } from '@iconify/vue';
import { cn } from '@/utils/cn';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const isSidebarOpen = ref(false);

const navigation = [
    { name: 'Dashboard', icon: 'lucide:layout-dashboard', routeName: 'dashboard' },
    { name: 'Payments', icon: 'lucide:credit-card', routeName: 'payments' },
    { name: 'Payouts', icon: 'lucide:arrow-up-right', routeName: 'payouts' },
    { name: 'Balance', icon: 'lucide:wallet', routeName: 'balance' },
    { name: 'Webhooks', icon: 'lucide:webhook', routeName: 'webhooks' },
    { name: 'Simulation', icon: 'lucide:zap', routeName: 'simulation' },
];

function handleLogout() {
    auth.logout();
    router.push({ name: 'login' });
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 flex">
        <!-- Sidebar Desktop -->
        <aside class="hidden lg:flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800">
            <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
                <div class="flex items-center space-x-2">
                    <div class="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center text-white">
                        <Icon icon="lucide:shield-check" class="h-5 w-5" />
                    </div>
                    <span class="font-bold text-lg text-white">PayMock</span>
                </div>
            </div>

            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <router-link
                    v-for="item in navigation"
                    :key="item.name"
                    :to="{ name: item.routeName }"
                    :class="
                        cn(
                            'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group',
                            route.name === item.routeName
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-slate-800 hover:text-white'
                        )
                    "
                >
                    <Icon :icon="item.icon" class="h-5 w-5" />
                    <span class="font-medium text-sm">{{ item.name }}</span>
                </router-link>
            </nav>

            <div class="p-4 border-t border-slate-800">
                <div class="flex items-center p-3 rounded-lg bg-slate-800/50 text-slate-400">
                    <div
                        class="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 mr-3"
                    >
                        {{ auth.project?.name?.charAt(0) || 'P' }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-200 truncate">{{ auth.project?.name }}</p>
                    </div>
                </div>
                <button
                    @click="handleLogout"
                    class="mt-2 w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                    <Icon icon="lucide:log-out" class="h-5 w-5" />
                    <span class="font-medium text-sm">Logout</span>
                </button>
            </div>
        </aside>

        <!-- Mobile Header & Toggle -->
        <div class="flex-1 flex flex-col min-w-0">
            <header
                class="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-slate-200 sticky top-0 z-30"
            >
                <div class="flex items-center lg:hidden">
                    <button @click="isSidebarOpen = true" class="text-slate-500 p-2 -ml-2">
                        <Icon icon="lucide:menu" class="h-6 w-6" />
                    </button>
                    <span class="ml-4 font-bold text-slate-900">PayMock</span>
                </div>

                <div class="hidden lg:block">
                    <h2 class="text-xl font-semibold text-slate-900 capitalize">{{ route.name }}</h2>
                </div>

                <div class="flex items-center space-x-4">
                    <router-link
                        :to="{ name: 'demo-checkout' }"
                        target="_blank"
                        class="hidden sm:flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                    >
                        <Icon icon="lucide:shopping-cart" class="h-4 w-4" />
                        <span>Demo Checkout</span>
                    </router-link>

                    <div
                        class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200"
                    >
                        <Icon icon="lucide:user" class="h-5 w-5" />
                    </div>
                </div>
            </header>

            <main class="flex-1 p-4 lg:p-8">
                <router-view v-slot="{ Component }">
                    <Transition
                        mode="out-in"
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 translate-y-2"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 translate-y-2"
                    >
                        <component :is="Component" />
                    </Transition>
                </router-view>
            </main>
        </div>

        <!-- Mobile Sidebar Backdrop -->
        <div
            v-if="isSidebarOpen"
            @click="isSidebarOpen = false"
            class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        ></div>

        <!-- Mobile Sidebar -->
        <aside
            :class="
                cn(
                    'fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 transform transition-transform duration-300 lg:hidden',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )
            "
        >
            <div class="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div class="flex items-center space-x-2">
                    <div class="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center text-white">
                        <Icon icon="lucide:shield-check" class="h-5 w-5" />
                    </div>
                    <span class="font-bold text-lg text-white">PayMock</span>
                </div>
                <button @click="isSidebarOpen = false" class="text-slate-400 p-2">
                    <Icon icon="lucide:x" class="h-6 w-6" />
                </button>
            </div>

            <nav class="p-4 space-y-1">
                <router-link
                    v-for="item in navigation"
                    :key="item.name"
                    :to="{ name: item.routeName }"
                    @click="isSidebarOpen = false"
                    :class="
                        cn(
                            'flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group',
                            route.name === item.routeName
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )
                    "
                >
                    <Icon :icon="item.icon" class="h-6 w-6" />
                    <span class="font-medium text-base">{{ item.name }}</span>
                </router-link>
            </nav>

            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                <button
                    @click="handleLogout"
                    class="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-rose-400"
                >
                    <Icon icon="lucide:log-out" class="h-6 w-6" />
                    <span class="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    </div>
</template>
