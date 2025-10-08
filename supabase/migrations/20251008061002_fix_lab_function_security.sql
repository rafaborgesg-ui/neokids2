-- Altera a função para ser executada com as permissões do usuário que a chama (invoker)
-- Isso garante que as políticas de RLS sejam aplicadas corretamente.
create or replace function public.get_lab_appointments()
returns json
language plpgsql
security invoker -- A correção principal está aqui: de DEFINER para INVOKER
as $$
begin
  return (
    select json_agg(
      json_build_object(
        'id', a.id,
        'appointment_date', a.appointment_date,
        'status', a.status,
        'patients', json_build_object(
          'name', p.name
        ),
        'appointment_services', (
          select json_agg(
            json_build_object(
              'services', json_build_object(
                'id', s.id,
                'name', s.name,
                'code', s.code
              )
            )
          )
          from public.appointment_services as aps
          join public.services as s on aps.service_id = s.id
          where aps.appointment_id = a.id
        )
      )
    )
    from public.appointments as a
    join public.patients as p on a.patient_id = p.id
    where a.status in ('awaiting_collection', 'in_analysis', 'awaiting_report', 'completed')
  );
end;
$$;
