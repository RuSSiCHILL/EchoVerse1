// src/app/api/test/route.ts
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message,
        hint: 'Проверьте ключи и наличие таблицы profiles'
      })
    }
    
    return Response.json({ 
      success: true, 
      message: 'Подключение успешно!',
      url: supabaseUrl.replace(/[^\.]+\.[^\.]+\.supabase\.co/, '***.supabase.co'),
      key_length: supabaseKey.length
    })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message 
    })
  }
}