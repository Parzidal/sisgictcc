import { _supabase } from './supabaseClient.js';

/**
 * Busca os projetos de um orientador e cria os elementos HTML dos cards.
 * @param {string} userId - O ID do orientador.
 * @returns {HTMLElement} Um elemento <div> contendo os cards dos projetos ou uma mensagem.
 */
export async function createProjectCards(userId) {
    // 1. Busca os dados necessários no Supabase.
    const { data: projects, error } = await _supabase
        .from('projetos')
        .select('id, titulo') // Pega apenas o ID e o título
        .eq('orientador_id', userId)
        .order('created_at', { ascending: false });

    // Cria o container principal que será retornado.
    const container = document.createElement('div');

    // 2. Trata o caso de erro na busca.
    if (error) {
        console.error("Erro ao buscar projetos:", error);
        container.innerHTML = `<p class="text-red-500">Ocorreu um erro ao carregar os projetos.</p>`;
        return container;
    }

    // 3. Trata o caso de não haver projetos.
    if (!projects || projects.length === 0) {
        container.innerHTML = `<p class="text-gray-600">Você ainda não possui projetos cadastrados.</p>`;
        return container;
    }

    // 4. Se houver projetos, cria o grid e os cards.
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    projects.forEach(project => {
        // Cria o HTML para cada card individualmente.
        const cardHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all duration-300 cursor-pointer">
                <h3 class="text-lg font-bold text-gray-900 truncate" title="${project.titulo}">
                    ${project.titulo}
                </h3>
            </div>
        `;
        // Adiciona o HTML do card ao grid.
        gridContainer.innerHTML += cardHTML;
    });
    
    container.appendChild(gridContainer);
    return container;
}