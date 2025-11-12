// Importa as funções necessárias de cada módulo especializado
import { checkUserSession, logout } from './auth.js';
import { 
    showSection, 
    updatePageTitle, 
    updateActiveSidebar, 
    updateUserInfo, 
    hideCreateProjectModal,
    showEtapaModal,
    hideEtapaModal,
    showTarefaModal,
    hideTarefaModal,
    showEditProjectModal,
    hideEditProjectModal,
    hideReuniaoModal
} from './ui.js';
import { loadDashboardContent } from './dashboard.js'; 
import { 
    loadProjects, 
    openCreateProjectModal, 
    handleCreateProject,
    loadProjectDetails,
    handleSaveEtapa,
    openEtapaModalForEdit,
    handleDeleteEtapa,
    openTarefaModalForEdit,
    handleSaveTarefa,
    handleDeleteTarefa, // <-- Adicionado
    openEditProjectModal,
    handleUpdateProject,
    handleDeleteProject
} from './projects.js';
import { loadStudents } from './students.js';
import { loadReunioes, openCreateReuniaoModal, handleSaveReuniao, handleDeleteReuniao, openReuniaoModalForEdit } from './reunioes.js';
import { _supabase } from './supabaseClient.js';
import { uploadFile, saveFileMetadata, deleteAttachment } from './storage.js';

// Variáveis globais para armazenar o estado da aplicação
let currentUser = null;
let currentProjectId = null;

/**
 * Função de inicialização da aplicação.
 */
async function init() {
    try {
        currentUser = await checkUserSession();
        if (currentUser) {
            updateUserInfo(currentUser);
            setupEventListeners();
            
            // Inicia na tela de projetos
            showSection('projects');
            updatePageTitle('projects');
            updateActiveSidebar(document.querySelector('[data-section="projects"]'));
            loadProjects(currentUser.id); 
        }
    } catch (error) {
        console.error("MAIN: Erro crítico na inicialização.", error);
        logout();
    }
}

/**
 * Configura todos os listeners de eventos da página.
 */
function setupEventListeners() {
    // --- OUVINTES GERAIS E DE NAVEGAÇÃO ---

    document.getElementById('logoutButton')?.addEventListener('click', logout);

    document.querySelectorAll('.sidebar-item').forEach(button => {
        button.addEventListener('click', (event) => {
            const sectionName = button.dataset.section;
            if (!sectionName) return;

            showSection(sectionName);
            updatePageTitle(sectionName);
            updateActiveSidebar(event.currentTarget);
            currentProjectId = null;

            if (sectionName === 'dashboard') loadDashboardContent(currentUser.id);
            if (sectionName === 'projects') loadProjects(currentUser.id);
            if (sectionName === 'students') loadStudents(currentUser.id);
            if (sectionName === 'reunioes') loadReunioes(currentUser.id);
        });
    });

    document.getElementById('projectsGrid')?.addEventListener('click', (event) => {
        const projectCard = event.target.closest('[data-project-id]');
        if (projectCard) {
            currentProjectId = projectCard.dataset.projectId;
            loadProjectDetails(currentProjectId);
        }
    });

    document.getElementById('backToProjectsBtn')?.addEventListener('click', () => {
        showSection('projects');
        updatePageTitle('projects');
        currentProjectId = null;
        loadProjects(currentUser.id);
    });

    // --- MODAIS DE PROJETO, ETAPA, TAREFA E REUNIÃO ---

    // Criar Projeto
    document.getElementById('newProjectBtn')?.addEventListener('click', openCreateProjectModal);
    document.getElementById('createProjectForm')?.addEventListener('submit', (event) => handleCreateProject(event, currentUser));
    document.getElementById('cancelCreateProjectBtn')?.addEventListener('click', hideCreateProjectModal);

    // Editar e Excluir Projeto
    document.getElementById('editProjectBtn')?.addEventListener('click', () => {
        if (currentProjectId) openEditProjectModal(currentProjectId);
    });
    document.getElementById('deleteProjectBtn')?.addEventListener('click', () => {
        if (currentProjectId) handleDeleteProject(currentProjectId, currentUser.id);
    });
    document.getElementById('editProjectForm')?.addEventListener('submit', handleUpdateProject);
    document.getElementById('cancelEditProjectBtn')?.addEventListener('click', hideEditProjectModal);

    // Etapa
    document.getElementById('newEtapaBtn')?.addEventListener('click', () => showEtapaModal(null));
    document.getElementById('cancelEtapaBtn')?.addEventListener('click', hideEtapaModal);
    document.getElementById('etapaForm')?.addEventListener('submit', (event) => {
        if (currentProjectId) handleSaveEtapa(event, currentProjectId);
    });

    // Tarefa
    document.getElementById('tarefaForm')?.addEventListener('submit', handleSaveTarefa);
    document.getElementById('cancelTarefaBtn')?.addEventListener('click', hideTarefaModal);
    document.addEventListener('tarefaSaved', () => {
        if (currentProjectId) loadProjectDetails(currentProjectId);
    });

    // Reunião
    document.getElementById('newReuniaoBtn')?.addEventListener('click', () => openCreateReuniaoModal(currentUser.id));
    document.getElementById('cancelReuniaoBtn')?.addEventListener('click', hideReuniaoModal);
    document.getElementById('reuniaoForm')?.addEventListener('submit', (event) => handleSaveReuniao(event, currentUser.id));
    const reunioesGrid = document.getElementById('reunioesGrid');
    reunioesGrid?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if(!button) return;
        const action = button.dataset.action;
        const reuniaoId = button.dataset.reuniaoId;
        if (action === 'edit-reuniao') openReuniaoModalForEdit(reuniaoId, currentUser.id);
        if (action === 'delete-reuniao') handleDeleteReuniao(reuniaoId, currentUser.id);
    });

    // --- CONTAINER PRINCIPAL DE ETAPAS E TAREFAS (LÓGICA CENTRAL) ---
    
    const etapasContainer = document.getElementById('etapasContainer');
    if (etapasContainer) {

        // OUVINTE GERAL DE CLIQUES
        etapasContainer.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            
            if (action === 'edit') {
                openEtapaModalForEdit(target.dataset.etapaId);
            } else if (action === 'delete') {
                if (currentProjectId) handleDeleteEtapa(target.dataset.etapaId, currentProjectId);
            } else if (action === 'edit-task') {
                openTarefaModalForEdit(target.dataset.taskId);
            } else if (action === 'delete-task') { // <-- LÓGICA DE EXCLUIR TAREFA
                if (currentProjectId) handleDeleteTarefa(target.dataset.taskId, currentProjectId);
            } else if (action === 'toggle-upload-form') {
                const taskCard = target.closest('.border-t');
                const formContainer = taskCard.querySelector('.upload-form-container');
                formContainer.classList.toggle('hidden');
            } else if (action === 'toggle-status-edit') {
                const statusContainer = target.closest('.flex-col, .items-end'); // Atualizado para funcionar
                const badge = statusContainer.querySelector('.status-badge');
                const select = statusContainer.querySelector('select');
                badge.classList.toggle('hidden');
                select.classList.toggle('hidden');
            } else if (action === 'delete-attachment') {
                const anexoId = target.dataset.anexoId;
                const anexoPath = target.dataset.anexoPath;
                if (confirm('Tem certeza que deseja excluir este anexo?')) {
                    const { error } = await deleteAttachment(anexoId, anexoPath);
                    if (error) {
                        alert(`Erro ao excluir o anexo: ${error.message}`);
                    } else {
                        alert('Anexo excluído com sucesso.');
                        if (currentProjectId) loadProjectDetails(currentProjectId);
                    }
                }
            }
        });

        // OUVINTE GERAL DE SUBMISSÃO DE FORMULÁRIOS
        etapasContainer.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.target.closest('form[data-action]');
            if (!form) return;
            const action = form.dataset.action;

            if (action === 'add-task') {
                const etapaId = form.dataset.etapaId;
                const title = form.querySelector('input[name="taskTitle"]').value.trim();
                const description = form.querySelector('textarea[name="taskDesc"]').value.trim();
                if (title) {
                    const { error } = await _supabase.from('tarefas').insert({ titulo: title, descricao: description, etapa_id: etapaId });
                    if (error) alert(`Erro ao adicionar tarefa: ${error.message}`);
                    else loadProjectDetails(currentProjectId);
                }
            } else if (action === 'upload-file') {
                const taskId = form.dataset.taskId;
                const fileInput = form.querySelector('input[type="file"]');
                const file = fileInput.files[0];
                if (!file) { alert('Selecione um arquivo.'); return; }
                const { data: uploadData, error: uploadError } = await uploadFile('anexos-tarefas', file, taskId);
                if (uploadError) { alert(`Falha no upload: ${uploadError.message}`); return; }
                const metadata = { tarefa_id: taskId, nome_arquivo: file.name, path_storage: uploadData.path };
                const { error: metaError } = await saveFileMetadata(metadata);
                if (metaError) alert(`Erro ao salvar informações do arquivo: ${metaError.message}`);
                else {
                    alert('Arquivo enviado com sucesso!');
                    loadProjectDetails(currentProjectId);
                }
            }
        });

        // OUVINTE GERAL DE MUDANÇA (STATUS DA TAREFA)
        etapasContainer.addEventListener('change', async (event) => {
            const select = event.target.closest('select[data-action="change-status"]');
            if (!select) return;
            const taskId = select.dataset.taskId;
            const newStatus = select.value;
            const { error } = await _supabase.from('tarefas').update({ status: newStatus }).eq('id', taskId);
            if (error) alert(`Erro ao atualizar status: ${error.message}`);
            else loadProjectDetails(currentProjectId);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);