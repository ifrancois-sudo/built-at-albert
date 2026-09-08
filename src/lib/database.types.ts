// Hand-written to match supabase/migrations. Keep in sync when a migration
// changes a column, and mirror the column-level grants: fields the client is
// not allowed to read (profiles.email) are deliberately absent from Row.

export type IdeaStatus = "pending" | "open" | "claimed" | "delivered" | "rejected";
export type ClaimStatus = "active" | "delivered" | "expired" | "released";
export type UserRole = "student" | "admin";
export type Locale = "fr" | "en";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  promo: string | null;
  campus: string | null;
  role: UserRole;
  locale: Locale;
  created_at: string;
}

export type IdeaRow = {
  id: string;
  author_id: string;
  title: string;
  problem: string;
  description: string;
  language: Locale;
  tags: string[];
  status: IdeaStatus;
  rejected_reason: string | null;
  vote_count: number;
  campus: string | null;
  created_at: string;
  published_at: string | null;
}

export type VoteRow = {
  idea_id: string;
  user_id: string;
  created_at: string;
}

export type ClaimRow = {
  id: string;
  idea_id: string;
  user_id: string;
  status: ClaimStatus;
  started_at: string;
  expires_at: string;
  reminded_at: string | null;
  reminder_stage: number;
  ended_at: string | null;
}

export type ProjectRow = {
  id: string;
  claim_id: string;
  idea_id: string;
  author_id: string;
  url: string;
  repo_url: string | null;
  description: string;
  screenshots: string[];
  is_public: boolean;
  published_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<Pick<ProfileRow, "full_name" | "promo" | "campus" | "locale">>;
        Relationships: [];
      };
      ideas: {
        Row: IdeaRow;
        Insert: Pick<IdeaRow, "title" | "problem"> &
          Partial<Pick<IdeaRow, "description" | "language" | "tags" | "campus">>;
        Update: Partial<IdeaRow>;
        Relationships: [];
      };
      votes: {
        Row: VoteRow;
        Insert: Pick<VoteRow, "idea_id" | "user_id">;
        Update: Partial<VoteRow>;
        Relationships: [];
      };
      claims: {
        Row: ClaimRow;
        Insert: Partial<ClaimRow> & { idea_id: string; user_id: string };
        Update: Partial<ClaimRow>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow> & { claim_id: string; idea_id: string; url: string };
        Update: Partial<Pick<ProjectRow, "url" | "repo_url" | "description" | "screenshots">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_verified: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      claim_idea: { Args: { p_idea_id: string }; Returns: ClaimRow };
      release_claim: { Args: { p_claim_id: string }; Returns: ClaimRow };
      extend_claim: { Args: { p_claim_id: string; p_days?: number }; Returns: ClaimRow };
      submit_project: {
        Args: {
          p_claim_id: string;
          p_url: string;
          p_description: string;
          p_screenshots: string[];
          p_repo_url?: string | null;
        };
        Returns: ProjectRow;
      };
      moderate_idea: {
        Args: { p_idea_id: string; p_approve: boolean; p_reason?: string | null };
        Returns: IdeaRow;
      };
      set_user_role: { Args: { p_user_id: string; p_role: UserRole }; Returns: ProfileRow };
      set_project_visibility: {
        Args: { p_project_id: string; p_is_public: boolean };
        Returns: ProjectRow;
      };
      expire_due_claims: {
        Args: Record<string, never>;
        Returns: {
          claim_id: string;
          idea_id: string;
          idea_title: string;
          builder_id: string;
          author_id: string;
        }[];
      };
      claim_reminders_due: {
        Args: Record<string, never>;
        Returns: {
          claim_id: string;
          idea_id: string;
          idea_title: string;
          builder_id: string;
          stage: number;
          expires_at: string;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
