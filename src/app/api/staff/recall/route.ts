import { NextRequest, NextResponse } from "next/server";
import { requireStaffAuth } from "@/lib/auth";
import { getTicketById, updateTicketStatus } from "@/lib/queries";

export async function POST(req: NextRequest) {
  if (!(await requireStaffAuth())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticket_id } = body;

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "skipped") {
      return NextResponse.json(
        {
          error: "invalid_action",
          message: "Only SKIPPED tickets can be recalled.",
        },
        { status: 409 }
      );
    }

    await updateTicketStatus(ticket_id, "waiting", null);

    return NextResponse.json({ message: "ticket recalled to waiting" });
  } catch (error) {
    console.error("Staff recall error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
