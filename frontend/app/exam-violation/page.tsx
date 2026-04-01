"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

function getReasonMessage(reason: string): string {
  switch (reason) {
    case "extension":
      return "Phat hien web extension can thiep vao moi truong thi.";
    case "devtools":
      return "Phat hien mo DevTools hoac su dung phim tat/thao tac bi cam.";
    case "contextmenu":
    case "shortcut":
    case "copy":
    case "cut":
    case "paste":
    case "selectstart":
    case "dragstart":
      return "Phat hien vi pham soft violation vuot nguong cho phep.";
    default:
      return "Phat hien hanh vi khong hop le trong qua trinh lam bai.";
  }
}

export default function ExamViolationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "devtools";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 text-center shadow-2xl shadow-rose-950/40">
        <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-rose-500/15">
          <ShieldAlert className="h-9 w-9 text-rose-400" />
        </div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-rose-300/60">
          Exam Security Lock
        </p>
        <h1 className="mb-3 text-3xl font-black text-white">Bai thi da bi khoa</h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-300">
          He thong da phat hien hanh vi vi pham quy dinh thi cu. Phien lam bai
          hien tai da bi chan de bao ve tinh cong bang cua ky thi.
        </p>

        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-200">Ly do ghi nhan</p>
              <p className="text-xs font-medium text-rose-100/80">
                {getReasonMessage(reason)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            className="bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => router.push("/student/dashboard")}
          >
            Quay lai bang dieu khien
          </Button>
        </div>
      </div>
    </div>
  );
}
