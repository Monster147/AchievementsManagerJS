import { ERROR_CODES } from '../common/errors.mjs'; // Importação dos códigos de erro definidos num módulo comum de erros.

// Classe para estruturar as respostas HTTP com o status apropriado e uma mensagem de erro.
function HttpResponse(status, e) {
    this.status = status; // Código de status HTTP (ex.: 400, 404, etc.).
    this.body = {
        code: e.code, // Código do erro (definido em ERROR_CODES).
        error: e.description // Descrição detalhada do erro.
    };
}

// Função que converte os erros da aplicação em respostas HTTP apropriadas.
export default function errorToHttp(e) {
    switch (e.code) {
        // Erros de parâmetros ou corpo de pedidos inválidos.
        case ERROR_CODES.MISSING_PARAMETER: return new HttpResponse(400, e); // 400 Bad Request: parâmetro em falta.
        case ERROR_CODES.INVALID_PARAMETER: return new HttpResponse(400, e); // 400 Bad Request: parâmetro inválido.
        case ERROR_CODES.INVALID_BODY: return new HttpResponse(400, e); // 400 Bad Request: corpo do pedido inválido.
        case ERROR_CODES.INVALID_SEARCH_SOURCE: return new HttpResponse(400, e); // 400 Bad Request: fonte de pesquisa inválida.
        case ERROR_CODES.INVALID_ACHIEVEMENT_SOURCE: return new HttpResponse(400, e); // 400 Bad Request: fonte de conquistas inválida.

        // Erros relacionados com recursos não encontrados.
        case ERROR_CODES.GAME_NOT_FOUND: return new HttpResponse(404, e); // 404 Not Found: grupo não encontrado.
        case ERROR_CODES.ACHIEVEMENTS_NOT_FOUND: return new HttpResponse(404, e); // 404 Not Found: conquistas não encontradas.

        // Erros de conflitos de dados (duplicações).
        case ERROR_CODES.DUPLICATE_GAME: return new HttpResponse(409, e); // 409 Conflict: equipa duplicada.

        // Erro padrão para situações não mapeadas.
        default:
            return new HttpResponse(500, "Internal server error. Contact your administrator!");
            // 500 Internal Server Error: mensagem genérica para erros não especificados.
    }
}