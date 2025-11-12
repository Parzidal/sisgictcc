import { _supabase } from './supabaseClient.js';
import { 
    showCreateProjectModal, 
    hideCreateProjectModal, 
    showSection, 
    showEtapaModal, 
    hideEtapaModal, 
    updatePageTitle, 
    updateActiveSidebar,
    showTarefaModal,
    hideTarefaModal,
    showEditProjectModal,
    hideEditProjectModal
} from './ui.js';
import { getPublicUrl } from './storage.js';

// --- LÓGICA DE LISTAGEM DE PROJETOS (READ) ---

function renderProjectsForGrid(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<p class="text-center col-span-full text-gray-500">Nenhum projeto cadastrado.</p>';
        return;
    }

    projects.forEach(project => {
        const studentName = project.orientando_id ? project.orientando_id.full_name : 'Orientando não definido';

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
                    <i class="fas fa-user-graduate mr-2 text-gray-400"></i>${studentName}
                </p>
            </div>
        `;
        projectsGrid.appendChild(card);
    });
}

export async function loadProjects(userId) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '<p class="text-center col-span-full">Carregando projetos...</p>';
    
    const { data, error } = await _supabase
        .from('projetos')
        .select('*, orientando_id ( full_name )')
        .eq('orientador_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("PROJECTS: Erro ao carregar projetos:", error);
        grid.innerHTML = `<p class="text-red-500">Erro ao carregar projetos.</p>`;
    } else {
        renderProjectsForGrid(data);
    }
}


// --- LÓGICA DE DETALHES DO PROJETO E CRUD DE ETAPAS/TAREFAS ---

export async function loadProjectDetails(projectId) {
    showSection('projectDetail');
    updatePageTitle('projectDetail');

    const titleEl = document.getElementById('projectDetailTitle');
    const infoEl = document.getElementById('projectDetailInfo');
    const studentEl = document.getElementById('projectDetailStudent');
    const etapasEl = document.getElementById('etapasContainer');

    titleEl.textContent = 'Carregando...';
    if(infoEl) infoEl.innerHTML = '<p>Buscando detalhes...</p>';
    if(studentEl) studentEl.innerHTML = '<p>Buscando orientando...</p>';
    etapasEl.innerHTML = '<p>Buscando etapas e tarefas...</p>';

    const { data: project, error: pError } = await _supabase
        .from('projetos')
        .select('*, orientando_id(*)')
        .eq('id', projectId)
        .single();

    if (pError || !project) {
        titleEl.textContent = 'Erro ao carregar projeto';
        return;
    }
    
    titleEl.textContent = project.titulo;
    if(infoEl) {
        const dataInicio = new Date(project.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR');
        const dataFim = new Date(project.data_fim + 'T00:00:00').toLocaleDateString('pt-BR');
        infoEl.innerHTML = `
            
            <p><strong class="font-medium text-gray-800">Descrição:</strong> <span class="text-gray-600">${project.descricao || 'Nenhuma descrição fornecida.'}</span></p>
            <p><strong class="font-medium text-gray-800">Início:</strong> <span class="text-gray-600">${dataInicio}</span></p>
            <p><strong class="font-medium text-gray-800">Prazo Final:</strong> <span class="text-gray-600">${dataFim}</span></p>
        `;
    }
    if(studentEl) {
        if (project.orientando_id) {
            const student = project.orientando_id;
            const initials = student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            studentEl.innerHTML = `
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                        <span class="text-white font-bold">${initials}</span>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-gray-800">${student.full_name}</h4>
                        <p class="text-sm text-gray-600">${student.email}</p>
                    </div>
                </div>
            `;
        } else {
            studentEl.innerHTML = '<p class="text-gray-500">Nenhum orientando associado.</p>';
        }
    }
    
    const { data: etapas, error: eError } = await _supabase.from('etapas').select('*, tarefas(*, anexos_de_tarefas(*))').eq('projeto_id', projectId).order('ordem', { ascending: true });
    
    if (eError) {
        etapasEl.innerHTML = `<p class="text-red-500">Erro ao carregar as etapas: ${eError.message}</p>`;
    } else {
        renderEtapas(etapas);
    }
}

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
        
        let tarefasHtml = '<p class="text-xs text-gray-500 mt-2">Nenhuma tarefa adicionada.</p>';
        if (etapa.tarefas && etapa.tarefas.length > 0) {
            tarefasHtml = etapa.tarefas.map(tarefa => {
                const statusInfo = statusMap[tarefa.status] || statusMap['Não iniciada'];
                
                const anexos = tarefa.anexos_de_tarefas || [];
                let anexosHtml = '';
                if (anexos.length > 0) {
                    anexosHtml = anexos.map(anexo => {
                        const publicUrl = getPublicUrl('anexos-tarefas', anexo.path_storage);
                        return `
                        <div class="flex items-center justify-between hover:bg-gray-100 p-1 rounded">
                            <a href="${publicUrl}" target="_blank" class="text-blue-600 hover:underline text-sm flex items-center flex-grow truncate">
                                <i class="fas fa-link mr-2"></i>
                                <span class="truncate">${anexo.nome_arquivo}</span>
                            </a>
                            <button data-action="delete-attachment" data-anexo-id="${anexo.id}" data-anexo-path="${anexo.path_storage}" title="Excluir anexo" class="text-red-500 hover:text-red-700 ml-4 px-2 text-xs flex-shrink-0">
                                <i class="fas fa-trash-alt pointer-events-none"></i>
                            </button>
                        </div>`;
                    }).join('');
                }

                return `
                <div class="bg-gray-50 p-3 rounded-lg border">
                    <div class="flex justify-between items-start gap-4">
                        <div class="flex-grow">
                            <p class="font-bold text-gray-800 ${tarefa.status === 'Concluída' ? 'line-through text-gray-500' : ''}">${tarefa.titulo}</p>
                            <p class="text-sm text-gray-600 mt-1 mb-3">${tarefa.descricao || 'Sem descrição.'}</p>
                        </div>
                        <div class="flex flex-col items-end flex-shrink-0">
                            <div class="flex items-center space-x-3">
                                <button data-action="edit-task" data-task-id="${tarefa.id}" class="text-blue-600 hover:text-blue-800 text-sm" title="Editar Tarefa"><i class="fas fa-pencil-alt"></i></button>
                                <button data-action="delete-task" data-task-id="${tarefa.id}" class="text-red-600 hover:text-red-800 text-sm" title="Excluir Tarefa"><i class="fas fa-trash-alt"></i></button>
                            </div>
                            <div data-task-id="${tarefa.id}" data-action="toggle-status-edit" class="status-badge cursor-pointer text-xs font-medium px-2.5 py-1 rounded-full flex items-center justify-center transition-transform hover:scale-105 mt-2 ${statusInfo.color}">
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
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="text-xl font-bold text-gray-800">${etapa.titulo}</h4>
                    <p class="text-gray-600 mt-1">${etapa.descricao || 'Nenhuma descrição fornecida.'}</p>
                </div>
                <div class="flex space-x-2">
                    <button data-action="edit" data-etapa-id="${etapa.id}" class="text-blue-600 hover:text-blue-800 p-2"><i class="fas fa-pencil-alt"></i></button>
                    <button data-action="delete" data-etapa-id="${etapa.id}" class="text-red-600 hover:text-red-800 p-2"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="mt-4 border-t pt-3">
                <h5 class="font-bold text-gray-700 mb-2">Tarefas</h5>
                <div class="space-y-3">${tarefasHtml}</div>
                <form data-action="add-task" data-etapa-id="${etapa.id}" class="mt-4 border-t pt-3">
                    <p class="font-semibold text-sm mb-2">Adicionar Nova Tarefa</p>
                    <input type="text" name="taskTitle" placeholder="Título da tarefa" required class="w-full px-3 py-1.5 border rounded-lg text-sm mb-2">
                    <textarea name="taskDesc" placeholder="Descrição da tarefa" class="w-full px-3 py-1.5 border rounded-lg text-sm mb-2"></textarea>
                    <button type="submit" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-600">Adicionar Tarefa</button>
                </form>
            </div>`;
        container.appendChild(card);
    });
}

// --- CRUD DE PROJETO ---

export async function openEditProjectModal(projectId) {
    const { data: project, error } = await _supabase
        .from('projetos')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error || !project) {
        alert('Não foi possível carregar os dados do projeto.');
        return;
    }

    await populateStudentSelect('editProjectStudentSelect', project.orientando_id);
    
    const form = document.getElementById('editProjectForm');
    form.querySelector('[name="projeto_id"]').value = project.id;
    form.querySelector('[name="titulo"]').value = project.titulo;
    form.querySelector('[name="tipo"]').value = project.tipo;
    form.querySelector('[name="descricao"]').value = project.descricao || '';
    form.querySelector('[name="data_inicio"]').value = project.data_inicio;
    form.querySelector('[name="data_fim"]').value = project.data_fim;

    showEditProjectModal();
}

export async function handleUpdateProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = formData.get('projeto_id');

    const updatedData = {
        titulo: formData.get('titulo'),
        tipo: formData.get('tipo'),
        orientando_id: formData.get('orientando_id'),
        descricao: formData.get('descricao'),
        data_inicio: formData.get('data_inicio'),
        data_fim: formData.get('data_fim'),
    };

    const { error } = await _supabase.from('projetos').update(updatedData).eq('id', projectId);

    if (error) {
        alert('Erro ao atualizar o projeto: ' + error.message);
    } else {
        alert('Projeto atualizado com sucesso!');
        hideEditProjectModal();
        loadProjectDetails(projectId);
    }
}

export async function handleDeleteProject(projectId, currentUserId) {
    const confirmed = confirm('Tem certeza que deseja excluir este projeto? Esta ação é irreversível e apagará todas as etapas e tarefas associadas.');
    if (!confirmed) return;

    const { error } = await _supabase.from('projetos').delete().eq('id', projectId);

    if (error) {
        alert('Erro ao excluir o projeto: ' + error.message);
    } else {
        alert('Projeto excluído com sucesso.');
        showSection('projects');
        updatePageTitle('projects');
        loadProjects(currentUserId);
    }
}

// --- CRUD DE TAREFAS ---

export async function openTarefaModalForEdit(tarefaId) {
    const { data, error } = await _supabase
        .from('tarefas')
        .select('*')
        .eq('id', tarefaId)
        .single();

    if (error || !data) {
        alert('Erro ao carregar os dados da tarefa.');
        return;
    }

    const form = document.getElementById('tarefaForm');
    form.querySelector('[name="tarefa_id"]').value = data.id;
    form.querySelector('[name="titulo"]').value = data.titulo;
    form.querySelector('[name="descricao"]').value = data.descricao || '';
    
    showTarefaModal();
}

export async function handleSaveTarefa(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const tarefaId = formData.get('tarefa_id');
    if (!tarefaId) return alert('ID da tarefa não encontrado.');

    const updatedData = {
        titulo: formData.get('titulo'),
        descricao: formData.get('descricao')
    };

    const { error } = await _supabase.from('tarefas').update(updatedData).eq('id', tarefaId);

    if (error) {
        alert('Erro ao salvar as alterações.');
    } else {
        hideTarefaModal();
        document.dispatchEvent(new CustomEvent('tarefaSaved'));
    }
}

// NOVA FUNÇÃO PARA EXCLUIR TAREFA
export async function handleDeleteTarefa(tarefaId, projectId) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        const { error } = await _supabase.from('tarefas').delete().eq('id', tarefaId);
        if (error) {
            alert("Erro ao excluir a tarefa: " + error.message);
        } else {
            alert("Tarefa excluída com sucesso.");
            loadProjectDetails(projectId);
        }
    }
}


// --- CRUD DE ETAPAS ---

export async function handleSaveEtapa(event, projectId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const etapaId = formData.get('etapa_id');

    const etapaData = {
        titulo: formData.get('titulo'),
        descricao: formData.get('descricao'),
        ordem: parseInt(formData.get('ordem'), 10),
        projeto_id: projectId
    };

    const { error } = etapaId
        ? await _supabase.from('etapas').update(etapaData).eq('id', etapaId)
        : await _supabase.from('etapas').insert(etapaData);

    if (error) {
        alert("Erro: " + error.message);
    } else {
        hideEtapaModal();
        loadProjectDetails(projectId);
    }
}

export async function openEtapaModalForEdit(etapaId) {
    const { data, error } = await _supabase.from('etapas').select('*').eq('id', etapaId).single();
    if (error) {
        alert("Não foi possível carregar os dados da etapa.");
        return;
    }
    const form = document.getElementById('etapaForm');
    form.querySelector('[name="etapa_id"]').value = data.id;
    form.querySelector('[name="titulo"]').value = data.titulo;
    form.querySelector('[name="descricao"]').value = data.descricao || '';
    form.querySelector('[name="ordem"]').value = data.ordem;
    showEtapaModal();
}

export async function handleDeleteEtapa(etapaId, projectId) {
    if (confirm("Tem certeza que deseja excluir esta etapa e todas as suas tarefas?")) {
        const { error } = await _supabase.from('etapas').delete().eq('id', etapaId);
        if (error) alert("Erro: " + error.message);
        else loadProjectDetails(projectId);
    }
}


// --- LÓGICA DE CRIAÇÃO DE PROJETOS ---

async function getStudents() {
    const { data, error } = await _supabase.from('usuarios').select('id, full_name').eq('role', 'orientando');
    if (error) {
        console.error("Erro ao buscar orientandos:", error);
        return [];
    }
    return data;
}

async function populateStudentSelect(selectId, selectedStudentId = null) {
    const studentSelect = document.getElementById(selectId);
    if (!studentSelect) return;
    studentSelect.innerHTML = '<option value="">Carregando...</option>';
    
    const students = await getStudents();

    if (students.length === 0) {
        studentSelect.innerHTML = '<option value="">Nenhum orientando encontrado</option>';
        return;
    }

    studentSelect.innerHTML = '<option value="">Selecione um orientando</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.full_name;
        if (student.id === selectedStudentId) {
            option.selected = true;
        }
        studentSelect.appendChild(option);
    });
}

export async function openCreateProjectModal() {
    await populateStudentSelect('createProjectStudentSelect');
    showCreateProjectModal();
}

export async function handleCreateProject(event, currentUser) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const newProjectData = {
        titulo: formData.get('titulo'),
        tipo: formData.get('tipo'),
        orientando_id: formData.get('orientando_id'),
        descricao: formData.get('descricao'),
        data_inicio: formData.get('data_inicio'),
        data_fim: formData.get('data_fim'),
        orientador_id: currentUser.id
    };

    const { error } = await _supabase.from('projetos').insert(newProjectData);

    if (error) {
        alert("Erro ao criar projeto: " + error.message);
    } else {
        alert("Projeto criado com sucesso!");
        hideCreateProjectModal();
        loadProjects(currentUser.id);
        showSection('projects');
        updatePageTitle('projects');
        updateActiveSidebar(document.querySelector('[data-section="projects"]'));
    }
}