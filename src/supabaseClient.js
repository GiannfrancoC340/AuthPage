import { createClient } from '@supabase/supabase-js'

const URL = 'insert your Project URL here';
const API_KEY = 'insert your Project API key here';
export const supabase = createClient(URL, API_KEY);
