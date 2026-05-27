"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../components/auth-provider";

export function useProtectedRoute() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login/signup");
    }
  }, [loading, user, router]);

  return {
    user,
    loading,
  };
}