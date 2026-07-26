export const theme = {
    colors: {
        primary: "#5D5FEF",
        primaryHover: "#4C4EE8",
        primaryActive: "#4042D9",

        background: "#F7F8FC",
        surface: "#FFFFFF",
        surfaceAlt: "#F4F6FB",

        border: "#E5E7EB",
        borderStrong: "#CBD5E1",

        text: "#0F172A",
        textSecondary: "#64748B",
        textMuted: "#94A3B8",

        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",

        disabled: "#CBD5E1",
    },

    radius: {
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
    },

    shadow: {
        card: "0 10px 30px rgba(15,23,42,.05)",
    },

    transition: {
        default: "all .2s ease",
    },
} as const;