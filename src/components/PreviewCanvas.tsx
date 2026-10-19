'use client';

import React, { useRef, useEffect, useState } from 'react';
import { DesignConfig } from '../types';

interface PreviewCanvasProps {
  productSlug: string;
  imageSrc?: string; // base64 or object URL of uploaded design
  dimensions?: { width: number; height: number }; // For flex banners
  selectedOptions?: Record<string, string>; // For options like t-shirt color or business card side
  onChange?: (config: DesignConfig, previewBase64: string) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  productSlug,
  imageSrc,
  dimensions = { width: 4, height: 3 },
  selectedOptions = {},
  onChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<DesignConfig>({
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0,
    side: 'front'
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  // Sync state options
  useEffect(() => {
    if (selectedOptions.color) {
      const colors: Record<string, string> = {
        white: '#fbfbfb',
        black: '#1f1f23',
        navy: '#1b263b',
        grey: '#a5a5a6'
      };
      setTshirtColor(colors[selectedOptions.color] || '#fbfbfb');
    }
    if (selectedOptions.sides) {
      // Toggle card side
      const side = selectedOptions.sides === 'double' ? cardSide : 'front';
      if (side !== config.side) {
        setConfig(prev => ({ ...prev, side }));
      }
    }
  }, [selectedOptions, cardSide, config.side]);

  // Load uploaded image
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        setImageEl(img);
        // Reset config position to center
        setConfig(prev => ({
          ...prev,
          x: 0,
          y: 0,
          scale: 0.5,
          rotation: 0
        }));
      };
    } else {
      setImageEl(null);
    }
  }, [imageSrc]);

  // Redraw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Template Background
    ctx.clearRect(0, 0, width, height);

    // Let's design the backdrop depending on the product
    if (productSlug === 'business-cards') {
      drawBusinessCardTemplate(ctx, width, height);
    } else if (productSlug === 't-shirts') {
      drawTshirtTemplate(ctx, width, height);
    } else if (productSlug === 'flex-banners') {
      drawFlexBannerTemplate(ctx, width, height, dimensions.width, dimensions.height);
    } else if (productSlug === 'flyers' || productSlug === 'brochures') {
      drawFlyerTemplate(ctx, width, height);
    } else if (productSlug === 'stickers') {
      drawStickerTemplate(ctx, width, height);
    } else {
      drawDefaultTemplate(ctx, width, height);
    }

    // 2. Draw Uploaded Design Overlay
    if (imageEl) {
      ctx.save();
      
      // Determine printing boundaries/clipping mask depending on product
      setupClippingMask(ctx, width, height);

      // Translate to placement configuration
      const center = getProductCenterPoint(productSlug, width, height);
      ctx.translate(center.x + config.x, center.y + config.y);
      ctx.rotate((config.rotation * Math.PI) / 180);

      const dWidth = imageEl.width * config.scale;
      const dHeight = imageEl.height * config.scale;

      // Draw design image centered at translated origin
      ctx.drawImage(imageEl, -dWidth / 2, -dHeight / 2, dWidth, dHeight);

      ctx.restore();
      
      // Draw Guideline Overlays (Bleed Line/Safety Margins) AFTER the image to show boundary guidelines
      drawGuidelineOverlay(ctx, width, height);
    } else {
      // Prompt upload instructions
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Your Custom Design Workspace', width / 2, height / 2 - 15);
      ctx.font = '12px ui-sans-serif, system-ui';
      ctx.fillText('(Upload design on the left to preview)', width / 2, height / 2 + 10);
    }

    // Fire onChange callback with current visual configuration and flattened preview
    if (onChange && imageSrc) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(config, dataUrl);
    }
  }, [productSlug, imageEl, config, dimensions, tshirtColor, cardSide]);

  // Canvas Helpers
  const getProductCenterPoint = (slug: string, w: number, h: number) => {
    if (slug === 't-shirts') {
      return { x: w / 2, y: h / 2 + 20 }; // Shirt printable box is slightly lower than absolute center
    }
    return { x: w / 2, y: h / 2 };
  };

  const setupClippingMask = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.beginPath();
    if (productSlug === 'business-cards') {
      // Clip inside business card shape
      const cw = 350;
      const ch = 200;
      const rx = (w - cw) / 2;
      const ry = (h - ch) / 2;
      ctx.roundRect(rx, ry, cw, ch, 8);
      ctx.clip();
    } else if (productSlug === 't-shirts') {
      // Clip inside printing chest box
      const cw = 140;
      const ch = 180;
      const rx = (w - cw) / 2;
      const ry = (h - ch) / 2 + 20;
      ctx.rect(rx, ry, cw, ch);
      ctx.clip();
    } else if (productSlug === 'flex-banners') {
      // Banner aspect ratio clipping
      const bannerSize = getBannerDisplaySize(w, h, dimensions.width, dimensions.height);
      const rx = (w - bannerSize.w) / 2;
      const ry = (h - bannerSize.h) / 2;
      ctx.rect(rx, ry, bannerSize.w, bannerSize.h);
      ctx.clip();
    } else if (productSlug === 'flyers' || productSlug === 'brochures') {
      const cw = 280;
      const ch = 380;
      const rx = (w - cw) / 2;
      const ry = (h - ch) / 2;
      ctx.rect(rx, ry, cw, ch);
      ctx.clip();
    } else if (productSlug === 'stickers') {
      const shape = selectedOptions.shape || 'circle';
      const size = 260;
      const rx = (w - size) / 2;
      const ry = (h - size) / 2;
      if (shape === 'circle') {
        ctx.arc(w / 2, h / 2, size / 2, 0, Math.PI * 2);
      } else {
        ctx.roundRect(rx, ry, size, size, 12);
      }
      ctx.clip();
    }
  };

  const getBannerDisplaySize = (cw: number, ch: number, bw: number, bh: number) => {
    const margin = 50;
    const maxWidth = cw - margin * 2;
    const maxHeight = ch - margin * 2;
    const aspect = bw / bh;

    let w = maxWidth;
    let h = maxWidth / aspect;

    if (h > maxHeight) {
      h = maxHeight;
      w = maxHeight * aspect;
    }
    return { w, h };
  };

  // Drawing Templates
  const drawBusinessCardTemplate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cw = 350;
    const ch = 200;
    const rx = (w - cw) / 2;
    const ry = (h - ch) / 2;

    // Draw background drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(rx, ry, cw, ch, 10);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Card border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Card texture lines (subtle grid just to make it realistic)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.5;
    for (let x = rx + 10; x < rx + cw; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.lineTo(x, ry + ch);
      ctx.stroke();
    }
  };

  const drawTshirtTemplate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Canvas background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    // Draw vector graphic representing Shirt body
    ctx.save();
    ctx.fillStyle = tshirtColor;
    
    // Draw dropshadow on shirt
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    // Neck collar
    ctx.moveTo(w / 2 - 45, 40);
    ctx.quadraticCurveTo(w / 2, 55, w / 2 + 45, 40);
    // Shoulder Right
    ctx.lineTo(w / 2 + 100, 55);
    // Sleeve Right
    ctx.lineTo(w / 2 + 140, 115);
    ctx.lineTo(w / 2 + 95, 135);
    ctx.lineTo(w / 2 + 85, 105);
    // Side Right
    ctx.lineTo(w / 2 + 85, 330);
    // Bottom Hem
    ctx.lineTo(w / 2 - 85, 330);
    // Side Left
    ctx.lineTo(w / 2 - 85, 105);
    // Sleeve Left
    ctx.lineTo(w / 2 - 95, 135);
    ctx.lineTo(w / 2 - 140, 115);
    // Shoulder Left
    ctx.lineTo(w / 2 - 100, 55);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.restore();

    // Collar detail line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 46, 39);
    ctx.quadraticCurveTo(w / 2, 58, w / 2 + 46, 39);
    ctx.stroke();

    // Printable bounds dashed frame
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    const px = (w - 140) / 2;
    const py = (h - 180) / 2 + 20;
    ctx.strokeRect(px, py, 140, 180);
    ctx.setLineDash([]);

    // Mini tag text
    ctx.fillStyle = '#64748b';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A4 Printable Chest Area', w / 2, py - 6);
  };

  const drawFlexBannerTemplate = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    bw: number,
    bh: number
  ) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);

    const banner = getBannerDisplaySize(w, h, bw, bh);
    const rx = (w - banner.w) / 2;
    const ry = (h - banner.h) / 2;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    
    // Banner white substrate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx, ry, banner.w, banner.h);
    
    ctx.shadowColor = 'transparent';

    // Metallic Grommets (Eyelets) representation
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;

    const drawGrommet = (gx: number, gy: number) => {
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Center hole
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
    };

    const fin = selectedOptions.finishing;
    if (fin === 'corners' || fin === 'border' || !fin) {
      // 4 corners
      drawGrommet(rx + 8, ry + 8);
      drawGrommet(rx + banner.w - 8, ry + 8);
      drawGrommet(rx + 8, ry + banner.h - 8);
      drawGrommet(rx + banner.w - 8, ry + banner.h - 8);
    }
    if (fin === 'border') {
      // Side grommets
      for (let x = rx + 60; x < rx + banner.w - 30; x += 60) {
        drawGrommet(x, ry + 8);
        drawGrommet(x, ry + banner.h - 8);
      }
    }
  };

  const drawFlyerTemplate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cw = 280;
    const ch = 380;
    const rx = (w - cw) / 2;
    const ry = (h - ch) / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx, ry, cw, ch);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, cw, ch);

    if (productSlug === 'brochures') {
      // Tri-fold fold guidelines dashed
      ctx.strokeStyle = '#e2e8f0';
      ctx.setLineDash([5, 5]);
      
      // Line 1
      ctx.beginPath();
      ctx.moveTo(rx + cw / 3, ry);
      ctx.lineTo(rx + cw / 3, ry + ch);
      ctx.stroke();

      // Line 2
      ctx.beginPath();
      ctx.moveTo(rx + (cw * 2) / 3, ry);
      ctx.lineTo(rx + (cw * 2) / 3, ry + ch);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  };

  const drawStickerTemplate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const shape = selectedOptions.shape || 'circle';
    const size = 260;
    const rx = (w - size) / 2;
    const ry = (h - size) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(w / 2, h / 2, size / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(rx, ry, size, size, 12);
    }
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawDefaultTemplate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(40, 40, w - 80, h - 80);
  };

  // Safe Bleed lines drawn on top of image
  const drawGuidelineOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);

    if (productSlug === 'business-cards') {
      const cw = 350;
      const ch = 200;
      const rx = (w - cw) / 2 + 10; // 10px bleed inside
      const ry = (h - ch) / 2 + 10;
      ctx.strokeRect(rx, ry, cw - 20, ch - 20);
    } else if (productSlug === 'flyers' || productSlug === 'brochures') {
      const cw = 280;
      const ch = 380;
      const rx = (w - cw) / 2 + 15;
      const ry = (h - ch) / 2 + 15;
      ctx.strokeRect(rx, ry, cw - 30, ch - 30);
    } else if (productSlug === 'stickers') {
      const shape = selectedOptions.shape || 'circle';
      const size = 260;
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(w / 2, h / 2, size / 2 - 10, 0, Math.PI * 2);
      } else {
        const rx = (w - size) / 2 + 10;
        const ry = (h - size) / 2 + 10;
        ctx.roundRect(rx, ry, size - 20, size - 20, 8);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Mouse & Touch Draggers
  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support TouchEvents
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleStartDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageEl) return;
    setIsDragging(true);
    const coords = getEventCoordinates(e);
    setDragStart({
      x: coords.x - config.x,
      y: coords.y - config.y
    });
  };

  const handleDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imageEl) return;
    const coords = getEventCoordinates(e);
    setConfig(prev => ({
      ...prev,
      x: coords.x - dragStart.x,
      y: coords.y - dragStart.y
    }));
  };

  const handleStopDrag = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setConfig({
      x: 0,
      y: 0,
      scale: 0.5,
      rotation: 0,
      side: config.side
    });
  };

return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card">
      {/* Side toggle, shown only for double-sided products */}
      {selectedOptions.sides === 'double' && (
        <div className="flex gap-1 border-b border-ink-200/80 bg-ink-50 p-1.5">
          {(['front', 'back'] as const).map(side => {
            const active = cardSide === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => {
                  setCardSide(side);
                  setConfig(prev => ({ ...prev, side }));
                }}
                aria-pressed={active}
                className={
                  active
                    ? 'flex-1 rounded-lg bg-white px-3 py-2 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-950 shadow-sm transition-colors'
                    : 'flex-1 rounded-lg px-3 py-2 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-500 transition-colors hover:bg-white/60 hover:text-ink-950'
                }
              >
                {side === 'front' ? 'Front' : 'Back'}
              </button>
            );
          })}
        </div>
      )}

      {/* Canvas workspace */}
      <div className="relative overflow-hidden border-b border-ink-200/80 bg-ink-50 p-4">
        <div className="mx-auto w-fit">
          <canvas
            ref={canvasRef}
            width={400}
            height={380}
            onMouseDown={handleStartDrag}
            onMouseMove={handleDrag}
            onMouseUp={handleStopDrag}
            onMouseLeave={handleStopDrag}
            onTouchStart={handleStartDrag}
            onTouchMove={handleDrag}
            onTouchEnd={handleStopDrag}
            className={`block touch-none ${imageSrc ? 'cursor-move' : ''}`}
          />
        </div>

        {imageSrc && (
          <span className="pointer-events-none absolute bottom-6 left-6 rounded-full bg-ink-950/85 px-2.5 py-1 font-mono text-micro text-white backdrop-blur-sm">
            Drag to reposition
          </span>
        )}

        {!imageSrc && (
          <span className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-micro uppercase tracking-wider2 text-ink-400">
            Upload artwork to start placing it
          </span>
        )}
      </div>

      {/* Controls */}
      {imageSrc && (
        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="zoom" className="label-caps">
                Zoom
              </label>
              <span className="tnum font-mono text-body-s font-medium text-ink-800">
                {Math.round(config.scale * 200)}%
              </span>
            </div>
            <input
              id="zoom"
              type="range"
              min="0.1"
              max="2.0"
              step="0.02"
              value={config.scale}
              onChange={e => setConfig(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="rotate" className="label-caps">
                Rotation
              </label>
              <span className="tnum font-mono text-body-s font-medium text-ink-800">
                {config.rotation}°
              </span>
            </div>
            <input
              id="rotate"
              type="range"
              min="-180"
              max="180"
              step="1"
              value={config.rotation}
              onChange={e => setConfig(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="font-mono text-micro font-medium uppercase tracking-wider2 text-primary-600 transition-colors hover:text-primary-700"
            >
              Reset placement
            </button>
            <span className="flex items-center gap-1.5 font-mono text-micro uppercase tracking-wider2 text-ink-400">
              <span className="inline-block h-2 w-2 flex-none bg-red-500" aria-hidden="true" />
              Red line = safety margin
            </span>
          </div>
        </div>
      )}
    </div>
  );
};