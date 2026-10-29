import { type FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetForecastsQueryKey, useCreateForecast, useGetForecasts, useUpdateForecast,
  type ForecastInput, type ForecastKind, type ForecastPayAs, type IncomeScope,
} from '@workspace/api-client-react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { ScopeDialog } from '@/components/scope-dialog';
import { shortDate } from '@/components/forecast-parts';
import { areaPath, isMonthKey, monthOf, today } from '@/lib/format';

const KINDS: { value: ForecastKind; label: string; icon: typeof ArrowDownLeft }[] = [
  { value: 'receive', label: 'A receber', icon: ArrowDownLeft },
  { value: 'pay', label: 'A pagar', icon: ArrowUpRight },
];

function Switch({ id, label, checked, onChange, testId }: { id: string; label: string; checked: boolean; onChange: (value: boolean) => void; testId: string }) {
  return <div className="flex items-center justify-between gap-3">
    <span id={id} className="text-[15px] font-semibold text-ink">{label}</span>
    <button type="button" role="switch" data-testid={testId} aria-checked={checked} aria-labelledby={id} onClick={() => onChange(!checked)} className="grid h-12 w-14 shrink-0 place-items-center">
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-brand' : 'bg-line-strong'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}/></span>
    </button>
  </div>;
}

// specs/previsoes.md RF-05, RF-06: nova previsão e edição, em tela cheia. "Entra como" só aparece para "A pagar" que mexe no saldo;
// a previsão que se repete pergunta o alcance ao salvar. O botão "Salvar previsão" fica fixo no rodapé.
export default function PrevisaoForm({ forecastId, month }: { forecastId?: number; month?: string }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const editing = forecastId !== undefined && month !== undefined && isMonthKey(month);
  const found = useGetForecasts(editing ? month : today().slice(0, 7), { query: { queryKey: getGetForecastsQueryKey(editing ? month : today().slice(0, 7)), enabled: editing } });
  const occurrence = editing ? found.data?.items.find((item) => item.forecastId === forecastId) : undefined;

  const [kind, setKind] = useState<ForecastKind>('receive');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [affects, setAffects] = useState(true);
  const [payAs, setPayAs] = useState<ForecastPayAs>('bill');
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeAsk, setScopeAsk] = useState(false);
  const [loaded, setLoaded] = useState(!editing);

  // Na edição, o formulário começa com os dados da ocorrência aberta.
  useEffect(() => {
    if (!occurrence || loaded) return;
    setKind(occurrence.kind); setDescription(occurrence.description); setAmount(String(occurrence.amount)); setDate(occurrence.date);
    setAffects(occurrence.affects); setPayAs(occurrence.payAs ?? 'bill'); setRecurring(occurrence.recurring);
    setLoaded(true);
  }, [occurrence, loaded]);

  const goBack = () => { if (window.history.length > 1) window.history.back(); else navigate(areaPath('forecasts', monthOf(date))); };
  const done = () => { void client.invalidateQueries(); navigate(areaPath('forecasts', monthOf(date))); };
  const create = useCreateForecast({ mutation: { onSuccess: done, onError: (e) => setError(e.message) } });
  const update = useUpdateForecast({ mutation: { onSuccess: done, onError: (e) => setError(e.message) } });
  const busy = create.isPending || update.isPending;

  const data = (): ForecastInput => ({ kind, description, amount: Number(amount.replace(',', '.')), date, affects, payAs: kind === 'pay' && affects ? payAs : null, recurring });
  const save = (scope: IncomeScope) => {
    setError(null);
    if (editing && occurrence) update.mutate({ forecastId: occurrence.forecastId, month: occurrence.month, scope, data: data() });
    else create.mutate({ data: data() });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (editing && occurrence?.recurring) { setScopeAsk(true); return; }
    save('forward');
  };

  // O texto de ajuda diz o que acontece com a chave (RF-05).
  const help = affects
    ? `Entra no saldo sozinha. No dia ${shortDate(date)} esta previsão passa a valer. Se não acontecer, apague.`
    : 'Só um lembrete. Aparece no calendário, mas não muda o saldo. Se acontecer, toque em Colocar no saldo.';

  return <main className="notebook-grain min-h-safe bg-paper pb-32 text-ink">
    <form id="forecast-form" data-testid="form-forecast" onSubmit={submit} noValidate className="relative z-10 mx-auto max-w-[560px] px-4 pt-5 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px] leading-tight text-ink">{editing ? 'Editar previsão' : 'Nova previsão'}</h1>
        <button type="button" aria-label="Fechar" data-testid="button-close-forecast" onClick={goBack} className="-mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-hover"><X size={22}/></button>
      </div>

      {editing && found.isLoading ? <div aria-busy="true" className="mt-6 h-[320px] animate-pulse rounded-2xl bg-line"/>
        : editing && !occurrence ? <p data-testid="text-forecast-missing" className="mt-6 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-[15px] text-ink-soft">Esta previsão não existe mais. <button type="button" onClick={() => navigate('/previsoes')} className="font-semibold text-brand underline underline-offset-4">Voltar às previsões</button></p>
        : <div className="mt-5 space-y-5">
          <div role="radiogroup" aria-label="Tipo da previsão" className="grid grid-cols-2 gap-2">
            {KINDS.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="radio" aria-checked={kind === value} data-testid={`kind-${value}`} onClick={() => setKind(value)} className={`flex h-12 items-center justify-center gap-2 rounded-full border text-[15px] font-semibold transition ${kind === value ? 'border-brand bg-tint text-brand' : 'border-line bg-surface text-ink-soft hover:bg-hover'}`}><Icon aria-hidden size={18}/>{label}</button>)}
          </div>

          <div>
            <label className="field-label" htmlFor="forecast-description">Descrição</label>
            <input id="forecast-description" data-testid="input-forecast-description" maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Salário, aluguel, venda do notebook" className="field-input"/>
          </div>
          <div>
            <label className="field-label" htmlFor="forecast-amount">Valor</label>
            <div className="relative"><span className="absolute left-4 top-[13px] text-ink-mute">R$</span><input id="forecast-amount" data-testid="input-forecast-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="field-input pl-12"/></div>
          </div>
          <div>
            <label className="field-label" htmlFor="forecast-date">Data prevista</label>
            <input id="forecast-date" data-testid="input-forecast-date" type="date" min={editing ? undefined : today()} value={date} onChange={(e) => setDate(e.target.value)} className="field-input"/>
          </div>

          <div className="rounded-2xl border border-line bg-surface px-4 py-2">
            <Switch id="forecast-affects-label" label="Mexe no saldo no dia" checked={affects} onChange={setAffects} testId="switch-affects"/>
            <p data-testid="text-affects-help" className="pb-2 text-[14px] leading-5 text-ink-soft">{help}</p>
          </div>

          {kind === 'pay' && affects && <div>
            <label className="field-label" htmlFor="forecast-pay-as">Entra como</label>
            <select id="forecast-pay-as" data-testid="select-pay-as" value={payAs} onChange={(e) => setPayAs(e.target.value as ForecastPayAs)} className="field-input">
              <option value="bill">Contas fixas</option>
              <option value="daily">Gastos do dia a dia</option>
            </select>
            <p className="mt-1.5 text-[14px] text-ink-soft">Em qual linha de Entradas o valor soma quando o dia chegar.</p>
          </div>}

          <div className="rounded-2xl border border-line bg-surface px-4 py-2">
            <Switch id="forecast-repeat-label" label="Repetir todo mês" checked={recurring} onChange={setRecurring} testId="switch-repeat"/>
            {recurring && <p className="pb-2 text-[14px] leading-5 text-ink-soft">Cai no mesmo dia de cada mês, sem data final. Para parar, apague “deste mês em diante”.</p>}
          </div>

          {error && <p role="alert" data-testid="text-form-error" className="rounded-xl bg-alert-tint px-3 py-2.5 text-[14px] leading-5 text-alert">{error}</p>}
        </div>}
    </form>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(12px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] backdrop-blur">
      <button type="submit" form="forecast-form" data-testid="button-save-forecast" disabled={busy || (editing && !occurrence)} className="mx-auto block h-14 w-full max-w-[560px] rounded-full bg-brand text-[16px] font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60">{busy ? 'Salvando…' : 'Salvar previsão'}</button>
    </div>

    {scopeAsk && occurrence && <ScopeDialog subject="previsão" action="edit" month={occurrence.month} onChoose={(scope) => { setScopeAsk(false); save(scope); }} onClose={() => setScopeAsk(false)}/>}
  </main>;
}
