type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

/**
 * Embudo de visitantes: en qué parte del camino se quedan. Cada barra mide
 * su ancho contra el primer paso (llegan a la página); el número chico de
 * abajo es cuánto avanza respecto del paso anterior, no del total.
 * Server component: los datos ya vienen calculados desde app/admin/page.tsx.
 */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.count ?? 0;

  return (
    <div className="admin-funnel" role="img" aria-label={funnelSummary(steps)}>
      {steps.map((step, i) => {
        const pctOfTop = top > 0 ? (step.count / top) * 100 : 0;
        const prevCount = i > 0 ? steps[i - 1].count : null;
        const pctOfPrev = prevCount && prevCount > 0 ? (step.count / prevCount) * 100 : null;
        const barWidth = top > 0 ? Math.max(pctOfTop, step.count > 0 ? 3 : 0) : 0;

        return (
          <div className="admin-funnel-step" key={step.key}>
            <div className="admin-funnel-row">
              <span className="admin-funnel-label">{step.label}</span>
              <span className="admin-funnel-count">
                {step.count}
                {pctOfPrev !== null && (
                  <em>{pctOfPrev.toFixed(0)}% del paso anterior</em>
                )}
              </span>
            </div>
            <div className="admin-funnel-track">
              <div className="admin-funnel-fill" style={{ width: `${barWidth}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function funnelSummary(steps: FunnelStep[]): string {
  return "Embudo de visitantes: " + steps.map((s) => `${s.label} ${s.count}`).join(", ");
}
