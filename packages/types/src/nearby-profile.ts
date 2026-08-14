export type NearbyProfileAccountType = "person" | "business";

export type NearbyProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  bio: string | null;
  city: string | null;
  account_type: NearbyProfileAccountType;
  distance: number;
};