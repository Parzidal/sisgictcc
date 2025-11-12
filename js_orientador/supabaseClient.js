import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://brtghaeqvvzqerarlrpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydGdoYWVxdnZ6cWVyYXJscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjk5MjYsImV4cCI6MjA3MzYwNTkyNn0.cNfHyO39bdJKaF_fB2adHrgHOGdY_f5I3iucaR_mMzk';

// =================== ALTERAÇÃO IMPORTANTE ABAIXO ===================

export const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        // Pega o ID do usuário do localStorage para enviar em cada requisição
        get headers() {
            const userId = localStorage.getItem('sisgic_user_id');
            return {
                // O nome do header pode ser qualquer um, vamos usar 'X-User-Id'
                'X-User-Id': userId || '', 
            };
        },
    },
});