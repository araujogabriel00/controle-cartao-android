import { describe, expect, it } from 'vitest';
import {
  areaOf, areaPath, benefitSpendsPath, currentMonth, defaultDateFor, forecastDayPath, isFutureMonth,
  isMonthKey, lastDayOf, listPath, monthInPath, plural, shiftMonth, today,
} from '@/lib/format';

describe('calendário', () => {
  it('usa a data local fixada', () => {
    expect(today()).toBe('2026-10-15');
    expect(currentMonth()).toBe('2026-10');
  });

  it('shiftMonth atravessa o ano', () => {
    expect(shiftMonth('2026-10', 3)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('isMonthKey valida o formato', () => {
    expect(isMonthKey('2026-10')).toBe(true);
    expect(isMonthKey('2026-13')).toBe(false);
    expect(isMonthKey('2026-1')).toBe(false);
  });

  it('isFutureMonth compara com o mês atual', () => {
    expect(isFutureMonth('2026-11')).toBe(true);
    expect(isFutureMonth('2026-10')).toBe(false);
  });

  it('lastDayOf respeita ano bissexto', () => {
    expect(lastDayOf('2028-02')).toBe('2028-02-29');
    expect(lastDayOf('2027-02')).toBe('2027-02-28');
  });

  it('defaultDateFor: hoje no mês atual, senão o último dia', () => {
    expect(defaultDateFor('2026-10')).toBe('2026-10-15');
    expect(defaultDateFor('2026-09')).toBe('2026-09-30');
  });

  it('plural', () => {
    expect(plural(1, 'compra', 'compras')).toBe('1 compra');
    expect(plural(2, 'compra', 'compras')).toBe('2 compras');
  });
});

describe('rotas', () => {
  it('o mês atual fica na rota curta da área', () => {
    expect(areaPath('home', '2026-10')).toBe('/');
    expect(areaPath('cards', '2026-10')).toBe('/cartoes');
    expect(areaPath('forecasts', '2026-11')).toBe('/previsoes/mes/2026-11');
  });

  it('areaOf identifica a aba', () => {
    expect(areaOf('/')).toBe('home');
    expect(areaOf('/entradas/lista/gastos')).toBe('income');
    expect(areaOf('/previsoes/saldo')).toBe('forecasts');
    expect(areaOf('/historico')).toBeNull();
  });

  it('listPath e benefitSpendsPath carregam o mês no fim', () => {
    expect(listPath('gastos', '2026-10')).toBe('/entradas/lista/gastos');
    expect(listPath('gastos', '2026-09')).toBe('/entradas/lista/gastos/mes/2026-09');
    expect(benefitSpendsPath(3, 'sem', '2026-09')).toBe('/beneficios/lancamentos/3/sem/mes/2026-09');
  });

  it('monthInPath lê o mês do endereço, inclusive do dia de Previsões', () => {
    expect(monthInPath('/cartoes/mes/2026-08')).toBe('2026-08');
    expect(monthInPath(forecastDayPath('2026-12-05'))).toBe('2026-12');
    expect(monthInPath('/cartoes')).toBe('2026-10');
  });
});
