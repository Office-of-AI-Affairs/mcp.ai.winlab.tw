import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

function success(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ success: true, data }),
      },
    ],
  };
}

function error(message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ success: false, error: message }),
      },
    ],
    isError: true,
  };
}

export function registerProfileTools(
  server: McpServer,
  supabase: SupabaseClient,
  userId: string
) {
  // --- get_my_profile ---
  server.tool("get_my_profile", {}, async () => {
    const { data, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (dbError) {
      return error(dbError.message);
    }

    return success(data);
  });

  // --- update_my_profile ---
  server.tool(
    "update_my_profile",
    {
      display_name: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
      facebook: z.string().optional(),
    },
    async ({ display_name, bio, phone, linkedin, github, website, facebook }) => {
      const updates: Record<string, unknown> = {};

      if (display_name !== undefined) updates.display_name = display_name;
      if (bio !== undefined) updates.bio = bio;
      if (phone !== undefined) updates.phone = phone;
      if (linkedin !== undefined) updates.linkedin = linkedin;
      if (github !== undefined) updates.github = github;
      if (website !== undefined) updates.website = website;
      if (facebook !== undefined) updates.facebook = facebook;

      if (Object.keys(updates).length === 0) {
        return error("No fields to update");
      }

      const { data, error: dbError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- list_profiles ---
  server.tool(
    "list_profiles",
    {
      role: z.enum(["admin", "user"]).optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().optional(),
    },
    async ({ role, limit, offset }) => {
      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role, created_at")
        .order("created_at", { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

      if (role) {
        query = query.eq("role", role);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );
}
