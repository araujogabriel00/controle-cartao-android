import { describe, expect, it } from 'vitest';
import { openApp } from '@/test/app';

describe('Categorias', () => {
  it('sem categorias mostra o estado vazio', async () => {
    const { screen } = await openApp('#/categorias');
    expect(await screen.findByTestId('text-categories-empty')).toBeInTheDocument();
  });

  it('cria uma categoria', async () => {
    const { user, screen } = await openApp('#/categorias');
    await user.type(await screen.findByTestId('input-category-name'), 'Mercado');
    await user.click(screen.getByTestId('button-add-category'));
    expect(await screen.findByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('0 compras')).toBeInTheDocument();
  });

  it('renomeia uma categoria', async () => {
    const { user, screen } = await openApp('#/categorias', async (s) => { await s.createCategory({ name: 'Mercado' }); });
    await user.click(await screen.findByRole('button', { name: 'Renomear Mercado' }));
    const input = await screen.findByTestId('input-category-rename');
    await user.clear(input);
    await user.type(input, 'Supermercado');
    await user.click(screen.getByRole('button', { name: /salvar/i }));
    expect(await screen.findByText('Supermercado')).toBeInTheDocument();
    expect(screen.queryByText('Mercado')).not.toBeInTheDocument();
  });

  it('exclui uma categoria depois de confirmar', async () => {
    const { user, screen, store } = await openApp('#/categorias', async (s) => { await s.createCategory({ name: 'Mercado' }); });
    await user.click(await screen.findByRole('button', { name: 'Mais opções de Mercado' }));
    await user.click(await screen.findByRole('button', { name: /excluir/i }));
    await user.click(await screen.findByTestId('button-confirm-ok'));
    expect(await screen.findByTestId('text-categories-empty')).toBeInTheDocument();
    expect(await store.getCategories()).toEqual([]);
  });

  it('cancelar a confirmação mantém a categoria', async () => {
    const { user, screen } = await openApp('#/categorias', async (s) => { await s.createCategory({ name: 'Mercado' }); });
    await user.click(await screen.findByRole('button', { name: 'Mais opções de Mercado' }));
    await user.click(await screen.findByRole('button', { name: /excluir/i }));
    await user.click(await screen.findByTestId('button-confirm-cancel'));
    expect(screen.getByText('Mercado')).toBeInTheDocument();
  });
});
