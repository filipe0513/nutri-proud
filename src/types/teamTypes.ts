// ── Frontend types for the Teams social feature ──────────────

/** Summary of a team as displayed in the hub listing */
export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  currentUserRole?: 'ADMIN' | 'MEMBER';
  createdAt: string; // ISO
}

/** Author info embedded in a post */
export interface PostAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

/** Aggregated reaction count for a single emoji */
export interface ReactionCount {
  emoji: string;
  count: number;
  /** Whether the current user has reacted with this emoji */
  reacted: boolean;
}

/** A post with all its social context, ready for rendering */
export interface PostWithAuthor {
  id: string;
  content: string | null;
  imageUrl: string | null;
  type: 'USER_GENERATED' | 'SYSTEM_MILESTONE';
  teamId: string;
  author: PostAuthor;
  reactions: ReactionCount[];
  commentCount: number;
  createdAt: string; // ISO
  metadata?: { pillarScores?: Record<string, number> } | null;
}

// ── Comment types ──────────────────────────────────────────

export interface CommentWithAuthor {
  id: string;
  text: string;
  author: PostAuthor;
  createdAt: string; // ISO
}

// ── Nutri Dashboard types ──────────────────────────────────

export interface EvolutionMetadata {
  photo_url: string | null;
  weight_kg: number | null;
  caption: string | null;
}

export interface MilestoneMetadata {
  dailyScore: number;
}

export interface TeamFeedPostWithPatient {
  id: string;
  type: 'MILESTONE' | 'ALERT' | 'EVOLUTION' | 'SYSTEM' | 'CHALLENGE_SUMMARY';
  content: string;
  createdAt: string; // ISO
  patient: PostAuthor;
  teamName: string;
  metadata: EvolutionMetadata | MilestoneMetadata | null;
}

export type UnifiedFeedItem =
  | { kind: 'social'; post: PostWithAuthor; teamName: string }
  | { kind: 'system'; feedPost: TeamFeedPostWithPatient };

export interface PatientRadarItem {
  patient: PostAuthor;
  teamName: string;
  lastLogAt: string | null; // ISO
  daysSinceLastLog: number | null;
  recentAvgScore: number | null;
  status: 'at_risk' | 'doing_great' | 'normal';
}

export interface PatientRadarData {
  atRisk: PatientRadarItem[];
  doingGreat: PatientRadarItem[];
}

// ── Team Management (Nutri) ─────────────────────────────────

export interface TeamMemberInfo {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string; // ISO
  user: {
    name: string | null;
    image: string | null;
  };
}

export interface TeamWithMembers extends TeamSummary {
  members: TeamMemberInfo[];
}
