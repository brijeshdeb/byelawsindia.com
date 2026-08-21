-- Trigger functions execute through their triggers and must not be exposed as RPCs.
revoke all on function public.enforce_service_request_status_boundary() from public,anon,authenticated;
revoke all on function public.record_service_request_status_history() from public,anon,authenticated;
