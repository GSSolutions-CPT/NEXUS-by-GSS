-- Fix search_path mutable warning on process_hardware_queue function
ALTER FUNCTION "public"."process_hardware_queue"() SET search_path = '';
