"use client";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="card p-8 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Creative Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted-text)" }}>パスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="px-4 py-3 rounded-lg text-sm w-full"
            style={{
              background: "#0f0f13",
              border: `1px solid ${error ? "#ff6584" : "var(--card-border)"}`,
              color: "var(--foreground)",
            }}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: "#ff6584" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading || !password ? "var(--muted)" : "var(--accent)",
              color: "#fff",
              cursor: loading || !password ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
