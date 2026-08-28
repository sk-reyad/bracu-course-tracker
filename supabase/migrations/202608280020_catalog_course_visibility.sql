-- Expand the catalog course contract without editing deployed migrations.
-- Rollback strategy: deploy a new forward migration that removes application
-- reads/writes of visibility first, restores non-null credits only after every
-- null is resolved, then drops the index, constraint, and column.

alter table public.catalog_courses
  alter column credits drop not null;

alter table public.catalog_courses
  drop constraint if exists catalog_courses_code_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_courses_code_format_check'
      and conrelid = 'public.catalog_courses'::regclass
  ) then
    alter table public.catalog_courses
      add constraint catalog_courses_code_format_check
      check (code ~ '^[A-Z]{2,6}[0-9]{2,4}([A-Z]|\([A-Z]\))?$');
  end if;
end;
$$;

alter table public.catalog_courses
  add column if not exists visibility text not null default 'curriculum';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_courses_visibility_check'
      and conrelid = 'public.catalog_courses'::regclass
  ) then
    alter table public.catalog_courses
      add constraint catalog_courses_visibility_check
      check (visibility in ('curriculum', 'search_only'));
  end if;
end;
$$;

create index if not exists catalog_courses_visibility_code_idx
  on public.catalog_courses (visibility, code);

create or replace function public.mutate_global_catalog(
  catalog_action text,
  catalog_kind text,
  catalog_item jsonb,
  actor_id uuid,
  audit_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_access jsonb;
  input_key text;
  before_item jsonb;
  after_item jsonb;
  hard_codes text[] := array[]::text[];
  soft_codes text[] := array[]::text[];
  result jsonb;
begin
  if catalog_action not in ('upsert', 'delete')
     or catalog_kind not in ('department', 'course', 'faculty')
     or catalog_item is null
     or jsonb_typeof(catalog_item) <> 'object'
     or actor_id is null
     or audit_request_id is null then
    raise exception 'Invalid global catalog request';
  end if;

  perform pg_advisory_xact_lock(202608280020);

  actor_access := public.admin_effective_access(actor_id);
  if actor_access is null
     or actor_access->>'status' <> 'active'
     or actor_access->>'role' not in ('admin', 'super_admin')
     or not coalesce((actor_access->'permissions') ? 'catalog.manage', false) then
    raise exception 'Catalog management access is required.';
  end if;

  input_key := case catalog_kind
    when 'department' then catalog_item->>'id'
    when 'course' then catalog_item->>'code'
    else catalog_item->>'initial'
  end;
  if input_key is null or input_key = '' then
    raise exception 'Invalid global catalog request';
  end if;

  if catalog_action = 'upsert' then
    if catalog_kind = 'department' then
      select to_jsonb(department) into before_item
      from public.catalog_departments department
      where department.id = input_key
      for update;

      insert into public.catalog_departments (id, name, color, created_by)
      values (
        input_key,
        catalog_item->>'name',
        coalesce(catalog_item->>'color', 'gray'),
        actor_id
      )
      on conflict (id) do update
      set name = excluded.name,
          color = excluded.color,
          updated_at = now()
      returning jsonb_build_object(
        'id', id, 'name', name, 'color', color, 'created_by', created_by,
        'created_at', created_at, 'updated_at', updated_at
      ) into after_item;

    elsif catalog_kind = 'faculty' then
      if not exists (
        select 1 from public.catalog_departments department
        where department.id = catalog_item->>'department'
      ) then
        raise exception 'The selected department does not exist.';
      end if;
      select to_jsonb(faculty) into before_item
      from public.catalog_faculties faculty
      where faculty.initial = input_key
      for update;

      insert into public.catalog_faculties (
        initial, name, email, department, created_by
      )
      values (
        input_key,
        catalog_item->>'name',
        nullif(catalog_item->>'email', ''),
        catalog_item->>'department',
        actor_id
      )
      on conflict (initial) do update
      set name = excluded.name,
          email = excluded.email,
          department = excluded.department,
          updated_at = now()
      returning jsonb_build_object(
        'initial', initial, 'name', name, 'email', email,
        'department', department, 'created_by', created_by,
        'created_at', created_at, 'updated_at', updated_at
      ) into after_item;

    else
      if jsonb_typeof(
        coalesce(catalog_item->'hard_prerequisites', '[]'::jsonb)
      ) <> 'array'
         or jsonb_typeof(
           coalesce(catalog_item->'soft_prerequisites', '[]'::jsonb)
         ) <> 'array' then
        raise exception 'Invalid course prerequisites';
      end if;
      select coalesce(array_agg(code), array[]::text[]) into hard_codes
      from jsonb_array_elements_text(
        coalesce(catalog_item->'hard_prerequisites', '[]'::jsonb)
      ) codes(code);
      select coalesce(array_agg(code), array[]::text[]) into soft_codes
      from jsonb_array_elements_text(
        coalesce(catalog_item->'soft_prerequisites', '[]'::jsonb)
      ) codes(code);
      if input_key = any(hard_codes) or input_key = any(soft_codes) then
        raise exception 'A course cannot require itself.';
      end if;
      if exists (
        select 1
        from unnest(hard_codes || soft_codes) required_course(code)
        where not exists (
          select 1 from public.catalog_courses existing_course
          where existing_course.code = required_course.code
        )
      ) then
        raise exception 'Every course prerequisite must already exist in the global catalog.';
      end if;
      if not exists (
        select 1 from public.catalog_departments department
        where department.id = catalog_item->>'department'
      ) then
        raise exception 'The selected department does not exist.';
      end if;
      select to_jsonb(course) into before_item
      from public.catalog_courses course
      where course.code = input_key
      for update;

      insert into public.catalog_courses (
        code, title, credits, department, category, visibility,
        roadmap_level, roadmap_order, hard_prerequisites,
        soft_prerequisites, source_note, is_roadmap_slot, created_by
      ) values (
        input_key,
        catalog_item->>'title',
        nullif(catalog_item->>'credits', '')::numeric,
        catalog_item->>'department',
        catalog_item->>'category',
        coalesce(nullif(catalog_item->>'visibility', ''), 'curriculum'),
        nullif(catalog_item->>'roadmap_level', '')::integer,
        nullif(catalog_item->>'roadmap_order', '')::integer,
        hard_codes,
        soft_codes,
        nullif(catalog_item->>'source_note', ''),
        coalesce((catalog_item->>'is_roadmap_slot')::boolean, false),
        actor_id
      )
      on conflict (code) do update
      set title = excluded.title,
          credits = excluded.credits,
          department = excluded.department,
          category = excluded.category,
          visibility = excluded.visibility,
          roadmap_level = excluded.roadmap_level,
          roadmap_order = excluded.roadmap_order,
          hard_prerequisites = excluded.hard_prerequisites,
          soft_prerequisites = excluded.soft_prerequisites,
          source_note = excluded.source_note,
          is_roadmap_slot = excluded.is_roadmap_slot,
          updated_at = now()
      returning jsonb_build_object(
        'code', code, 'title', title, 'credits', credits,
        'department', department, 'category', category,
        'visibility', visibility, 'roadmap_level', roadmap_level,
        'roadmap_order', roadmap_order,
        'hard_prerequisites', hard_prerequisites,
        'soft_prerequisites', soft_prerequisites,
        'source_note', source_note, 'is_roadmap_slot', is_roadmap_slot,
        'created_by', created_by, 'created_at', created_at,
        'updated_at', updated_at
      ) into after_item;
    end if;

    result := jsonb_build_object('kind', catalog_kind, 'item', after_item);
  else
    if catalog_kind = 'department' then
      select to_jsonb(department) into before_item
      from public.catalog_departments department
      where department.id = input_key
      for update;
      if exists (
        select 1 from public.catalog_courses course
        where course.department = input_key
      ) or exists (
        select 1 from public.catalog_faculties faculty
        where faculty.department = input_key
      ) then
        raise exception 'Catalog item is referenced by another catalog record.';
      end if;
      delete from public.catalog_departments where id = input_key;
    elsif catalog_kind = 'faculty' then
      select to_jsonb(faculty) into before_item
      from public.catalog_faculties faculty
      where faculty.initial = input_key
      for update;
      delete from public.catalog_faculties where initial = input_key;
    else
      select to_jsonb(selected_course) into before_item
      from public.catalog_courses selected_course
      where selected_course.code = input_key
      for update;
      if exists (
        select 1 from public.catalog_courses course
        where course.hard_prerequisites @> array[input_key]
           or course.soft_prerequisites @> array[input_key]
      ) then
        raise exception 'Catalog item is referenced by another catalog record.';
      end if;
      delete from public.catalog_courses where code = input_key;
    end if;

    if before_item is null then
      raise exception 'The global catalog item was not found.';
    end if;
    result := jsonb_build_object(
      'kind', catalog_kind,
      'key', input_key,
      'deleted', true
    );
  end if;

  insert into public.admin_audit_log (
    actor_id, target_id, action, succeeded,
    before_values, after_values, request_id
  ) values (
    actor_id,
    null,
    catalog_action || '-catalog-item',
    true,
    jsonb_build_object('kind', catalog_kind, 'item', before_item),
    result,
    audit_request_id
  );
  return result;
end;
$$;

revoke all on function public.mutate_global_catalog(text, text, jsonb, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.mutate_global_catalog(text, text, jsonb, uuid, uuid)
to service_role;
