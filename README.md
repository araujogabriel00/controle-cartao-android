# Controle do Cartão — Android

Versão Android do [Controle do Cartão](../controle-cartao): mesma interface do app web, empacotada com [Capacitor](https://capacitorjs.com) e com **todos os dados salvos no próprio celular**, sem servidor nem internet.

As funcionalidades estão descritas em BDD em [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md), e o histórico mensal em [`specs/historico-mensal.md`](specs/historico-mensal.md).

## Como funciona

- A interface (`src/pages/dashboard.tsx`, `src/index.css`) é a mesma do app web.
- O pacote `@workspace/api-client-react`, que no app web chama a API, aqui é um **alias** para `src/data/api.ts`. Esse módulo exporta os mesmos hooks (`useGetCard`, `useCreateMovement`, …), mas lê e grava localmente.
- `src/data/store.ts` guarda o estado em um único JSON (chave `controle-cartao:v1`, formato `version: 2`) usando o [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences). No Android ele usa o SharedPreferences; no navegador, o `localStorage`.
- As fontes (Fraunces, DM Sans e DM Mono) vêm junto com o app via `@fontsource`, então funcionam offline.

### Histórico mensal

Os dados são organizados por **mês do calendário**. A especificação completa está em [`specs/historico-mensal.md`](specs/historico-mensal.md).

- Cada categoria pertence a um mês, e um lançamento só aceita data dentro do mês da sua categoria.
- `#/` mostra o mês corrente, `#/mes/AAAA-MM` mostra um mês passado e `#/historico` lista todos os meses com seus totais. As rotas usam hash porque o bundle tem base relativa.
- Na virada do mês, o app pergunta se quer copiar as categorias do mês anterior (abertas e sem lançamentos) ou começar do zero. Se o mês anterior não tinha categorias, o novo mês começa vazio sem perguntar.
- Cada mês guarda o limite do cartão da época. Editar o limite muda só o mês corrente.
- Meses passados continuam editáveis; o que bloqueia alterações é a categoria estar fechada. Meses futuros não podem ser abertos.
- Dados do formato antigo (`version: 1`) são migrados automaticamente para o mês corrente na primeira abertura.

### Regras de cálculo

Todos os valores abaixo são calculados **dentro de um mês**, só com as categorias daquele mês.

| Valor | Cálculo |
| ----- | ------- |
| Usado da categoria | soma dos lançamentos da categoria |
| Disponível da categoria | orçamento − usado |
| **Valor do mês** | soma de todos os lançamentos do mês |
| **Já comprometido (cartão)** | soma dos orçamentos das categorias **abertas** + soma do que foi gasto nas categorias **fechadas** |
| Disponível para usar | limite do mês − comprometido |
| Orçamentos em aberto | soma dos orçamentos das categorias abertas |
| Categorias fechadas | soma do gasto nas categorias fechadas |

Uma categoria aberta reserva o orçamento inteiro no cartão. Ao ser fechada, ela libera a sobra e deixa comprometido só o valor gasto. Categorias fechadas não aceitam novos lançamentos nem alterações nos existentes. Remover o cartão apaga todos os meses, categorias e lançamentos.

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
│   ├── lib/format.ts       # formatação de valores, datas e meses
│   ├── pages/dashboard.tsx # painel de um mês
│   ├── pages/historico.tsx # lista de meses
│   └── ...
├── specs/                  # especificações das funcionalidades
├── capacitor.config.ts     # appId br.pessoal.controlecartao, barras do sistema
├── vite.config.ts          # alias do api-client, base relativa
└── android/                # projeto nativo gerado pelo Capacitor
```
