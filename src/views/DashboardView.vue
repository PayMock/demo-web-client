<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

const stats = ref<any>(null);
const recentPayments = ref<any[]>([]);
const isLoading = ref(true);

async function fetchData() {
    try {
        isLoading.value = true;
        const [balanceData, paymentsData] = await Promise.all([
            api.get<any>('/balances'),
            api.get<any>('/payments?limit=5'),
        ]);
        stats.value = balanceData;
        recentPayments.value = paymentsData.data || [];
    } catch (e) {
        console.error('Failed to fetch dashboard data', e);
    } finally {
        isLoading.value = false;
    }
}

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value || 0));
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const statusColors: any = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
    canceled: 'bg-slate-100 text-slate-700 border-slate-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    requested: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

onMounted(fetchData);
</script>

<template>
    <div class="space-y-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card class="p-6 relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 transition-transform group-hover:scale-110">
                    <Icon icon="lucide:wallet" class="h-12 w-12 text-slate-100" />
                </div>
                <p class="text-sm font-medium text-slate-500">Total Balance</p>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-bold text-slate-900">
                        {{ isLoading ? '...' : formatCurrency(stats?.total) }}
                    </p>
                </div>
                <p class="mt-1 text-xs text-slate-400">Total accumulated volume</p>
            </Card>

            <Card class="p-6 relative overflow-hidden group border-l-4 border-l-indigo-500">
                <div class="absolute right-0 top-0 p-4 transition-transform group-hover:scale-110">
                    <Icon icon="lucide:check-circle" class="h-12 w-12 text-slate-100" />
                </div>
                <p class="text-sm font-medium text-slate-500">Available</p>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-bold text-indigo-600">
                        {{ isLoading ? '...' : formatCurrency(stats?.available) }}
                    </p>
                </div>
                <p class="mt-1 text-xs text-slate-400">Ready for withdrawal</p>
            </Card>

            <Card class="p-6 relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 transition-transform group-hover:scale-110">
                    <Icon icon="lucide:clock" class="h-12 w-12 text-slate-100" />
                </div>
                <p class="text-sm font-medium text-slate-500">Pending</p>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-bold text-slate-900">
                        {{ isLoading ? '...' : formatCurrency(stats?.pending) }}
                    </p>
                </div>
                <p class="mt-1 text-xs text-slate-400">Future scheduled releases</p>
            </Card>

            <Card class="p-6 relative overflow-hidden group border-l-4 border-l-rose-500">
                <div class="absolute right-0 top-0 p-4 transition-transform group-hover:scale-110">
                    <Icon icon="lucide:arrow-up-right" class="h-12 w-12 text-slate-100" />
                </div>
                <p class="text-sm font-medium text-slate-500">Withdrawn</p>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-bold text-rose-600">
                        {{ isLoading ? '...' : formatCurrency(stats?.withdrawn) }}
                    </p>
                </div>
                <p class="mt-1 text-xs text-slate-400">Total payouts processed</p>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Recent Activity Table -->
            <Card class="lg:col-span-2 overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 class="font-bold text-slate-900">Recent Payments</h3>
                    <router-link :to="{ name: 'payments' }">
                        <Button variant="ghost" size="sm">View All</Button>
                    </router-link>
                </div>

                <div class="flex-1 overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="px-6 py-3 text-xs font-bold uppercase text-slate-500">Transaction</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase text-slate-500">Amount</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="isLoading" v-for="i in 5" :key="i" class="animate-pulse">
                                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-32"></div></td>
                                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-16"></div></td>
                                <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded-full w-20"></div></td>
                                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                            </tr>
                            <tr v-else-if="recentPayments.length === 0">
                                <td colspan="4" class="px-6 py-12 text-center text-slate-500">No records found</td>
                            </tr>
                            <tr
                                v-for="payment in recentPayments"
                                :key="payment.id"
                                class="hover:bg-slate-50/50 transition-colors"
                            >
                                <td class="px-6 py-4">
                                    <div class="font-mono text-xs text-slate-400 mb-1 leading-none">
                                        {{ payment.id }}
                                    </div>
                                    <div class="text-sm font-medium text-slate-900">
                                        {{ payment.metadata?.customer_name || 'Generic Customer' }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 font-semibold text-slate-900">
                                    {{ formatCurrency(payment.amount) }}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        :class="
                                            cn(
                                                'px-2.5 py-1 rounded-full text-xs font-bold border',
                                                statusColors[payment.status] || 'bg-slate-100 text-slate-700'
                                            )
                                        "
                                    >
                                        {{ payment.status }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                    {{ formatDate(payment.created_at) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <!-- Quick Actions & Webhooks -->
            <div class="space-y-6">
                <Card class="p-6">
                    <h3 class="font-bold text-slate-900 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 gap-3">
                        <Button @click="router.push({ name: 'demo-checkout' })" class="justify-start">
                            <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                            New Payment Demo
                        </Button>
                        <Button variant="outline" @click="router.push({ name: 'payouts' })" class="justify-start">
                            <Icon icon="lucide:arrow-up-right" class="mr-2 h-4 w-4" />
                            Request Payout
                        </Button>
                        <Button variant="outline" @click="router.push({ name: 'simulation' })" class="justify-start">
                            <Icon icon="lucide:zap" class="mr-2 h-4 w-4" />
                            Open Simulation
                        </Button>
                    </div>
                </Card>

                <Card class="p-6">
                    <h3 class="font-bold text-slate-900 mb-4">API Health</h3>
                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100"
                        >
                            <div class="flex items-center space-x-3 text-emerald-700">
                                <Icon icon="lucide:check-circle" class="h-5 w-5" />
                                <span class="text-sm font-medium">Gateway API</span>
                            </div>
                            <span class="text-xs font-bold text-emerald-600 uppercase">Operational</span>
                        </div>

                        <div class="text-xs text-slate-400 leading-relaxed">
                            Webhooks are being dispatched via Redis stream. If you experience delays, check the
                            simulation tab.
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</template>
