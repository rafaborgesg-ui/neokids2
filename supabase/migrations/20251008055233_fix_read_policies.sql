-- 1. Habilita a RLS e permite a leitura para usuários autenticados na tabela 'appointments'
alter table public.appointments enable row level security;

create policy "Allow authenticated read access on appointments" on public.appointments
for select to authenticated using (true);

-- 2. Habilita a RLS e permite a leitura para usuários autenticados na tabela 'patients'
alter table public.patients enable row level security;

create policy "Allow authenticated read access on patients" on public.patients
for select to authenticated using (true);
