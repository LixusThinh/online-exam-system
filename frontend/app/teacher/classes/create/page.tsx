"use client";

import { useState } from "react";
import { createClass } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CreateClassPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showDialog, setShowDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const result = await createClass({ name });
      setInviteCode(result.invite_code);
      setShowDialog(true);
      
      toast({
        title: "Tạo lớp học thành công",
        description: "Vui lòng chia sẻ mã mời cho học sinh.",
      });
      setName("");
      setDesc("");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({ title: "Đã sao chép mã mời" });
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Tạo Lớp Học Mới</CardTitle>
          <CardDescription>
            Điền thông tin cơ bản để khởi tạo một lớp học trên hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="className" className="font-semibold">Tên lớp học <span className="text-red-500">*</span></Label>
              <Input
                id="className"
                placeholder="VD: Toán 12A1 K61"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desc" className="font-semibold">Mô tả (Không bắt buộc)</Label>
              <Textarea
                id="desc"
                placeholder="Nhập thông tin mô tả chi tiết cho lớp học..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? "Đang xử lý..." : "Khởi tạo lớp học"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-green-600">Thành Công!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Lớp học đã được tạo. Hãy gửi mã mời dưới đây cho sinh viên để họ có thể tham gia.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="text-4xl font-black text-blue-600 tracking-widest bg-blue-50 py-3 px-8 rounded-lg border border-blue-200 shadow-inner">
              {inviteCode}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleCopy} className="w-full sm:w-auto mt-2">
              Sao chép mã mời
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto mt-2">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
