create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text not null,
  redirect_uris jsonb not null,
  grant_types jsonb not null,
  response_types jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.oauth_clients is 'Dynamic OAuth client registrations for MCP clients.';
