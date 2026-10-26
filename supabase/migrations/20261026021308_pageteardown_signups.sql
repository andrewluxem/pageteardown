-- Signups from Page Teardown's Watchlist waitlist form. Written only by the
-- pageteardown-signup edge function with the service role; anon and
-- authenticated get no access, and RLS has no policies.
--
-- Kept apart from inboxteardown_signups and socialteardown_signups on purpose,
-- so the sites' lists never share a table; list = 'page-watchlist' marks each
-- row as well. email is text kept lowercase rather than citext, as in those
-- tables: citext is not installed on this shared project, and this migration
-- creates only pageteardown objects. The check plus the unique constraint give
-- a case-insensitive dedupe.

create table public.pageteardown_signups (
  id bigint generated always as identity primary key,
  email text not null
    constraint pageteardown_signups_email_lower check (email = lower(email))
    constraint pageteardown_signups_email_length check (char_length(email) between 3 and 254),
  list text not null
    constraint pageteardown_signups_list_check check (list in ('page-watchlist')),
  source_page text,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint pageteardown_signups_email_list_key unique (email, list)
);

alter table public.pageteardown_signups enable row level security;

revoke all on table public.pageteardown_signups from anon, authenticated;
revoke all on sequence public.pageteardown_signups_id_seq from anon, authenticated;
