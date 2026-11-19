import { NextResponse } from "next/server";
import { saveSupportRequest } from "@/lib/support";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    message?: string;
    source?: string;
  };

  let firstName = String(body.firstName || "").trim();
  let lastName = String(body.lastName || "").trim();
  if ((!firstName || !lastName) && body.name) {
    const parts = String(body.name).trim().split(/\s+/);
    firstName = firstName || parts[0] || "";
    lastName = lastName || parts.slice(1).join(" ") || firstName;
  }

  const saved = await saveSupportRequest({
    firstName,
    lastName,
    email: String(body.email || ""),
    message: String(body.message || ""),
    source: body.source === "page" ? "page" : "widget",
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }
  return NextResponse.json(
    {
      id: saved.request.id,
      mail: saved.mail,
    },
    { status: 201 },
  );
}
