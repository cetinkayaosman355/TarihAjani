-- Canlı sohbet mesajları — erişim yalnız "chat" edge fonksiyonu üzerinden
-- (RLS açık, anon politika bilinçli olarak YOK; service role her şeyi görür)
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  thread text not null,
  sender text not null default 'ziyaretci',   -- ziyaretci | ajan
  name text not null default '',
  email text not null default '',
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread, id);
alter table public.chat_messages enable row level security;
