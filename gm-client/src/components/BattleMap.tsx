import { useRef, useEffect, useState, useCallback } from 'react';

interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  hp_current?: number;
  hp_max?: number;
  ac?: number;
  color: string;
  size: number;
  type: 'pc' | 'monster';
}

interface FogReveal {
  x: number;
  y: number;
  radius: number;
}

interface Props {
  width?: number;
  height?: number;
  tokens: Token[];
  onTokenMove?: (id: string, x: number, y: number) => void;
  backgroundImage?: string;
  fogReveals?: FogReveal[];
  isGM?: boolean;
}

const GRID_SIZE = 40; // pixels per cell
const COLORS = { pc: '#4a90d9', monster: '#d94a4a' };

export default function BattleMap({
  width = 800, height = 600,
  tokens: initialTokens,
  onTokenMove,
  backgroundImage,
  fogReveals = [],
  isGM = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [gridType, setGridType] = useState<'square' | 'hex'>('square');
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => { setTokens(initialTokens); }, [initialTokens]);

  const gridToPixel = useCallback((gx: number, gy: number) => {
    return {
      x: gx * GRID_SIZE * zoom + pan.x,
      y: gy * GRID_SIZE * zoom + pan.y,
    };
  }, [pan, zoom]);

  const pixelToGrid = useCallback((px: number, py: number) => {
    return {
      x: Math.round((px - pan.x) / (GRID_SIZE * zoom)),
      y: Math.round((py - pan.y) / (GRID_SIZE * zoom)),
    };
  }, [pan, zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#3b2b1a';
    ctx.fillRect(0, 0, width, height);

    // Background image
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      if (img.complete) {
        ctx.drawImage(img, 0, 0, width, height);
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
    ctx.lineWidth = 0.5;

    if (gridType === 'square') {
      for (let x = 0; x <= width; x += GRID_SIZE * zoom) {
        ctx.beginPath();
        ctx.moveTo(x + (pan.x % (GRID_SIZE * zoom)), 0);
        ctx.lineTo(x + (pan.x % (GRID_SIZE * zoom)), height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE * zoom) {
        ctx.beginPath();
        ctx.moveTo(0, y + (pan.y % (GRID_SIZE * zoom)));
        ctx.lineTo(width, y + (pan.y % (GRID_SIZE * zoom)));
        ctx.stroke();
      }
    } else {
      // Hex grid (simplified)
      const hexW = GRID_SIZE * zoom * 1.15;
      const hexH = GRID_SIZE * zoom;
      for (let row = 0; row < height / hexH + 2; row++) {
        for (let col = 0; col < width / hexW + 2; col++) {
          const offsetX = row % 2 === 0 ? 0 : hexW / 2;
          const cx = col * hexW + offsetX + pan.x % hexW;
          const cy = row * hexH * 0.75 + pan.y % (hexH * 0.75);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = cx + (hexW / 2) * Math.cos(angle);
            const hy = cy + (hexH / 2) * Math.sin(angle);
            i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // Fog of war (not GM view)
    if (!isGM) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'destination-out';
      for (const fog of fogReveals) {
        const p = gridToPixel(fog.x, fog.y);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, fog.radius * GRID_SIZE * zoom);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - fog.radius * GRID_SIZE * zoom, p.y - fog.radius * GRID_SIZE * zoom, fog.radius * 2 * GRID_SIZE * zoom, fog.radius * 2 * GRID_SIZE * zoom);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Tokens
    for (const token of tokens) {
      const p = gridToPixel(token.x, token.y);
      const r = token.size * zoom;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(p.x + 2, p.y + 2, r, 0, Math.PI * 2);
      ctx.fill();

      // Token circle
      ctx.fillStyle = token.color;
      ctx.strokeStyle = selectedToken?.id === token.id ? '#ffd700' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = selectedToken?.id === token.id ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Initial
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(r * 0.9)}px var(--font-display)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.name[0] || '?', p.x, p.y);

      // HP bar
      if (token.hp_max && token.hp_current !== undefined) {
        const barW = r * 2.5;
        const barH = 4;
        const barY = p.y + r + 6;
        const hpPct = token.hp_current / token.hp_max;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(p.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
        ctx.fillRect(p.x - barW / 2, barY, barW * hpPct, barH);
      }
    }
  }, [width, height, tokens, gridType, selectedToken, pan, zoom, backgroundImage, fogReveals, isGM, gridToPixel]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check token hit
    const hit = [...tokens].reverse().find(t => {
      const p = gridToPixel(t.x, t.y);
      return Math.hypot(mx - p.x, my - p.y) < t.size * zoom + 4;
    });

    if (hit) {
      setDragging(hit.id);
      setSelectedToken(hit);
    } else {
      setSelectedToken(null);
      // Start pan
      setDragging('__pan__');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging === '__pan__') {
      setPan(prev => ({
        x: prev.x + (mx - (rect.width / 2)) * 0.02,
        y: prev.y + (my - (rect.height / 2)) * 0.02,
      }));
      return;
    }

    const grid = pixelToGrid(mx, my);
    setTokens(prev => prev.map(t => t.id === dragging ? { ...t, x: grid.x, y: grid.y } : t));
  };

  const handleMouseUp = () => {
    if (dragging && dragging !== '__pan__') {
      const token = tokens.find(t => t.id === dragging);
      if (token && onTokenMove) onTokenMove(dragging, token.x, token.y);
    }
    setDragging(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button className={`dice-btn ${gridType === 'square' ? '' : ''}`}
          style={{ background: gridType === 'square' ? 'var(--gold)' : undefined, color: gridType === 'square' ? 'white' : undefined }}
          onClick={() => setGridType('square')}>方格</button>
        <button className={`dice-btn ${gridType === 'hex' ? '' : ''}`}
          style={{ background: gridType === 'hex' ? 'var(--gold)' : undefined, color: gridType === 'hex' ? 'white' : undefined }}
          onClick={() => setGridType('hex')}>六角</button>
        <span className="btn" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} style={{ cursor: 'pointer' }}>重置视图</span>
        {selectedToken && (
          <span style={{ marginLeft: 16, fontSize: 13, color: 'var(--ink-light)' }}>
            {selectedToken.name} | AC: {selectedToken.ac || '-'} | HP: {selectedToken.hp_current}/{selectedToken.hp_max}
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid var(--parchment-dark)',
          borderRadius: 8,
          cursor: dragging ? 'grabbing' : 'grab',
          maxWidth: '100%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
