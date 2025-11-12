import { _supabase } from './supabaseClient.js';

export async function loadStudents(userId) {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<p class="text-center col-span-full">Carregando orientandos...</p>';
    
    // 1. Busca apenas os projetos do orientador logado
    const { data: projects, error: pError } = await _supabase
        .from('projetos')
        .select('orientando_id')
        .eq('orientador_id', userId);
    
    if (pError) {
        console.error(pError);
        grid.innerHTML = '<p class="text-red-500">Erro ao buscar projetos dos orientandos.</p>';
        return;
    }

    // 2. Cria uma lista de IDs de alunos únicos, removendo valores nulos
    const studentIds = [...new Set(projects.map(p => p.orientando_id).filter(id => id))];
    
    if (studentIds.length === 0) {
        grid.innerHTML = '<p class="text-center col-span-full text-gray-500">Nenhum orientando associado a projetos.</p>';
        return;
    }

    // 3. Busca o perfil apenas dos alunos encontrados
    const { data: students, error: sError } = await _supabase
        .from('usuarios')
        .select('*')
        .in('id', studentIds);
    
    if (sError) {
        console.error('Erro ao buscar orientandos:', sError);
        grid.innerHTML = '<p class="text-red-500">Erro ao carregar dados dos orientandos.</p>';
        return;
    }

    renderStudents(students);
}

function renderStudents(students) {
    const grid = document.getElementById('studentsGrid');
    grid.innerHTML = '';

    if (!students || students.length === 0) {
        grid.innerHTML = '<p class="text-center col-span-full text-gray-500">Nenhum perfil de orientando encontrado.</p>';
        return;
    }

    students.forEach(student => {
        const initials = student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg p-6 border border-gray-200';
        card.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                    <span class="text-white font-bold">${initials}</span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${student.full_name}</h3>
                    <p class="text-sm text-gray-600">${student.email}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}