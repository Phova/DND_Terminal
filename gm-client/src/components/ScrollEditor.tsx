import { useState } from 'react';

interface Props {
  data?: { title: string; content: string };
  onSave: (data: { title: string; content: string }) => void;
}

export default function ScrollEditor({ data, onSave }: Props) {
  const [title, setTitle] = useState(data?.title || '');
  const [content, setContent] = useState(data?.content || '');
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`dice-btn ${!preview ? '' : ''}`}
          style={{ background: !preview ? 'var(--gold)' : undefined, color: !preview ? 'white' : undefined }}
          onClick={() => setPreview(false)}>编辑</button>
        <button className={`dice-btn ${preview ? '' : ''}`}
          style={{ background: preview ? 'var(--gold)' : undefined, color: preview ? 'white' : undefined }}
          onClick={() => setPreview(true)}>预览</button>
        <button className="btn" onClick={() => onSave({ title, content })}>保存卷轴</button>
      </div>

      {preview ? (
        <div style={{
          background: 'var(--parchment-light)',
          border: '1px solid var(--parchment-dark)',
          borderRadius: 8,
          padding: 24,
          minHeight: 300,
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: 16 }}>{title}</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--ink-light)' }}>{content}</div>
        </div>
      ) : (
        <div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="卷轴标题..."
            style={{ width: '100%', marginBottom: 8, fontSize: 16, fontFamily: 'var(--font-display)' }}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="卷轴内容...（支持换行）"
            rows={15}
            style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14 }}
          />
        </div>
      )}
    </div>
  );
}
