"use client";

import { useEffect, useState } from "react";

export const useAdvancedAntiCheat = (examTitle: string) => {
  const [cheatCount, setCheatCount] = useState(0);

  useEffect(() => {
    const handleBlur = () => {
      setCheatCount((prev) => prev + 1);
      alert(`[CẢNH BÁO] Phát hiện hành vi rời khỏi trang bài thi "${examTitle}". Hệ thống đã ghi nhận lần vi phạm thứ ${cheatCount + 1}!`);
    };

    const handleResize = () => {
      setCheatCount((prev) => prev + 1);
      alert("[CẢNH BÁO] Phát hiện hành vi thay đổi kích thước trình duyệt (có thể là mở DevTools hoặc Copilot). Vui lòng không gian lận!");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Hành động bị chặn: Không được phép chuột phải trong lúc làm bài!");
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [examTitle, cheatCount]);

  return { cheatCount };
};
