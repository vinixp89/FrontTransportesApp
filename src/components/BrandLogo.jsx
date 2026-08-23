// Marca "Vai na Boa" — logo oficial (verde/amarelo), recortada em duas versões a partir do
// arquivo enviado pelo usuário: ícone isolado (logo-icon.png) para espaços compactos, e o
// conjunto ícone + nome (logo-full.png) para telas com mais espaço, como o login.
// Proporção real de cada arquivo (largura/altura), pra reservar o espaço certo quando `cor`
// troca o <img> por uma <span> com CSS mask (que não tem tamanho intrínseco como uma imagem).
const PROPORCAO = {
  full: 985 / 798,
  icon: 612 / 619,
}

export default function BrandLogo({ tamanho = 32, comTexto = true, variant = 'padrao', className = '' }) {
  const src = comTexto ? '/logo-full.png' : '/logo-icon.png'
  const altura = comTexto ? tamanho * 1.6 : tamanho

  // variant="purple" (cor de marca do perfil Motorista) recolore a logo inteira numa cor sólida
  // via CSS mask-image — o PNG vira só uma máscara de recorte, sem depender de outro arquivo.
  if (variant === 'purple') {
    return (
      <span
        role="img"
        aria-label="Vai na Boa"
        className={`inline-block bg-purple-600 dark:bg-purple-400 ${className}`}
        style={{
          height: altura,
          aspectRatio: comTexto ? PROPORCAO.full : PROPORCAO.icon,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url(${src})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
    )
  }

  return (
    <img
      src={src}
      alt="Vai na Boa"
      style={{ height: altura, width: comTexto ? undefined : tamanho }}
      className={className}
    />
  )
}
