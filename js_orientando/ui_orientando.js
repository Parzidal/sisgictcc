export function showSection(sectionName) {
    const sections = ['dashboardSection', 'projectsSection', 'projectDetailSection', 'reunioesSection'];
    
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.classList.add('hidden');
    });

    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) targetSection.classList.remove('hidden');
}

export function updatePageTitle(sectionName) {
    const titles = { 
        'dashboard': 'Dashboard', 
        'projects': 'Meus Projetos', 
        'projectDetail': 'Detalhes do Projeto',
        'reunioes': 'Minhas Reuniões'
    };
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = titles[sectionName] || 'Dashboard';
    }
}

export function updateActiveSidebar(clickedButton) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-sidebar');
    });
    if (clickedButton) clickedButton.classList.add('active-sidebar');
}

export function updateUserInfo(user) {
    if (!user) return;

    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) {
        userNameElement.textContent = user.full_name;
    }

    if (userAvatarElement) {
        const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        userAvatarElement.innerHTML = `<span class="text-white font-medium">${initials}</span>`;
    }
}