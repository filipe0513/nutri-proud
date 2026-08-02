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
}
