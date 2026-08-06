-- ============================================================
-- OmniSupport AI — Supabase Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  email       text,
  job_title   text default 'Support Agent',
  department  text default 'Enterprise Solutions',
  role        text default 'agent' check (role in ('agent', 'admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Tickets ───────────────────────────────────────────────────────────────────
create table if not exists public.tickets (
  id               uuid default uuid_generate_v4() primary key,
  subject          text not null,
  description      text,
  category         text default 'Technical Support',
  product_module   text default 'Core Platform',
  status           text default 'Open'
                     check (status in ('Open', 'In Progress', 'On Hold', 'Resolved', 'Closed')),
  priority         text default 'Medium'
                     check (priority in ('Critical', 'High', 'Medium', 'Low')),
  ai_priority      text check (ai_priority in ('Critical', 'High', 'Medium', 'Low')),
  confidence_score numeric(5,2) default 0,
  customer_name    text,
  customer_email   text,
  assigned_to      uuid references public.profiles(id),
  attachments      jsonb default '[]',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.tickets enable row level security;

-- All authenticated users can read tickets
create policy "Authenticated users can read tickets"
  on public.tickets for select to authenticated using (true);

-- All authenticated users can create tickets
create policy "Authenticated users can create tickets"
  on public.tickets for insert to authenticated with check (true);

-- All authenticated users can update tickets
create policy "Authenticated users can update tickets"
  on public.tickets for update to authenticated using (true);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.update_updated_at();


-- ── Ticket Activities ─────────────────────────────────────────────────────────
create table if not exists public.ticket_activities (
  id          uuid default uuid_generate_v4() primary key,
  ticket_id   uuid references public.tickets(id) on delete cascade not null,
  type        text default 'message'
                check (type in ('message', 'internal_note', 'status_change', 'assignment')),
  author      text not null,
  author_role text default 'agent',
  content     text not null,
  created_at  timestamptz default now()
);

alter table public.ticket_activities enable row level security;

create policy "Authenticated users can read activities"
  on public.ticket_activities for select to authenticated using (true);

create policy "Authenticated users can create activities"
  on public.ticket_activities for insert to authenticated with check (true);


-- ── Training Logs ─────────────────────────────────────────────────────────────
create table if not exists public.training_logs (
  id              uuid default uuid_generate_v4() primary key,
  model_id        text not null,
  date            text not null,
  duration        text not null,
  epochs          integer default 100,
  accuracy_delta  numeric(5,2) default 0,
  accuracy        numeric(5,2) default 0,
  f1_score        numeric(5,4) default 0,
  status          text default 'SUCCESS'
                    check (status in ('SUCCESS', 'ABORTED', 'FAILED', 'RUNNING')),
  notes           text,
  created_at      timestamptz default now()
);

alter table public.training_logs enable row level security;

create policy "Authenticated users can read training logs"
  on public.training_logs for select to authenticated using (true);

create policy "Admins can insert training logs"
  on public.training_logs for insert to authenticated with check (true);


-- ── Seed Data: Sample Tickets ─────────────────────────────────────────────────
insert into public.tickets (subject, description, category, product_module, status, priority, ai_priority, confidence_score, customer_name, customer_email, created_at)
values
  ('API Authentication Failure in Production',
   'We are encountering a critical 403 Forbidden error whenever we attempt to sync our internal service mesh with the OmniSupport production endpoints. This started occurring after the 2.4.0 update last night.',
   'Technical Support', 'Core Platform', 'Open', 'Critical', 'Critical', 94.0,
   'Sarah Jenkins', 'sarah@company.com', now() - interval '2 minutes'),

  ('Subscription Billing Inconsistency',
   'Invoice #2023-991 reflects incorrect seat count. We were billed for 50 seats but our plan shows 35. Please investigate.',
   'Billing', 'Billing Module', 'In Progress', 'High', 'High', 88.5,
   'Michael Torres', 'michael@enterprise.com', now() - interval '45 minutes'),

  ('User Seat Limit Reached Warning',
   'We keep seeing a seat limit warning but we are only at 80% capacity according to our plan details. Waiting for a response.',
   'Account', 'User Management', 'On Hold', 'Medium', 'Medium', 72.3,
   'Priya Sharma', 'priya@startup.io', now() - interval '3 hours'),

  ('Documentation Update for Webhooks',
   'The webhook configuration guide is missing examples for the new v2 signature verification.',
   'Documentation', 'Developer Tools', 'Resolved', 'Low', 'Low', 91.0,
   'James Wilson', 'james@devco.com', now() - interval '1 day')
on conflict do nothing;

-- Seed training logs
insert into public.training_logs (model_id, date, duration, epochs, accuracy_delta, accuracy, f1_score, status)
values
  ('#SBERT-V2-004', 'Oct 24, 2023 09:12 AM', '4h 12m', 150, 2.4, 92.0, 0.9142, 'SUCCESS'),
  ('#SBERT-V2-003', 'Oct 18, 2023 11:45 PM', '3h 58m', 120, -0.8, 89.6, 0.8876, 'ABORTED'),
  ('#SBERT-V2-002', 'Oct 12, 2023 02:22 AM', '5h 05m', 200, 1.1, 90.4, 0.8993, 'SUCCESS')
on conflict do nothing;
