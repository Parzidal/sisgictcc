import { _supabase } from './supabaseClient.js';
import { showSection, updatePageTitle } from './ui_orientando.js';
import { getPublicUrl } from './storage.js'; // Importação necessária

function renderProjectsForGrid(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<p class="text-center col-span-full text-gray-500">Você ainda não foi associado(a) a nenhum projeto.</p>';
        return;
    }

    projects.forEach(project => {
        const advisorName = project.orientador_id ? project.orientador_id.full_name : 'Orientador não definido';

        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col justify-between';
        card.setAttribute('data-project-id', project.id);
        card.innerHTML = `
            <div class="pointer-events-none">
                 <span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${project.tipo || 'Sem Tipo'}</span>
                <h3 class="text-xl font-bold text-gray-800 truncate mt-2" title="${project.titulo}">
                    ${project.titulo}
                </h3>
            </div>
            <div class="mt-4 border-t pt-2 pointer-events-none">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-user-tie mr-2 text-gray-400"></i>${advisorName}
                </p>
            </div>
        `;
        projectsGrid.appendChild(card);
    });
}

export async function loadProjects(userId) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '<p class="text-center col-span-full">Carregando seus projetos...</p>';
    
    const { data, error } = await _supabase
        .from('projetos')
        .select('*, orientador_id ( full_name )')
        .eq('orientando_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("PROJECTS_ORIENTANDO: Erro ao carregar projetos:", error);
        grid.innerHTML = `<p class="text-red-500">Erro ao carregar projetos.</p>`;
    } else {
        renderProjectsForGrid(data);
    }
}

export async function loadProjectDetails(projectId) {
    showSection('projectDetail');
    updatePageTitle('projectDetail');

    const titleEl = document.getElementById('projectDetailTitle');
    const infoEl = document.getElementById('projectDetailInfo');
    const advisorEl = document.getElementById('projectAdvisorInfo');
    const etapasEl = document.getElementById('etapasContainer');

    titleEl.textContent = 'Carregando...';
    infoEl.innerHTML = '<p>Buscando detalhes...</p>';
    advisorEl.innerHTML = '<p>Buscando orientador...</p>';
    etapasEl.innerHTML = '<p>Buscando etapas...</p>';

    const { data: project, error: pError } = await _supabase
        .from('projetos')
        .select('*, orientador_id(*)')
        .eq('id', projectId)
        .single();

    if (pError || !project) {
        console.error("Erro ao carregar detalhes do projeto:", pError);
        titleEl.textContent = 'Erro ao carregar projeto';
        return;
    }
    
    titleEl.textContent = project.titulo;
    const dataInicio = new Date(project.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR');
    const dataFim = new Date(project.data_fim + 'T00:00:00').toLocaleDateString('pt-BR');
    infoEl.innerHTML = `
        <p><strong class="font-medium text-gray-800">Tipo:</strong> <span class="text-gray-600">${project.tipo}</span></p>
        <p><strong class="font-medium text-gray-800">Descrição:</strong> <span class="text-gray-600">${project.descricao || 'Nenhuma descrição fornecida.'}</span></p>
        <p><strong class="font-medium text-gray-800">Início:</strong> <span class="text-gray-600">${dataInicio}</span></p>
        <p><strong class="font-medium text-gray-800">Prazo Final:</strong> <span class="text-gray-600">${dataFim}</span></p>
    `;

    if (project.orientador_id) {
        const advisor = project.orientador_id;
        const initials = advisor.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        advisorEl.innerHTML = `
            <div class="flex items-center">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                    <span class="text-white font-bold">${initials}</span>
                </div>
                <div>
                    <h4 class="text-lg font-bold text-gray-800">${advisor.full_name}</h4>
                    <p class="text-sm text-gray-600">${advisor.email}</p>
                </div>
            </div>
        `;
    }
    
    // ATUALIZAÇÃO: Busca as etapas com as tarefas e anexos aninhados
    const { data: etapas, error: eError } = await _supabase
        .from('etapas')
        .select('*, tarefas(*, anexos_de_tarefas(*))')
        .eq('projeto_id', projectId)
        .order('ordem', { ascending: true });
    
    if (eError) {
        etapasEl.innerHTML = `<p class="text-red-500">Erro ao carregar as etapas: ${eError.message}</p>`;
    } else {
        renderEtapas(etapas);
    }
}

// NOVA FUNÇÃO: Renderiza as etapas com tarefas detalhadas para o orientando
function renderEtapas(etapas) {
    const container = document.getElementById('etapasContainer');
    container.innerHTML = '';

    if (!etapas || etapas.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 bg-gray-100 p-4 rounded-lg">Nenhuma etapa cadastrada para este projeto.</p>';
        return;
    }

    const statusMap = {
        'Não iniciada': { color: 'bg-gray-200 text-gray-800', icon: 'fas fa-pause-circle' },
        'Em andamento': { color: 'bg-blue-200 text-blue-800', icon: 'fas fa-person-digging' },
        'Concluída': { color: 'bg-green-200 text-green-800', icon: 'fas fa-check-circle' }
    };

    etapas.forEach(etapa => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow border mb-4';
        
        let tarefasHtml = '<p class="text-xs text-gray-500 mt-2">Nenhuma tarefa para esta etapa.</p>';
        if (etapa.tarefas && etapa.tarefas.length > 0) {
            tarefasHtml = etapa.tarefas.map(tarefa => {
                const statusInfo = statusMap[tarefa.status] || statusMap['Não iniciada'];
                
                const anexos = tarefa.anexos_de_tarefas || [];
                let anexosHtml = '';
                if (anexos.length > 0) {
                    anexosHtml = anexos.map(anexo => {
                        const publicUrl = getPublicUrl('anexos-tarefas', anexo.path_storage);
                        return `<a href="${publicUrl}" target="_blank" class="text-blue-600 hover:underline text-sm flex items-center"><i class="fas fa-link mr-1"></i>${anexo.nome_arquivo}</a>`;
                    }).join('');
                }

                return `
                <div class="bg-gray-50 p-3 rounded-lg border">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-gray-800 ${tarefa.status === 'Concluída' ? 'line-through text-gray-500' : ''}">${tarefa.titulo}</p>
                            <p class="text-sm text-gray-600 mt-1 mb-3">${tarefa.descricao || 'Sem descrição.'}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <div data-task-id="${tarefa.id}" data-action="toggle-status-edit" class="status-badge cursor-pointer text-xs font-medium px-2.5 py-1 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${statusInfo.color}">
                                <i class="${statusInfo.icon} mr-1"></i>
                                <span>${tarefa.status}</span>
                            </div>
                            <select data-action="change-status" data-task-id="${tarefa.id}" class="hidden mt-1 text-xs border rounded-md p-1 bg-white">
                                <option value="Não iniciada" ${tarefa.status === 'Não iniciada' ? 'selected' : ''}>Não iniciada</option>
                                <option value="Em andamento" ${tarefa.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
                                <option value="Concluída" ${tarefa.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                            </select>
                        </div>
                    </div>
                    <div class="border-t mt-3 pt-3">
                         <div class="space-y-1 mb-2">${anexosHtml}</div>
                         <button data-action="toggle-upload-form" class="text-xs font-semibold text-blue-600 hover:underline"><i class="fas fa-paperclip mr-1"></i>Anexar Arquivo</button>
                         <div class="upload-form-container hidden mt-2">
                             <form data-action="upload-file" data-task-id="${tarefa.id}" class="flex items-center space-x-2">
                                <input type="file" name="taskFile" required class="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                <button type="submit" class="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600">Enviar</button>
                             </form>
                         </div>
                    </div>
                </div>`;
            }).join('<div class="my-3"></div>');
        }

        card.innerHTML = `
            <div>
                <h4 class="text-xl font-bold text-gray-800">${etapa.titulo}</h4>
                <p class="text-gray-600 mt-1">${etapa.descricao || 'Nenhuma descrição fornecida.'}</p>
            </div>
            <div class="mt-4 border-t pt-3">
                <h5 class="font-bold text-gray-700 mb-2">Tarefas</h5>
                <div class="space-y-3">${tarefasHtml}</div>
            </div>`;
        container.appendChild(card);
    });
}