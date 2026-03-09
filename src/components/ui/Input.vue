<template>
    <div :class="cn('space-y-1.5', className)">
        <label
            v-if="label"
            :for="id"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
            {{ label }}
        </label>
        <input
            :id="id"
            :type="type"
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            :class="
                cn(
                    'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-rose-500 focus-visible:ring-rose-500'
                )
            "
            v-bind="$attrs"
        />
        <p v-if="error" class="text-xs font-medium text-rose-500">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn';

interface Props {
    id?: string;
    label?: string;
    modelValue?: string | number;
    type?: string;
    className?: string;
    error?: string;
}

defineProps<Props>();
defineEmits(['update:modelValue']);
</script>
