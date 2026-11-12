import { describe, expect, it } from 'vitest';
import { openApp } from '@/test/app';
import { withCard, withCash } from '@/test/seeds';

describe('rotas e guardas', () => {
  const goesTo = async (from: string, to: string, seed = withCash) => {
    const app = await openApp(from, seed);
    await app.waitFor(() => expect(window.location.hash).toBe(to));
    return app;
  };

  it('abre o Início na raiz', async () => {
    const { screen } = await openApp('#/', withCash);
    expect(await screen.findByTestId('text-home-balance')).toBeInTheDocument();
  });

  it('rota desconhecida mostra a tela de não encontrado', async () => {
    const { screen } = await openApp('#/nao-existe', withCash);
    expect(await screen.findByText(/404 Page Not Found/)).toBeInTheDocument();
  });

  it('/mes/:mes redireciona para Cartões no mesmo mês', async () => {
    const { screen } = await goesTo('#/mes/2026-09', '#/cartoes/mes/2026-09');
    expect(await screen.findByTestId('text-month')).toHaveTextContent(/setembro de 2026/i);
  });

  it('mês inválido em Cartões volta ao mês atual', async () => {
    await goesTo('#/cartoes/mes/lixo', '#/cartoes');
  });

  it('mês futuro sem compra prevista volta ao mês atual', async () => {
    await goesTo('#/cartoes/mes/2027-09', '#/cartoes');
  });

  it('o mês atual na rota longa vai para a rota curta', async () => {
    await goesTo('#/cartoes/mes/2026-10', '#/cartoes');
  });

  it('lista de Entradas desconhecida volta para a aba', async () => {
    await goesTo('#/entradas/lista/xyz', '#/entradas');
  });

  it('mês de Entradas além do intervalo vai para o mais próximo', async () => {
    const app = await openApp('#/entradas/mes/2030-01', withCash);
    await app.waitFor(() => expect(window.location.hash).toMatch(/^#\/entradas\/mes\/2027-10$/));
  });

  it('dia de Previsões inválido volta para a área', async () => {
    await goesTo('#/previsoes/dia/2026-13-45', '#/previsoes');
  });

  it('benefício inexistente volta para Benefícios', async () => {
    await goesTo('#/beneficios/lancamentos/999/todos', '#/beneficios');
  });

  it('a barra de baixo navega entre as áreas', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCard);
    await user.click(await screen.findByTestId('tab-cards'));
    await waitFor(() => expect(window.location.hash).toBe('#/cartoes'));
    await user.click(screen.getByTestId('tab-income'));
    await waitFor(() => expect(window.location.hash).toBe('#/entradas'));
    await user.click(screen.getByTestId('tab-forecasts'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes'));
    await user.click(screen.getByTestId('tab-benefits'));
    await waitFor(() => expect(window.location.hash).toBe('#/beneficios'));
    await user.click(screen.getByTestId('nav-home'));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  // specs/barra-inferior-sem-rotulos.md
  it('a barra mostra só ícones, com nome acessível e dica em cada item', async () => {
    const { screen } = await openApp('#/', withCard);
    const nav = await screen.findByRole('navigation', { name: 'Áreas do app' });
    const buttons = Array.from(nav.querySelectorAll('button'));
    expect(buttons).toHaveLength(5);
    expect(nav.textContent).toBe('');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Início', 'Entradas', 'Previsões', 'Cartões', 'Benefícios']);
    expect(buttons.map((b) => b.getAttribute('title'))).toEqual(['Início', 'Entradas', 'Previsões', 'Cartões', 'Benefícios']);
    buttons.forEach((b) => expect(b).toHaveClass('min-h-12', 'min-w-12'));
  });

  it('só o item da área ativa tem aria-current e o traço mais grosso', async () => {
    const { screen } = await openApp('#/cartoes', withCard);
    const nav = await screen.findByRole('navigation', { name: 'Áreas do app' });
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-label', 'Cartões');
    expect(current[0].querySelector('svg')).toHaveAttribute('stroke-width', '2.4');
    expect(nav.querySelector('[data-testid="tab-income"] svg')).toHaveAttribute('stroke-width', '2');
  });

  it('navegar pela barra mantém o mês aberto', async () => {
    const { user, screen, waitFor } = await openApp('#/', withCard);
    await user.click(await screen.findByRole('button', { name: 'Entradas' }));
    await waitFor(() => expect(window.location.hash).toBe('#/entradas'));
  });
});
