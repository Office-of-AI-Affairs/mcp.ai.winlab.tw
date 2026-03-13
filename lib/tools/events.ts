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

export function registerEventTools(
  server: McpServer,
  supabase: SupabaseClient
) {
  // --- list_events ---
  server.tool(
    "list_events",
    {
      status: z.enum(["draft", "published"]).optional(),
      pinned: z.boolean().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().optional(),
    },
    async ({ status, pinned, limit, offset }) => {
      let query = supabase
        .from("events")
        .select("*")
        .order("sort_order", { ascending: true })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

      if (status) {
        query = query.eq("status", status);
      }

      if (pinned !== undefined) {
        query = query.eq("pinned", pinned);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- get_event ---
  server.tool(
    "get_event",
    {
      id: z.string().uuid().optional(),
      slug: z.string().optional(),
    },
    async ({ id, slug }) => {
      if (!id && !slug) {
        return error("Must provide either id or slug");
      }

      let query = supabase.from("events").select("*");

      if (id) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", slug!);
      }

      const { data, error: dbError } = await query.single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- create_event ---
  server.tool(
    "create_event",
    {
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      cover_image: z.string().optional(),
      status: z.enum(["draft", "published"]).optional(),
      pinned: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ name, slug, description, cover_image, status, pinned, sort_order }) => {
      const { data, error: dbError } = await supabase
        .from("events")
        .insert({
          name,
          slug,
          description: description ?? null,
          cover_image: cover_image ?? null,
          status: status ?? "draft",
          pinned: pinned ?? false,
          sort_order: sort_order ?? 0,
        })
        .select()
        .single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- update_event ---
  server.tool(
    "update_event",
    {
      id: z.string().uuid(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      cover_image: z.string().optional(),
      status: z.enum(["draft", "published"]).optional(),
      pinned: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ id, name, slug, description, cover_image, status, pinned, sort_order }) => {
      const updates: Record<string, unknown> = {};

      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (cover_image !== undefined) updates.cover_image = cover_image;
      if (status !== undefined) updates.status = status;
      if (pinned !== undefined) updates.pinned = pinned;
      if (sort_order !== undefined) updates.sort_order = sort_order;

      if (Object.keys(updates).length === 0) {
        return error("No fields to update");
      }

      const { data, error: dbError } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );
}
