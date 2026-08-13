import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// PostgREST caps a single SELECT at ~1000 rows. Any query that has to see EVERY
// matching row (balances, ledgers, totals) must page through with .range(),
// otherwise rows past the cap are silently dropped and the numbers go stale.
const PAGE_SIZE = 1000;
const MAX_PAGES = 500; // safety net so a misbehaving query can't loop forever

/**
 * Repeats a select query until every matching row has been fetched.
 *
 * `buildQuery` must return a NEW query builder each call (builders are single-use)
 * and must order by a unique column (id) so pages never overlap or skip rows.
 */
export async function fetchAllRows(buildQuery) {
  const rows = [];
  let from = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const batch = data || [];
    if (batch.length === 0) break;

    rows.push(...batch);
    // Advance by what actually came back, so this stays correct even if the
    // server's row cap is lower than PAGE_SIZE.
    from += batch.length;
  }

  return rows;
}