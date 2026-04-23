# Review Carolina (Sócia) — Pontos das Transcrições

**Date:** 2026-03-31
**Source:** 2 transcrições de reunião

---

## Todos os Pontos Levantados pela Carolina

### 1. Cadastro do Pet (Onboarding)

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Raça como select** | Não deixar digitar livremente. Selecionar de lista pré-definida com todas as raças. Evitar variações/poluição | ❌ Input text livre | Criar autocomplete com database de raças (cão + gato) |
| **Toggle alergias** | Se não tem alergia, pular. Toggle "tem/não tem" antes de abrir campos | ❌ Campos sempre visíveis | Adicionar toggle condicional |
| **Toggle condições** | Mesmo padrão — se não tem, pular | ❌ Campos sempre visíveis | Adicionar toggle condicional |
| **Castração** | Se é castrado, data de castração | ❌ Não existe | Novo campo no Pet |
| **Nível de atividade** | Leve, moderada, alta — influencia ração | ❌ Não existe | Novo campo no Pet |

### 2. Alimentação / Ração

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Marcas como database** | Puxar todas marcas de ração do mercado brasileiro. Não digitar | ❌ Input text livre | Criar database de rações com info nutricional |
| **Cálculo automático** | Calcular qtd diária baseado em peso, idade, raça, nível de atividade + tabela da ração | ❌ Não existe | Feature nova: calculadora de ração |
| **Calorias** | Mostrar calorias da ração, informação nutricional | ❌ Não existe | Depende da database de rações |
| **Visual da embalagem** | Mostrar foto da embalagem | ❌ Não existe | Depende da database |
| **E-commerce** | Conectar com e-commerce pra comprar ração | ❌ Não existe | Visão futura (marketplace) |
| **Ração úmida/sachê** | Puxar info de sachês também, calorias | ✅ Tipo seca/úmida/mista existe | Falta info nutricional |

### 3. Rotina / Dia a Dia

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Passeios** | Quantas vezes/dia, quantos minutos | ❌ Não existe | Novo módulo: Rotina |
| **Creche** | Se frequenta, qual, contato da creche | ❌ Não existe | Novo campo |
| **Banho** | Frequência (semanal, quinzenal), onde | ❌ Não existe | Novo campo |
| **Produtos/preferências** | Tipo de produto que usa, com/sem perfume | ❌ Não existe | Novo campo |

### 4. Saúde / Veterinário

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Convênio pet** | Se tem plano de saúde pet, qual | ❌ Não existe | Novo campo no Pet |
| **Veterinários de confiança** | Cadastrar vets separadamente (nome, clínica, contato) | ⚠️ Parcial — vet nome aparece na vacina/consulta mas não é entidade separada | Criar model Veterinário |
| **Tratamentos** | Histórico de tratamentos em andamento | ⚠️ Parcial — medicações ativas servem parcialmente | Poderia ser mais completo |
| **Vermífugos** | Quando tomou, qual produto | ✅ Existe | OK |
| **Vacinação** | Tipos, datas, vet | ✅ Existe | OK |
| **Castração** | Data, se é castrado | ❌ Não existe | Novo campo |

### 5. Documentos / Prontuário

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Centralizar exames** | Upload de exames de diferentes vets, tudo num lugar | ✅ Existe (Records + attachments) | OK — precisa funcionar o upload real |
| **Histórico completo** | Diário da vida do pet — tudo registrado | ✅ Existe (Records timeline) | OK |
| **Export** | Poder compartilhar/exportar | ⚠️ Endpoint existe no backend, falta no frontend | Implementar PDF export |

### 6. Notificações / Alertas

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Alertas de vacinação** | Notificação quando vacina vence | ⚠️ Backend calcula status, mas sem push | SP4/SP5 — Push notifications |
| **Lembrete medicamento** | Push para tomar medicamento | ⚠️ Toggle existe, mas sem push real | SP4/SP5 |
| **Previsões proativas** | "Seu pet vai precisar de vermífugo em X meses" | ❌ Não existe | Feature IA futura |

### 7. Conteúdo / Educação

| Ponto | O que Carolina pediu | Status atual | Gap |
|-------|---------------------|-------------|-----|
| **Conteúdos de veterinários** | Vets publicando conteúdo de saúde e cuidados | ❌ Não existe | Nova seção (pode ser parte da Comunidade) |
| **Calendário visual** | Ver no calendário quando foi ao vet, banho, vacina | ❌ Não existe | Nova feature: Calendar view |
| **Dicas/erros e acertos** | Tópicos educativos | ⚠️ Comunidade tem posts de dicas, mas não curado por vets | Pode evoluir |

---

## Resumo de Gaps — Priorizado

### P0 — Crítico para Lançamento
1. **Raça como autocomplete** — UX básica, evita dados sujos
2. **Castração** — campo essencial que toda veterinária pergunta
3. **Toggle alergias/condições** — UX que Carolina enfatizou

### P1 — Alta Prioridade
4. **Nível de atividade** — campo simples mas impacta cálculo de ração
5. **Veterinários como entidade** — cadastrar vets de confiança separadamente
6. **Convênio pet** — campo simples
7. **Passeios / Banho / Creche** — módulo Rotina do pet
8. **Calendário visual** — view mensal com todos eventos

### P2 — Média Prioridade
9. **Database de rações** — grande esforço, muito valor
10. **Calculadora de ração automática** — depende do database de rações
11. **Conteúdos de veterinários** — seção editorial
12. **PDF export no frontend** — backend tem endpoint

### P3 — Visão Futura
13. **E-commerce / marketplace** — conectar com lojas de ração
14. **Previsões de saúde com IA** — notificações proativas
15. **Push notifications reais** — SP5 (Capacitor)
16. **Produtos/preferências** — nice to have
