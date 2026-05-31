import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzeujwiavpamlvdsqprs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZXVqd2lhdnBhbWx2ZHNxcHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDM3NzIsImV4cCI6MjA5NTgxOTc3Mn0.dvOEUryXkXl1BxHSoVjFuzsYuOsdeuKGGrFFe_tSFMM';

export const supabase = createClient(supabaseUrl, supabaseKey);
