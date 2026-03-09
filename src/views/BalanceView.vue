<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';

type Payment = {
    amount: number;
    currency: string;
};
const balance = ref<any>(null);
const isLoading = ref(true);

const availableAdvanceDays = [
    { label: '30 days', days: 30, fee_percentage: 0 },
    { label: '15 days', days: 15, fee_percentage: 1.5 },
    { label: '7 days', days: 7, fee_percentage: 3.0 },
    { label: '3 days', days: 3, fee_percentage: 4.0 },
    { label: '24 hours', days: 1, fee_percentage: 5.0 },
    { label: '1~2 hours', days: 0.04, fee_percentage: 6.0 },
    { label: 'Instant', days: 0, fee_percentage: 10.0 },
];

const showAdvanceModal = ref(false);
const selectedAdvanceDays = ref<number | null>(null);
const advanceAmount = ref<number>(0);
const isSubmitting = ref(false);
const message = ref('');
const pendingPayments = ref<Payment[]>([]);
const pendingPaymentsSum = computed<number>(() => {
    return (pendingPayments.value || [])?.reduce((a: number, i: any) => a + (i?.amount || 0), 0);
});

function clearAdvanceDaysForm() {
    selectedAdvanceDays.value = null;
    message.value = '';
}

watch(
    () => showAdvanceModal.value,
    (newValue) => {
        if (!newValue) {
            clearAdvanceDaysForm();
        }
    }
    // { deep: true }
);

async function fetchBalance() {
    try {
        isLoading.value = true;
        const data = await api.get<any>('/balance');
        balance.value = data;

        pendingPayments.value = 'pending' in data ? data?.pending : [];
    } catch (e) {
        console.error('Failed to fetch balance', e);
    } finally {
        isLoading.value = false;
    }
}

async function handleRequestAdvance() {
    try {
        isSubmitting.value = true;
        message.value = '';
        await api.post('/balance/advance', { days: selectedAdvanceDays.value, amount: advanceAmount.value });
        message.value = 'Advance requested successfully!';
        setTimeout(() => {
            showAdvanceModal.value = false;
            fetchBalance();
        }, 1500);
    } catch (e: any) {
        message.value = e.data?.message || 'Failed to request advance';
    } finally {
        isSubmitting.value = false;
    }
}

onMounted(fetchBalance);
</script>

<template>
    <div class="space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card class="p-8 border-l-8 border-l-indigo-600">
                <h3 class="text-xs font-bold uppercase text-slate-400 mb-2">Total Balance</h3>
                <p class="text-4xl font-extrabold text-slate-900">
                    {{ isLoading ? '...' : formatCurrency(balance?.total) }}
                </p>

                <div class="mt-8 grid grid-cols-2 gap-8">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase">Available</p>
                        <p class="text-xl font-bold text-emerald-600">
                            {{ isLoading ? '...' : formatCurrency(balance?.available) }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase">Pending</p>
                        <p class="text-xl font-bold text-amber-500">
                            {{ isLoading ? '...' : formatCurrency(balance?.pending) }}
                        </p>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500">Withdrawn</p>
                        <p class="text-lg font-bold text-slate-700">
                            {{ isLoading ? '...' : formatCurrency(balance?.withdrawn) }}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        @click="showAdvanceModal = true"
                        :disabled="isLoading || Number(balance?.pending) <= 0"
                    >
                        <Icon icon="lucide:zap" class="mr-2 h-4 w-4" />
                        Advance Receivables
                    </Button>
                </div>
            </Card>

            <Card class="p-8 bg-slate-900 text-white relative overflow-hidden">
                <div class="absolute -right-8 -bottom-8 opacity-10">
                    <Icon icon="lucide:shield-check" class="h-48 w-48 text-white" />
                </div>

                <div class="relative z-10">
                    <h3 class="text-lg font-bold mb-4">Balance Summary</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                            <span class="text-slate-400">Next Payout</span>
                            <span class="font-medium">Tomorrow, 09:00 AM</span>
                        </div>
                        <div class="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                            <span class="text-slate-400">Processing Status</span>
                            <span class="text-emerald-400 font-bold uppercase text-xs">Healthy</span>
                        </div>
                        <div class="flex justify-between items-center text-sm py-2">
                            <span class="text-slate-400">Project ID</span>
                            <span class="font-mono text-xs opacity-75">{{ balance?.project_id || '...' }}</span>
                        </div>
                    </div>

                    <div class="mt-12 bg-indigo-500/20 rounded-xl p-4 border border-indigo-500/30">
                        <p class="text-xs text-indigo-200">
                            Need help with your balance?
                            <br />
                            <a href="#" class="text-white font-bold underline">Check the documentation</a>
                        </p>
                    </div>
                </div>
            </Card>
        </div>

        <!-- Advance Modal -->
        <Modal :show="showAdvanceModal" title="Advance Receivables" @close="showAdvanceModal = false">
            <div class="space-y-6">
                <p class="text-sm text-slate-600">
                    Receive your pending values immediately. Choose the advance period:
                </p>

                <div
                    v-if="message"
                    :class="
                        cn(
                            'p-3 rounded-lg text-sm font-medium',
                            message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        )
                    "
                >
                    {{ message }}
                </div>

                <div class="w-full p-4">
                    <div class="space-y-1.5" placeholder="Amount">
                        <label
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Amount
                        </label>
                        <input
                            class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="100.00"
                            type="number"
                            v-model="advanceAmount"
                            :min="5"
                            :max="pendingPaymentsSum"
                        />
                    </div>

                    <div>
                        <span>Available: {{ formatCurrency(pendingPaymentsSum) }}</span>
                        <button
                            type="button"
                            @click.stop.prevent="advanceAmount = pendingPaymentsSum"
                            class="hidden sm:flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                        >
                            Use full available
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button
                        v-for="(item, index) in availableAdvanceDays"
                        :key="index"
                        @click="selectedAdvanceDays = item.days"
                        :class="
                            cn(
                                'p-2 rounded-xl border-2 text-center transition-all min-h-20',
                                selectedAdvanceDays === item.days
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-100 hover:bg-slate-100 hover:border-slate-300 text-slate-500'
                            )
                        "
                    >
                        <!-- <span class="select-none text-2xl font-bold block">{{ String(item.label || '').split(' ').slice(0, 1).join(' ') }}</span> -->
                        <span class="select-none text-2xl font-bold block">{{ item.label }}</span>
                        <span class="select-none text-sm italic uppercase font-semibold text-indigo-400">
                            {{ item.fee_percentage ? String(item.fee_percentage || '0') + '%' : '0%' }}
                        </span>
                    </button>
                </div>
            </div>
            <template #footer>
                <Button variant="outline" @click="showAdvanceModal = false" :disabled="isSubmitting">Cancel</Button>
                <Button
                    @click="handleRequestAdvance"
                    :disabled="advanceAmount <= 0 || selectedAdvanceDays === null || isSubmitting"
                >
                    <Icon v-if="isSubmitting" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                    Confirm Advance
                </Button>
            </template>
        </Modal>
    </div>
</template>
