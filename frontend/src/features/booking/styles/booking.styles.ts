export const PRESET_IMAGES = [
    { label: "Terre Battue", url: "https://images.unsplash.com/photo-1551773188-0801da12ddae?w=800" },
    { label: "Dur (Bleu)", url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800" },
    { label: "Gazon", url: "https://images.unsplash.com/photo-1572540688236-4eb938e8c099?w=800" },
    { label: "Indoor", url: "https://images.unsplash.com/photo-1545809074-59472b3f5ecc?w=800" }
];

export const ADMIN_BOOKING_CSS = `
  :root {
    --admin-green: #16a34a;
    --admin-dark: #0f172a;
    --admin-border: #e2e8f0;
    --admin-radius: 16px;
  }

  .abp-page { background: #f1f5f9; min-height: 100vh; color: var(--admin-dark); display: flex; flex-direction: column; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

  /* Hero Section */
  .abp-hero { position: relative; padding: 56px 0 64px; background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f4a28 100%); overflow: hidden; }
  .abp-hero::before { content: ''; position: absolute; top: -120px; right: -80px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%); pointer-events: none; }
  .abp-hero::after { content: ''; position: absolute; bottom: -60px; left: -40px; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%); pointer-events: none; }
  .abp-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15,23,42,0.4) 0%, rgba(22,163,74,0.08) 100%); }
  .abp-hero-content { position: relative; width: min(1100px, 92vw); margin: 0 auto; z-index: 2; }

  .abp-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; border-radius: 14px; min-width: 130px; backdrop-filter: blur(8px); transition: transform 0.2s, background 0.2s; }
  .abp-stat:hover { transform: translateY(-2px); background: rgba(255,255,255,0.1); }
  .abp-stat-num { display: block; color: #4ade80; font-weight: 800; font-size: 28px; line-height: 1.2; }
  .abp-stat-label { color: rgba(255,255,255,0.55); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

  /* Main Layout */
  .abp-main { width: min(1100px, 92vw); margin: -28px auto 60px; position: relative; z-index: 10; }

  /* Forms */
  .abp-form-card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid rgba(226,232,240,0.8); margin-bottom: 32px; }
  .abp-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .abp-field { display: flex; flex-direction: column; gap: 8px; }
  .abp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px; }
  .abp-input { padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--admin-border); font-size: 14px; background: #fafbfc; transition: all 0.2s; }
  .abp-input:focus { outline: none; border-color: var(--admin-green); box-shadow: 0 0 0 4px rgba(22,163,74,0.08); background: #fff; }

  /* Image Selector */
  .abp-image-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .abp-tab { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--admin-border); background: white; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; color: #64748b; transition: all 0.2s; }
  .abp-tab:hover { border-color: #cbd5e1; background: #f8fafc; }
  .abp-tab.active { background: var(--admin-dark); color: white; border-color: var(--admin-dark); }

  .abp-preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .abp-preset-item { position: relative; height: 100px; border-radius: 14px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.25s; }
  .abp-preset-item:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .abp-preset-item img { width: 100%; height: 100%; object-fit: cover; }
  .abp-preset-item.selected { border-color: var(--admin-green); transform: scale(0.97); box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
  .abp-preset-check { position: absolute; top: 8px; right: 8px; background: var(--admin-green); color: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 8px rgba(22,163,74,0.4); }

  /* Court List Items */
  .abp-courts-list { display: flex; flex-direction: column; gap: 16px; }
  .abp-court-row {
    background: white; border-radius: 20px; padding: 24px;
    border: 1px solid rgba(226,232,240,0.8);
    display: grid; grid-template-columns: 130px 1fr; gap: 24px; align-items: start;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .abp-court-row:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .abp-court-img { width: 130px; height: 130px; border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); flex-shrink: 0; }
  .abp-court-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  .abp-court-row:hover .abp-court-img img { transform: scale(1.05); }

  .abp-badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .abp-badge.green { background: rgba(22,163,74,0.1); color: #15803d; border: 1px solid rgba(22,163,74,0.2); }
  .abp-badge.red { background: rgba(239,68,68,0.08); color: #b91c1c; border: 1px solid rgba(239,68,68,0.15); }

  /* Slots UI */
  .abp-slots-wrap { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; padding-top: 20px; border-top: 1px solid #f1f5f9; margin-top: 12px; }
  .abp-slot-chip {
    background: #f8fafc; border: 1px solid var(--admin-border); padding: 7px 14px; border-radius: 10px;
    font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 10px;
    transition: all 0.2s;
  }
  .abp-slot-chip:hover { background: #f1f5f9; }
  .abp-slot-chip.booked { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.2); color: #1d4ed8; }
  .abp-slot-del { border: none; background: #f1f5f9; color: #94a3b8; cursor: pointer; border-radius: 6px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.15s; }
  .abp-slot-del:hover { background: #fee2e2; color: #ef4444; transform: scale(1.1); }

  .abp-slot-form { grid-column: 1 / -1; background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 24px; border-radius: 16px; border: 2px dashed #cbd5e1; }

  /* Buttons & Toasts */
  .abp-btn-primary {
    background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none;
    padding: 12px 22px; border-radius: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(22,163,74,0.25);
    font-size: 14px;
  }
  .abp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(22,163,74,0.35); }
  .abp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

  .abp-toast { position: fixed; bottom: 30px; right: 30px; padding: 16px 24px; border-radius: 14px; display: flex; align-items: center; gap: 12px; z-index: 1000; box-shadow: 0 20px 40px rgba(0,0,0,0.15); color: white; backdrop-filter: blur(12px); }
  .abp-toast-err { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .abp-toast-ok { background: var(--admin-dark); border-left: 4px solid var(--admin-green); }

  .abp-spin { animation: abp-spin 1s linear infinite; }
  @keyframes abp-spin { to { transform: rotate(360deg); } }

  .abp-btn-sm {
    padding: 8px 14px; border-radius: 10px; border: 1.5px solid var(--admin-border);
    background: white; font-size: 12px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 6px; transition: all 0.2s;
  }
  .abp-btn-sm:hover { transform: translateY(-1px); }
  .abp-btn-green { color: var(--admin-green); border-color: rgba(22,163,74,.25); }
  .abp-btn-green:hover { background: #f0fdf4; box-shadow: 0 2px 8px rgba(22,163,74,0.12); }
  .abp-btn-red { color: #ef4444; border-color: rgba(239,68,68,.2); }
  .abp-btn-red:hover { background: #fef2f2; box-shadow: 0 2px 8px rgba(239,68,68,0.12); }
  .abp-btn-ghost { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--admin-border); background: white; cursor: pointer; font-size: 13px; font-weight: 600; color: #64748b; transition: all 0.2s; }
  .abp-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

  .abp-court-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 40px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); }

  .abp-spinner-wrap { display: flex; justify-content: center; padding: 80px 0; }

  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid rgba(74,222,128,.25); border-radius: 999px; background: rgba(74,222,128,.1); font-size: 12px; font-weight: 800; letter-spacing: .5px; color: #4ade80; text-transform: uppercase; margin-bottom: 14px; }
  .heroTitle { margin: 0; font-size: clamp(28px, 3.5vw, 48px); line-height: 1.05; letter-spacing: -0.6px; font-weight: 900; color: #fff; }
  .footer { margin-top: auto; border-top: 1px solid rgba(15,23,42,.06); background: #0f172a; color: rgba(255,255,255,.45); text-align: center; padding: 22px 10px; font-size: 13px; }
`;