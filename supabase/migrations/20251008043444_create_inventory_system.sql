-- 1. Cria a tabela para armazenar os itens do estoque
create table if not exists public.inventory_items (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    quantity integer not null default 0,
    unit text, -- ex: 'unidades', 'caixas', 'ml'
    alert_level integer not null default 10, -- Nível para emitir alerta de baixo estoque
    supplier text,
    last_updated_by uuid references auth.users(id)
);

-- 2. Habilita a segurança de nível de linha (RLS)
alter table public.inventory_items enable row level security;

-- 3. Cria políticas de acesso
-- Permite que usuários autenticados leiam todos os itens
create policy "Allow authenticated read access" on public.inventory_items
for select to authenticated using (true);

-- Permite que administradores e técnicos criem, atualizem e deletem itens
create policy "Allow full access for admins and techs" on public.inventory_items
for all to authenticated using (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
) with check (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
);
