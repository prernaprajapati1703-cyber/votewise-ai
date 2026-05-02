
-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_idx on public.conversations(user_id, updated_at desc);
alter table public.conversations enable row level security;

create policy "Users view own conversations" on public.conversations
  for select using (auth.uid() = user_id);
create policy "Users insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.conversations
  for update using (auth.uid() = user_id);
create policy "Users delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages(conversation_id, created_at);
alter table public.messages enable row level security;

create policy "Users view own messages" on public.messages
  for select using (auth.uid() = user_id);
create policy "Users insert own messages" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "Users delete own messages" on public.messages
  for delete using (auth.uid() = user_id);

-- Quiz attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  created_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts(user_id, created_at desc);
alter table public.quiz_attempts enable row level security;

create policy "Users view own attempts" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "Users insert own attempts" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);
create policy "Users delete own attempts" on public.quiz_attempts
  for delete using (auth.uid() = user_id);
