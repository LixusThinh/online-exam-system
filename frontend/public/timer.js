document.addEventListener("DOMContentLoaded", function () {
    // 1. Chống gian lận F5 (Timer cứng)
    const timerDisplay = document.getElementById("timer-display");
    const EXAM_DURATION = 45 * 60 * 1000; // 45 phút
    
    // Lấy thời gian kết thúc từ localStorage
    let endTime = localStorage.getItem("exam_end_time");
    
    if (!endTime) {
        // Lần đầu vào thi, set thời gian kết thúc = Hiện tại + 45 phút
        endTime = Date.now() + EXAM_DURATION;
        localStorage.setItem("exam_end_time", endTime);
    } else {
        endTime = parseInt(endTime, 10); // Chuyển sang Float/Int
    }

    const timerInterval = setInterval(updateTimer, 1000);

    function updateTimer() {
        const now = Date.now();
        const timeLeft = Math.max(0, endTime - now);

        if (timeLeft === 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "00:00";
            alert("Đã hết thời gian làm bài! Hệ thống sẽ tự động nộp bài.");
            submitExam(true); // Gửi cờ true để nộp tự động, bỏ qua confirm
            return;
        }

        const totalSeconds = Math.floor(timeLeft / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Nếu dưới 5 phút (< 300 giây) thì nhấp nháy
        if (totalSeconds < 300) {
            timerDisplay.classList.add("text-danger");
            timerDisplay.style.opacity = totalSeconds % 2 === 0 ? "1" : "0.3";
        } else {
            timerDisplay.classList.remove("text-danger");
            timerDisplay.style.opacity = "1";
        }
    }
    
    updateTimer(); // Gọi ngay lần đầu để tránh delay 1 giây hiển thị mốc cũ

    // 2. Tương tác mượt mà (Highlight câu đã làm)
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        // Loại bỏ inline JS cũ giúp mã sạch hơn
        radio.removeAttribute("onchange");

        radio.addEventListener("change", function () {
            const groupName = this.name; // Ví dụ: "question1"
            const qID = groupName.replace("question", ""); // Ra "1"
            
            const navBtn = document.getElementById(`btn-q${qID}`);
            if (navBtn) {
                // Đổi class để hiện xanh lá báo hiệu đã làm
                navBtn.classList.remove("btn-outline-secondary", "unanswered");
                navBtn.classList.add("btn-success", "text-white");
            }
        });
    });
    
    // Polyfill để tránh lỗi trình duyệt lỡ gọi `markAnswered()` trước khi DOM load xong
    window.markAnswered = function() {};

    // 3. Logic nộp bài
    window.submitExam = function (isAutoSubmit = false) {
        if (!isAutoSubmit) {
            if (!confirm("Bạn có chắc chắn muốn nộp bài bây giờ không? Bạn không thể thay đổi đáp án sau khi nộp.")) {
                return;
            }
        }
        
        // Hoàn thành: xóa timer để reset lần sau
        localStorage.removeItem("exam_end_time");
        clearInterval(timerInterval);
        
        // Hiện màn hình loading Overlay
        const overlay = document.getElementById("loading-overlay");
        if (overlay) overlay.style.display = "flex";
        
        // Giả lập xử lý server 2 giây, sau đó chuyển trang sang kết quả
        setTimeout(() => {
            window.location.href = "result.html";
        }, 2000);
    };
});
