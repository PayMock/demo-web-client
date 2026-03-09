<template>
    <div :class="cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)">
        <div v-if="$slots.header || title || description" class="flex flex-col space-y-1.5 p-6">
            <h3 v-if="title" class="text-lg font-semibold leading-none tracking-tight">
                {{ title }}
            </h3>
            <p v-if="description" class="text-sm text-slate-500">
                {{ description }}
            </p>
            <slot name="header" />
        </div>
        <div :class="cn('p-6 pt-0', bodyClassName)">
            <slot />
        </div>
        <div v-if="$slots.footer" :class="cn('flex items-center p-6 pt-0', footerClassName)">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn';

interface Props {
    title?: string;
    description?: string;
    className?: string;
    bodyClassName?: string;
    footerClassName?: string;
}

defineProps<Props>();
</script>
