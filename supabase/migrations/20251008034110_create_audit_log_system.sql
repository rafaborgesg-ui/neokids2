-- 1. Cria a tabela para armazenar os logs de auditoria
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id),
    user_email text,
    action text not null, -- ex: INSERT, UPDATE, DELETE
    table_name text not null, -- ex: patients, services
    record_id uuid, -- ID do registro afetado
    old_record_data jsonb, -- Dados antigos (para UPDATE e DELETE)
    new_record_data jsonb -- Dados novos (para INSERT e UPDATE)
);

-- 2. Cria a função de gatilho que será executada em cada alteração
create or replace function public.log_audit_trail()
returns trigger
language plpgsql
security definer
as $$
begin
    -- Insere um novo registro na tabela de auditoria
    insert into public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_record_data,
        new_record_data
    )
    values (
        auth.uid(), -- Pega o ID do usuário autenticado
        (select raw_user_meta_data->>'email' from auth.users where id = auth.uid()), -- Pega o email do usuário
        TG_OP, -- A operação (INSERT, UPDATE, DELETE)
        TG_TABLE_NAME, -- O nome da tabela
        case
            when TG_OP = 'DELETE' then old.id
            else new.id
        end,
        case
            when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old)
            else null
        end,
        case
            when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new)
            else null
        end
    );

    -- Retorna o registro para a operação original continuar
    return case
        when TG_OP = 'DELETE' then old
        else new
    end;
end;
$$;

-- 3. Anexa os gatilhos às tabelas que queremos auditar

-- Gatilho para a tabela 'patients'
create trigger patients_audit_trigger
after insert or update or delete on public.patients
for each row execute function public.log_audit_trail();

-- Gatilho para a tabela 'services'
create trigger services_audit_trigger
after insert or update or delete on public.services
for each row execute function public.log_audit_trail();
