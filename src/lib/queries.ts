import { createServerClient } from "./supabase/server";
import { Category, CATEGORY_PREFIX, Ticket, TicketStatus } from "./types";

// ─── Queue Number Generation ─────────────────────────
export async function generateQueueNumber(category: Category): Promise<string> {
  const supabase = createServerClient();
  const prefix = CATEGORY_PREFIX[category] || "Q";

  const { data } = await supabase
    .from("tickets")
    .select("queue_number")
    .like("queue_number", `${prefix}%`)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  let lastNum = 0;
  if (data?.queue_number) {
    const numPart = data.queue_number.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) lastNum = parsed;
  }

  const newNum = lastNum + 1;
  return `${prefix}${String(newNum).padStart(3, "0")}`;
}

// ─── Create Ticket ───────────────────────────────────
export async function createTicket(
  category: Category,
  email: string
): Promise<Ticket> {
  const supabase = createServerClient();
  const queueNumber = await generateQueueNumber(category);

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      queue_number: queueNumber,
      category,
      email,
      status: "waiting" as TicketStatus,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Ticket;
}

// ─── Count People Ahead ──────────────────────────────
export async function countPeopleAhead(createdAt: string): Promise<number> {
  const supabase = createServerClient();

  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "waiting")
    .lt("created_at", createdAt);

  return count ?? 0;
}

// ─── Get Active Ticket for Counter ───────────────────
export async function getActiveTicketForCounter(
  counterNo: number
): Promise<Ticket | null> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("status", "serving")
    .eq("counter_no", counterNo)
    .limit(1)
    .single();

  return (data as Ticket) || null;
}

// ─── Get Next Waiting Ticket ─────────────────────────
export async function getNextWaitingTicket(
  categoryFilter?: string
): Promise<Ticket | null> {
  const supabase = createServerClient();

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(1);

  if (categoryFilter && categoryFilter !== "All") {
    query = query.eq("category", categoryFilter);
  }

  const { data } = await query.single();
  return (data as Ticket) || null;
}

// ─── Update Ticket Status ────────────────────────────
export async function updateTicketStatus(
  ticketId: number,
  status: TicketStatus,
  counterNo?: number | null
): Promise<Ticket> {
  const supabase = createServerClient();

  const update: Record<string, unknown> = { status };
  if (counterNo !== undefined) update.counter_no = counterNo;

  const { data, error } = await supabase
    .from("tickets")
    .update(update)
    .eq("id", ticketId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Ticket;
}

// ─── Get Ticket By ID ────────────────────────────────
export async function getTicketById(id: number): Promise<Ticket | null> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  return (data as Ticket) || null;
}

// ─── Display Data ────────────────────────────────────
export async function getDisplayData() {
  const supabase = createServerClient();

  const [servingRes, nextRes, skippedRes, historyRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, queue_number, category, status, counter_no")
      .eq("status", "serving")
      .order("counter_no", { ascending: true }),

    supabase
      .from("tickets")
      .select("id, queue_number, category, status, counter_no")
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(10),

    supabase
      .from("tickets")
      .select("id, queue_number, category, status, counter_no")
      .eq("status", "skipped")
      .order("created_at", { ascending: true })
      .limit(10),

    supabase
      .from("tickets")
      .select("id, queue_number, category, status, counter_no")
      .in("status", ["serving", "done", "skipped"])
      .order("id", { ascending: false })
      .limit(15),
  ]);

  return {
    serving: servingRes.data || [],
    next: nextRes.data || [],
    skipped: skippedRes.data || [],
    history: historyRes.data || [],
  };
}
