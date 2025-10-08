-- 1. Cria a tabela para o histórico detalhado de resultados
create table if not exists public.exam_results (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    appointment_id uuid not null references public.appointments(id) on delete cascade,
    service_id uuid not null references public.services(id) on delete cascade,
    patient_id uuid not null references public.patients(id) on delete cascade,
    result_data jsonb,
    notes text,
    status text default 'pending', -- pending, final, corrected
    issued_at timestamp with time zone,
    created_by uuid references auth.users(id),
    unique (appointment_id, service_id) -- Garante que só haja um resultado por serviço em um atendimento
);

-- 2. Adiciona colunas à tabela de junção para acesso rápido
alter table public.appointment_services
add column if not exists result_data jsonb,
add column if not exists notes text;

-- 3. Habilita RLS para a nova tabela
alter table public.exam_results enable row level security;

-- 4. Cria políticas de acesso para a tabela de resultados
create policy "Allow authenticated read access on exam_results" on public.exam_results
for select to authenticated using (true);

create policy "Allow full access for admins and techs on exam_results" on public.exam_results
for all to authenticated using (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
) with check (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
);

-- 5. Garante que a tabela appointment_services também tenha RLS e políticas
alter table public.appointment_services enable row level security;

create policy "Allow authenticated read on appointment_services" on public.appointment_services
for select to authenticated using (true);

create policy "Allow full access for admins and techs on appointment_services" on public.appointment_services
for all to authenticated using (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
) with check (
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('administrador', 'tecnico')
);
