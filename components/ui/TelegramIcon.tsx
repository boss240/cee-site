/** Знак Telegram (паперовий літачок) — без зовнішніх ресурсів. */
export function TelegramIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.4 4.3 2.9 11.4c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.6ZM9.4 14.6l8.9-5.6c.4-.3.8-.1.5.2l-7.4 6.7-.3 3.1-1.7-4.4Z" />
    </svg>
  );
}
