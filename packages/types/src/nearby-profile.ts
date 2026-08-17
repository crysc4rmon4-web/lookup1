export type NearbyProfileAccountType =
  | "person"
  | "business";

export type NearbyProfile = {
  id: string;

  username: string | null;
  full_name: string | null;
  avatar_url: string | null;

  profession: string | null;
  bio: string | null;
  city: string | null;

  account_type:
    NearbyProfileAccountType;

  distance: number;

  /**
   * Similitud coseno entre los embeddings
   * del usuario actual y el candidato.
   *
   * null = alguno de los dos perfiles
   * todavía no dispone de embedding.
   */
  semantic_similarity:
    number | null;

  /**
   * Similaridad Jaccard entre los intereses
   * explícitos de ambos perfiles.
   *
   * Rango esperado: 0..1
   */
  interest_similarity:
    number;

  /**
   * Intereses explícitos compartidos,
   * normalizados por PostgreSQL.
   */
  shared_interests:
    string[];

  shared_interest_count:
    number;

  /**
   * LookUp Match Score v1.
   *
   * 80% similitud semántica
   * 20% intereses explícitos
   *
   * null = todavía no existe suficiente
   * información semántica para calcularlo.
   */
  match_score:
    number | null;
};