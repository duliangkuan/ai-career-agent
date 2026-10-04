import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "职业观察室 · AI 求职 Agent",
  description: "上传简历，对照真实 AI 岗位，找到有依据的求职方向与成长计划。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

