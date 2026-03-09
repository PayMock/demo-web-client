<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';

const step = ref(1); // 1: Info, 2: Payment, 3: Result
const isLoading = ref(false);
const result = ref<any>(null);

const form = ref({
    amount: '49.90',
    name: 'John Doe',
    email: 'john@example.com',
    cardNumber: '4444 4444 4444 4444',
    expiry: '12/28',
    cvv: '123',
});

async function handleCheckout() {
    try {
        isLoading.value = true;

        const payload = {
            amount: Number(form.value.amount),
            card_number: form.value.cardNumber.replace(/\s/g, ''),
            metadata: {
                customer_name: form.value.name,
                customer_email: form.value.email,
                product: 'Premium Course Access',
            },
        };

        const data = await api.post<any>('/payments', payload);
        result.value = data;
        step.value = 3;
    } catch (e: any) {
        alert(e.data?.message || 'Payment failed');
    } finally {
        isLoading.value = false;
    }
}

function reset() {
    step.value = 1;
    result.value = null;
}
</script>

<template>
    <div class="max-w-4xl mx-auto py-12 px-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-8">
            <!-- Order Summary -->
            <div class="md:col-span-2 order-2 md:order-1">
                <Card class="p-6 sticky top-24">
                    <h2 class="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Icon icon="lucide:package" class="h-8 w-8" />
                        </div>
                        <div class="flex-1">
                            <h4 class="font-bold text-slate-800">Premium Course</h4>
                            <p class="text-xs text-slate-500">One-time payment</p>
                        </div>
                        <span class="font-bold text-slate-900">
                            {{
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    Number(form.amount)
                                )
                            }}
                        </span>
                    </div>

                    <div class="space-y-3 py-6 border-t border-slate-100">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Subtotal</span>
                            <span class="text-slate-900">
                                {{
                                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        Number(form.amount)
                                    )
                                }}
                            </span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Tax (0%)</span>
                            <span class="text-slate-900">R$ 0,00</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center py-6 border-t border-slate-100">
                        <span class="font-bold text-slate-900 text-lg">Total</span>
                        <span class="font-extrabold text-indigo-600 text-2xl uppercase tracking-tighter">
                            {{
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    Number(form.amount)
                                )
                            }}
                        </span>
                    </div>

                    <div class="mt-6 flex items-center justify-center space-x-2 text-slate-400">
                        <Icon icon="lucide:shield-check" class="h-4 w-4" />
                        <span class="text-[10px] font-bold uppercase">Secure SSL Checkout</span>
                    </div>
                </Card>
            </div>

            <!-- Checkout Steps -->
            <div class="md:col-span-3 order-1 md:order-2">
                <div class="mb-8 flex items-center space-x-4">
                    <div
                        :class="
                            cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                                step >= 1
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-200 text-slate-400'
                            )
                        "
                    >
                        1
                    </div>
                    <div class="h-px flex-1 bg-slate-200"></div>
                    <div
                        :class="
                            cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                                step >= 2
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-200 text-slate-400'
                            )
                        "
                    >
                        2
                    </div>
                    <div class="h-px flex-1 bg-slate-200"></div>
                    <div
                        :class="
                            cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                                step === 3
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-200 text-slate-400'
                            )
                        "
                    >
                        3
                    </div>
                </div>

                <div v-if="step === 1" class="space-y-6">
                    <h2 class="text-2xl font-bold text-slate-900">Customer Info</h2>
                    <Input label="Full Name" v-model="form.name" placeholder="John Doe" />
                    <Input label="Email Address" v-model="form.email" type="email" placeholder="john@example.com" />
                    <Button class="w-full mt-4" @click="step = 2">Continue to Payment</Button>
                </div>

                <div v-if="step === 2" class="space-y-6">
                    <h2 class="text-2xl font-bold text-slate-900">Payment Details</h2>
                    <div class="grid grid-cols-1 gap-4">
                        <div class="p-4 rounded-xl border-2 border-indigo-600 bg-white relative">
                            <div class="absolute right-4 top-4 text-indigo-600">
                                <Icon icon="lucide:check-circle" class="h-5 w-5" />
                            </div>
                            <div class="flex items-center space-x-3 text-slate-900 mb-2">
                                <Icon icon="lucide:credit-card" class="h-6 w-6" />
                                <span class="font-bold">Credit Card</span>
                            </div>
                            <p class="text-xs text-slate-500">Pay securely with your credit card.</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <Input label="Card Number" v-model="form.cardNumber" placeholder="0000 0000 0000 0000" />
                        <div class="grid grid-cols-2 gap-4">
                            <Input label="Expiry Date" v-model="form.expiry" placeholder="MM/YY" />
                            <Input label="CVV" v-model="form.cvv" placeholder="123" />
                        </div>
                    </div>

                    <div class="flex items-center space-x-4 pt-4">
                        <Button variant="ghost" @click="step = 1">Back</Button>
                        <Button class="flex-1" @click="handleCheckout" :disabled="isLoading">
                            <Icon v-if="isLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                            Pay {{ formatCurrency(Number(form.amount)) }}
                        </Button>
                    </div>
                </div>

                <div v-if="step === 3" class="text-center py-12 space-y-6">
                    <div
                        class="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6"
                    >
                        <Icon icon="lucide:check" class="h-10 w-10" />
                    </div>
                    <h2 class="text-2xl font-bold text-slate-900">Payment Successful!</h2>
                    <p class="text-slate-500">Your order has been processed. Check your email for more details.</p>

                    <div class="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                        <div
                            class="flex justify-between text-xs text-slate-400 mb-4 uppercase font-bold tracking-widest"
                        >
                            <span>Transaction ID</span>
                            <span>{{ result?.id }}</span>
                        </div>
                        <div class="flex justify-between text-sm py-2 border-b border-slate-200">
                            <span class="text-slate-500">Status</span>
                            <span class="font-bold text-emerald-600 uppercase italic">{{ result?.status }}</span>
                        </div>
                        <div class="flex justify-between text-sm py-2">
                            <span class="text-slate-500">Amount Paid</span>
                            <span class="font-bold text-slate-900">R$ {{ Number(result?.amount).toFixed(2) }}</span>
                        </div>
                    </div>

                    <Button variant="outline" class="w-full mt-8" @click="reset">Back to start</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
function formatCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

import { cn } from '@/utils/cn';
export default {
    // helpers
};
</script>
