## 2026-04-23 - [Optimization] JWT Claims for RLS
**Learning:** Supabase RLS policies calling `user_role()` or `user_unit_id()` helper functions can cause N+1 query bottlenecks as they hit the `profiles` table for every row. Using `auth.jwt()` to read custom claims (e.g., `user_role`, `user_unit_id`) is a zero-cost alternative as it's parsed from the token.
**Action:** Always prefer `auth.jwt() ->> 'user_role'` over `auth.user_role()` in RLS policies and application logic where possible.
