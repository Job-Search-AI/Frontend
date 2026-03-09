import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 채용공고 검색 서비스",
  description:
    "자연어 질의를 기반으로 채용공고를 탐색하고 결과를 구조화해 보여주는 AI 채용 검색 SaaS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
