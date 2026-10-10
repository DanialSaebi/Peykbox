"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type InstallStatus = { installed: boolean; name: string | null };

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<InstallStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/setup/status/", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Backend is not ready.");
        return response.json() as Promise<InstallStatus>;
      })
      .then((result) => {
        if (!result.installed) router.replace("/setup");
        else setStatus(result);
      })
      .catch(() => setError("Cannot reach the API. Check: docker compose ps"));
  }, [router]);

  return (
    <main className="page-shell">
      <section className="card home-card">
        <div className="brand"><span className="brand-icon">✉</span> Peykbox <span className="tag">0.1.0</span></div>
        {error ? <div className="notice error">{error}</div> : !status ? (
          <p className="muted">Checking installation status…</p>
        ) : (
          <>
            <span className="checkmark">✓</span>
            <h1>{status.name} is ready.</h1>
            <p className="muted">The instance has been initialized, and your owner account was created successfully.</p>
            <div className="notice">This is milestone 1: infrastructure and installation wizard. SMTP, IMAP, authentication, and the mailbox dashboard arrive in upcoming milestones.</div>
          </>
        )}
      </section>
    </main>
  );
}
