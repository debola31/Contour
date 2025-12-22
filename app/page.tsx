"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await fetch("/api/example_name");
        if (!response.ok) {
          throw new Error("Failed to fetch name");
        }
        const data = await response.json();
        setName(data.data.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchName();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            {loading && "Loading..."}
            {error && `Error: ${error}`}
            {!loading && !error && name && `Hello ${name}`}
          </h1>
        </div>
      </main>
    </div>
  );
}
