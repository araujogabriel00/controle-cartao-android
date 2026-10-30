import { describe, expect, it } from 'vitest';
import { openApp, plain } from '@/test/app';
import { withCash } from '@/test/seeds';

const withForecast = async (s: import('@/test/app').Store) => {
  await withCash(s);
  await s.createForecast({ kind: 'receive', description: 'Freela', amount: 400, date: '2026-10-20', affects: false, recurring: false });
};

describe('Previsões', () => {
  it('o resumo mostra o saldo de hoje e o previsto sem contar o lembrete', async () => {
    const { screen } = await openApp('#/previsoes', withForecast);
    expect(plain((await screen.findByTestId('text-forecast-today')).textContent)).toContain('R$ 1.850,00');
    expect(plain(screen.getByTestId('text-forecast-projected').textContent)).toContain('R$ 1.850,00');
  });

  it('escolher um dia mostra a previsão dele', async () => {
    const { user, screen } = await openApp('#/previsoes', withForecast);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    expect(await screen.findByText('Freela')).toBeInTheDocument();
  });

  it('o botão Nova previsão abre o formulário', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withCash);
    await user.click(await screen.findByTestId('button-new-forecast'));
    await waitFor(() => expect(window.location.hash).toBe('#/previsoes/nova'));
    expect(await screen.findByTestId('form-forecast')).toBeInTheDocument();
  });

  it('cria uma previsão a receber pelo formulário', async () => {
    const { user, screen, store, waitFor } = await openApp('#/previsoes/nova', withCash);
    await user.type(await screen.findByTestId('input-forecast-description'), 'Bônus');
    await user.type(screen.getByTestId('input-forecast-amount'), '800');
    await user.clear(screen.getByTestId('input-forecast-date'));
    await user.type(screen.getByTestId('input-forecast-date'), '2026-10-25');
    await user.click(screen.getByTestId('button-save-forecast'));
    await waitFor(async () => expect((await store.getForecasts('2026-10')).items.map((i) => i.description)).toEqual(['Bônus']));
  });

  it('data passada no formulário mostra o erro', async () => {
    const { user, screen } = await openApp('#/previsoes/nova', withCash);
    await user.type(await screen.findByTestId('input-forecast-description'), 'Velha');
    await user.type(screen.getByTestId('input-forecast-amount'), '10');
    await user.clear(screen.getByTestId('input-forecast-date'));
    await user.type(screen.getByTestId('input-forecast-date'), '2026-10-01');
    await user.click(screen.getByTestId('button-save-forecast'));
    expect(await screen.findByTestId('text-form-error')).toHaveTextContent(/anterior a hoje/i);
  });

  it('editar abre o formulário preenchido', async () => {
    const { user, screen, waitFor } = await openApp('#/previsoes', withForecast);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    await user.click(await screen.findByLabelText(/Editar previsão Freela/));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/previsoes\/editar\/\d+\/2026-10$/));
    expect(await screen.findByTestId('input-forecast-description')).toHaveValue('Freela');
  });
});
