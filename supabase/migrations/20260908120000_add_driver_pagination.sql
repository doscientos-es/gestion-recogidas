create or replace function public.get_drivers_page(
  search_text text default '',
  requested_page integer default 1,
  requested_page_size integer default 12
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with params as (
    select
      greatest(1, requested_page) as page,
      least(50, greatest(1, requested_page_size)) as page_size,
      nullif(btrim(search_text), '') as search
  ),
  filtered as (
    select
      driver.value ->> 'id' as id,
      driver.value ->> 'name' as name,
      driver.value ->> 'phone' as phone,
      driver.value ->> 'email' as email,
      driver.value ->> 'initials' as initials,
      driver.value ->> 'isExternal' = 'true' as is_external
    from public.demo_workspaces workspace
    cross join lateral jsonb_array_elements(coalesce(workspace.state -> 'drivers', '[]'::jsonb)) driver
    cross join params
    where workspace.owner_id = auth.uid()
      and (
        params.search is null
        or concat_ws(' ', driver.value ->> 'name', driver.value ->> 'phone', driver.value ->> 'email')
          ilike '%' || params.search || '%'
      )
  ),
  pagination as (
    select
      least(
        params.page,
        greatest(1, ceil(count(*)::numeric / params.page_size)::integer)
      ) as page,
      params.page_size,
      count(*) as total
    from filtered
    cross join params
    group by params.page, params.page_size
  ),
  paginated as (
    select *
    from filtered
    order by lower(name), id
    limit (select page_size from pagination)
    offset (select (page - 1) * page_size from pagination)
  )
  select jsonb_build_object(
    'drivers',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'phone', phone,
            'email', email,
            'initials', initials,
            'isExternal', is_external
          )
        )
        from paginated
      ),
      '[]'::jsonb
    ),
    'total', (select total from pagination),
    'page', (select page from pagination)
  );
$$;

revoke all on function public.get_drivers_page(text, integer, integer) from public;
grant execute on function public.get_drivers_page(text, integer, integer) to authenticated;