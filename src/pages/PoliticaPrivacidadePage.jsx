import AppNavbar from '../components/AppNavbar'
import ThemeToggleButton from '../components/ThemeToggleButton'

// Página pública (sem login) — é a URL cadastrada como "Política de privacidade" nos dois apps
// (Vai na Boa e Vai na Boa Motorista) no Google Play Console. O mesmo texto também é mostrado
// nativo dentro dos apps (ver PoliticaPrivacidadeScreen.tsx em cada repositório mobile), mas o
// Play Console exige uma URL pública além da tela dentro do app.
const SECOES = [
  {
    titulo: '1. Quem somos',
    paragrafos: [
      'Esta política é publicada por VZY Tecnologia da Informação, inscrita no CNPJ sob o nº 68.923.558/0001-82 ("Vai na Boa", "nós"), responsável pelo tratamento dos dados pessoais coletados através dos aplicativos Vai na Boa e Vai na Boa Motorista e do site vainaboamobilidade.com.br.',
    ],
  },
  {
    titulo: '2. Dados que coletamos',
    paragrafos: ['Coletamos diretamente de você, no momento do cadastro e do uso do app:'],
    itens: [
      'Nome completo, e-mail e senha (armazenada com hash) — pra criar e autenticar a conta',
      'CPF e telefone — pra identificação e contato entre as partes de uma corrida',
      'Endereço (logradouro, número, bairro, cidade, estado) — pra definir origem/destino e sugerir endereços',
      'Localização GPS em tempo real — pra estimar rota/preço e acompanhar a corrida em andamento',
      'CNH, placa, modelo e ano do veículo (só motoristas) — pra habilitação como motorista parceiro e categorias de corrida',
      'Histórico de corridas, avaliações, saldo e transações da carteira — pra operação do serviço e suporte',
    ],
  },
  {
    titulo: '3. Localização',
    paragrafos: [
      'O app pede acesso à sua localização enquanto em uso para calcular rota/preço das corridas e, no app Motorista, enquanto o motorista estiver "disponível" ou em corrida, pra que o passageiro veja o veículo se aproximando no mapa durante uma corrida ativa.',
      'A localização só é enviada aos nossos servidores enquanto o app estiver aberto (e, no caso do motorista, "disponível" ou em corrida), e só é exibida à outra parte da corrida em andamento — nunca a terceiros ou outros usuários.',
      'Você pode revogar a permissão de localização a qualquer momento nas configurações do aparelho; sem ela, algumas funções (pedir/aceitar corrida, acompanhar no mapa) deixam de funcionar.',
    ],
  },
  {
    titulo: '4. Como usamos os dados',
    paragrafos: ['Usamos os dados coletados para:'],
    itens: [
      'Viabilizar o pedido, aceite e acompanhamento de corridas entre passageiros e motoristas',
      'Processar pagamentos das corridas, saques e assinatura de planos',
      'Enviar e-mails transacionais e notificações push sobre corridas novas e o andamento delas',
      'Prevenir fraude e uso indevido da plataforma',
      'Cumprir obrigações legais e fiscais',
    ],
  },
  {
    titulo: '5. Com quem compartilhamos',
    paragrafos: ['Compartilhamos dados apenas com prestadores de serviço estritamente necessários à operação:'],
    itens: [
      'Mercado Pago — processamento de pagamentos e assinaturas (não temos acesso a números de cartão)',
      'Banco Inter — envio via Pix dos valores sacados da carteira do motorista',
      'Google Maps Platform — geocodificação de endereços e cálculo de rotas',
      'Provedor de e-mail (SMTP) — envio de e-mails transacionais da conta',
      'Entre passageiro e motorista — nome, localização em tempo real e dados do veículo são compartilhados entre as duas partes de uma mesma corrida, pelo tempo necessário a ela',
    ],
  },
  {
    titulo: '6. Armazenamento e segurança',
    paragrafos: [
      'Os dados são armazenados em banco de dados hospedado em servidor próprio, com senhas protegidas por hash e comunicação entre app e servidor criptografada (HTTPS/TLS). Acesso interno aos dados é restrito à equipe responsável pela operação da plataforma.',
    ],
  },
  {
    titulo: '7. Retenção e exclusão',
    paragrafos: [
      'Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo adicional exigido por obrigações legais e fiscais (ex.: histórico de transações financeiras e saques). Ao solicitar a exclusão da conta, removemos ou anonimizamos os dados pessoais que não precisem ser retidos por lei.',
    ],
  },
  {
    titulo: '8. Seus direitos (LGPD)',
    paragrafos: ['Nos termos dos artigos 17 a 22 da LGPD, você pode solicitar, a qualquer momento:'],
    itens: [
      'Confirmação de que tratamos seus dados, e acesso a eles',
      'Correção de dados incompletos, inexatos ou desatualizados',
      'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei',
      'Portabilidade dos dados a outro fornecedor',
      'Eliminação dos dados tratados com base no seu consentimento',
      'Revogação do consentimento, a qualquer momento',
    ],
  },
  {
    titulo: '9. Menores de idade',
    paragrafos: [
      'Os aplicativos são destinados a maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Se identificarmos uma conta criada por um menor, ela será removida.',
    ],
  },
  {
    titulo: '10. Cookies e identificadores',
    paragrafos: [
      'Os aplicativos usam um token de sessão local (armazenado no aparelho) para manter você conectado, e um identificador de notificações push (Expo/Firebase) para o envio de alertas sobre corridas novas. O site usa apenas cookies estritamente necessários ao funcionamento. Não usamos cookies de rastreamento publicitário.',
    ],
  },
  {
    titulo: '11. Alterações desta política',
    paragrafos: [
      'Podemos atualizar esta política periodicamente. Mudanças relevantes serão avisadas dentro do app ou por e-mail antes de entrarem em vigor.',
    ],
  },
  {
    titulo: '12. Contato e encarregado',
    paragrafos: [
      'Dúvidas, solicitações sobre seus dados ou exercício dos direitos da LGPD podem ser enviadas para contato@vainaboamobilidade.com.br.',
      'Encarregado de proteção de dados (DPO): VZY Tecnologia da Informação, contato pelo mesmo e-mail.',
    ],
  },
  {
    titulo: '13. Como excluir sua conta',
    paragrafos: ['Para excluir sua conta nos aplicativos Vai na Boa ou Vai na Boa Motorista, siga os passos abaixo:'],
    itens: [
      'Envie um e-mail para contato@vainaboamobilidade.com.br, a partir do e-mail cadastrado na conta, informando qual app e pedindo a exclusão da conta',
      'Confirmamos o recebimento em até 2 dias úteis e concluímos a exclusão em até 15 dias',
      'Também é possível pedir a exclusão de dados específicos, sem excluir a conta inteira, pelo mesmo canal',
    ],
  },
]

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen pb-16">
      <AppNavbar brand titulo="Política de Privacidade">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vigência: 2 de setembro de 2026 · Versão 1.0</p>

        <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Como tratamos os dados de quem usa os aplicativos Vai na Boa (passageiros) e Vai na Boa
          Motorista (motoristas parceiros), em conformidade com a Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018 — LGPD).
        </p>

        <div className="mt-6 rounded-2xl bg-green-50 p-5 dark:bg-green-950">
          <p className="mb-2 text-xs font-bold tracking-wide text-green-800 dark:text-green-300">
            RESUMO RÁPIDO
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
            {[
              'Coletamos só o necessário pra ligar passageiro, motorista e corrida: identificação, contato, endereço e localização em tempo real durante uma corrida.',
              'Pagamentos e saques passam pelo Mercado Pago e Banco Inter — não guardamos número de cartão nem dados bancários completos nos nossos servidores.',
              'Sua localização só é compartilhada com a outra parte da corrida em andamento, e só enquanto ela durar.',
              'Você pode pedir a exclusão da sua conta e dos seus dados a qualquer momento pelo e-mail de contato.',
              'Não vendemos dados pessoais a terceiros.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {SECOES.map((secao) => (
          <section key={secao.titulo} className="mt-8">
            <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-white">{secao.titulo}</h2>
            {secao.paragrafos.map((paragrafo) => (
              <p key={paragrafo} className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {paragrafo}
              </p>
            ))}
            {secao.itens ? (
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
                {secao.itens.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green-600 dark:text-green-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <a
          href="mailto:contato@vainaboamobilidade.com.br"
          className="mt-8 inline-block text-sm font-semibold text-green-600 hover:underline dark:text-green-400"
        >
          contato@vainaboamobilidade.com.br
        </a>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Vai na Boa Mobilidade — política de privacidade v1.0
        </p>
      </main>
    </div>
  )
}
