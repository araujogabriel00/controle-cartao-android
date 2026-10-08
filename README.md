# Controle do Cartão — Android

Versão Android do [Controle do Cartão](../controle-cartao): mesma interface do app web, empacotada com [Capacitor](https://capacitorjs.com) e com **todos os dados salvos no próprio celular**, sem servidor nem internet.

As funcionalidades estão descritas em BDD em [`../controle-cartao/FUNCIONALIDADES.md`](../controle-cartao/FUNCIONALIDADES.md).

## Como funciona

- A interface (`src/pages/dashboard.tsx`, `src/index.css`) é a mesma do app web.
- O pacote `@workspace/api-client-react`, que no app web chama a API, aqui é um **alias** para `src/data/api.ts`. Esse módulo exporta os mesmos hooks (`useGetCard`, `useCreateMovement`, …), mas lê e grava localmente.
- `src/data/store.ts` guarda o estado em um único JSON (chave `controle-cartao:v1`) usando o [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences). No Android ele usa o SharedPreferences; no navegador, o `localStorage`.
- As fontes (Fraunces, DM Sans e DM Mono) vêm junto com o app via `@fontsource`, então funcionam offline.

### Regras de cálculo

| Valor | Cálculo |
| ----- | ------- |
| Usado da categoria | soma dos lançamentos da categoria |
| Disponível da categoria | orçamento − usado |
| **Já comprometido (cartão)** | soma dos orçamentos das categorias **abertas** + soma do que foi gasto nas categorias **fechadas** |
| Disponível para usar | limite − comprometido |
| Orçamentos em aberto | soma dos orçamentos das categorias abertas |
| Categorias fechadas | soma do gasto nas categorias fechadas |

Uma categoria aberta reserva o orçamento inteiro no cartão. Ao ser fechada, ela libera a sobra e deixa comprometido só o valor gasto. Categorias fechadas não aceitam novos lançamentos nem alterações nos existentes. Remover o cartão apaga todas as categorias e lançamentos.

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
│   │   ├── store.ts        # armazenamento local, validações e cálculos
│   │   └── api.ts          # hooks compatíveis com @workspace/api-client-react
│   ├── pages/dashboard.tsx # tela principal (igual ao app web)
│   └── ...
├── capacitor.config.ts     # appId br.pessoal.controlecartao, barras do sistema
├── vite.config.ts          # alias do api-client, base relativa
└── android/                # projeto nativo gerado pelo Capacitor
```
