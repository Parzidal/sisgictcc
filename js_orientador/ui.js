/**
 * Altera a visibilidade das seções principais da aplicação.
 * @param {string} sectionName - O nome da seção a ser exibida (ex: 'dashboard', 'projects').
 */
export function showSection(sectionName) {
    // Lista de todas as seções principais
    const sections = ['dashboardSection', 'projectsSection', 'studentsSection', 'projectDetailSection', 'reunioesSection'];
    
    // Esconde todas as seções
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.classList.add('hidden');
        }
    });

    // Mostra apenas a seção desejada
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

/**
 * Atualiza o título principal no cabeçalho da página.
 * @param {string} sectionName - O nome da seção atual.
 */
export function updatePageTitle(sectionName) {
    const titles = { 
        'dashboard': 'Dashboard', 
        'projects': 'Gestão de Projetos', 
        'students': 'Orientandos',
        'projectDetail': 'Detalhes do Projeto',
        'reunioes': 'Agenda de Reuniões'
    };
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = titles[sectionName] || 'Dashboard';
    }
}

/**
 * Atualiza o estilo do item ativo na barra lateral.
 * @param {HTMLElement} clickedButton - O elemento do botão que foi clicado.
 */
export function updateActiveSidebar(clickedButton) {
    // Remove a classe ativa de todos os itens
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-sidebar');
    });

    // Adiciona a classe ativa apenas ao item clicado
    if (clickedButton) {
        clickedButton.classList.add('active-sidebar');
    }
}

/**
 * Atualiza o nome e o avatar do usuário no cabeçalho.
 * @param {object} user - O objeto do usuário contendo 'full_name'.
 */
export function updateUserInfo(user) {
    if (!user) return;

    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) {
        userNameElement.textContent = user.full_name;
    }

    if (userAvatarElement) {
        // Pega as iniciais do nome para o avatar
        const initials = user.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        userAvatarElement.innerHTML = `<span class="text-white font-medium">${initials}</span>`;
    }
}


// --- Funções para controlar o Modal de Criação de Projeto ---

export function showCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

export function hideCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('createProjectForm');
    if (form) {
        form.reset();
    }
}

// --- Funções para controlar o Modal de Criação/Edição de Etapa ---

/**
 * Mostra o modal de etapa e, opcionalmente, preenche com dados para edição.
 * @param {object|null} etapaData - Os dados da etapa para editar, ou null para criar uma nova.
 */
export function showEtapaModal(etapaData = null) {
    const modal = document.getElementById('etapaModal');
    const form = document.getElementById('etapaForm');
    const title = document.getElementById('etapaModalTitle');
    
    if (!modal || !form || !title) return;

    form.reset(); // Limpa o formulário

    if (etapaData) {
        // MODO EDIÇÃO: Preenche o formulário com os dados existentes
        title.textContent = 'Editar Etapa';
        form.querySelector('[name="etapa_id"]').value = etapaData.id;
        form.querySelector('[name="titulo"]').value = etapaData.titulo;
        form.querySelector('[name="descricao"]').value = etapaData.descricao || '';
        form.querySelector('[name="ordem"]').value = etapaData.ordem;
    } else {
        // MODO CRIAÇÃO: Deixa o formulário em branco
        title.textContent = 'Criar Nova Etapa';
    }
    
    modal.classList.remove('hidden');
}

/**
 * Esconde o modal de etapa e limpa o formulário.
 */
export function hideEtapaModal() {
    const modal = document.getElementById('etapaModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('etapaForm');
    if (form) {
        form.reset();
    }
}

// --- Funções para controlar o Modal de Reunião ---
export function showReuniaoModal(reuniaoData = null) {
    const modal = document.getElementById('reuniaoModal');
    const title = document.getElementById('reuniaoModalTitle');
    const form = document.getElementById('reuniaoForm');
    
    if(!reuniaoData) {
        title.textContent = "Agendar Nova Reunião";
        form.reset();
    } else {
        title.textContent = "Editar Reunião";
    }

    modal.classList.remove('hidden');
}

export function hideReuniaoModal() {
    const modal = document.getElementById('reuniaoModal');
    if(modal) modal.classList.add('hidden');
    document.getElementById('reuniaoForm')?.reset();
}

// Adicione estas funções em ui.js

export function showTarefaModal() {
    const modal = document.getElementById('tarefaModal');
    if (modal) modal.classList.remove('hidden');
}

export function hideTarefaModal() {
    const modal = document.getElementById('tarefaModal');
    const form = document.getElementById('tarefaForm');
    if (form) form.reset(); // Limpa o formulário ao fechar
    if (modal) modal.classList.add('hidden');
}

// Adicione estas funções em ui.js
export function showEditProjectModal() {
    document.getElementById('editProjectModal')?.classList.remove('hidden');
}

export function hideEditProjectModal() {
    document.getElementById('editProjectModal')?.classList.add('hidden');
}