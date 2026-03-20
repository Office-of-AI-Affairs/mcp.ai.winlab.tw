import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  normalizeApplicationMethod,
  resolveRecruitmentLink,
} from "@/lib/recruitment-links";

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

const positionSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
  type: z.enum(["full_time", "internship", "part_time", "remote"]),
  count: z.number().int().positive(),
  salary: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  nice_to_have: z.string().optional(),
});

const applicationMethodLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const applicationMethodSchema = z.object({
  email: z.string().optional(),
  url: z.string().optional(),
  links: z.array(applicationMethodLinkSchema).optional(),
  other: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export function registerRecruitmentTools(
  server: McpServer,
  supabase: SupabaseClient
) {
  // --- list_recruitments ---
  server.tool(
    "list_recruitments",
    {
      event_id: z.string().uuid().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().optional(),
    },
    async ({ event_id, limit, offset }) => {
      let query = supabase
        .from("competitions")
        .select(
          "id, title, link, image, start_date, end_date, event_id, created_at"
        )
        .order("created_at", { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

      if (event_id) {
        query = query.eq("event_id", event_id);
      } else {
        query = query.is("event_id", null);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- get_recruitment ---
  server.tool(
    "get_recruitment",
    {
      id: z.string().uuid(),
    },
    async ({ id }) => {
      const { data, error: dbError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- create_recruitment ---
  server.tool(
    "create_recruitment",
    {
      title: z.string(),
      link: z.string().optional(),
      image: z.string().optional(),
      company_description: z.string().optional(),
      start_date: z.string(),
      end_date: z.string().optional(),
      positions: z.array(positionSchema).optional(),
      application_method: applicationMethodSchema.optional(),
      contact: contactSchema.optional(),
      required_documents: z.string().optional(),
      event_id: z.string().uuid().optional(),
    },
    async ({
      title,
      link,
      image,
      company_description,
      start_date,
      end_date,
      positions,
      application_method,
      contact,
      required_documents,
      event_id,
    }) => {
      const normalizedApplicationMethod =
        normalizeApplicationMethod(application_method) ?? null;

      const { data, error: dbError } = await supabase
        .from("competitions")
        .insert({
          title,
          link: resolveRecruitmentLink(link, normalizedApplicationMethod),
          image: image ?? null,
          company_description: company_description ?? null,
          start_date,
          end_date: end_date ?? null,
          positions: positions ?? null,
          application_method: normalizedApplicationMethod,
          contact: contact ?? null,
          required_documents: required_documents ?? null,
          event_id: event_id ?? null,
        })
        .select()
        .single();

      if (dbError) {
        return error(dbError.message);
      }

      return success(data);
    }
  );

  // --- update_recruitment ---
  server.tool(
    "update_recruitment",
    {
      id: z.string().uuid(),
      title: z.string().optional(),
      link: z.string().optional(),
      image: z.string().optional(),
      company_description: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      positions: z.array(positionSchema).optional(),
      application_method: applicationMethodSchema.optional(),
      contact: contactSchema.optional(),
      required_documents: z.string().optional(),
      event_id: z.string().uuid().optional(),
    },
    async ({
      id,
      title,
      link,
      image,
      company_description,
      start_date,
      end_date,
      positions,
      application_method,
      contact,
      required_documents,
      event_id,
    }) => {
      const updates: Record<string, unknown> = {};
      const normalizedApplicationMethod =
        application_method !== undefined
          ? normalizeApplicationMethod(application_method)
          : undefined;

      if (title !== undefined) updates.title = title;
      if (image !== undefined) updates.image = image;
      if (company_description !== undefined)
        updates.company_description = company_description;
      if (start_date !== undefined) updates.start_date = start_date;
      if (end_date !== undefined) updates.end_date = end_date;
      if (positions !== undefined) updates.positions = positions;
      if (application_method !== undefined)
        updates.application_method = normalizedApplicationMethod;
      if (link !== undefined || normalizedApplicationMethod !== undefined) {
        updates.link = resolveRecruitmentLink(link, normalizedApplicationMethod ?? null);
      }
      if (contact !== undefined) updates.contact = contact;
      if (required_documents !== undefined)
        updates.required_documents = required_documents;
      if (event_id !== undefined) updates.event_id = event_id;

      if (Object.keys(updates).length === 0) {
        return error("No fields to update");
      }

      const { data, error: dbError } = await supabase
        .from("competitions")
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
