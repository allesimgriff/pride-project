export type UserRole =
  | "admin"
  | "projektleitung"
  | "entwicklung"
  | "einkauf"
  | "vertrieb"
  | "externer_partner";

export type ProjectStatus =
  | "idee"
  | "konzept"
  | "entwicklung"
  | "muster"
  | "freigabe"
  | "abgeschlossen"
  | "archiviert";

export type TaskPriority = "niedrig" | "mittel" | "hoch" | "dringend";

export interface ProjectCategory {
  id: string;
  name: string;
  prefix: string;
  sort_order: number;
  workspace_id: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkspaceMemberRole = "admin" | "member";

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  workspace_name: string | null;
  user_id: string;
  user_email: string | null;
  role: WorkspaceMemberRole;
  created_at: string;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  role: WorkspaceMemberRole;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  dev_number: string;
  product_name: string;
  category: string | null;
  customer_market_country: string | null;
  responsible_id: string | null;
  project_image_id: string | null;
  status: ProjectStatus;
  description: string | null;
  technical_data: Record<string, unknown>;
  functions: string | null;
  materials: string | null;
  target_price: number | null;
  open_points: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles_responsible?: Profile | null;
  profiles_created_by?: Profile | null;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export interface Invite {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  token: string;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  profiles?: Profile | null;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  responsible_id: string | null;
  priority: TaskPriority;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles_responsible?: Profile | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  change_summary: string;
  changes: Record<string, unknown>;
  created_at: string;
  profiles?: Profile | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  projektleitung: "Projektleitung",
  entwicklung: "Entwicklung",
  einkauf: "Einkauf",
  vertrieb: "Vertrieb",
  externer_partner: "Externer Partner",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idee: "Idee",
  konzept: "Konzept",
  entwicklung: "In Entwicklung",
  muster: "Muster",
  freigabe: "Freigabe",
  abgeschlossen: "Abgeschlossen",
  archiviert: "Archiviert",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
  dringend: "Dringend",
};
