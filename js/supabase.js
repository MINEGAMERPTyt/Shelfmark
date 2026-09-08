/* =========================================================
   SUPABASE CLIENT
========================================================= */

const SUPABASE_URL = "https://vshszzwqibypadclqzao.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Pr5InB66dPuZ74VOq8_u3Q_3H_YJKOd";

window.shelfmarkSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);
