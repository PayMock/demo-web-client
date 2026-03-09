<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="show" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" @click="$emit('close')"></div>
        </Transition>

        <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    :class="
                        cn(
                            'bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]',
                            sizeClasses[size],
                            className
                        )
                    "
                >
                    <div class="flex items-center justify-between p-6 border-b border-slate-100">
                        <h3 class="text-xl font-semibold text-slate-900 leading-none">
                            {{ title }}
                        </h3>
                        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
                            <Icon icon="lucide:x" class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6">
                        <slot />
                    </div>

                    <div
                        v-if="$slots.footer"
                        class="p-6 border-t border-slate-100 flex items-center justify-end space-x-3"
                    >
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { cn } from '@/utils/cn';

interface Props {
    show: boolean;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full m-4',
};

withDefaults(defineProps<Props>(), {
    size: 'md',
});

defineEmits(['close']);
</script>
