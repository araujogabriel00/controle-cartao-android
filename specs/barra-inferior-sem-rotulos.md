# Spec — Barra inferior só com ícones (sem os rótulos de texto)

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 12/11/2026 |
| Escopo | `src/components/app-tabs.tsx`, `src/App.test.tsx` (e testes que procurem o texto dos itens), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md), [`previsoes.md`](previsoes.md) (5.º item da barra) |
| Substitui em parte | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md): D1 ("sempre com texto") e o item "rótulo de 12 px sempre visível" da seção Interface; RN-06 deixa de citar rótulos da barra entre as exceções de 12 px |
| Referência visual | Barra inferior das telas V2 do canvas, sem a linha de texto |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A barra inferior tem 5 itens (Início, Entradas, Previsões, Cartões, Benefícios), cada um com ícone e um rótulo de 12 px. **Pedido do usuário:** tirar os rótulos de texto da barra. **Objetivo:** a barra mostra só os ícones, sem perder acessibilidade (leitor de tela e toque continuam dizendo o nome da área) e sem mudar a navegação, as rotas ou o mês compartilhado.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | A barra inferior **não mostra mais o texto** dos itens. Ficam ícone (24 px) e a pílula `tint` no item ativo. | Pedido do usuário. |
| D2 | Cada item **continua com nome acessível**: `aria-label` com o nome da área ("Início", "Entradas", "Previsões", "Cartões", "Benefícios") e `aria-current="page"` no ativo. O rótulo **não** some para leitor de tela. | Nunca remover o nome de um controle; os testes e o TalkBack dependem dele. |
| D3 | O item ativo fica mais evidente que hoje: pílula de 64 × 32 px em `tint` e o ícone em `ink` (os inativos em `ink-soft`), sempre com **contorno de 2 px de espessura no traço do ícone ativo** (strokeWidth 2.4 contra 2 dos inativos). Nunca só cor. | Sem o texto, o estado ativo precisa de mais de uma pista. |
| D4 | A **altura da barra continua 72 px** mais a área segura, e o alvo de toque de cada item continua com **no mínimo 48 px**. | Evita mexer no botão Lançar, na folha de Previsões e nos espaçadores, que contam com 72 px. |
| D5 | Ao **pressionar e segurar** um item, o nome da área aparece como dica (`title`). | Ajuda a quem não reconhece um ícone, sem ocupar espaço. |
| D6 | Os ícones **não mudam**: Início (casa), Entradas (moedas), Previsões (calendário), Cartões (cartão), Benefícios (talheres). | Já são distintos entre si; trocar ícones seria outra decisão. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A barra inferior mostra 5 ícones e **nenhum texto visível** (D1). |
| RF-02 | Cada item tem `aria-label` com o nome da área e `title` com o mesmo nome (D2, D5). |
| RF-03 | O item da área ativa tem `aria-current="page"`, pílula `tint` de 64 × 32 px e traço do ícone mais grosso (D3). |
| RF-04 | A navegação não muda: tocar abre a área **no mês aberto** e tocar no item ativo volta à raiz dela (RF-02 de `redesign-v2-fundacao.md`). |
| RF-05 | Alvo de toque de cada item com no mínimo 48 × 48 px; altura da barra de 72 px mais a área segura (D4). |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nada mais muda: rotas, mês compartilhado, botão Lançar e as telas abertas a partir da barra continuam como estão. |
| RN-02 | `FUNCIONALIDADES.md` deixa de dizer que a barra tem texto; os cenários que citam "toco em Cartões na barra inferior" continuam valendo (o nome vem do `aria-label`). |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Barra inferior só com ícones

  Cenário: A barra não mostra texto
    Quando eu abro o app
    Então a barra inferior mostra 5 ícones
    E não há texto visível dentro da barra

  Cenário: Cada item tem nome para leitor de tela
    Então a barra tem os botões "Início", "Entradas", "Previsões", "Cartões" e "Benefícios" pelo nome acessível
    E cada um tem o nome também como dica ao segurar

  Cenário: Item ativo marcado
    Dado que estou em "Cartões"
    Então o item "Cartões" tem aria-current "page", a pílula e o ícone em traço mais grosso
    E os outros itens não

  Cenário: Navegar pela barra mantém o mês
    Dado que estou em outubro de 2026 em "Início"
    Quando eu toco no ícone de "Entradas"
    Então abre Entradas em outubro de 2026

  Cenário: Tocar no item ativo volta à raiz
    Dado que estou numa tela aberta a partir de Cartões
    Quando eu toco no ícone de "Cartões"
    Então abre a tela raiz de Cartões

  Cenário: Alvo de toque
    Então cada item da barra tem pelo menos 48 px de largura e de altura
```

### 4.1 Matriz de rastreabilidade

| Requisito / regra | Cenário(s) |
| ----------------- | ---------- |
| RF-01, D1 | A barra não mostra texto |
| RF-02, D2, D5 | Cada item tem nome para leitor de tela |
| RF-03, D3 | Item ativo marcado |
| RF-04, RN-01 | Navegar pela barra mantém o mês; Tocar no item ativo volta à raiz |
| RF-05, D4 | Alvo de toque |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nas rotas. Só muda o componente `AppTabs`.

## 6. Interface

- **Barra:** 72 px mais a área segura, 5 colunas iguais, borda superior de 1 px, fundo `surface` com leve transparência (como hoje).
- **Item:** botão com `aria-label` e `title`, ícone de 24 px centralizado; ativo com pílula `tint` de 64 × 32 px e traço do ícone de 2,4; inativo em `ink-soft` com traço 2.
- Sem o `<span>` do rótulo.

## 7. Fora de escopo

- Trocar ícones, mudar a quantidade de itens ou a altura da barra.
- Rótulos opcionais nas configurações (não é pedido; fica como possível evolução).
- Mudar o botão Lançar ou as folhas que ficam acima da barra.

## 8. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Cada cenário da seção 4 tem teste em `src/App.test.tsx` (ou teste do componente) e os testes que procuravam o texto da barra foram trocados por `getByRole('button', { name })`.
- [ ] Em 360 × 780, claro e escuro: nenhum texto na barra, pílula do item ativo visível, sem scroll horizontal.
- [ ] `FUNCIONALIDADES.md` e `README.md` atualizados (barra só com ícones; `redesign-v2-fundacao.md` D1 marcado como substituído).

## 9. Tarefas

1. `AppTabs`: remover o `<span>` com o texto, adicionar `aria-label` e `title`, ícone de 24 px e traço mais grosso no ativo.
2. Ajustar `src/App.test.tsx` e os testes que citem o texto da barra; adicionar os cenários novos.
3. `FUNCIONALIDADES.md` (seção 32 e as notas "as abas viraram a barra inferior") e `README.md`.
4. Rodar `test`, `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, 360 × 780, claro e escuro: conferir os 5 ícones e a pílula do item ativo.
2. Navegar entre as áreas e conferir o mês compartilhado.
3. Inspecionar os botões da barra (nome acessível) e conferir a dica ao segurar.
