<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

const pendingPayments = ref<any[]>([]);
const requestedPayouts = ref<any[]>([]);
const isLoading = ref(true);
const actionLoading = ref<string | null>(null);

async function fetchData() {
    try {
        isLoading.value = true;
        const [payments, payouts] = await Promise.all([
            api.get<any>('/payments?status=pending'),
            api.get<any>('/payouts?status=requested'),
        ]);
        pendingPayments.value = payments.data || [];
        requestedPayouts.value = payouts.data || [];
    } catch (e) {
        console.error('Failed to fetch simulation data', e);
    } finally {
        isLoading.value = false;
    }
}

async function handleAction(type: 'payment' | 'payout', id: string, action: 'confirm' | 'fail') {
    try {
        actionLoading.value = `${id}-${action}`;
        const endpoint = type === 'payment' ? `/payments/${id}/${action}` : `/payouts/${id}/${action}`;
        await api.post(endpoint);
        await fetchData();
    } catch (e: any) {
        alert(e.data?.message || `Failed to ${action} ${type}`);
    } finally {
        actionLoading.value = null;
    }
}

onMounted(fetchData);
</script>

<template>
    <div class="space-y-8">
        <div class="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div class="absolute right-0 top-0 p-8 opacity-20">
                <Icon icon="lucide:zap" class="h-32 w-32" />
            </div>
            <div class="relative z-10 max-w-2xl">
                <h1 class="text-3xl font-bold mb-4">Simulation Center</h1>
                <p class="text-indigo-100 text-lg">
                    Manually override transactions and payouts to test your webhook integrations and frontend listeners
                    without waiting for automatic processing.
                </p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Pending Payments -->
            <Card class="flex flex-col">
                <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-slate-900">Pending Payments</h3>
                        <p class="text-xs text-slate-500">Wait for user action or override here.</p>
                    </div>
                    <Button variant="ghost" size="sm" @click="fetchData">
                        <Icon icon="lucide:refresh-cw" :class="cn('h-4 w-4', isLoading && 'animate-spin')" />
                    </Button>
                </div>

                <div class="p-0 overflow-y-auto max-h-[500px]">
                    <div v-if="pendingPayments.length === 0" class="p-12 text-center text-slate-400">
                        <Icon icon="lucide:inbox" class="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p class="text-sm">No pending payments to simulate.</p>
                    </div>

                    <div
                        v-for="payment in pendingPayments"
                        :key="payment.id"
                        class="p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="font-mono text-xs text-slate-400 block">{{ payment.id }}</span>
                                <span class="font-bold text-slate-900">
                                    {{
                                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                            payment.amount
                                        )
                                    }}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    class="text-rose-600 hover:bg-rose-50 border-rose-100"
                                    :disabled="!!actionLoading"
                                    @click="handleAction('payment', payment.id, 'fail')"
                                >
                                    <Icon
                                        v-if="actionLoading === `${payment.id}-fail`"
                                        icon="lucide:loader-2"
                                        class="animate-spin mr-1"
                                    />
                                    Fail
                                </Button>
                                <Button
                                    size="sm"
                                    class="bg-emerald-600 hover:bg-emerald-700"
                                    :disabled="!!actionLoading"
                                    @click="handleAction('payment', payment.id, 'confirm')"
                                >
                                    <Icon
                                        v-if="actionLoading === `${payment.id}-confirm`"
                                        icon="lucide:loader-2"
                                        class="animate-spin mr-1"
                                    />
                                    Confirm
                                </Button>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 italic">
                            Customer: {{ payment.metadata?.customer_name || 'Anonymous' }}
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Requested Payouts -->
            <Card class="flex flex-col">
                <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-slate-900">Requested Payouts</h3>
                        <p class="text-xs text-slate-500">Simulate bank approval or rejection.</p>
                    </div>
                    <Button variant="ghost" size="sm" @click="fetchData">
                        <Icon icon="lucide:refresh-cw" :class="cn('h-4 w-4', isLoading && 'animate-spin')" />
                    </Button>
                </div>

                <div class="p-0 overflow-y-auto max-h-[500px]">
                    <div v-if="requestedPayouts.length === 0" class="p-12 text-center text-slate-400">
                        <Icon icon="lucide:inbox" class="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p class="text-sm">No requested payouts to simulate.</p>
                    </div>

                    <div
                        v-for="payout in requestedPayouts"
                        :key="payout.id"
                        class="p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="font-mono text-xs text-slate-400 block">{{ payout.id }}</span>
                                <span class="font-bold text-slate-900">
                                    {{
                                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                            payout.amount
                                        )
                                    }}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    class="text-rose-600 hover:bg-rose-50 border-rose-100"
                                    :disabled="!!actionLoading"
                                    @click="handleAction('payout', payout.id, 'fail')"
                                >
                                    <Icon
                                        v-if="actionLoading === `${payout.id}-fail`"
                                        icon="lucide:loader-2"
                                        class="animate-spin mr-1"
                                    />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    class="bg-indigo-600 hover:bg-indigo-700"
                                    :disabled="!!actionLoading"
                                    @click="handleAction('payout', payout.id, 'confirm')"
                                >
                                    <Icon
                                        v-if="actionLoading === `${payout.id}-confirm`"
                                        icon="lucide:loader-2"
                                        class="animate-spin mr-1"
                                    />
                                    Approve
                                </Button>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500">
                            Method:
                            <span class="uppercase font-bold">{{ payout.transfer_details?.type }}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>
