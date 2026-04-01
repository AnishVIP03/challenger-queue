export type TicketStatus = "waiting" | "serving" | "skipped" | "done";

export type Category =
  | "VEW"
  | "Singsaver"
  | "Setup"
  | "Screen Protector"
  | "Others";

export const CATEGORIES: Category[] = [
  "VEW",
  "Singsaver",
  "Setup",
  "Screen Protector",
  "Others",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  VEW: "Extended Warranty",
  Singsaver: "Singsaver",
  Setup: "Setup",
  "Screen Protector": "Screen Protector Installation",
  Others: "Others",
};

export const CATEGORY_PREFIX: Record<Category, string> = {
  VEW: "V",
  Singsaver: "SS",
  Setup: "ST",
  "Screen Protector": "SP",
  Others: "O",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  VEW: "🛡️",
  Singsaver: "💳",
  Setup: "⚙️",
  "Screen Protector": "📱",
  Others: "📋",
};

export interface Ticket {
  id: number;
  queue_number: string;
  category: Category;
  email: string;
  status: TicketStatus;
  counter_no: number | null;
  created_at: string;
}

export interface DisplayData {
  serving: Ticket[];
  next: Ticket[];
  skipped: Ticket[];
  history: Ticket[];
}
