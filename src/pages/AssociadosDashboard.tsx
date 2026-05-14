import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAssociados } from '@/hooks/useAssociados';
import { useMensalidades } from '@/hooks/useMensalidades';
import { formatCurrency } from '@/lib/format';
import { Users, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const currentMM_YYYY = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function AssociadosDashboard() {
  const { data: associados = [] } = useAssociados();
  const { data: mensalidades = [] } = useMensalidades();

  const competencia = currentMM_YYYY();

  const stats = useMemo(() => {
    const today = new Date();
    const doMes = mensalidades.filter((m) => m.competencia === competencia);
    const aReceber = doMes.filter((m) => m.status !== 'pago').reduce((s, m) => s + Number(m.valor), 0);
    const recebido = doMes.filter((m) => m.status === 'pago').reduce((s, m) => s + Number(m.valor), 0);
    const inadimplentes = doMes.filter((m) => m.status === 'pendente' && new Date(m.vencimento + 'T23:59:59') < today);
    const inadValor = inadimplentes.reduce((s, m) => s + Number(m.valor), 0);
    const totalDoMes = doMes.reduce((s, m) => s + Number(m.valor), 0);
    const inadPct = totalDoMes > 0 ? (inadValor / totalDoMes) * 100 : 0;
    return {
      aReceber,
      recebido,
      inadValor,
      inadPct,
      ativos: associados.filter((a) => a.status === 'ativo').length,
    };
  }, [mensalidades, associados, competencia]);

  const porPosto = useMemo(() => {
    const doMes = mensalidades.filter((m) => m.competencia === competencia);
    const map = new Map<string, { posto: string; previsto: number; recebido: number }>();
    for (const m of doMes) {
      const a = associados.find((x) => x.id === m.associado_id);
      const k = a?.posto_graduacao || 'Não informado';
      const cur = map.get(k) || { posto: k, previsto: 0, recebido: 0 };
      cur.previsto += Number(m.valor);
      if (m.status === 'pago') cur.recebido += Number(m.valor);
      map.set(k, cur);
    }
    return Array.from(map.values());
  }, [mensalidades, associados, competencia]);

  const inadimplentes = useMemo(() => {
    const today = new Date();
    return mensalidades
      .filter((m) => m.status === 'pendente' && new Date(m.vencimento + 'T23:59:59') < today)
      .sort((a, b) => Number(b.valor) - Number(a.valor))
      .slice(0, 10);
  }, [mensalidades]);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Painel de Associados</h1>
            <p className="text-muted-foreground mt-1">Resumo de mensalidades — {competencia}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/associados">Associados</Link></Button>
            <Button asChild><Link to="/associados/mensalidades">Mensalidades</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Associados Ativos" value={String(stats.ativos)} icon={<Users className="w-5 h-5" />} accent="text-primary" />
          <Card title="A Receber no mês" value={formatCurrency(stats.aReceber)} icon={<Wallet className="w-5 h-5" />} accent="text-warning" />
          <Card title="Recebido no mês" value={formatCurrency(stats.recebido)} icon={<TrendingUp className="w-5 h-5" />} accent="text-success" />
          <Card title="Inadimplência" value={`${stats.inadPct.toFixed(1)}%`} subtitle={formatCurrency(stats.inadValor)} icon={<AlertTriangle className="w-5 h-5" />} accent="text-destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-display font-semibold mb-4">Receita por Posto/Graduação</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porPosto}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="posto" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend />
                  <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="recebido" name="Recebido" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-display font-semibold mb-4">Top 10 Inadimplentes</h3>
            <div className="space-y-2">
              {inadimplentes.length === 0 && <p className="text-sm text-muted-foreground">Sem inadimplência 🎉</p>}
              {inadimplentes.map((m) => {
                const a = associados.find((x) => x.id === m.associado_id);
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a?.nome || '—'}</p>
                      <p className="text-xs text-muted-foreground">{m.competencia} · venc. {m.vencimento.split('-').reverse().join('/')}</p>
                    </div>
                    <span className="text-destructive font-semibold">{formatCurrency(Number(m.valor))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Card({ title, value, subtitle, icon, accent }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-display font-bold mt-1 ${accent}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={accent}>{icon}</div>
      </div>
    </div>
  );
}
