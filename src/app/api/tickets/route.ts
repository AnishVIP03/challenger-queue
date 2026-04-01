import { NextRequest, NextResponse } from "next/server";
import { createTicket, countPeopleAhead } from "@/lib/queries";
import { canSendEmailToday, sendEmail } from "@/lib/email";
import { CATEGORIES, Category } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, email } = body;

    if (!category || !email) {
      return NextResponse.json(
        { error: "category and email are required" },
        { status: 400 }
      );
    }

    const trimmedCategory = (category as string).trim() as Category;
    const trimmedEmail = (email as string).trim().toLowerCase();

    if (!CATEGORIES.includes(trimmedCategory)) {
      return NextResponse.json({ error: "invalid category" }, { status: 400 });
    }

    if (
      trimmedEmail.length > 254 ||
      !trimmedEmail.includes("@") ||
      !trimmedEmail.split("@").pop()?.includes(".")
    ) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }

    const ticket = await createTicket(trimmedCategory, trimmedEmail);
    const peopleInFront = await countPeopleAhead(ticket.created_at);

    let emailSent = false;
    let emailMessage = "";

    if (await canSendEmailToday()) {
      const subject = `Your queue number: ${ticket.queue_number}`;
      const bodyText = [
        "Thank you for checking in at Challenger.",
        `Service type: ${trimmedCategory}`,
        `Your queue number is: ${ticket.queue_number}`,
        `People ahead of you in the queue: ${peopleInFront}`,
        "",
        "You will see your number and counter on the display when it is your turn.",
        "Please listen for the chime and watch the TV display.",
      ].join("\n");

      emailSent = await sendEmail(trimmedEmail, subject, bodyText);
      emailMessage = emailSent
        ? "Email sent with your queue number."
        : "Tried to send email, but there was an error.";
    } else {
      emailMessage =
        "Email limit reached for today. Please take a photo of your queue number and wait for it to be called.";
    }

    return NextResponse.json({
      id: ticket.id,
      queue_number: ticket.queue_number,
      category: ticket.category,
      email: ticket.email,
      status: ticket.status,
      people_in_front: peopleInFront,
      email_sent: emailSent,
      email_message: emailMessage,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
