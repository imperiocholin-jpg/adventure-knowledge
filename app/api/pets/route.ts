import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabase/server"

export const revalidate = 60

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          table: "pets",
          error: { message: "Missing Supabase server environment variables." },
          data: [],
        },
        { status: 503 },
      )
    }

    const { data, error } = await supabase.from("pets").select("*")

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          table: "pets",
          error: {
            message: error.message,
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          },
          data: [],
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        ok: false,
        source: "server",
        table: "pets",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
        data: [],
      },
      { status: 503 },
    )
  }
}
