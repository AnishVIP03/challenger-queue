import { NextRequest, NextResponse } from "next/server";
import { requireStaffAuth } from "@/lib/auth";
import { getTicketById, updateTicketStatus } from "@/lib/queries";

export async function POST(req: NextRequest) {
  if (!(await requireStaffAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticket_id, counter_no } = body;

    if (![1, 2, 3].includes(counter_no)) {
      return NextResponse.json(
        { error: "counter_no must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "serving" || ticket.counter_no !== counter_no) {
      return NextResponse.json(
        {
          error: "invalid_action",
          message:
            "You can only mark DONE for the ticket your counter is currently serving.",
        },
        { status: 409 }
      );
    }

    await updateTicketStatus(ticket_id, "done");

    return NextResponse.json({ message: "ticket completed" });
  } catch (error) {
    console.error("Staff done error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
