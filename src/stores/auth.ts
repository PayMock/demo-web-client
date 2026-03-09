import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
    const apiKey = ref<string | null>(sessionStorage.getItem('paymock_api_key'));
    const project = ref<any>(null);
    const isLoading = ref(false);

    const isAuthenticated = computed(() => !!apiKey.value);

    function setApiKey(key: string) {
        apiKey.value = key;
        sessionStorage.setItem('paymock_api_key', key);
    }

    function logout() {
        apiKey.value = null;
        project.value = null;
        sessionStorage.removeItem('paymock_api_key');
    }

    async function fetchMe() {
        if (!apiKey.value) {
            return null;
        }

        try {
            isLoading.value = true;
            const data = await api.get<any>('/projects/me');
            project.value = data;
            return data;
        } catch (error) {
            logout();
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        apiKey,
        project,
        isLoading,
        isAuthenticated,
        setApiKey,
        logout,
        fetchMe,
    };
});
