import nodemailer from "nodemailer";
import { createServerClient } from "./supabase/server";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 7000,
});

export async function canSendEmailToday(): Promise<boolean> {
  const limit = parseInt(process.env.EMAIL_DAILY_LIMIT || "250");
  const supabase = createServerClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  return (count ?? 0) < limit;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[EMAIL SKIP] Missing SMTP_USER / SMTP_PASS; would send to:", to);
    return false;
  }

  if (!to) {
    console.log("[EMAIL SKIP] Empty recipient.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    console.log(`[EMAIL OK] To=${to} Subject=${subject}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] To=${to} Subject=${subject} Error=`, error);
    return false;
  }
}
