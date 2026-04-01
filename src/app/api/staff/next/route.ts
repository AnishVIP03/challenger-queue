import { NextRequest, NextResponse } from "next/server";
import { requireStaffAuth } from "@/lib/auth";
import {
  getActiveTicketForCounter,
  getNextWaitingTicket,
  updateTicketStatus,
} from "@/lib/queries";

export async function POST(req: NextRequest) {
  if (!(await requireStaffAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { counter_no, category } = body;

    if (![1, 2, 3].includes(counter_no)) {
      return NextResponse.json(
        { error: "counter_no must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    // Check if counter is already serving someone
    const active = await getActiveTicketForCounter(counter_no);
    if (active) {
      return NextResponse.json(
        {
          error: "counter_busy",
          message:
            "This counter is already serving a customer. Please mark DONE or SKIP before calling next.",
          active_ticket: {
            id: active.id,
            queue_number: active.queue_number,
            category: active.category,
            counter_no: active.counter_no,
            status: active.status,
            email: active.email,
          },
        },
        { status: 409 }
      );
    }

    const ticket = await getNextWaitingTicket(category);
    if (!ticket) {
      return NextResponse.json({ message: "no waiting tickets" });
    }

    const updated = await updateTicketStatus(ticket.id, "serving", counter_no);

    return NextResponse.json({
      id: updated.id,
      queue_number: updated.queue_number,
      category: updated.category,
      counter_no: updated.counter_no,
      status: updated.status,
      email: updated.email,
    });
  } catch (error) {
    console.error("Staff next error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
