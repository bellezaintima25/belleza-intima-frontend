'use client';

import { TruckIcon, ShieldCheckIcon, GiftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const items = [
  { icon: TruckIcon, label: 'Envíos a toda Colombia' },
  { icon: ShieldCheckIcon, label: 'Compra segura' },
  { icon: GiftIcon, label: 'Empaque especial' },
  {
    icon: ChatBubbleLeftRightIcon,
    label: '¿Necesitas ayuda?',
    href: 'https://wa.me/573217795555',
  },
];

export default function TopBar() {
  return (
    <div className="bg-primary-100 text-primary-700 text-xs border-b border-primary-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Desktop: all four spread out */}
        <div className="hidden md:flex items-center justify-center gap-8 py-2">
          {items.map(({ icon: Icon, label, href }) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-600 transition-colors font-medium"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ) : (
              <span key={label} className="flex items-center gap-1.5 font-medium">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            )
          )}
        </div>

        {/* Mobile: auto-scrolling marquee (no manual horizontal scroll) */}
        <div className="md:hidden overflow-hidden py-2">
          <div className="flex w-max animate-marquee items-center whitespace-nowrap">
            {/* Content duplicated twice for a seamless infinite loop */}
            {[...items, ...items].map(({ icon: Icon, label, href }, i) =>
              href ? (
                <a
                  key={`${label}-${i}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-3 flex items-center gap-1.5 font-medium flex-shrink-0"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ) : (
                <span
                  key={`${label}-${i}`}
                  className="mx-3 flex items-center gap-1.5 font-medium flex-shrink-0"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
