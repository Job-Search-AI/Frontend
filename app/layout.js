import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "AI Career Finder",
  description: "당신의 커리어를 위한 최적의 기회를 찾아드립니다",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="beforeInteractive"
        />
        <style>{`
          @view-transition {
            navigation: auto;
          }
        `}</style>
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
