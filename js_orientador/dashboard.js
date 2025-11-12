import { _supabase } from './supabaseClient.js';

export async function loadDashboardContent(userId) {
    const dashboardSection = document.getElementById('dashboardSection');
    if (!dashboardSection) {
        console.error("ERRO CRÍTICO: A 'div' com id 'dashboardSection' não foi encontrada no HTML.");
        return;
    }

    dashboardSection.innerHTML = '<p class="text-gray-500">Buscando projetos no banco de dados...</p>';

    // 1. BUSCA OS DADOS (AGORA COM MAIS ATRIBUTOS)
    // Usamos a sintaxe do Supabase para buscar o nome do orientando da tabela 'usuarios'
    const { data: projects, error } = await _supabase
        .from('projetos')
        .select('id, titulo, orientando_id ( full_name )') // Pega id, titulo, tipo e o nome completo do orientando
        .eq('orientador_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("ERRO NA CONSULTA AO SUPABASE:", error);
        dashboardSection.innerHTML = `<p class="text-red-500">Erro ao buscar dados. Verifique o console.</p>`;
        return;
    }

    renderDashboard(dashboardSection, projects);
}

function renderDashboard(container, projects) {
    container.innerHTML = ''; // Limpa o container

    const title = document.createElement('h2');
    title.className = 'text-3xl font-bold text-gray-800 mb-6';
    title.textContent = 'Meus Projetos Recentes';
    container.appendChild(title);

    if (!projects || projects.length === 0) {
        const noProjectsMessage = document.createElement('p');
        noProjectsMessage.className = 'text-gray-600';
        noProjectsMessage.textContent = 'Nenhum projeto cadastrado ou visível para este usuário.';
        container.appendChild(noProjectsMessage);
        return;
    }
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    projects.forEach(project => {
        // Garantir que temos um nome de orientando para exibir
        const studentName = project.orientando_id ? project.orientando_id.full_name : 'Orientando não definido';
        
        const card = document.createElement('div');
        // Adicionamos um padding e um flex container para organizar melhor as informações
        card.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between';
        // 2. ATUALIZA O HTML DO CARD PARA MOSTRAR OS NOVOS ATRIBUTOS
        card.innerHTML = `
            <div>
                
                <h3 class="text-lg font-bold text-gray-900 mt-2 truncate" title="${project.titulo}">
                    ${project.titulo}
                </h3>
            </div>
            <div class="mt-4 border-t pt-2">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-user-graduate mr-2 text-gray-400"></i>${studentName}
                </p>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    container.appendChild(gridContainer);
}