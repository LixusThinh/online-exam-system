"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." };
  }

  try {
    // Backend FastAPI mong đợi application/x-www-form-urlencoded
    const payload = new URLSearchParams({
      username: username,
      password: password,
    });

    const response = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      // Bắt lỗi từ FastAPI (như sai tài khoản, mật khẩu)
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.detail || "Đăng nhập thất bại. Kiểm tra lại thông tin." 
      };
    }

    // Đọc JSON chứa access_token
    const data = await response.json();
    const accessToken = data.access_token;
    
    if (accessToken) {
      // Set cookie httpOnly an toàn
      // Hỗ trợ cả Next.js 14 và 15 (next 15 yêu cầu await cookies())
      const cookieStore = await cookies();
      cookieStore.set("access_token", accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 3600, // 3600s = 1h
      });
    } else {
      return { error: "Xảy ra lỗi: Không nhận được token từ hệ thống." };
    }

  } catch (err) {
    console.error("Login lỗi:", err);
    return { error: "Không thể kết nối đến hệ thống máy chủ." };
  }

  // Chuyển hướng trình duyệt nều thành công
  // redirect phải nằm ngoài khối try/catch trong Next.js (do bản chất nó thi hành Error ném ra để stop run)
  redirect("/dashboard");
}
