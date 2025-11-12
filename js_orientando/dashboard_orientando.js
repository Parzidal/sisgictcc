export async function loadDashboardContent(user) {
    const dashboardSection = document.getElementById('dashboardSection');
    if (!dashboardSection) return;

    const userName = user.full_name.split(' ')[0];

    dashboardSection.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-4">Bem-vindo(a) de volta, ${userName}!</h2>
        <p class="text-gray-600 text-lg">Este é o seu painel de orientação. Navegue até a seção "Meus Projetos" para ver o andamento de suas atividades acadêmicas.</p>
        <div class="mt-8 bg-white p-6 rounded-xl shadow-md border border-blue-200">
            <h3 class="text-xl font-bold text-gray-800 mb-3">Acesso Rápido</h3>
            <p class="text-gray-600">Clique no menu ao lado para começar.</p>
        </div>
    `;
}