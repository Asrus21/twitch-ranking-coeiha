import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'asrus.app',
  description: 'twitch tools & rankings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                  var lang = localStorage.getItem('lang') || 'pt';
                  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
