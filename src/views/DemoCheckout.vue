<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const POLL_INTERVAL_SECONDS = 3;
const POLL_TIMEOUT_SECONDS = 5 * 60;

const auth = useAuthStore();
const step = ref<1 | 2 | 3>(1);
const isLoading = ref(false);
const selectedMethod = ref<'credit_card' | 'pix'>('credit_card');
const result = ref<any>(null);

const form = ref({
    amount: '49.90',
    name: 'John Doe',
    email: 'john@example.com',
    cardNumber: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    holderName: 'John Doe',
});

type PixStatus = 'waiting' | 'paid' | 'expired';

interface PixData {
    qr_code_url: string;
    qr_code_base64: string;
    transaction_id: string;
}

const pixData = ref<PixData | null>(null);
const chargePublicId = ref<string | null>(null);
const pixStatus = ref<PixStatus>('waiting');
const pollingElapsedSeconds = ref(0);
const pollingIntervalId = ref<ReturnType<typeof setInterval> | null>(null);
const isPolling = ref(false);

const remainingSeconds = computed(() => {
    return Math.max(0, POLL_TIMEOUT_SECONDS - pollingElapsedSeconds.value);
});

const remainingTimeDisplay = computed(() => {
    const total = remainingSeconds.value;
    const mins = Math.floor(total / 60);
    const secs = total % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const pollingProgressPercent = computed(() => {
    return Math.min(100, (pollingElapsedSeconds.value / POLL_TIMEOUT_SECONDS) * 100);
});

const projectPublicKey = computed<string>(() => {
    return (auth.project as any)?.public_key ?? '';
});

async function publicFetch(path: string, options: RequestInit = {}): Promise<any> {
    const headers = new Headers(options.headers);

    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    headers.set('X-Public-Key', projectPublicKey.value);

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error?.message || `Request failed (${response.status})`);
    }

    return data;
}

async function createCharge(): Promise<string> {
    const charge = await api.post<any>('/charges', {
        amount: Number(form.value.amount),
        description: 'Premium Course Access',
        customer_name: form.value.name,
        customer_email: form.value.email,
    });

    return charge.id;
}

async function handleCardCheckout() {
    try {
        isLoading.value = true;

        const chargeId = await createCharge();

        const data = await publicFetch(`/public/charges/${chargeId}/pay`, {
            method: 'POST',
            body: JSON.stringify({
                method: 'credit_card',
                card_number: form.value.cardNumber.replace(/\s/g, ''),
                card_holder_name: form.value.holderName,
                card_expiry: form.value.expiry,
                card_cvv: form.value.cvv,
            }),
        });

        result.value = {
            id: data.payment?.transaction_id,
            status: data.payment?.status,
            failure_reason: data.payment?.failure_reason,
            amount: Number(form.value.amount),
        };

        step.value = 3;
    } catch (e: any) {
        alert(e.message || 'Payment failed');
    } finally {
        isLoading.value = false;
    }
}

async function handlePixCheckout() {
    try {
        isLoading.value = true;

        const chargeId = await createCharge();

        chargePublicId.value = chargeId;

        const data = await publicFetch(`/public/charges/${chargeId}/pay`, {
            method: 'POST',
            body: JSON.stringify({ method: 'pix' }),
        });

        pixData.value = {
            qr_code_url: data.payment.qr_code_url,
            qr_code_base64: data.payment.qr_code_base64,
            transaction_id: data.payment.transaction_id,
        };

        pixStatus.value = 'waiting';
        step.value = 3;

        startPolling();
    } catch (e: any) {
        alert(e.message || 'Failed to initiate PIX payment');
    } finally {
        isLoading.value = false;
    }
}

function startPolling() {
    stopPolling();

    pollingElapsedSeconds.value = 0;
    isPolling.value = true;

    pollingIntervalId.value = setInterval(async () => {
        pollingElapsedSeconds.value += POLL_INTERVAL_SECONDS;

        if (pollingElapsedSeconds.value >= POLL_TIMEOUT_SECONDS) {
            stopPolling();
            pixStatus.value = 'expired';

            return;
        }

        await pollChargeStatus();
    }, POLL_INTERVAL_SECONDS * 1000);
}

function stopPolling() {
    if (pollingIntervalId.value !== null) {
        clearInterval(pollingIntervalId.value);
        pollingIntervalId.value = null;
    }

    isPolling.value = false;
}

async function pollChargeStatus() {
    if (!chargePublicId.value) {
        return;
    }

    try {
        const data = await publicFetch(`/public/charges/${chargePublicId.value}/status`);

        if (data.status === 'paid') {
            stopPolling();
            pixStatus.value = 'paid';

            result.value = {
                id: pixData.value?.transaction_id,
                status: 'approved',
                amount: Number(form.value.amount),
            };
        }
    } catch (e) {
        console.error('PIX status poll failed:', e);
    }
}

function refreshPolling() {
    if (!chargePublicId.value || pixStatus.value === 'paid') {
        return;
    }

    pixStatus.value = 'waiting';
    startPolling();
}

function handlePayment() {
    if (selectedMethod.value === 'pix') {
        handlePixCheckout();
    } else {
        handleCardCheckout();
    }
}

function reset() {
    stopPolling();
    step.value = 1;
    result.value = null;
    pixData.value = null;
    chargePublicId.value = null;
    pixStatus.value = 'waiting';
    pollingElapsedSeconds.value = 0;
}

onUnmounted(() => {
    stopPolling();
});
</script>

<template>
    <div class="max-w-4xl mx-auto py-12 px-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-8">
            <!-- Order Summary sidebar -->
            <div class="md:col-span-2 order-2 md:order-1">
                <Card class="p-6 sticky top-24">
                    <router-link
                        :to="{ name: 'dashboard' }"
                        class="flex items-center gap-2 text-indigo-600 text-sm font-medium mb-6 hover:text-indigo-800 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" class="h-4 w-4" />
                        Back to dashboard
                    </router-link>

                    <h2 class="text-lg font-bold text-slate-900 mb-5">Order Summary</h2>

                    <div class="flex items-center gap-4 mb-5">
                        <div class="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Icon icon="lucide:package" class="h-7 w-7 text-slate-400" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-800 truncate">Premium Course</h4>
                            <p class="text-xs text-slate-500">One-time payment</p>
                        </div>
                        <span class="font-bold text-slate-900 shrink-0">{{ formatCurrency(form.amount) }}</span>
                    </div>

                    <div class="space-y-2 py-4 border-t border-slate-100">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Subtotal</span>
                            <span>{{ formatCurrency(form.amount) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Tax (0%)</span>
                            <span>{{ formatCurrency(0) }}</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center py-4 border-t border-slate-100">
                        <span class="font-bold text-slate-900">Total</span>
                        <span class="font-extrabold text-indigo-600 text-xl">{{ formatCurrency(form.amount) }}</span>
                    </div>

                    <div class="mt-4 flex items-center justify-center gap-2 text-slate-400">
                        <Icon icon="lucide:shield-check" class="h-4 w-4" />
                        <span class="text-[10px] font-bold uppercase tracking-wide">Secure Checkout</span>
                    </div>
                </Card>
            </div>

            <!-- Checkout flow -->
            <div class="md:col-span-3 order-1 md:order-2">
                <!-- Progress indicator -->
                <div class="mb-8 flex items-center">
                    <template v-for="(label, index) in ['Info', 'Payment', 'Result']" :key="label">
                        <div class="flex flex-col items-center">
                            <div
                                :class="
                                    cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                                        step > index + 1
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : step === index + 1
                                              ? 'bg-indigo-600 border-indigo-600 text-white'
                                              : 'border-slate-200 text-slate-400 bg-white'
                                    )
                                "
                            >
                                <Icon v-if="step > index + 1" icon="lucide:check" class="h-4 w-4" />
                                <span v-else>{{ index + 1 }}</span>
                            </div>
                            <span
                                class="text-xs mt-1 font-medium"
                                :class="step === index + 1 ? 'text-indigo-600' : 'text-slate-400'"
                            >
                                {{ label }}
                            </span>
                        </div>
                        <div
                            v-if="index < 2"
                            :class="
                                cn('flex-1 h-px mb-5 mx-2 transition-colors', step > index + 1 ? 'bg-emerald-400' : 'bg-slate-200')
                            "
                        ></div>
                    </template>
                </div>

                <!-- Step 1: Info -->
                <div v-if="step === 1" class="space-y-5">
                    <h2 class="text-2xl font-bold text-slate-900">Customer Info</h2>
                    <Input label="Full Name" v-model="form.name" placeholder="John Doe" />
                    <Input label="Email" v-model="form.email" type="email" placeholder="john@example.com" />
                    <Input label="Amount (BRL)" v-model="form.amount" type="number" step="0.01" min="0.01" />
                    <Button class="w-full" @click="step = 2">
                        Continue to Payment
                        <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <!-- Step 2: Payment method -->
                <div v-if="step === 2" class="space-y-5">
                    <h2 class="text-2xl font-bold text-slate-900">Payment Details</h2>

                    <div class="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            @click="selectedMethod = 'credit_card'"
                            :class="
                                cn(
                                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold',
                                    selectedMethod === 'credit_card'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                )
                            "
                        >
                            <Icon icon="lucide:credit-card" class="h-6 w-6" />
                            Credit Card
                        </button>
                        <button
                            type="button"
                            @click="selectedMethod = 'pix'"
                            :class="
                                cn(
                                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold',
                                    selectedMethod === 'pix'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                )
                            "
                        >
                            <Icon icon="lucide:qr-code" class="h-6 w-6" />
                            PIX
                        </button>
                    </div>

                    <!-- Credit card fields -->
                    <div v-if="selectedMethod === 'credit_card'" class="space-y-4">
                        <Input label="Card Number" v-model="form.cardNumber" placeholder="0000 0000 0000 0000" />
                        <Input label="Cardholder Name" v-model="form.holderName" placeholder="John Doe" />
                        <div class="grid grid-cols-2 gap-4">
                            <Input label="Expiry" v-model="form.expiry" placeholder="MM/YY" />
                            <Input label="CVV" v-model="form.cvv" placeholder="123" />
                        </div>
                        <div class="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                            <p class="font-semibold mb-1">Test card numbers</p>
                            <p>Ends <strong>0000</strong> → fraud &nbsp;·&nbsp; <strong>1234</strong> → invalid CVV</p>
                            <p class="mt-0.5">Ends <strong>8888</strong> → issuer error &nbsp;·&nbsp; Amount <strong>777</strong> → always approved</p>
                        </div>
                    </div>

                    <!-- PIX info -->
                    <div v-if="selectedMethod === 'pix'" class="space-y-3">
                        <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                            <div class="flex items-start gap-3">
                                <Icon icon="lucide:info" class="h-5 w-5 shrink-0 mt-0.5" />
                                <div class="space-y-1">
                                    <p class="font-semibold">How PIX works in this simulation</p>
                                    <ol class="list-decimal list-inside text-xs space-y-0.5">
                                        <li>Click "Generate QR Code"</li>
                                        <li>Scan QR or click "Open Payment Page"</li>
                                        <li>Click "Confirm Payment" on that page</li>
                                        <li>This screen updates automatically</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
                            Registering payment for <strong>{{ form.name }}</strong> · {{ formatCurrency(form.amount) }}
                        </div>
                    </div>

                    <div class="flex items-center gap-3 pt-1">
                        <Button variant="ghost" @click="step = 1">Back</Button>
                        <Button class="flex-1" @click="handlePayment" :disabled="isLoading">
                            <Icon v-if="isLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                            <template v-else>
                                <Icon
                                    :icon="selectedMethod === 'pix' ? 'lucide:qr-code' : 'lucide:lock'"
                                    class="mr-2 h-4 w-4"
                                />
                                {{ selectedMethod === 'pix' ? 'Generate QR Code' : `Pay ${formatCurrency(form.amount)}` }}
                            </template>
                        </Button>
                    </div>
                </div>

                <!-- Step 3: Result -->
                <div v-if="step === 3">
                    <!-- PIX expired -->
                    <div v-if="selectedMethod === 'pix' && pixStatus === 'expired'" class="text-center py-10 space-y-5">
                        <div class="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                            <Icon icon="lucide:clock" class="h-10 w-10 text-amber-500" />
                        </div>
                        <h2 class="text-xl font-bold text-slate-900">QR Code Expired</h2>
                        <p class="text-slate-500 text-sm max-w-xs mx-auto">
                            The 5-minute payment window closed without confirmation.
                        </p>
                        <div class="flex items-center justify-center gap-3">
                            <Button variant="outline" @click="reset">Start Over</Button>
                            <Button @click="refreshPolling">
                                <Icon icon="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                                Restart Timer
                            </Button>
                        </div>
                    </div>

                    <!-- PIX waiting: QR + countdown -->
                    <div v-else-if="selectedMethod === 'pix' && pixStatus === 'waiting'" class="space-y-5">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-slate-900">Awaiting Payment</h2>
                            <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                <span class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Polling every {{ POLL_INTERVAL_SECONDS }}s
                            </div>
                        </div>

                        <!-- QR Code -->
                        <div class="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center gap-4">
                            <img
                                v-if="pixData?.qr_code_base64"
                                :src="`data:image/svg+xml;base64,${pixData.qr_code_base64}`"
                                alt="PIX QR Code"
                                class="h-52 w-52 rounded-lg"
                            />
                            <div v-else class="h-52 w-52 bg-slate-100 rounded-lg animate-pulse"></div>

                            <p class="text-xs text-slate-500 text-center">
                                Scan with your bank app, or click the link below to simulate the customer's bank screen.
                            </p>

                            <a
                                v-if="pixData?.qr_code_url"
                                :href="pixData.qr_code_url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                            >
                                <Icon icon="lucide:external-link" class="h-4 w-4" />
                                Open Payment Page
                            </a>
                        </div>

                        <!-- Countdown -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-slate-500">Time remaining</span>
                                <span
                                    :class="
                                        cn(
                                            'font-mono font-bold tabular-nums',
                                            remainingSeconds < 60 ? 'text-rose-600' : 'text-slate-700'
                                        )
                                    "
                                >
                                    {{ remainingTimeDisplay }}
                                </span>
                            </div>
                            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    :class="
                                        cn(
                                            'h-full rounded-full transition-all duration-[3000ms] ease-linear',
                                            remainingSeconds < 60 ? 'bg-rose-500' : 'bg-emerald-500'
                                        )
                                    "
                                    :style="{ width: `${100 - pollingProgressPercent}%` }"
                                ></div>
                            </div>
                            <p class="text-xs text-slate-400 text-center">
                                Polling stops automatically after 5 minutes.
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-3">
                            <Button variant="outline" class="flex-1" @click="reset">Cancel</Button>
                            <Button variant="outline" class="flex-1" @click="refreshPolling">
                                <Icon icon="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                                Restart Timer
                            </Button>
                        </div>
                    </div>

                    <!-- PIX paid -->
                    <div v-else-if="selectedMethod === 'pix' && pixStatus === 'paid'" class="text-center py-10 space-y-5">
                        <div class="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Icon icon="lucide:check" class="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 class="text-2xl font-bold text-slate-900">PIX Payment Confirmed!</h2>
                        <p class="text-slate-500 text-sm">Your payment was received and confirmed.</p>

                        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
                            <div class="flex justify-between text-xs uppercase font-bold text-slate-400 tracking-widest pb-2">
                                <span>Transaction</span>
                                <span class="font-mono normal-case">{{ result?.id }}</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-t border-slate-100">
                                <span class="text-slate-500">Method</span>
                                <span class="font-bold text-emerald-600 uppercase">PIX</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-t border-slate-100">
                                <span class="text-slate-500">Amount</span>
                                <span class="font-bold">{{ formatCurrency(result?.amount) }}</span>
                            </div>
                        </div>

                        <Button variant="outline" class="w-full" @click="reset">New Payment</Button>
                    </div>

                    <!-- Card: approved -->
                    <div v-else-if="selectedMethod === 'credit_card' && result?.status === 'approved'" class="text-center py-10 space-y-5">
                        <div class="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Icon icon="lucide:check" class="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 class="text-2xl font-bold text-slate-900">Payment Successful!</h2>
                        <p class="text-slate-500 text-sm">Your order has been processed.</p>

                        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
                            <div class="flex justify-between text-xs uppercase font-bold text-slate-400 tracking-widest pb-2">
                                <span>Transaction</span>
                                <span class="font-mono normal-case">{{ result?.id }}</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-t border-slate-100">
                                <span class="text-slate-500">Status</span>
                                <span class="font-bold text-emerald-600 uppercase">{{ result?.status }}</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-t border-slate-100">
                                <span class="text-slate-500">Amount</span>
                                <span class="font-bold">{{ formatCurrency(result?.amount) }}</span>
                            </div>
                        </div>

                        <Button variant="outline" class="w-full" @click="reset">New Payment</Button>
                    </div>

                    <!-- Card: declined / fraud -->
                    <div v-else-if="selectedMethod === 'credit_card'" class="text-center py-10 space-y-5">
                        <div class="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
                            <Icon
                                :icon="result?.status === 'fraud' ? 'lucide:shield-alert' : 'lucide:x'"
                                class="h-10 w-10 text-rose-600"
                            />
                        </div>
                        <h2 class="text-2xl font-bold text-slate-900">
                            {{ result?.status === 'fraud' ? 'Fraud Detected' : 'Payment Declined' }}
                        </h2>
                        <p class="text-slate-500 text-sm">
                            {{
                                result?.failure_reason
                                    ? `Reason: ${result.failure_reason}`
                                    : 'The payment could not be processed.'
                            }}
                        </p>

                        <div class="flex items-center justify-center gap-3">
                            <Button variant="outline" @click="step = 2">Try Again</Button>
                            <Button @click="reset">Start Over</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
