import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 border-b-4 border-blue-500 pb-2">
        SKY-EXAM
      </h1>
      <Link href="/login">
        <Button size="lg" className="text-lg px-8 py-6 rounded-full font-medium shadow-md hover:shadow-lg transition-transform hover:-translate-y-1">
          Đăng nhập
        </Button>
      </Link>
    </main>
  );
}
