import { createClient } from '@supabase/supabase-js';


//

const supabaseUrl = 'https://wsigymigmzdpoegbiddn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_APP_API_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
