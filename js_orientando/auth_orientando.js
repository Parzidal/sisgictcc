import { _supabase } from './supabaseClient.js';

export async function checkUserSession() {
    const userId = localStorage.getItem('sisgic_user_id');
    const userRole = localStorage.getItem('sisgic_user_role');

    if (!userId || userRole !== 'orientando') {
        logout();
        return null;
    }

    const { data, error } = await _supabase.from('usuarios').select('*').eq('id', userId).single();

    if (error || !data) {
        logout();
        return null;
    }
    
    return data;
}

export function logout() {
    localStorage.removeItem('sisgic_user_id');
    localStorage.removeItem('sisgic_user_role');
    window.location.href = 'login.html';
}