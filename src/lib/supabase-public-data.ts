import type { Tables } from "@/types/supabase";

type OfficialCompetitionRow = Tables<"official_competitions">;
type OfficialSourceLinkRow = Tables<"official_source_links">;

type OfficialCompetitionResponse = Pick<
  OfficialCompetitionRow,
  | "slug"
  | "name"
  | "status"
  | "start_date"
  | "end_date"
  | "location_city"
  | "location_country"
  | "official_source_url"
  | "live_source_url"
> & {
  official_source_links?: Array<
    Pick<
      OfficialSourceLinkRow,
      "label" | "url" | "source_kind" | "extraction_policy" | "automated_ingestion_allowed"
    >
  >;
};

export type OfficialCompetitionSnapshot =
  | {
      state: "connected";
      competition: OfficialCompetitionResponse;
    }
  | {
      state: "missing-env";
      message: string;
    }
  | {
      state: "error";
      message: string;
    };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function getOfficialCompetitionSnapshot(slug: string): Promise<OfficialCompetitionSnapshot> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return {
      state: "missing-env",
      message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to read live source rows.",
    };
  }

  const endpoint = new URL("/rest/v1/official_competitions", SUPABASE_URL);
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set(
    "select",
    [
      "slug",
      "name",
      "status",
      "start_date",
      "end_date",
      "location_city",
      "location_country",
      "official_source_url",
      "live_source_url",
      "official_source_links(label,url,source_kind,extraction_policy,automated_ingestion_allowed)",
    ].join(","),
  );

  const headers: HeadersInit = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };

  if (SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  }

  try {
    const response = await fetch(endpoint, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        state: "error",
        message: `Supabase returned ${response.status} while reading the official competition snapshot.`,
      };
    }

    const rows = (await response.json()) as OfficialCompetitionResponse[];
    const competition = rows[0];

    if (!competition) {
      return {
        state: "error",
        message: "No official competition row was returned for the 2026 trial slug.",
      };
    }

    return {
      state: "connected",
      competition,
    };
  } catch (error) {
    return {
      state: "error",
      message:
        error instanceof Error && error.message.includes("fetch")
          ? "Could not reach the Supabase Data API from this environment."
          : "The Supabase Data API check is unavailable right now.",
    };
  }
}
