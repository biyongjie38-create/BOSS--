import { createClient } from "@supabase/supabase-js";

import { AppError } from "./errors";
import type { AnalysisResult, QuotePayload } from "./types";

export async function saveAnalysisRecord(
  symbol: string,
  quote: QuotePayload,
  analysis: AnalysisResult
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new AppError("SUPABASE_SAVE_ERROR", "Missing Supabase environment variables.", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { error } = await supabase.from("analysis_records").insert({
    symbol,
    quote_json: quote,
    ai_json: analysis
  });

  if (error) {
    throw new AppError("SUPABASE_SAVE_ERROR", "Supabase insert failed.", 502);
  }
}
