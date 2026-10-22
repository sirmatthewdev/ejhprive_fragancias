import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { $cartOpen, $count, hydrateCart } from '../../lib/cart';

export default function CartButton() {
  const stored = useStore($count);
  // the server always renders 0; show the stored count only after mount so hydration matches
  const [mounted, setMounted] = useState(false);
  useEffect(() => { hydrateCart(); setMounted(true); }, []);
  const count = mounted ? stored : 0;
  return (
    <button
      type="button"
      onClick={() => $cartOpen.set(true)}
      aria-label={`Abrir bolsa, ${count} ${count === 1 ? 'producto' : 'productos'}`}
      className="relative flex size-11 items-center justify-center"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M5 8h14l-1.2 12H6.2zM9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span
        key={count}
        className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lilac px-1 text-[10px] font-bold text-plum motion-safe:animate-[pop_.5s_cubic-bezier(.16,1,.3,1)]"
        style={{ opacity: count ? 1 : 0 }}
      >
        {count}
      </span>
    </button>
  );
}
