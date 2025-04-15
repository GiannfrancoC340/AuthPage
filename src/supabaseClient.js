import { createClient } from '@supabase/supabase-js'

const URL = 'https://cprjninkiiycaiowqhcq.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcmpuaW5raWl5Y2Fpb3dxaGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NzQ2MDcsImV4cCI6MjA2MDI1MDYwN30.i9p81jLjl0Az3_5N2H6kA5r2_HM1WZ4DzFtLD0jPRxg';
export const supabase = createClient(URL, API_KEY);
