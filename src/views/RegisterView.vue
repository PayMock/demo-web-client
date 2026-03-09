<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';

const auth = useAuthStore();
const router = useRouter();

const projectName = ref('');
const error = ref('');
const isLoading = ref(false);

const showSuccessModal = ref(false);
const createdProject = ref<any>(null);

async function handleRegister() {
    if (!projectName.value) {
        error.value = 'Project name is required';
        return;
    }

    try {
        isLoading.value = true;
        error.value = '';
        const data = await api.post<any>('/projects', { name: projectName.value });
        createdProject.value = data;
        showSuccessModal.value = true;
    } catch (e: any) {
        error.value = e.data?.message || 'Failed to create project';
    } finally {
        isLoading.value = false;
    }
}

function handleLoginWithProject() {
    if (createdProject.value?.api_key) {
        auth.setApiKey(createdProject.value.api_key);
        router.push({ name: 'dashboard' });
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
                    <Icon icon="lucide:plus-circle" class="h-8 w-8" />
                </div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900">Create Project</h1>
                <p class="mt-2 text-sm text-slate-600">Start building your payment integration</p>
            </div>

            <Card class="p-8">
                <form @submit.prevent="handleRegister" class="space-y-6">
                    <Input
                        id="name"
                        label="Project Name"
                        placeholder="e.g. My Awesome Shop"
                        v-model="projectName"
                        :error="error"
                        required
                    />

                    <div class="space-y-4">
                        <Button type="submit" class="w-full" :disabled="isLoading">
                            <Icon v-if="isLoading" icon="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                            Create Project
                        </Button>

                        <Button type="button" variant="ghost" class="w-full" @click="router.push({ name: 'login' })">
                            Back to login
                        </Button>
                    </div>
                </form>
            </Card>
        </div>

        <!-- Success Modal -->
        <Modal :show="showSuccessModal" title="Project Created Successfully" @close="showSuccessModal = false">
            <div class="space-y-6">
                <div class="rounded-lg bg-emerald-50 p-4 border border-emerald-100 italic text-sm text-emerald-800">
                    Your project has been created. Save your API key securely.
                </div>

                <div class="space-y-4 text-slate-900">
                    <div>
                        <label class="text-xs font-bold uppercase text-slate-500">Project ID</label>
                        <p class="font-mono text-sm">{{ createdProject?.id }}</p>
                    </div>

                    <div>
                        <label class="text-xs font-bold uppercase text-slate-500">API Key</label>
                        <div class="flex items-center space-x-2 mt-1">
                            <code
                                class="flex-1 p-2 bg-slate-100 rounded border border-slate-200 text-sm overflow-x-auto whitespace-nowrap"
                            >
                                {{ createdProject?.api_key }}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button variant="outline" @click="showSuccessModal = false">Close</Button>
                <Button @click="handleLoginWithProject">
                    <Icon icon="lucide:log-in" class="mr-2 h-4 w-4" />
                    Login with Project
                </Button>
            </template>
        </Modal>
    </div>
</template>
