-- 1. Cria uma função helper robusta para obter a função (role) do usuário atual.
-- Esta versão busca a informação diretamente da tabela de usuários, em vez de depender do token.
create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
as $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid()
$$;

-- 2. Refatora TODAS as políticas de segurança para usar a nova função robusta.

-- Tabela 'inventory_items'
drop policy if exists "Allow full access for admins and techs" on public.inventory_items;
create policy "Allow full access for admins and techs" on public.inventory_items
for all to authenticated using (
    get_current_user_role() in ('administrador', 'tecnico')
) with check (
    get_current_user_role() in ('administrador', 'tecnico')
);

-- Tabela 'exam_results'
drop policy if exists "Allow full access for admins and techs on exam_results" on public.exam_results;
create policy "Allow full access for admins and techs on exam_results" on public.exam_results
for all to authenticated using (
    get_current_user_role() in ('administrador', 'tecnico')
) with check (
    get_current_user_role() in ('administrador', 'tecnico')
);

-- Tabela 'appointment_services'
drop policy if exists "Allow full access for admins and techs on appointment_services" on public.appointment_services;
create policy "Allow full access for admins and techs on appointment_services" on public.appointment_services
for all to authenticated using (
    get_current_user_role() in ('administrador', 'tecnico')
) with check (
    get_current_user_role() in ('administrador', 'tecnico')
);

-- 3. Garante que as permissões de leitura básicas continuem existindo.
grant execute on function public.get_current_user_role() to authenticated;
