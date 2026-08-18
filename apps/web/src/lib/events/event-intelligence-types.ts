export type EventAudienceSampleStatus =
  | "sufficient"
  | "insufficient_sample"
  | "insufficient_related_sample"
  | "no_local_data"
  | "unavailable";

export type EventLocalAudiencePreview = {
  sampleStatus: EventAudienceSampleStatus;

  analyzedProfiles: number | null;

  relatedProfiles: number | null;

  strongProfiles: number | null;

  averageSimilarity: number | null;

  topInterests: string[];
};

export type EventIntelligenceConfidence =
  | "insufficient"
  | "low"
  | "medium"
  | "high";

export type EventIntelligenceVerdict =
  | "learning"
  | "works"
  | "improve"
  | "stop";

export type EventReadinessStatus =
  | "ready"
  | "strong"
  | "needs_work"
  | "incomplete";

export type EventReadinessCheckId =
  | "title"
  | "description"
  | "category"
  | "tags"
  | "audience"
  | "location"
  | "schedule"
  | "action";

export type EventReadinessCheckPublic = {
  id: EventReadinessCheckId;

  label: string;

  score: number;

  maxScore: number;

  passed: boolean;

  message: string;
};

export type EventReadinessPublic = {
  score: number;

  status: EventReadinessStatus;

  checks: EventReadinessCheckPublic[];

  strengths: string[];

  improvements: string[];
};

export type EventPrepublishAdvice = {
  verdict: EventIntelligenceVerdict;

  confidence: EventIntelligenceConfidence;

  title: string;

  message: string;

  recommendation: string | null;

  source:
    | "ai"
    | "fallback";

  model: string | null;
};

export type EventEmbeddingPublicStatus = {
  status:
    | "created"
    | "updated"
    | "unchanged"
    | "unavailable";

  model: string | null;

  dimensions: number | null;
};

export type EventDraftIntelligenceResult = {
  eventId: string;

  readiness: EventReadinessPublic;

  localAudience: EventLocalAudiencePreview;

  advice: EventPrepublishAdvice;

  embedding: EventEmbeddingPublicStatus;

  generatedAt: string;
};