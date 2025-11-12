import { _supabase } from './supabaseClient.js';
import { showReuniaoModal, hideReuniaoModal } from './ui.js';

async function getProjectsForSelect(userId) {
    const { data, error } = await _supabase
        .from('projetos')
        .select('id, titulo, orientando_id(full_name)')
        .eq('orientador_id', userId);
    if (error) {
        console.error("Erro ao buscar projetos para o select:", error);
        return [];
    }
    return data;
}

export async function openCreateReuniaoModal(userId) {
    const select = document.getElementById('reuniaoProjectSelect');
    select.innerHTML = '<option>Carregando projetos...</option>';
    const projects = await getProjectsForSelect(userId);
    
    if (projects.length === 0) {
        select.innerHTML = '<option>Nenhum projeto encontrado</option>';
    } else {
        select.innerHTML = '<option value="">Selecione um projeto</option>';
        projects.forEach(p => {
            const studentName = p.orientando_id ? p.orientando_id.full_name : 'Sem orientando';
            select.innerHTML += `<option value="${p.id}">${p.titulo} (${studentName})</option>`;
        });
    }
    showReuniaoModal();
}

export async function openReuniaoModalForEdit(reuniaoId, userId) {
    await openCreateReuniaoModal(userId); // Re-popula o select
    
    const { data, error } = await _supabase.from('reunioes').select('*').eq('id', reuniaoId).single();
    if(error) {
        alert('Erro ao carregar dados da reunião.');
        return;
    }

    const form = document.getElementById('reuniaoForm');
    form.querySelector('[name="reuniao_id"]').value = data.id;
    form.querySelector('[name="projeto_id"]').value = data.projeto_id;
    form.querySelector('[name="titulo"]').value = data.titulo;
    form.querySelector('[name="pauta"]').value = data.pauta || '';
    form.querySelector('[name="link"]').value = data.link || '';
    
    // Formata a data para o input datetime-local
    const date = new Date(data.data_hora);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    form.querySelector('[name="data_hora"]').value = date.toISOString().slice(0, 16);

    showReuniaoModal(data);
}


export async function loadReunioes(userId) {
    const grid = document.getElementById('reunioesGrid');
    grid.innerHTML = '<p>Carregando reuniões...</p>';

    // Pega todos os projetos do orientador
    const { data: projects, error: pError } = await _supabase
        .from('projetos')
        .select('id')
        .eq('orientador_id', userId);
    
    if (pError || projects.length === 0) {
        grid.innerHTML = '<p class="text-gray-500">Nenhuma reunião encontrada pois não há projetos.</p>';
        return;
    }
    const projectIds = projects.map(p => p.id);

    // Busca as reuniões desses projetos
    const { data: reunioes, error } = await _supabase
        .from('reunioes')
        .select('*, projeto_id(*, orientando_id(full_name))')
        .in('projeto_id', projectIds)
        .order('data_hora', { ascending: true });

    if (error) {
        grid.innerHTML = '<p class="text-red-500">Erro ao carregar as reuniões.</p>';
        return;
    }
    renderReunioes(reunioes);
}


function renderReunioes(reunioes) {
    const grid = document.getElementById('reunioesGrid');
    grid.innerHTML = '';

    if (reunioes.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 bg-white p-4 rounded-lg shadow-sm">Nenhuma reunião agendada.</p>';
        return;
    }

    reunioes.forEach(reuniao => {
        const studentName = reuniao.projeto_id.orientando_id ? reuniao.projeto_id.orientando_id.full_name : 'N/A';
        const projectTitle = reuniao.projeto_id.titulo;
        const dataFormatada = new Date(reuniao.data_hora).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });

        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow border flex justify-between items-start';
        card.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-gray-800">${reuniao.titulo}</h3>
                <p class="text-sm text-gray-500 mt-1">
                    <i class="fas fa-project-diagram mr-2"></i><strong>Projeto:</strong> ${projectTitle} 
                    <span class="mx-2">|</span> 
                    <i class="fas fa-user-graduate mr-2"></i><strong>Com:</strong> ${studentName}
                </p>
                <p class="text-gray-700 font-semibold mt-2"><i class="fas fa-calendar-alt mr-2"></i>${dataFormatada}</p>
                ${reuniao.link ? `<a href="${reuniao.link}" target="_blank" class="text-blue-600 hover:underline mt-2 inline-block"><i class="fas fa-link mr-2"></i>Acessar link da chamada</a>` : ''}
            </div>
            <div class="flex space-x-2">
                <button data-action="edit-reuniao" data-reuniao-id="${reuniao.id}" class="text-blue-600 hover:text-blue-800 p-2"><i class="fas fa-pencil-alt pointer-events-none"></i></button>
                <button data-action="delete-reuniao" data-reuniao-id="${reuniao.id}" class="text-red-600 hover:text-red-800 p-2"><i class="fas fa-trash-alt pointer-events-none"></i></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

export async function handleSaveReuniao(event, userId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const reuniaoId = formData.get('reuniao_id');

    const reuniaoData = {
        projeto_id: formData.get('projeto_id'),
        titulo: formData.get('titulo'),
        pauta: formData.get('pauta'),
        data_hora: formData.get('data_hora'),
        link: formData.get('link')
    };

    let error;
    if (reuniaoId) {
        ({ error } = await _supabase.from('reunioes').update(reuniaoData).eq('id', reuniaoId));
    } else {
        ({ error } = await _supabase.from('reunioes').insert(reuniaoData));
    }

    if(error) {
        alert("Erro ao salvar reunião: " + error.message);
    } else {
        hideReuniaoModal();
        loadReunioes(userId);
    }
}

export async function handleDeleteReuniao(reuniaoId, userId) {
    if (confirm('Tem certeza que deseja cancelar esta reunião?')) {
        const { error } = await _supabase.from('reunioes').delete().eq('id', reuniaoId);
        if (error) {
            alert("Erro ao cancelar reunião: " + error.message);
        } else {
            loadReunioes(userId);
        }
    }
}