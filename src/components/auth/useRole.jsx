import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // While loading, assume admin to avoid flicker on admin accounts
  const isAdmin = loading ? true : user?.role === "admin";

  return { user, isAdmin, loading };
}