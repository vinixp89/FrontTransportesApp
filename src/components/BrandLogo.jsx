// Marca "Vai na Boa" — logo oficial (verde/amarelo), recortada em duas versões a partir do
// arquivo enviado pelo usuário: ícone isolado (logo-icon.png) para espaços compactos, e o
// conjunto ícone + nome (logo-full.png) para telas com mais espaço, como o login.
export default function BrandLogo({ tamanho = 32, comTexto = true, className = '' }) {
  if (comTexto) {
    return (
      <img
        src="/logo-full.png"
        alt="Vai na Boa"
        style={{ height: tamanho * 1.6 }}
        className={className}
      />
    )
  }

  return (
    <img
      src="/logo-icon.png"
      alt="Vai na Boa"
      style={{ height: tamanho, width: tamanho }}
      className={className}
    />
  )
}
