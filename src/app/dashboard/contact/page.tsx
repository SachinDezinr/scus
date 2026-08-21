'use client';

import { Mail, Linkedin, Instagram, ExternalLink, Heart } from 'lucide-react';

const channels = [
  {
    title: 'Electronic Mail',
    value: 'sachinpanwarpay@gmail.com',
    href: 'mailto:sachinpanwarpay@gmail.com',
    icon: Mail,
  },
  {
    title: 'LinkedIn Professional',
    value: 'sachin-panwar-dezinr',
    href: 'https://www.linkedin.com/in/sachin-panwar-dezinr',
    icon: Linkedin,
  },
  {
    title: 'Instagram Handle',
    value: '@isachin.panwar',
    href: 'https://www.instagram.com/isachin.panwar?igsh=MXIxeGFxcXR2dThuYw==',
    icon: Instagram,
  },
];

export default function ContactPage() {
  return (
    <div className="space-y-8 max-w-3xl min-h-[calc(100vh-140px)] flex flex-col justify-between">
      <div className="space-y-8">
        <div className="pb-6 border-b border-[#1f2230]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">Inquiries & Support</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Campus <span className="gradient-text">Communications</span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Reach out for technical issues, system contributions, or department integrations.
          </p>
        </div>

        <div className="space-y-3">
          {channels.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="block"
            >
              <div className="glass-card glass-card-hover rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#181a24] border border-[#262a3c] flex items-center justify-center text-primary">
                    <c.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase text-muted-foreground">{c.title}</p>
                    <p className="text-sm font-semibold text-white">{c.value}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 pb-4 mt-12 border-t border-[#1f2230] text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
          Created by <span className="text-white font-semibold gradient-text">Sachin Panwar</span>
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
          Campus Utility System © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}