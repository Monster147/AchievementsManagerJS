// Exporta um objeto contendo os códigos de erro definidos para a aplicação
export const ERROR_CODES = {
    MISSING_PARAMETER: 1,   // Parâmetro em falta
    INVALID_PARAMETER: 2,   // Parâmetro inválido
    INVALID_BODY: 3,        // Corpo da requisição inválido
    GAME_NOT_FOUND: 4,     // Grupo não encontrado
    ACHIEVEMENTS_NOT_FOUND: 5, // Conquista não encontrada
    DUPLICATE_GAME: 6,      // Equipa duplicada
    DUPLICATE_ACHIEVEMENT: 7, // Conquista duplicada
    INVALID_SEARCH_SOURCE: 8, // Fonte de pesquisa inválida
    INVALID_ACHIEVEMENT_SOURCE: 9, // Conquista inválida
    INVALID_ARGUMENT: 10, // Argumento inválido
};
  
// Função construtora para criar objetos de erro personalizados
function Error(code, description) {
    this.code = code; // Código do erro
    this.description = description; // Descrição detalhada do erro
}
  
// Exporta um conjunto de funções para criar erros personalizados com base nos códigos definidos
export const errors = {
    // Erro de parâmetro em falta, recebe o nome do parâmetro como argumento
    MISSING_PARAMETER: (param) => {
        return new Error(ERROR_CODES.MISSING_PARAMETER, `Missing parameter: ${param}`);
    },
    // Erro de parâmetro inválido, recebe o nome do parâmetro como argumento
    INVALID_PARAMETER: (param) =>{
        return new Error(ERROR_CODES.INVALID_PARAMETER, `Invalid parameter: ${param}`);
    },
    // Erro de corpo da requisição inválido, não requer argumentos adicionais
    INVALID_BODY: () =>{
        return new Error(ERROR_CODES.INVALID_BODY, `Invalid request body`);
    },
    // Erro de jogo não encontrado ou não autorizado, recebe o ID do jogo como argumento
    GAME_NOT_FOUND: (game) =>{
        return new Error(ERROR_CODES.GAME_NOT_FOUND, `Game with id/name ${game} not found or unauthorized`);
    },
    // Erro de conquistas não encontradas, não requer argumentos adicionais
    ACHIEVEMENTS_NOT_FOUND: (gameid) =>{
        return new Error(ERROR_CODES.ACHIEVEMENTS_NOT_FOUND, `Achievements not found for game with id ${gameid}`);
    },
    // Erro de jogo duplicada, recebe o ID/nome do jogo como argumento
    DUPLICATE_GAME: (game) =>{
        return new Error(ERROR_CODES.DUPLICATE_GAME, `Game with id/name ${game} already exists`);
    },
    DUPLICATE_ACHIEVEMENT: (achievementName) => {
        return new Error(ERROR_CODES.DUPLICATE_ACHIEVEMENT, `Achievement ${achievementName} already exists`);
    },
    // Erro de fonte de pesquisa inválida, recebe o nome da fonte como argumento
    INVALID_SEARCH_SOURCE: (source) =>{
        return new Error(ERROR_CODES.INVALID_SEARCH_SOURCE, `Invalid search source: ${source}. Supported sources are: steam, psn.`);
    },
    // Erro de fonte de conquistas inválida, recebe o nome da fonte como argumento
    INVALID_ACHIEVEMENT_SOURCE: (source) =>{
        return new Error(ERROR_CODES.INVALID_ACHIEVEMENT_SOURCE, `Invalid achievement source: ${source}. Supported sources are: steam, retroachievements, psn.`);
    },
    INVALID_ARGUMENT: (argName) => {
        return new Error(INTERNAL_ERROR_CODES.INVALID_ARGUMENT, `Invalid argument ${argName}`);
    }
};