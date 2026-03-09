<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

const webhooks = ref<any[]>([]);
const isLoading = ref(true);

async function fetchWebhooks() {
    try {
        isLoading.value = true;
        const data = await api.get<any>('/webhooks');
        webhooks.value = data.data || [];
    } catch (e) {
        console.error('Failed to fetch webhooks', e);
    } finally {
        isLoading.value = false;
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR');
}

onMounted(fetchWebhooks);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-slate-900">Webhook Events</h3>
            <Button variant="outline" size="sm" @click="fetchWebhooks">
                <Icon icon="lucide:refresh-cw" :class="cn('h-4 w-4', isLoading && 'animate-spin')" />
            </Button>
        </div>

        <Card class="overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100">
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Event</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Resource</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="isLoading" v-for="i in 5" :key="i" class="animate-pulse">
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-48"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                            <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded-full w-16"></div></td>
                            <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-28"></div></td>
                        </tr>
                        <tr v-else-if="webhooks.length === 0">
                            <td colspan="4" class="px-6 py-12 text-center text-slate-500 italic">
                                No webhook events found.
                            </td>
                        </tr>
                        <tr
                            v-for="wb in webhooks"
                            :key="wb.id"
                            class="hover:bg-slate-50 border-l-4"
                            :class="wb.status === 'delivered' ? 'border-l-emerald-500' : 'border-l-amber-500'"
                        >
                            <td class="px-6 py-4">
                                <span class="font-bold text-slate-900">{{ wb.event }}</span>
                                <div class="text-xs text-slate-400 font-mono">{{ wb.id }}</div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-xs text-slate-500 font-mono">
                                    {{ wb.transaction_id ? 'TX: ' + wb.transaction_id : 'PO: ' + wb.payout_id }}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    :class="
                                        cn(
                                            'px-2.5 py-1 rounded-full text-xs font-bold border',
                                            wb.status === 'delivered'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        )
                                    "
                                >
                                    {{ wb.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-500">{{ formatDate(wb.created_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
</template>
