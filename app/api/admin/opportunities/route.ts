import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const verified = req.nextUrl.searchParams.get("verified") === "true";
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("is_verified", verified)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !body.registration_url) {
    return NextResponse.json({ error: "title and registration_url are required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      ...body,
      is_verified: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
