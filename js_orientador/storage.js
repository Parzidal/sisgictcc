import { _supabase } from './supabaseClient.js';

/**
 * Faz o upload de um arquivo para o Supabase Storage.
 * @param {string} bucketName - O nome do bucket.
 * @param {File} file - O arquivo a ser enviado.
 * @param {number} tarefaId - O ID da tarefa para organizar os arquivos.
 * @returns {Promise<object>} - O resultado do upload.
 */
export async function uploadFile(bucketName, file, tarefaId) {
    const filePath = `tarefa_${tarefaId}/${Date.now()}_${file.name}`;

    const { data, error } = await _supabase.storage
        .from(bucketName)
        .upload(filePath, file);

    if (error) {
        console.error('Erro no upload:', error);
    }
    return { data, error };
}

/**
 * Registra os metadados do arquivo no banco de dados.
 * @param {object} fileMetadata - As informações do arquivo.
 * @returns {Promise<object>} - O resultado da inserção.
 */
export async function saveFileMetadata(fileMetadata) {
    const { data, error } = await _supabase
        .from('anexos_de_tarefas')
        .insert(fileMetadata);

    if (error) {
        console.error('Erro ao salvar metadados:', error);
    }
    return { data, error };
}

/**
 * Gera o link público para um arquivo no Storage.
 * @param {string} bucketName - O nome do bucket.
 * @param {string} filePath - O caminho do arquivo no bucket.
 * @returns {string} - A URL pública do arquivo.
 */
export function getPublicUrl(bucketName, filePath) {
    const { data } = _supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
}

// Adicione esta nova função ao final do seu arquivo storage.js

/**
 * Exclui um anexo do Supabase Storage e da tabela do banco de dados.
 * @param {string} anexoId - O ID do registo na tabela 'anexos_de_tarefas'.
 * @param {string} filePath - O caminho do arquivo no Storage (path_storage).
 * @returns {Promise<object>} - O resultado da operação.
 */
export async function deleteAttachment(anexoId, filePath) {
    // 1. Exclui o arquivo do Storage
    const { error: storageError } = await _supabase.storage
        .from('anexos-tarefas')
        .remove([filePath]);

    if (storageError) {
        console.error('Erro ao excluir do Storage:', storageError);
        return { error: storageError };
    }

    // 2. Se a exclusão do Storage for bem-sucedida, exclui o registo do banco de dados
    const { error: dbError } = await _supabase
        .from('anexos_de_tarefas')
        .delete()
        .eq('id', anexoId);

    if (dbError) {
        console.error('Erro ao excluir do banco de dados:', dbError);
    }

    return { error: dbError };
}