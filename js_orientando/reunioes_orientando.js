import { _supabase } from './supabaseClient.js';

export async function loadReunioes(userId) {
    const grid = document.getElementById('reunioesGrid');
    grid.innerHTML = '<p>Carregando reuniões...</p>';

    const { data: projects, error: pError } = await _supabase
        .from('projetos')
        .select('id')
        .eq('orientando_id', userId);
    
    if (pError || projects.length === 0) {
        grid.innerHTML = '<p class="text-gray-500">Nenhuma reunião encontrada.</p>';
        return;
    }
    const projectIds = projects.map(p => p.id);

    const { data: reunioes, error } = await _supabase
        .from('reunioes')
        .select('*, projeto_id(titulo)')
        .in('projeto_id', projectIds)
        .order('data_hora', { ascending: true });

    if (error) {
        grid.innerHTML = '<p class="text-red-500">Erro ao carregar as reuniões.</p>';
        return;
    }
    renderReunioesReadOnly(reunioes);
}


function renderReunioesReadOnly(reunioes) {
    const grid = document.getElementById('reunioesGrid');
    grid.innerHTML = '';

    if (reunioes.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 bg-white p-4 rounded-lg shadow-sm">Nenhuma reunião agendada.</p>';
        return;
    }

    reunioes.forEach(reuniao => {
        const dataFormatada = new Date(reuniao.data_hora).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });

        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow border';
        card.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-gray-800">${reuniao.titulo}</h3>
                <p class="text-sm text-gray-500 mt-1">
                    <i class="fas fa-project-diagram mr-2"></i><strong>Projeto:</strong> ${reuniao.projeto_id.titulo}
                </p>
                <p class="text-gray-700 font-semibold mt-2"><i class="fas fa-calendar-alt mr-2"></i>${dataFormatada}</p>
                ${reuniao.link ? `<a href="${reuniao.link}" target="_blank" class="text-blue-600 hover:underline mt-2 inline-block"><i class="fas fa-link mr-2"></i>Acessar link da chamada</a>` : ''}
                ${reuniao.pauta ? `<div class="mt-3 pt-3 border-t"><p class="text-gray-600">${reuniao.pauta}</p></div>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}