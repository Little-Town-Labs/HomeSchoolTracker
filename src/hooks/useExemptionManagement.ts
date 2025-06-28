import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ExemptionManagementResult {
  updateExemption: (
    userId: string,
    exemptStatus: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export function useExemptionManagement(): ExemptionManagementResult {
  const [isLoading, setIsLoading] = useState(false);

  const updateExemption = async (
    userId: string,
    exemptStatus: boolean,
  ): Promise<{ success: boolean; error?: string }> => {
    // Get current session token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return { success: false, error: "No authentication token available" };
    }

    setIsLoading(true);
    try {
      // Call the Netlify edge function to update exemption status
      const response = await fetch(
        "/.netlify/functions/admin-manage-exemption",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId,
            exemptStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to update exemption status",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating exemption status:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateExemption,
    isLoading,
  };
}
