import { checkUserSession, logout } from './auth_orientando.js';
import { showSection, updatePageTitle, updateActiveSidebar, updateUserInfo } from './ui_orientando.js';
import { loadDashboardContent } from './dashboard_orientando.js';
import { loadProjects, loadProjectDetails } from './projects_orientando.js';
import { loadReunioes } from './reunioes_orientando.js';
import { _supabase } from './supabaseClient.js';
import { uploadFile, saveFileMetadata } from './storage.js'; // Novas importações

let currentUser = null;
let currentProjectId = null; // Adiciona variável para saber o projeto atual

async function init() {
    try {
        currentUser = await checkUserSession();
        if (currentUser) {
            updateUserInfo(currentUser);
            setupEventListeners();
            showSection('dashboard');
            loadDashboardContent(currentUser);
        }
    } catch (error) {
        console.error("MAIN_ORIENTANDO: Erro crítico na inicialização.", error);
        logout();
    }
}

function setupEventListeners() {
    document.getElementById('logoutButton')?.addEventListener('click', logout);

    document.querySelectorAll('.sidebar-item').forEach(button => {
        button.addEventListener('click', (event) => {
            const sectionName = button.dataset.section;
            if (!sectionName) return;

            showSection(sectionName);
            updatePageTitle(sectionName);
            updateActiveSidebar(event.currentTarget);

            if (sectionName === 'dashboard') loadDashboardContent(currentUser);
            if (sectionName === 'projects') loadProjects(currentUser.id);
            if (sectionName === 'reunioes') loadReunioes(currentUser.id);
        });
    });

    const projectsGrid = document.getElementById('projectsGrid');
    projectsGrid?.addEventListener('click', (event) => {
        const projectCard = event.target.closest('[data-project-id]');
        if (projectCard) {
            currentProjectId = projectCard.dataset.projectId; // Guarda o ID do projeto
            loadProjectDetails(currentProjectId);
        }
    });

    document.getElementById('backToProjectsBtn')?.addEventListener('click', () => {
        currentProjectId = null; // Limpa o ID
        showSection('projects');
        updatePageTitle('projects');
        loadProjects(currentUser.id);
    });

    // --- NOVA LÓGICA PARA INTERAÇÃO COM TAREFAS ---
    const etapasContainer = document.getElementById('etapasContainer');
    if (etapasContainer) {

        // Ouve cliques para mostrar/esconder formulários e seletores
        etapasContainer.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;

            if (action === 'toggle-upload-form') {
                const taskCard = target.closest('.border-t');
                const formContainer = taskCard.querySelector('.upload-form-container');
                formContainer.classList.toggle('hidden');
            }

            if (action === 'toggle-status-edit') {
                const statusContainer = target.closest('.flex-col');
                const badge = statusContainer.querySelector('.status-badge');
                const select = statusContainer.querySelector('select');
                badge.classList.toggle('hidden');
                select.classList.toggle('hidden');
            }
        });

        // Ouve o envio do formulário de upload
        etapasContainer.addEventListener('submit', async (event) => {
            const form = event.target.closest('form[data-action="upload-file"]');
            if (!form) return;
            
            event.preventDefault();
            const taskId = form.dataset.taskId;
            const fileInput = form.querySelector('input[type="file"]');
            const file = fileInput.files[0];

            if (!file) { alert('Selecione um arquivo.'); return; }

            // Usa as funções do storage.js
            const { data: uploadData, error: uploadError } = await uploadFile('anexos-tarefas', file, taskId);
            if (uploadError) { alert(`Falha no upload: ${uploadError.message}`); return; }
            
            const metadata = { tarefa_id: taskId, nome_arquivo: file.name, path_storage: uploadData.path };
            const { error: metaError } = await saveFileMetadata(metadata);

            if (metaError) alert(`Erro ao salvar informações do arquivo: ${metaError.message}`);
            else {
                alert('Arquivo enviado com sucesso!');
                if (currentProjectId) loadProjectDetails(currentProjectId); // Recarrega
            }
        });

        // Ouve a mudança de status no seletor
        etapasContainer.addEventListener('change', async (event) => {
            const select = event.target.closest('select[data-action="change-status"]');
            if (!select) return;

            const taskId = select.dataset.taskId;
            const newStatus = select.value;

            const { error } = await _supabase.from('tarefas').update({ status: newStatus }).eq('id', taskId);

            if (error) alert(`Erro ao atualizar status: ${error.message}`);
            else {
                if (currentProjectId) loadProjectDetails(currentProjectId); // Recarrega
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);