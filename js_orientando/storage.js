import { _supabase } from './supabaseClient.js';

/**
 * Faz o upload de um arquivo para o Supabase Storage.
 * @param {string} bucketName - O nome do bucket.
 * @param {File} file - O arquivo a ser enviado.
 * @param {string} tarefaId - O ID da tarefa (UUID) para organizar os arquivos.
 * @returns {Promise<object>} - O resultado do upload.
 */
export async function uploadFile(bucketName, file, tarefaId) {
    const filePath = `tarefa_${tarefaId}/${Date.now()}_${file.name}`;

    const { data, error } = await _supabase.storage
        .from(bucketName)
        .upload(filePath, file);

    if (error) console.error('Erro no upload:', error);
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

    if (error) console.error('Erro ao salvar metadados:', error);
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