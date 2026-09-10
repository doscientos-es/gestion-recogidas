revoke all on function public.get_drivers_page(text, integer, integer, text) from public;
revoke all on function public.get_drivers_page(text, integer, integer, text) from anon;
grant execute on function public.get_drivers_page(text, integer, integer, text) to authenticated;