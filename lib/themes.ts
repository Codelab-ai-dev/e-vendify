export type Theme = 'modern' | 'elegant' | 'vibrant' | 'nature';

export interface ThemeColors {
    primary: string;
    primaryForeground: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
}

export const themes: Record<Theme, ThemeColors> = {
    modern: {
        primary: 'bg-blue-600 dark:bg-blue-500',
        primaryForeground: 'text-white',
        secondary: 'bg-blue-50 dark:bg-blue-900/20',
        background: 'bg-[#F3F4F6] dark:bg-gray-950',
        text: 'text-gray-900 dark:text-gray-50',
        accent: 'text-blue-600 dark:text-blue-400',
    },
    elegant: {
        primary: 'bg-gray-900 dark:bg-white',
        primaryForeground: 'text-white dark:text-gray-900',
        secondary: 'bg-gray-100 dark:bg-zinc-800',
        background: 'bg-[#FAFAFA] dark:bg-zinc-950',
        text: 'text-gray-800 dark:text-zinc-100',
        accent: 'text-gray-900 dark:text-white',
    },
    vibrant: {
        primary: 'bg-violet-600 dark:bg-violet-500',
        primaryForeground: 'text-white',
        secondary: 'bg-violet-50 dark:bg-violet-900/20',
        background: 'bg-white dark:bg-slate-950', // Changed from bg-[#F5F3FF] to bg-white for cleaner look
        text: 'text-gray-900 dark:text-slate-50',
        accent: 'text-violet-600 dark:text-violet-400',
    },
    nature: {
        primary: 'bg-emerald-600 dark:bg-emerald-500',
        primaryForeground: 'text-white',
        secondary: 'bg-emerald-50 dark:bg-emerald-900/20',
        background: 'bg-white dark:bg-stone-950', // Changed from bg-[#ECFDF5] to bg-white for cleaner look
        text: 'text-gray-900 dark:text-stone-50',
        accent: 'text-emerald-600 dark:text-emerald-400',
    },
};

export const themeLabels: Record<Theme, string> = {
    modern: 'Moderno (Azul)',
    elegant: 'Elegante (Negro)',
    vibrant: 'Vibrante (Violeta)',
    nature: 'Naturaleza (Verde)',
};
