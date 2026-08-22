// Cor da marca por perfil: Cliente = verde (cor principal da "Vai na Boa"), Motorista = roxo.
// Ainda não existem telas de Motorista no front, mas isso já deixa pronto pra quando existirem.
export const CORES_PERFIL = {
  Cliente: { nome: 'green', hex: '#16a34a', hexEscuro: '#15803d' },
  Motorista: { nome: 'purple', hex: '#9333ea', hexEscuro: '#7e22ce' },
}

export function corDoPerfil(roles) {
  if (roles?.includes('Motorista')) return CORES_PERFIL.Motorista
  // Padrão (Cliente ou visitante ainda sem perfil, ex: tela de login) = verde, a cor principal da marca.
  return CORES_PERFIL.Cliente
}
