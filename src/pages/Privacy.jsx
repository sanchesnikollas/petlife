export default function Privacy() {
  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-text-primary mb-4">Política de Privacidade</h1>
      <p className="text-xs text-text-secondary mb-6">Última atualização: 15 de abril de 2026</p>

      <div className="prose-sm text-text-primary space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">1. Quem somos</h2>
          <p>PetLife é um aplicativo de gestão de saúde e rotina de animais de estimação, desenvolvido por Sanches Creative (nikollas@sanchescreative.com). Nós atuamos como controlador dos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">2. Dados que coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Conta:</strong> nome, e-mail, telefone (opcional), senha (hash criptográfico).</li>
            <li><strong>Pet:</strong> nome, espécie, raça, data de nascimento, peso, foto, alergias, condições médicas, microchip, histórico de vacinas, medicações, consultas, vermífugos.</li>
            <li><strong>Alimentação:</strong> marca de ração, porções, horários de refeição.</li>
            <li><strong>Comunidade:</strong> posts, comentários, curtidas, grupos seguidos.</li>
            <li><strong>Técnicos:</strong> tipo de dispositivo (iOS/Android), token de push notification (opcional), dados de uso anônimos via PostHog (se consentido).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">3. Finalidade do tratamento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gerenciar a saúde e rotina dos seus pets.</li>
            <li>Enviar lembretes de vacinas, medicações e consultas.</li>
            <li>Calcular porções ideais de ração.</li>
            <li>Gerar prontuários em PDF para veterinários.</li>
            <li>Permitir interação na comunidade (posts, comentários).</li>
            <li>Melhorar o aplicativo com base em métricas de uso anônimas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">4. Base legal (LGPD)</h2>
          <p>O tratamento dos seus dados é baseado no <strong>consentimento</strong> (art. 7º, I da LGPD) fornecido ao criar sua conta. Você pode retirar o consentimento a qualquer momento excluindo sua conta.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">5. Compartilhamento</h2>
          <p>Seus dados <strong>não são vendidos</strong> a terceiros. Compartilhamos apenas com:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Railway:</strong> hospedagem da infraestrutura (EUA).</li>
            <li><strong>Cloudflare R2:</strong> armazenamento de fotos e arquivos.</li>
            <li><strong>Firebase (Google):</strong> envio de push notifications.</li>
            <li><strong>PostHog:</strong> métricas de uso anônimas (opt-in).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">6. Seus direitos (LGPD art. 18)</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar o tratamento dos dados.</li>
            <li>Acessar seus dados (exportar prontuário PDF).</li>
            <li>Corrigir dados incompletos ou inexatos.</li>
            <li>Solicitar exclusão dos dados (excluir conta).</li>
            <li>Revogar consentimento (opt-out de analytics).</li>
            <li>Portabilidade (export PDF + JSON via API).</li>
          </ul>
          <p>Para exercer seus direitos, envie e-mail para <strong>nikollas@sanchescreative.com</strong> ou use a opção "Excluir minha conta" em Configurações.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">7. Retenção</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão, os dados são apagados em até 30 dias, exceto quando houver obrigação legal de retenção.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">8. Segurança</h2>
          <p>Utilizamos criptografia (bcrypt para senhas, JWT para sessões), HTTPS em todas as comunicações, rate limiting, e armazenamento seguro em servidores protegidos.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">9. Crianças</h2>
          <p>O PetLife não é destinado a menores de 13 anos. Não coletamos intencionalmente dados de crianças.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">10. Alterações</h2>
          <p>Podemos atualizar esta política periodicamente. Notificaremos via app em caso de mudanças significativas.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">11. Contato</h2>
          <p>Sanches Creative<br />E-mail: nikollas@sanchescreative.com</p>
        </section>
      </div>
    </div>
  );
}
