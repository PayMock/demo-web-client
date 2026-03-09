<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Modal from '@/components/ui/Modal.vue';

const paymentsData = ref<any>(null);
const isLoading = ref(true);
const page = ref(1);
const statusFilter = ref('');

const showDetailsModal = ref(false);
const selectedPayment = ref<any>(null);

async function fetchPayments() {
    try {
        isLoading.value = true;
        let url = `/payments?page=${page.value}`;
        if (statusFilter.value) url += `&status=${statusFilter.value}`;

        const data = await api.get<any>(url);
        paymentsData.value = data;
    } catch (e) {
        console.error('Failed to fetch payments', e);
    } finally {
        isLoading.value = false;
    }
}

function handleViewDetails(payment: any) {
    selectedPayment.ref = payment; // selectedPayment is ref, wait
    selectedPayment.value = payment;
    showDetailsModal.value = true;
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
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
    canceled: 'bg-slate-100 text-slate-700 border-slate-200',
};

onMounted(fetchPayments);

function setPage(p: number) {
    page.value = p;
    fetchPayments();
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-2">
                <select
                    v-model="statusFilter"
                    @change="
                        page = 1;
                        fetchPayments();
                    "
                    class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="canceled">Canceled</option>
                </select>
            </div>

            <Button
                @click="
                    page = 1;
                    fetchPayments();
                "
                variant="outline"
            >
                <Icon icon="lucide:refresh-cw" :class="cn('mr-2 h-4 w-4', isLoading && 'animate-spin')" />
                Refresh
            </Button>
        </div>

        <Card class="overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100">
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Transaction ID</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Customer</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Amount</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Date</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="isLoading" v-for="i in 8" :key="i" class="animate-pulse">
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-32"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-16"></div></td>
                            <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded-full w-20"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-28"></div></td>
                            <td class="px-6 py-4"><div class="h-8 bg-slate-200 rounded w-12"></div></td>
                        </tr>
                        <tr v-else-if="paymentsData?.data?.length === 0">
                            <td colspan="6" class="px-6 py-12 text-center text-slate-500 italic">
                                No payments found matching your criteria.
                            </td>
                        </tr>
                        <tr
                            v-for="payment in paymentsData?.data"
                            :key="payment.id"
                            class="hover:bg-slate-50/50 transition-colors"
                        >
                            <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ payment.id }}</td>
                            <td class="px-6 py-4">
                                <span class="text-sm font-medium text-slate-900">
                                    {{ payment.metadata?.customer_name || 'N/A' }}
                                </span>
                                <div class="text-xs text-slate-400">
                                    {{ payment.metadata?.customer_email || 'No email' }}
                                </div>
                            </td>
                            <td class="px-6 py-4 font-bold text-slate-900">{{ formatCurrency(payment.amount) }}</td>
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
                            <td class="px-6 py-4 text-right">
                                <button
                                    @click="handleViewDetails(payment)"
                                    class="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                                >
                                    Details
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div
                v-if="paymentsData && paymentsData.total > paymentsData.per_page"
                class="p-4 border-t border-slate-100 flex items-center justify-between"
            >
                <span class="text-xs text-slate-500">
                    Showing {{ paymentsData.from }}-{{ paymentsData.to }} of {{ paymentsData.total }}
                </span>
                <div class="flex items-center space-x-1">
                    <Button variant="outline" size="sm" :disabled="page === 1" @click="setPage(page - 1)">
                        <Icon icon="lucide:chevron-left" class="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="page === paymentsData.last_page"
                        @click="setPage(page + 1)"
                    >
                        <Icon icon="lucide:chevron-right" class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>

        <!-- Details Modal -->
        <Modal
            :show="showDetailsModal"
            :title="'Payment Details: ' + selectedPayment?.id"
            @close="showDetailsModal = false"
            size="lg"
        >
            <div v-if="selectedPayment" class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="text-xs font-bold uppercase text-slate-400">Status</label>
                        <div class="mt-1">
                            <span
                                :class="
                                    cn(
                                        'px-2.5 py-1 rounded-full text-xs font-bold border',
                                        statusColors[selectedPayment.status] || 'bg-slate-100 text-slate-700'
                                    )
                                "
                            >
                                {{ selectedPayment.status }}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase text-slate-400">Amount</label>
                        <p class="text-lg font-bold text-slate-900">{{ formatCurrency(selectedPayment.amount) }}</p>
                    </div>
                </div>

                <div class="border-t border-slate-100 pt-6">
                    <h4 class="text-sm font-bold text-slate-900 mb-3">Customer Information</h4>
                    <pre class="bg-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-40 font-mono text-slate-600">{{
                        JSON.stringify(selectedPayment.metadata, null, 2)
                    }}</pre>
                </div>

                <div class="border-t border-slate-100 pt-6">
                    <h4 class="text-sm font-bold text-slate-900 mb-3">Timeline</h4>
                    <div class="space-y-3">
                        <div class="flex items-center text-xs text-slate-500">
                            <Icon icon="lucide:plus" class="mr-2 h-4 w-4 text-emerald-500" />
                            <span>Created at: {{ formatDate(selectedPayment.created_at) }}</span>
                        </div>
                        <div v-if="selectedPayment.canceled_at" class="flex items-center text-xs text-slate-500">
                            <Icon icon="lucide:x" class="mr-2 h-4 w-4 text-rose-500" />
                            <span>Canceled at: {{ formatDate(selectedPayment.canceled_at) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>
