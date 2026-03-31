import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED = /^[a-zA-Z0-9._-]+\.json$/;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const { file: raw } = await context.params;
  const file = decodeURIComponent(raw);

  if (!ALLOWED.test(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const token = req.cookies.get("dashboard_auth")?.value;
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || token !== expected) {
    return unauthorized();
  }

  const filePath = path.join(process.cwd(), "private-data", file);
  const resolved = path.resolve(filePath);
  const base = path.resolve(process.cwd(), "private-data");
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const rawJson = await fs.readFile(filePath, "utf-8");
    JSON.parse(rawJson);
    return new NextResponse(rawJson, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
