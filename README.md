# Controle do Cartão — Android

Versão Android do [Controle do Cartão](../controle-cartao): mesma interface do app web, empacotada com [Capacitor](https://capacitorjs.com) e com **todos os dados salvos no próprio celular**, sem servidor nem internet.

As funcionalidades estão descritas em BDD em [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md), e as especificações de cada uma ficam em [`specs/`](specs).

## Como funciona

- A interface (`src/pages/dashboard.tsx`, `src/index.css`) é a mesma do app web.
- O pacote `@workspace/api-client-react`, que no app web chama a API, aqui é um **alias** para `src/data/api.ts`. Esse módulo exporta os mesmos hooks (`useGetCard`, `useCreateMovement`, …), mas lê e grava localmente.
- `src/data/store.ts` guarda o estado em um único JSON (chave `controle-cartao:v1`, formato `version: 10`) usando o [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences). No Android ele usa o SharedPreferences; no navegador, o `localStorage`.
- As fontes (Fraunces, DM Sans e DM Mono) vêm junto com o app via `@fontsource`, então funcionam offline.

### Compras e categorias

A especificação completa está em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

- As compras são registradas **direto no cartão**, sem planejamento prévio, e o cartão **não tem limite**: o que importa é o total da **fatura** do mês ([`specs/cartao-sem-limite.md`](specs/cartao-sem-limite.md)).
- A **categoria é opcional** e vem de uma lista **global**, a mesma para todos os cartões. Ela só classifica: não tem orçamento, mês nem estado aberto/fechado. Excluir uma categoria deixa as compras dela "Sem categoria".
- A tela do cartão mostra a lista de compras do mês, o filtro por categoria e o resumo por categoria. As categorias são gerenciadas num lugar só, a tela "Categorias" (`#/categorias`, em [`specs/tela-de-categorias.md`](specs/tela-de-categorias.md)), aberta pelo botão "Categorias" de cada aba.

### Botão Lançar

- Um **menu de rodapé** (nas abas Entradas, Cartões e Benefícios) tem o ícone de **categorias** (abre `#/categorias`) e o botão **"+"**, só com o ícone, que abre os formulários de entrada, conta fixa, gasto do dia a dia, compra no cartão e gasto de benefício no mês aberto, sem trocar de aba ([`specs/botao-lancar.md`](specs/botao-lancar.md)).

### Histórico mensal

- O acesso ao Histórico fica na **face de cada cartão** (botão ao lado de editar e remover), e a aba Cartões não tem botão "Atualizar" ([`specs/historico-no-cartao.md`](specs/historico-no-cartao.md)).

Os dados são organizados por **cartão** e, dentro de cada cartão, por **mês do calendário**: a data da compra define o mês dela. As especificações completas estão em [`specs/historico-mensal.md`](specs/historico-mensal.md) e [`specs/multiplos-cartoes.md`](specs/multiplos-cartoes.md).

- O app aceita vários cartões, cada um com nome, cor, meses e compras próprios. A troca é feita num carrossel horizontal no estilo das carteiras digitais, e o app lembra o último cartão usado.
- Com 2 cartões ou mais, o histórico ganha, em cada mês, a linha "Todos os cartões" com o total das faturas.
- `#/` mostra o mês corrente, `#/mes/AAAA-MM` mostra outro mês e `#/historico` lista todos os meses com seus totais. As rotas usam hash porque o bundle tem base relativa.
- **O mês é o mesmo nas três abas** ([`specs/mes-compartilhado.md`](specs/mes-compartilhado.md)): o seletor de mês fica acima da barra de abas e trocar de aba mantém o mês (`#/entradas/mes/AAAA-MM`, `#/beneficios/mes/AAAA-MM`). Se a aba de destino não abre aquele mês, abre o mais próximo. O app **lembra o último mês aberto** (só um mês que não é o corrente) e abre a aba Cartões nele; "Voltar para o mês atual" apaga a lembrança, e um endereço com mês vale mais que ela.
- Na virada do mês, o mês novo começa sozinho, sem perguntar nada.
- Meses passados continuam editáveis. Um mês futuro abre até o último mês que tenha parcela prevista ou compra registrada: mostra as parcelas previstas e as compras já registradas, e aceita "Registrar compra", mas não é iniciado até chegar.
- Dados dos formatos antigos são migrados automaticamente na primeira abertura: `version: 1` vai para o mês corrente, o cartão único da `version: 2` vira o primeiro cartão (verde) da `version: 3`, a `version: 4` acrescenta a lista vazia de compras parceladas, a `version: 5` acrescenta as listas vazias de entradas, a `version: 6` troca as categorias-envelope por categorias globais (os lançamentos viram compras no cartão em que estavam; orçamentos e o estado aberto/fechado são descartados), a `version: 7` acrescenta as listas vazias de benefícios, a `version: 8` acrescenta as listas vazias de contas fixas e de gastos do dia a dia, a `version: 9` acrescenta as listas vazias de compras recorrentes, e a `version: 10` apaga o limite dos cartões e dos meses.

### Parcelamento

A especificação completa está em [`specs/parcelamento.md`](specs/parcelamento.md).

- Uma compra parcelada guarda o valor total, o nº de parcelas, a parcela inicial e a categoria. A divisão é feita em centavos, e o resto fica na parcela 1.
- Cada parcela vira uma **compra comum** no mês em que cai, na categoria da compra parcelada. A compra parcelada não aceita data em mês futuro.
- As parcelas de meses futuros não são gravadas: elas são calculadas a partir da compra e gravadas quando o mês começa.
- Editar ou excluir uma parcela muda a compra inteira, todas as parcelas.

### Entradas

A especificação completa está em [`specs/entradas.md`](specs/entradas.md).

- Salário, pró-labore e bônus ficam na aba **Entradas** (`#/entradas`, `#/entradas/mes/AAAA-MM`), separada dos cartões. As entradas são globais por mês e **não entram em nenhum cálculo dos cartões**.
- Uma entrada pode se repetir todo mês, com mês final opcional. Os meses são calculados a partir da regra e não ficam gravados. Editar ou excluir uma ocorrência pergunta se vale "Só este mês" ou "Este e os próximos".
- A navegação vai do mês da entrada mais antiga até 12 meses à frente.

### Compra recorrente

A especificação completa está em [`specs/compra-recorrente.md`](specs/compra-recorrente.md).

- Uma compra recorrente (assinatura) guarda a descrição, o valor mensal, o dia, a categoria opcional, o mês inicial e o mês final opcional. Cadastra-se pelo interruptor "Compra recorrente" do "Registrar compra" (não fica ligado junto com "Compra parcelada").
- Funciona como o parcelamento: cada cobrança até o mês corrente é gravada como **compra comum** (selo "Mensal"), e as dos meses futuros são **previstas** (calculadas, até 12 meses à frente) e já entram na fatura prevista, na prévia de meses e nos "Próximos meses" do Histórico.
- Editar ou excluir uma cobrança pergunta "Só este mês" ou "Este e os próximos", como nas entradas e contas fixas. Um reajuste vale daqui em diante sem reescrever o passado.

### Contas fixas, gastos do dia a dia e saldo

A especificação completa está em [`specs/contas-e-gastos.md`](specs/contas-e-gastos.md). Tudo fica na aba **Entradas** (`#/entradas`).

- **Conta fixa** (aluguel, internet…): despesa mensal com nome, valor, dia e mês final opcional. Como as entradas recorrentes, os meses são calculados e editar ou excluir pergunta "Só este mês" ou "Este e os próximos".
- **Gasto do dia a dia**: despesa avulsa (descrição, valor, data) com categoria global opcional e um resumo por categoria no mês. Aceita datas até 12 meses à frente.
- **Resultado do mês** = entradas − contas fixas − gastos do dia a dia − o total das faturas no mês. O **Saldo** do mês é o **Saldo anterior + o resultado**, e passa para o mês seguinte: a sobra e a falta acumulam. O saldo anterior é a soma dos resultados desde o primeiro mês com entrada, conta fixa ou gasto (os cartões não definem o início), calculada a cada leitura, e os meses futuros projetam o saldo. A tela **só lê** os cartões: nada daqui altera cartões, compras ou benefícios, e os benefícios não entram no saldo.

### Benefícios

A especificação completa está em [`specs/beneficios.md`](specs/beneficios.md).

- Um benefício (VR, VA…) é um **saldo mensal** com nome, valor mensal, mês inicial e mês final opcional. Fica na aba **Benefícios** (`#/beneficios`, `#/beneficios/mes/AAAA-MM`), **independente dos cartões e das entradas**: um gasto de benefício não usa o limite de cartão.
- **Disponível** do mês = sobra anterior + crédito do mês − gasto do mês. A sobra acumula de um mês para o outro e pode ficar negativa.
- O valor mensal tem histórico: alterar o valor "a partir de um mês" vale daquele mês em diante, sem mexer nos anteriores. O mês inicial não muda depois de criado.
- Os gastos são avulsos (descrição, valor, data) com categoria global opcional, e só aceitam datas dentro do período do benefício.
- Um benefício pode ser **dividido por categoria**, como eram os envelopes: cada categoria reserva uma parte do valor mensal e tem a sua própria sobra, e o que não é dividido aparece como "Sem categoria". A divisão (livre, nunca acima do valor) repete todo mês e tem histórico, como o valor. Sem divisão, o benefício é um saldo só.
- Dá para **fechar** uma categoria dentro do benefício: a sobra dela é liberada para "Sem categoria", a linha congela e não recebe mais gastos. Também dá para reabrir (a categoria volta com sobra zero).
- A navegação vai do mês do benefício mais antigo até 12 meses à frente.

### Regras de cálculo

Todos os valores abaixo são calculados **por cartão e dentro de um mês**, só com as compras daquele cartão naquele mês. O total das faturas soma a fatura de cada cartão.

| Valor | Cálculo |
| ----- | ------- |
| **Fatura (cartão)** | soma das compras do cartão no mês. Num mês futuro, soma também as parcelas e as cobranças previstas |
| **Total das faturas** | soma das faturas de todos os cartões no mês |
| Resumo por categoria | soma das compras de cada categoria no mês e a participação no total; compras sem categoria ficam em "Sem categoria" |
| **Resultado do mês** (aba Entradas) | entradas − contas fixas − gastos do dia a dia − total das faturas, só do mês |
| **Saldo do mês** (aba Entradas) | saldo anterior (soma dos resultados dos meses antes) + resultado do mês |

Não existe limite nem reserva de orçamento: só contam as compras de fato lançadas. Remover um cartão apaga os meses, as compras e as compras parceladas dele, sem alterar os outros cartões nem as categorias.

## Como adicionar uma funcionalidade

O projeto segue *spec-driven development*. Para cada nova funcionalidade:

1. Crie uma spec nova em `specs/<nome-da-funcionalidade>.md` antes de escrever código, usando [`specs/historico-mensal.md`](specs/historico-mensal.md) como modelo.
2. Implemente seguindo as tarefas da spec e, ao terminar, marque o Status como `Implementada`.
3. Atualize o [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) no mesmo PR: uma seção nova para a funcionalidade, com link para a spec, e ajustes nos cenários existentes que mudaram.

O passo a passo completo está no [`CLAUDE.md`](CLAUDE.md).

## Pré-requisitos

- Node.js 20 ou mais recente
- Android Studio, com o Android SDK em `%LOCALAPPDATA%\Android\Sdk`
- **JDK 21** para o Gradle. O JDK 25 que vem com o Android Studio recente não é suportado pelo Gradle 8.14 do projeto e dá o erro `Unsupported class file major version 69`.

## Desenvolvimento no navegador

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
```

## Gerar e instalar o app Android

```bash
npm run build
npx cap sync android
```

Gerar o APK de debug (PowerShell):

```powershell
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\azul-21.0.12.1"   # qualquer JDK 21
cd android
.\gradlew.bat assembleDebug
```

O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Para instalar em um celular com depuração USB ativada ou no emulador:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Também dá para abrir o projeto no Android Studio com `npx cap open android` e rodar por lá. Nesse caso, configure o Gradle JDK para a versão 21 em *Settings → Build Tools → Gradle*.

> `android/local.properties` aponta para o SDK nesta máquina. Ajuste o caminho se for compilar em outro computador.

## Estrutura

```
├── src/
│   ├── data/
│   │   ├── store.ts        # armazenamento local, validações, cálculos e migração
│   │   └── api.ts          # hooks compatíveis com @workspace/api-client-react
│   ├── lib/format.ts       # formatação de valores, datas e meses; caminho de cada aba num mês
│   ├── lib/last-month.ts   # último mês aberto (lembrado fora do estado)
│   ├── lib/card-colors.ts  # paleta de cores dos cartões
│   ├── components/card-carousel.tsx # carrossel de cartões
│   ├── components/app-tabs.tsx # abas Entradas | Cartões | Benefícios
│   ├── components/month-nav.tsx # seletor de mês, acima das abas
│   ├── pages/dashboard.tsx # painel de um mês
│   ├── pages/historico.tsx # lista de meses
│   ├── pages/entradas.tsx  # entradas do mês
│   ├── pages/beneficios.tsx # benefícios do mês
│   ├── pages/categorias.tsx # criar, renomear e excluir categorias
│   └── ...
├── specs/                  # especificações das funcionalidades
├── capacitor.config.ts     # appId br.pessoal.controlecartao, barras do sistema
├── vite.config.ts          # alias do api-client, base relativa
└── android/                # projeto nativo gerado pelo Capacitor
```
