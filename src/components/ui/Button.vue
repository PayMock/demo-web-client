<template>
    <button
        :class="
            cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700',
                variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-900',
                variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
                variant === 'ghost' && 'hover:bg-slate-100 text-slate-700',
                variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
                className
            )
        "
        v-bind="$attrs"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn';

interface Props {
    variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger';
    className?: string;
}

withDefaults(defineProps<Props>(), {
    variant: 'primary',
});
</script>
