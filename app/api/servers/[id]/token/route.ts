import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id: serverId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: server, error } = await admin
    .from("servers")
    .select("id,owner_user_id,auth_token")
    .eq("id", serverId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!server) {
    return NextResponse.json({ ok: false, error: "server_not_found" }, { status: 404 });
  }

  if (server.owner_user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "not_owner" }, { status: 403 });
  }

  if (!server.auth_token) {
    return NextResponse.json(
      { ok: false, error: "token_not_available", message: "Token was not stored for this server. Re-link the server to store the token." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, token: server.auth_token });
}
