drop function if exists public.get_drivers_page(text, integer, integer);

create function public.get_drivers_page(
  search_text text default '',
  requested_page integer default 1,
  requested_page_size integer default 12,
  sort_by text default 'name_asc'
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
      nullif(btrim(search_text), '') as search,
      case
        when sort_by in ('name_asc', 'name_desc', 'internal_first') then sort_by
        else 'name_asc'
      end as sort
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
      least(params.page, greatest(1, ceil(count(*)::numeric / params.page_size)::integer)) as page,
      params.page_size,
      count(*) as total
    from filtered
    cross join params
    group by params.page, params.page_size
  ),
  paginated as (
    select filtered.*
    from filtered
    cross join params
    order by
      case when params.sort = 'internal_first' then is_external end asc,
      case when params.sort = 'name_desc' then lower(name) end desc,
      case when params.sort <> 'name_desc' then lower(name) end asc,
      id
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