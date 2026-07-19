"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../components/auth-provider";

export default function HomePage() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    router.replace(
      user
        ? "/dashboard"
        : "/login",
    );
  }, [loading, user, router]);

  return (
    <main className="min-h-screen bg-white" />
  );
}