import { useState } from 'react';

interface OmenParameter {
  name: string;
  value: number;
  targetValue: number;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
}

interface Props {
  data?: { parameters: OmenParameter[] };
  onSave: (data: { parameters: OmenParameter[] }) => void;
}

export default function OmenEditor({ data, onSave }: Props) {
  const [params, setParams] = useState<OmenParameter[]>(
    data?.parameters || [
      { name: '命运之线', value: 50, targetValue: 60, warningLow: 30, warningHigh: 70, criticalLow: 10, criticalHigh: 90 },
      { name: '元素平衡', value: 40, targetValue: 50, warningLow: 25, warningHigh: 75, criticalLow: 10, criticalHigh: 90 },
      { name: '诸神眷顾', value: 70, targetValue: 65, warningLow: 40, warningHigh: 80, criticalLow: 20, criticalHigh: 95 },
    ]
  );

  const updateParam = (index: number, field: keyof OmenParameter, value: number) => {
    setParams(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addParam = () => {
    setParams(prev => [...prev, { name: '新预兆', value: 50, targetValue: 50, warningLow: 25, warningHigh: 75, criticalLow: 10, criticalHigh: 90 }]);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn" onClick={addParam}>+ 添加预兆</button>
        <button className="btn" onClick={() => onSave({ parameters: params })}>保存预兆</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {params.map((p, i) => (
          <div key={i} style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={p.name} onChange={e => updateParam(i, 'name', e.target.value as any)} placeholder="名称" style={{ width: 120 }} />
              <label style={{ fontSize: 11 }}>当前: <input type="number" value={p.value} onChange={e => updateParam(i, 'value', Number(e.target.value))} style={{ width: 60 }} /></label>
              <label style={{ fontSize: 11 }}>目标: <input type="number" value={p.targetValue} onChange={e => updateParam(i, 'targetValue', Number(e.target.value))} style={{ width: 60 }} /></label>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, height: 12, background: 'var(--parchment-bg)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, width: `${p.criticalLow}%`, height: '100%', background: 'var(--danger)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', left: `${p.warningLow}%`, width: `${p.warningHigh - p.warningLow}%`, height: '100%', background: 'var(--warning)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', left: `${p.criticalHigh}%`, width: `${100 - p.criticalHigh}%`, height: '100%', background: 'var(--danger)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', left: `${p.value}%`, width: 2, height: '100%', background: 'var(--ink)' }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{p.value} / {p.targetValue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
