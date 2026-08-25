-- Forward-only wording correction for functions already deployed by migrations 001 and 004.
-- This replaces function definitions in place; it does not read or mutate user data.

begin;

do $migration$
declare
  target_function regprocedure;
  function_definition text;
  legacy_message constant text :=
    'Please use you official BRAC University G-suite email';
  corrected_message constant text :=
    'Please use your official BRAC University G-Suite email';
begin
  foreach target_function in array array[
    'public.hook_restrict_signup(jsonb)'::regprocedure,
    'public.complete_student_onboarding(text,text,text,integer,text,text)'::regprocedure
  ] loop
    select pg_get_functiondef(target_function)
      into function_definition;

    if position(legacy_message in function_definition) > 0 then
      execute replace(function_definition, legacy_message, corrected_message);
    elsif position(corrected_message in function_definition) = 0 then
      raise exception 'Expected legacy message was not found in function %', target_function;
    end if;
  end loop;
end;
$migration$;

commit;
