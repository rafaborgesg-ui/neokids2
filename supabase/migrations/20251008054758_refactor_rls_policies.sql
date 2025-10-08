-- 1. Cria uma função helper para obter a função (role) do usuário atual de forma eficiente.
create or replace function public.get_my_role()
returns text
language sql
stable
as $$
  select auth.jwt()->>'user_role'
$$;

-- 2. Refatora as políticas da tabela 'inventory_items' para usar a nova função.
drop policy if exists "Allow authenticated read access" on public.inventory_items;
create policy "Allow authenticated read access" on public.inventory_items
for select to authenticated using (true);

drop policy if exists "Allow full access for admins and techs" on public.inventory_items;
create policy "Allow full access for admins and techs" on public.inventory_items
for all to authenticated using (
    get_my_role() in ('administrador', 'tecnico')
) with check (
    get_my_role() in ('administrador', 'tecnico')
);

-- 3. Refatora as políticas da tabela 'exam_results'.
drop policy if exists "Allow authenticated read access on exam_results" on public.exam_results;
create policy "Allow authenticated read access on exam_results" on public.exam_results
for select to authenticated using (true);

drop policy if exists "Allow full access for admins and techs on exam_results" on public.exam_results;
create policy "Allow full access for admins and techs on exam_results" on public.exam_results
for all to authenticated using (
    get_my_role() in ('administrador', 'tecnico')
) with check (
    get_my_role() in ('administrador', 'tecnico')
);

-- 4. Refatora as políticas da tabela 'appointment_services'.
drop policy if exists "Allow authenticated read on appointment_services" on public.appointment_services;
create policy "Allow authenticated read on appointment_services" on public.appointment_services
for select to authenticated using (true);

drop policy if exists "Allow full access for admins and techs on appointment_services" on public.appointment_services;
create policy "Allow full access for admins and techs on appointment_services" on public.appointment_services
for all to authenticated using (
    get_my_role() in ('administrador', 'tecnico')
) with check (
    get_my_role() in ('administrador', 'tecnico')
);
