import type { Metadata } from "next";
// 1. Import font Quicksand từ Google Fonts của Next.js
import { Quicksand } from "next/font/google";
import "./globals.css";

// 2. Cấu hình font (nhớ chọn subsets vietnamese để không bị lỗi dấu tiếng Việt)
const quicksand = Quicksand({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Azota Clone - Hệ thống thi trắc nghiệm",
  description: "Dựng bởi Thịnh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* 3. Áp dụng font vào thẻ body */}
      <body className={quicksand.className}>
        {children}
      </body>
    </html>
  );
}