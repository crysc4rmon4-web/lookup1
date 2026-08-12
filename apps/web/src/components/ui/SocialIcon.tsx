"use client";

import { Globe, Briefcase, Gamepad2 } from "lucide-react";

import {
  SiInstagram,
  SiTiktok,
  SiThreads,
  SiX,
  SiFacebook,
  SiGithub,
  SiGitlab,
  SiBehance,
  SiDribbble,
  SiYoutube,
  SiTwitch,
  SiKick,
  SiDiscord,
  SiTelegram,
  SiWhatsapp,
  SiSpotify,
  SiSteam,
  SiPlaystation,
  SiPatreon,
  SiKofi,
  SiBuymeacoffee,
  SiOnlyfans,
  SiReddit,
  SiPinterest,
  SiBluesky,
  SiSnapchat,
} from "@icons-pack/react-simple-icons";

type Props = {
  platform: string;
  size?: number;
};

export function SocialIcon({ platform, size = 22 }: Props) {
  switch (platform) {
    case "instagram":
      return <SiInstagram size={size} />;

    case "tiktok":
      return <SiTiktok size={size} />;

    case "threads":
      return <SiThreads size={size} />;

    case "x":
      return <SiX size={size} />;

    case "facebook":
      return <SiFacebook size={size} />;

    case "linkedin":
      return <Briefcase size={size} />;

    case "github":
      return <SiGithub size={size} />;

    case "gitlab":
      return <SiGitlab size={size} />;

    case "behance":
      return <SiBehance size={size} />;

    case "dribbble":
      return <SiDribbble size={size} />;

    case "youtube":
      return <SiYoutube size={size} />;

    case "twitch":
      return <SiTwitch size={size} />;

    case "kick":
      return <SiKick size={size} />;

    case "discord":
      return <SiDiscord size={size} />;

    case "telegram":
      return <SiTelegram size={size} />;

    case "whatsapp":
      return <SiWhatsapp size={size} />;

    case "spotify":
      return <SiSpotify size={size} />;

    case "steam":
      return <SiSteam size={size} />;

    case "playstation":
      return <SiPlaystation size={size} />;

    case "xbox":
      return <Gamepad2 size={size} />;

    case "patreon":
      return <SiPatreon size={size} />;

    case "kofi":
      return <SiKofi size={size} />;

    case "buymeacoffee":
      return <SiBuymeacoffee size={size} />;

    case "onlyfans":
      return <SiOnlyfans size={size} />;

    case "reddit":
      return <SiReddit size={size} />;

    case "pinterest":
      return <SiPinterest size={size} />;

    case "bluesky":
      return <SiBluesky size={size} />;

    case "snapchat":
      return <SiSnapchat size={size} />;

    case "website":
      return <Globe size={size} />;

    default:
      return <Globe size={size} />;
  }
}
