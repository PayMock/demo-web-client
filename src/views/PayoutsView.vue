<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Modal from '@/components/ui/Modal.vue';

const payouts = ref<any[]>([]);
const balance = ref<any>(null);
const isLoading = ref(true);

const showRequestModal = ref(false);
const amount = ref('');
const transferType = ref('pix');
const pixKey = ref('');
const pixKeyType = ref('email');
const isSubmitting = ref(false);
const error = ref('');

async function fetchData() {
    try {
        isLoading.value = true;
        const [payoutsData, balanceData] = await Promise.all([api.get<any>('/payouts'), api.get<any>('/balances')]);
        payouts.value = payoutsData.data || [];
        balance.value = balanceData;
    } catch (e) {
        console.error('Failed to fetch payouts', e);
    } finally {
        isLoading.value = false;
    }
}

async function handleRequestPayout() {
    if (!amount.value || Number(amount.value) <= 0) {
        error.value = 'Valid amount is required';
        return;
    }

    try {
        isSubmitting.value = true;
        error.value = '';

        await api.post('/payouts', {
            amount: Number(amount.value),
            transfer_details: {
                type: transferType.value,
                pix_key: transferType.value === 'pix' ? pixKey.value : undefined,
                key_type: transferType.value === 'pix' ? pixKeyType.value : undefined,
                bank_name: transferType.value === 'bank_transfer' ? 'Mock Bank' : undefined,
                account_holder: 'Project Owner',
            },
        });

        showRequestModal.value = false;
        amount.value = '';
        pixKey.value = '';
        fetchData();
    } catch (e: any) {
        error.value = e.data?.message || 'Failed to request payout';
    } finally {
        isSubmitting.value = false;
    }
}

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value || 0));
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR');
}

const statusColors: any = {
    requested: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
};

onMounted(fetchData);
</script>

<template>
    <div class="space-y-8">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-sm font-medium text-slate-500">Available for Payout</h3>
                <p class="text-3xl font-bold text-slate-900">
                    {{ isLoading ? '...' : formatCurrency(balance?.available) }}
                </p>
            </div>
            <Button @click="showRequestModal = true" :disabled="isLoading || Number(balance?.available) <= 0">
                <Icon icon="lucide:arrow-up-right" class="mr-2 h-4 w-4" />
                Request Withdrawal
            </Button>
        </div>

        <Card class="overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 class="font-bold text-slate-900">Withdrawal History</h3>
                <Button variant="outline" size="sm" @click="fetchData">
                    <Icon icon="lucide:refresh-cw" :class="cn('h-4 w-4', isLoading && 'animate-spin')" />
                </Button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100">
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Payout ID</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Amount</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Method</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="isLoading" v-for="i in 5" :key="i" class="animate-pulse">
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-16"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                            <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded-full w-20"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-28"></div></td>
                        </tr>
                        <tr v-else-if="payouts.length === 0">
                            <td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">
                                No withdrawal requests found.
                            </td>
                        </tr>
                        <tr v-for="payout in payouts" :key="payout.id" class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ payout.id }}</td>
                            <td class="px-6 py-4 font-bold text-slate-900">{{ formatCurrency(payout.amount) }}</td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-slate-600 uppercase">
                                    {{ payout.transfer_details?.type || 'N/A' }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    :class="
                                        cn(
                                            'px-2.5 py-1 rounded-full text-xs font-bold border',
                                            statusColors[payout.status] || 'bg-slate-100 text-slate-700'
                                        )
                                    "
                                >
                                    {{ payout.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-500">{{ formatDate(payout.created_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>

        <!-- Request Modal -->
        <Modal :show="showRequestModal" title="Request Withdrawal" @close="showRequestModal = false">
            <form @submit.prevent="handleRequestPayout" class="space-y-6">
                <div class="space-y-4">
                    <Input
                        id="amount"
                        label="Amount to withdraw"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        v-model="amount"
                        :error="error"
                        required
                    />

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Transfer Method</label>
                        <div class="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                @click="transferType = 'pix'"
                                :class="
                                    cn(
                                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                                        transferType === 'pix'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    )
                                "
                            >
                                <Icon icon="lucide:qr-code" class="h-6 w-6 mb-2" />
                                <span class="text-xs font-bold uppercase">PIX</span>
                            </button>
                            <button
                                type="button"
                                @click="transferType = 'bank_transfer'"
                                :class="
                                    cn(
                                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                                        transferType === 'bank_transfer'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    )
                                "
                            >
                                <Icon icon="lucide:landmark" class="h-6 w-6 mb-2" />
                                <span class="text-xs font-bold uppercase text-center">Bank Transfer</span>
                            </button>
                        </div>
                    </div>

                    <div v-if="transferType === 'pix'" class="space-y-4 pt-2">
                        <div class="space-y-1">
                            <label class="block text-sm font-medium text-slate-700">Key Type</label>
                            <select
                                v-model="pixKeyType"
                                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="email">Email</option>
                                <option value="cpf">CPF</option>
                                <option value="cnpj">CNPJ</option>
                                <option value="phone">Phone</option>
                                <option value="random">Random Key</option>
                            </select>
                        </div>
                        <Input id="pixKey" label="PIX Key" placeholder="your@email.com" v-model="pixKey" required />
                    </div>
                </div>

                <template #footer>
                    <Button variant="outline" @click="showRequestModal = false" :disabled="isSubmitting">Cancel</Button>
                    <Button type="submit" :disabled="isSubmitting">
                        <Icon v-if="isSubmitting" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                        Confirm Withdrawal
                    </Button>
                </template>
            </form>
        </Modal>
    </div>
</template>
