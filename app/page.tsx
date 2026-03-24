import Dashboard from "@/components/Dashboard";
import { promises as fs } from "fs";
import path from "path";

interface WeekEntry {
  id: string;
  label: string;
  file?: string;
  mediaFile?: string;
}

async function getWeeks(): Promise<WeekEntry[]> {
  const indexPath = path.join(process.cwd(), "public", "data", "index.json");
  const raw = await fs.readFile(indexPath, "utf-8");
  return JSON.parse(raw);
}

export default async function DashboardPage() {
  const weeks = await getWeeks();

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--background)" }}>
      <Dashboard weeks={weeks} />
    </main>
  );
}
