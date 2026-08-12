export type PlatformCategory =
  | "social"
  | "video"
  | "professional"
  | "community"
  | "music"
  | "gaming"
  | "creator"
  | "website";

export type PlatformType = "username" | "url" | "phone";

export type Platform = {
  id: string;
  name: string;
  category: PlatformCategory;
  type: PlatformType;
  enabled: boolean;
  featured: boolean;
  placeholder: string;
  prefix: string;
};

export const SOCIAL_PLATFORMS: Platform[] = [
  // Social

  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://instagram.com/",
  },

  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://www.tiktok.com/@",
  },

  {
    id: "threads",
    name: "Threads",
    category: "social",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://www.threads.net/@",
  },

  {
    id: "x",
    name: "X",
    category: "social",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://x.com/",
  },

  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://facebook.com/",
  },

  {
    id: "snapchat",
    name: "Snapchat",
    category: "social",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://snapchat.com/add/",
  },

  {
    id: "bluesky",
    name: "Bluesky",
    category: "social",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://bsky.app/profile/",
  },

  {
    id: "reddit",
    name: "Reddit",
    category: "social",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://reddit.com/u/",
  },

  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://pinterest.com/",
  },

  // Video

  {
    id: "youtube",
    name: "YouTube",
    category: "video",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "@canal",
    prefix: "https://youtube.com/@",
  },

  {
    id: "twitch",
    name: "Twitch",
    category: "video",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "streamer",
    prefix: "https://twitch.tv/",
  },

  {
    id: "kick",
    name: "Kick",
    category: "video",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "streamer",
    prefix: "https://kick.com/",
  },

  // Profesional

  {
    id: "linkedin",
    name: "LinkedIn",
    category: "professional",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://linkedin.com/in/",
  },

  {
    id: "github",
    name: "GitHub",
    category: "professional",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "https://github.com/",
  },

  {
    id: "gitlab",
    name: "GitLab",
    category: "professional",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://gitlab.com/",
  },

  {
    id: "behance",
    name: "Behance",
    category: "professional",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://behance.net/",
  },

  {
    id: "dribbble",
    name: "Dribbble",
    category: "professional",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://dribbble.com/",
  },

  // Comunidad

  {
    id: "discord",
    name: "Discord",
    category: "community",
    type: "username",
    enabled: true,
    featured: true,
    placeholder: "usuario",
    prefix: "",
  },

  {
    id: "telegram",
    name: "Telegram",
    category: "community",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://t.me/",
  },

  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "community",
    type: "phone",
    enabled: true,
    featured: false,
    placeholder: "34600111222",
    prefix: "https://wa.me/",
  },

  // Música

  {
    id: "spotify",
    name: "Spotify",
    category: "music",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://open.spotify.com/user/",
  },

  // Gaming

  {
    id: "steam",
    name: "Steam",
    category: "gaming",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "https://steamcommunity.com/id/",
  },

  {
    id: "playstation",
    name: "PlayStation",
    category: "gaming",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "",
  },

  {
    id: "xbox",
    name: "Xbox",
    category: "gaming",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "usuario",
    prefix: "",
  },

  // Creadores

  {
    id: "patreon",
    name: "Patreon",
    category: "creator",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "creator",
    prefix: "https://patreon.com/",
  },

  {
    id: "kofi",
    name: "Ko-fi",
    category: "creator",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "creator",
    prefix: "https://ko-fi.com/",
  },

  {
    id: "buymeacoffee",
    name: "Buy Me a Coffee",
    category: "creator",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "creator",
    prefix: "https://buymeacoffee.com/",
  },

  {
    id: "onlyfans",
    name: "OnlyFans",
    category: "creator",
    type: "username",
    enabled: true,
    featured: false,
    placeholder: "creator",
    prefix: "https://onlyfans.com/",
  },

  // Web

  {
    id: "website",
    name: "Sitio web",
    category: "website",
    type: "url",
    enabled: true,
    featured: false,
    placeholder: "https://",
    prefix: "",
  },
];
