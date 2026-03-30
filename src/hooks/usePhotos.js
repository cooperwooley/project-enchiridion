import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

export function usePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("date", { ascending: true });
    setPhotos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();

    // Real-time subscription (requires Realtime enabled on the table in Supabase dashboard)
    const channel = supabase
      .channel("photos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos" },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { photos, loading, refetch };
}
