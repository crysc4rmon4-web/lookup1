export type SocialPlatform = {
  id: string;
  name: string;
  placeholder: string;
  baseUrl?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "instagram",
    name: "Instagram",
    placeholder: "@usuario",
    baseUrl: "https://instagram.com/",
  },
  {
    id: "tiktok",
    name: "TikTok",
    placeholder: "@usuario",
    baseUrl: "https://tiktok.com/@",
  },
  {
    id: "facebook",
    name: "Facebook",
    placeholder: "Perfil",
  },
  {
    id: "threads",
    name: "Threads",
    placeholder: "@usuario",
  },
  {
    id: "x",
    name: "X",
    placeholder: "@usuario",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    placeholder: "Perfil",
  },
  {
    id: "github",
    name: "GitHub",
    placeholder: "usuario",
    baseUrl: "https://github.com/",
  },
  {
    id: "gitlab",
    name: "GitLab",
    placeholder: "usuario",
  },
  {
    id: "behance",
    name: "Behance",
    placeholder: "usuario",
  },
  {
    id: "dribbble",
    name: "Dribbble",
    placeholder: "usuario",
  },
  {
    id: "youtube",
    name: "YouTube",
    placeholder: "Canal",
  },
  {
    id: "twitch",
    name: "Twitch",
    placeholder: "usuario",
  },
  {
    id: "kick",
    name: "Kick",
    placeholder: "usuario",
  },
  {
    id: "discord",
    name: "Discord",
    placeholder: "usuario",
  },
  {
    id: "telegram",
    name: "Telegram",
    placeholder: "@usuario",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    placeholder: "+34600111222",
  },
  {
    id: "spotify",
    name: "Spotify",
    placeholder: "Perfil",
  },
  {
    id: "reddit",
    name: "Reddit",
    placeholder: "u/usuario",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    placeholder: "usuario",
  },
  {
    id: "onlyfans",
    name: "OnlyFans",
    placeholder: "usuario",
  },
  {
    id: "website",
    name: "Sitio Web",
    placeholder: "https://",
  },
];