import { _supabase } from './supabaseClient.js';

export async function checkUserSession() {
    console.log("AUTH: Iniciando verificação de sessão...");
    const userId = localStorage.getItem('sisgic_user_id');
    const userRole = localStorage.getItem('sisgic_user_role');
    console.log(`AUTH: ID do usuário no localStorage: ${userId}`);
    console.log(`AUTH: Role no localStorage: ${userRole}`);

    if (!userId) {
        console.error("AUTH FALHA: 'sisgic_user_id' não encontrado no localStorage.");
        logout();
        return null;
    }
    if (userRole !== 'orientador') {
        console.error(`AUTH FALHA: Role é '${userRole}', mas era esperado 'orientador'.`);
        logout();
        return null;
    }

    const { data, error } = await _supabase.from('usuarios').select('*').eq('id', userId).single();

    if (error || !data) {
        console.error("AUTH FALHA: Usuário com ID não encontrado ou erro na consulta:", error?.message);
        logout();
        return null;
    }
    
    console.log("AUTH SUCESSO: Sessão validada para o usuário:", data.full_name);
    return data;
}

export function logout() {
    console.log("AUTH: Executando logout e redirecionando para login.html");
    localStorage.removeItem('sisgic_user_id');
    localStorage.removeItem('sisgic_user_role');
    window.location.href = 'login.html';
}