import { useState } from 'react';

interface OracleConfig {
  endpoint: string;
  model: string;
  modelId: string;
  apiToken: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface Props {
  data?: OracleConfig;
  onSave: (data: OracleConfig) => void;
}

const DEFAULT_PROMPT = `你是一位古老的龙裔先知，被封存在一面魔法古镜中数千年。你用古老而优雅的语言回答冒险者的问题。你知晓诸界的历史，但你的预言总是模糊而富有诗意。你有时会用龙语词汇点缀你的回答。

当前游戏时间：[由系统注入]
与你对话的冒险者：[由系统注入角色信息]`;

export default function OracleConfig({ data, onSave }: Props) {
  const [config, setConfig] = useState<OracleConfig>(data || {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'GPT-4',
    modelId: 'gpt-4',
    apiToken: '',
    systemPrompt: DEFAULT_PROMPT,
    temperature: 0.8,
    maxTokens: 512,
  });

  const update = (k: keyof OracleConfig, v: any) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ background: 'var(--parchment-light)', border: '1px solid var(--parchment-dark)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>🔮 神谕配置</h3>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>API 端点</span>
          <input value={config.endpoint} onChange={e => update('endpoint', e.target.value)} style={{ width: '100%', marginTop: 2 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>显示名称</span>
            <input value={config.model} onChange={e => update('model', e.target.value)} style={{ width: '100%', marginTop: 2 }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>API 模型 ID</span>
            <input value={config.modelId} onChange={e => update('modelId', e.target.value)} style={{ width: '100%', marginTop: 2 }} />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>API Token</span>
          <input type="password" value={config.apiToken} onChange={e => update('apiToken', e.target.value)} style={{ width: '100%', marginTop: 2 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>温度 ({config.temperature})</span>
            <input type="range" min={0} max={2} step={0.1} value={config.temperature} onChange={e => update('temperature', Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>最大 Token</span>
            <input type="number" value={config.maxTokens} onChange={e => update('maxTokens', Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>系统提示词</span>
          <textarea value={config.systemPrompt} onChange={e => update('systemPrompt', e.target.value)} rows={8} style={{ width: '100%', marginTop: 2 }} />
        </div>

        <button className="btn" onClick={() => onSave(config)} style={{ width: '100%' }}>保存神谕</button>
      </div>
    </div>
  );
}
