<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';

const auth = useAuthStore();
const router = useRouter();

const apiKeyInput = ref('');
const error = ref('');
const isLoading = ref(false);

async function handleLogin() {
    if (!apiKeyInput.value) {
        error.value = 'API Key is required';
        return;
    }

    try {
        isLoading.value = true;
        error.value = '';
        auth.setApiKey(apiKeyInput.value);
        await auth.fetchMe();
        router.push({ name: 'dashboard' });
    } catch (e: any) {
        error.value = 'Invalid API Key or connection error';
        auth.logout();
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div class="w-full max-w-md space-y-8">
            <div class="text-center">
                <div
                    class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg mb-4"
                >
                    <Icon icon="lucide:shield-check" class="h-8 w-8" />
                </div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900">PayMock Backoffice</h1>
                <p class="mt-2 text-sm text-slate-600">Enter your project API key to continue</p>
            </div>

            <Card class="p-8">
                <form @submit.prevent="handleLogin" class="space-y-6">
                    <Input
                        id="apiKey"
                        label="Project API Key"
                        type="password"
                        placeholder="sk_test_..."
                        v-model="apiKeyInput"
                        :error="error"
                        required
                    />

                    <div class="space-y-4">
                        <Button type="submit" class="w-full" :disabled="isLoading">
                            <Icon v-if="isLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                            Sign in
                        </Button>

                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <span class="w-full border-t border-slate-200"></span>
                            </div>
                            <div class="relative flex justify-center text-xs uppercase">
                                <span class="bg-white px-2 text-slate-500">Or</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            class="w-full"
                            @click="router.push({ name: 'register' })"
                        >
                            Create new project
                        </Button>
                    </div>
                </form>
            </Card>

            <p class="text-center text-xs text-slate-400">&copy; 2026 PayMock Gateway Sim. All rights reserved.</p>
        </div>
    </div>
</template>
