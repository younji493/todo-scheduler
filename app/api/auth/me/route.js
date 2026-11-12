import { requireUser, publicUser, apiError } from "../../../../features/auth/serverAuth.js";
export async function GET() {
  try {
    const { user } = await requireUser();
    return Response.json({ user: publicUser(user) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
