// src/utils/permissions.js

/**
 * Verifica se o usuário possui uma permissão específica
 * @param {object} user - userData vindo do backend (/me)
 * @param {string} permission - código da permissão
 */
export function can(user, permission) {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return user.permissoes.includes(permission);
}

/**
 * Verifica se o usuário possui TODAS as permissões informadas
 */
export function canAll(user, permissions = []) {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return permissions.every((p) => user.permissoes.includes(p));
}

/**
 * Verifica se o usuário possui PELO MENOS UMA das permissões
 */
export function canAny(user, permissions = []) {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return permissions.some((p) => user.permissoes.includes(p));
}
