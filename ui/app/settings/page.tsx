'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { STORAGE_KEY, MODEL_STORAGE_KEY, DEFAULT_ARK_MODEL } from '@/lib/apiKey';

export default function SettingsPage() {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem(STORAGE_KEY) || '');
    setModel(localStorage.getItem(MODEL_STORAGE_KEY) || '');
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, key.trim());
    const m = model.trim();
    if (m) localStorage.setItem(MODEL_STORAGE_KEY, m);
    else localStorage.removeItem(MODEL_STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODEL_STORAGE_KEY);
    setKey('');
    setModel('');
  };

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← 返回
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">仅存在你的浏览器，不上传任何服务器</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          豆包 API Key（火山方舟）
        </h2>
        <div className="flex gap-2">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ARK_API_KEY，例如 a1b2c3d4-..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
            aria-label={show ? '隐藏' : '显示'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-muted)]">
            模型 ID（可选，留空使用默认 <code>{DEFAULT_ARK_MODEL}</code>）
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_ARK_MODEL}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!key.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} /> {saved ? '已保存' : '保存'}
          </button>
          {(key || model) && (
            <button
              onClick={clear}
              className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)]"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          获取 API Key：
          <a
            href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] underline"
          >
            火山方舟控制台
          </a>
          。AI 推荐通过 OpenAI 兼容接口调用 <code>{DEFAULT_ARK_MODEL}</code>，每次约几分钱。
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          关于
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          源码：
          <a
            href="https://github.com/frankliu20/ai-reading-mate"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] underline"
          >
            ai-reading-mate
          </a>
        </p>
      </section>
    </div>
  );
}
