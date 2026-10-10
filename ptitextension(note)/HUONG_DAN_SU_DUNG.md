# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG CHROME EXTENSION TKB x QLDT

Extension **TKB x QLDT** được thiết kế chuyên biệt để hoạt động trực tiếp trên cổng quản lý đào tạo PTIT (`https://qldt.ptit.edu.vn/#/tkb-tuan`), giúp sinh viên kéo thả thẻ vào thời khóa biểu, báo thức thông minh trước giờ học, anti logout chống hết hạn phiên làm việc và quản lý thời gian với biểu đồ tròn 24h.

---

## I. CÁCH CÀI ĐẶT EXTENSION VÀO TRÌNH DUYỆT CHROME

1. Mở trình duyệt **Google Chrome** (hoặc Microsoft Edge, Brave, Cốc Cốc).
2. Nhập vào thanh địa chỉ: `chrome://extensions/` và nhấn **Enter**.
3. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải màn hình.
4. Nhấn nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục chứa tiện ích:
   ```
   D:\develop\extension_and_tools\qldt x note (PTIT)\ptitextension(note)
   ```
6. Tiện ích **TKB x QLDT - Tiện Ích Thời Khóa Biểu & Quản Lý Thời Gian PTIT** sẽ xuất hiện trên danh sách extension. Hãy ghim biểu tượng (Pin) lên thanh trình duyệt để dễ dàng theo dõi.

---

## II. HƯỚNG DẪN SỬ DỤNG CÁC TÍNH NĂNG CHÍNH

Truy cập vào trang thời khóa biểu PTIT: [https://qldt.ptit.edu.vn/#/tkb-tuan](https://qldt.ptit.edu.vn/#/tkb-tuan)

### 1. Nút Mở/Đóng Bảng Điều Khiển Tối Giản (`>` và `<`)
- **Mở bảng**: Ở góc dưới bên trái màn hình có nút bấm đỏ nổi bật **PTIT >**. Nhấn vào để mở bảng điều khiển trượt ra từ cạnh trái.
- **Đóng bảng**: 
  - Nhấn nút **<** ở rìa phải của bảng điều khiển.
  - Hoặc nhấn phím **Escape** trên bàn phím.
- **Thiết kế cạnh trái độc lập (Không xê dịch hay thay đổi tỷ lệ web)**:
  - Bảng điều khiển hiển thị ở **cạnh trái màn hình** (chiều rộng 420px) dưới dạng lớp phủ (overlay) độc lập, hoàn toàn giữ nguyên 100% bố cục gốc, tỷ lệ giao diện và vị trí các thành phần của trang web PTIT.
  - Bảng thời khóa biểu giữ nguyên kích thước và cuộn ngang mượt mà, giúp bạn dễ dàng theo dõi và kéo thả lời nhắc vào bất kỳ ô thứ/tiết học nào.

### 2. Tab 1: "Lịch Trình & Lời Nhắc" (Kéo Thả Vào TKB, Báo Thức & Phân Loại Màu)
- **Tạo thẻ thời khóa biểu mới**:
  - Nhập **Tên lịch** (ví dụ: *Nộp bài tập lớn C++*, *Kiểm tra 15 phút*).
  - Nhập **Nội dung chi tiết** (ví dụ: *Phòng 702-A2*, *Mang theo đề cương*).
  - **Tùy chỉnh số phút báo trước buổi học**: Chọn báo trước **-5 phút, -10 phút, -15 phút, -20 phút, -30 phút, -45 phút, -60 phút, Đúng giờ (0p)**, hoặc chọn **Tùy chỉnh** để tự nhập số phút theo nhu cầu chuẩn bị của bạn.
  - **Bảng chọn màu trực quan (10 màu phong phú)**: 🔴 Đỏ PTIT, 🔵 Xanh dương, 🟢 Xanh lá, 🌱 Xanh lá non, 🟠 Cam, 🟣 Tím, 🌸 Hồng, 🟤 Nâu, ⚫ Đen, ⚪ Xám.
  - Nhấn **+ Thêm thẻ**.
- **Danh sách thẻ mẫu dạng lưới hình vuông & Bộ lọc theo màu**:
  - Các thẻ mẫu được hiển thị dưới dạng **thẻ hình vuông nhỏ gọn** xếp theo dạng lưới hiện đại, giúp tiết kiệm diện tích tối đa.
  - **Thanh phân loại màu**: Bấm vào nút màu tương ứng để lọc nhanh các thẻ theo màu (hoặc chọn *Tất cả*).
  - **Xóa thẻ mẫu**: Rê chuột vào thẻ vuông và bấm nút **×** ở góc trên bên phải thẻ.
- **Kéo thả thông minh vào ô Thời khóa biểu**:
  - Nhấn và giữ chuột vào thẻ vuông trong danh sách rồi kéo thả vào ô tiết học mong muốn trên bảng thời khóa biểu PTIT.
  - **Full màu nền và chữ trắng nổi bật**: Thẻ ghim trên thời khóa biểu được phủ 100% màu nền theo màu bạn chọn với văn bản màu trắng sắc nét.
  - **Dóng tự động cột trên cùng**: Tự động nhận diện cột để trích xuất chính xác **Thứ** và **Ngày** (ví dụ: `Thứ 3 (15/09)`).
  - **Dóng tự động dòng chiều ngang**: Tự động quét dòng để lấy **Tiết học** (ví dụ: `Tiết 1`) và **Thời gian bắt đầu** (ví dụ: `07:00 -> 08:50`).
  - **Tính toán báo thức thông minh**: Tự động lùi thời gian báo thức theo số phút đã đặt so với giờ bắt đầu buổi học (ví dụ: lớp học lúc 07:00, báo trước 15 phút $\rightarrow$ chuông và thông báo sẽ tự động kích hoạt vào lúc 06:45).
  - **Căn chỉnh vị trí thẻ trong cùng 1 ô (Hoạt ảnh đường viền chỉ vị trí thả trực quan)**:
    - Khi trong 1 ô đã có thẻ, bạn có thể chủ động chọn vị trí thả mới: **trên cùng**, **ở giữa** hoặc **dưới cùng**.
    - Đường viền chỉ dẫn màu đỏ phát sáng mượt mà với nhãn `Thả vào đây` sẽ tự động hiển thị theo con trỏ chuột.
  - **Kéo thả sắp xếp lại vị trí thẻ trực tiếp trên bảng**: Tất cả các thẻ đã ghim trong ô đều hỗ trợ kéo thả (`drag & drop`) trực tiếp để đổi chỗ hoặc di chuyển sang các ô khác.
  - **Khắc phục triệt để lỗi nhảy cột khi chuyển tuần**:
    - Sử dụng **giải thuật Ma Trận Bảng (Table Matrix)** và **định vị ngữ nghĩa**. Khi chuyển tuần, tiện ích tự động tái dựng ma trận và khóa chặt thẻ ghim vào đúng cột Thứ và Giờ học.
- **Xóa thẻ đã gắn trên TKB**:
  - **Kéo thả vào bảng để xóa**: Nhấn giữ thẻ trên thời khóa biểu và kéo thả sang bảng điều khiển tiện ích bên trái (hoặc nút bấm đỏ `PTIT >` ở góc trái khi bảng đang đóng) để xóa thẻ.
  - **Gỡ nhanh toàn bộ thẻ**: Nhấn nút **🗑️ Gỡ tất cả thẻ đã gắn trên TKB** để xóa sạch mọi thẻ đang gắn trên trang web chỉ trong 1 lần bấm (có hộp thoại xác nhận an toàn).
- **Báo thức & Chuông âm thanh**:
  - Khi đến giờ hẹn, Extension sẽ tự động gửi thông báo máy tính (kèm chi tiết thứ, ngày, tiết, giờ học) và kích hoạt chuông báo âm thanh trên tab PTIT.

### 3. Tab 2: "Thời Gian Biểu 24h Hôm Nay" (Tự Động Bám Theo TKB & Thẻ Hoạt Động Hiện Tại)
- **Tự động bám theo cột ngày hôm nay của Thời khóa biểu**:
  - Không cần thiết lập thủ công riêng biệt: Tiện ích tự động nhận diện **Thứ và Ngày hôm nay** (`DD/MM/YYYY`) trên bảng thời khóa biểu PTIT.
  - Tự động trích xuất toàn bộ các môn học/lớp học trong ngày hôm nay (tên môn, phòng học, tiết học, giờ bắt đầu và giờ kết thúc).
  - Tự động tích hợp các **thẻ thời khóa biểu ghim** bạn đã gắn vào cột ngày hôm nay.
  - Tự động gộp liền mạch các tiết học liên tiếp cùng môn thành một khối thời gian liên tục.
- **Biểu Đồ Tròn Đồng Hồ 24 Giờ Trực Quan**:
  - Vẽ trực quan các phân đoạn thời gian học và hoạt động trong ngày lên mặt đồng hồ 24 giờ (`0h` ở đỉnh, `6h` ở góc 3h, `12h` ở góc 6h, `18h` ở góc 9h).
  - **Kim chỉ giờ thời gian thực (Live needle)** màu đỏ chỉ chính xác giờ phút hiện tại.
  - Tự động cập nhật tức thì mỗi 10 giây hoặc khi kéo thả/gỡ thẻ.
- **Khung Hình Chữ Nhật Nổi Bật Nhắc Việc Hiện Tại**:
  - Nằm ngay dưới biểu đồ tròn 24h, hiển thị trạng thái công việc/thẻ TKB ngay tại thời điểm thực tế:
    - **Khi đang trong giờ học / có việc**:
      - Nhãn nhấp nháy `ĐANG DIỄN RA` với màu sắc đại diện cho thẻ/môn học.
      - Tên môn học / thẻ công việc hiển thị nổi bật, cỡ chữ to rõ.
      - Khung giờ chi tiết, số tiết, phòng học / ghi chú.
      - **⏱️ Đếm ngược thời gian còn lại**: Cập nhật trực tiếp số phút còn lại của buổi học/công việc.
      - **Thanh tiến độ (Progress bar)**: Trực quan hóa % thời gian đã trôi qua trong buổi học.
    - **Khi đang rảnh / ngoài giờ học**:
      - Nhãn `☕ ĐANG RẢNH / NGHỈ NGƠI` cùng đồng hồ hiện tại.
      - Hiển thị thông tin **Công việc/môn học tiếp theo** trong ngày kèm đếm ngược số phút sắp tới.
- **Danh Sách Lịch Trình Hôm Nay Theo Dòng Thời Gian**:
  - Liệt kê toàn bộ các khung giờ hoạt động trong ngày đã được sắp xếp tăng dần theo thời gian.
  - Môn học đang diễn ra được làm nổi bật với viền phát sáng và nhãn `Đang diễn ra`.

### 4. Tính Năng Anti Logout & Chống Khóa Thoát Đăng Nhập (24/7)
- **Cơ chế**:
  - **Giả lập nhịp tim tương tác 15s**: Tự động phát sự kiện tương tác chuẩn (`mousemove`, `keydown`) mỗi 15 giây lên `window` và `document`.
  - **Chặn yêu cầu POST đăng xuất ngầm**: Can thiệp `fetch` và `XMLHttpRequest`, chặn và vô hiệu hóa mọi lệnh gọi `POST /api/auth/logout` do hẹn giờ tự động.
  - **Gia hạn phiên máy chủ định kỳ 2 phút**: Gửi tín hiệu ping `GET /api/auth/ping` kèm mã xác thực `Bearer Token`.
  - **Lá chắn bảo vệ `CURRENT_USER`**: Bảo vệ `sessionStorage` không bị xóa ngoài ý muốn.
  - **Triệt tiêu modal cảnh báo & Chặn reload**: Tự động xóa ngay hộp thoại *"Phiên làm việc đã hết hạn"* và chặn `window.location.reload()`.

### 5. Chuẩn Hóa Thời Gian Biểu 24 Giờ & Sửa Lỗi Ô Sau 22:00
- **Chuẩn hóa khung giờ đêm và sáng sớm**:
  - Bổ sung 7 khung giờ ban đêm/sáng sớm (`00:00 - 01:00`, ..., `06:00 - 07:00`) ở đầu bảng.
  - Định dạng lại các mốc sau 22:00 thành `22:00 - 23:00` và `23:00 - 24:00`, ẩn các hàng lẻ 6 phút phân mảnh ở giữa.

### 6. Quản Lý & Sao Lưu Dữ Liệu
- **Liên kết thư mục máy tính**: Nhấn **Chọn thư mục** để lưu tự động dữ liệu vào thư mục bạn chỉ định (`CauHinhToanBoTienIch.json`, `LoiNhacHenGio.json`, `ThoiGianBieu.json`).
- **Xuất / Nhập file JSON**:
  - **Xuất file JSON**: Tải tệp sao lưu `.json` về máy.
  - **Nhập file JSON**: Khôi phục lại toàn bộ dữ liệu chỉ với 1 click.

---

## III. CAM KẾT AN TOÀN DỮ LIỆU & QUY CHUẨN

1. **Không sinh rác trên máy**: Toàn bộ mã nguồn nằm gọn trong thư mục extension, không lưu rác vào `%temp%` hay `%appdata%`.
2. **Offline 100%**: Hoạt động trực tiếp trên trình duyệt, không gửi dữ liệu ra máy chủ bên ngoài.
3. **Hiệu năng cao**: Giao diện sắc nét, tối ưu hóa sự kiện chuột và DOM, không gây lag trang web.
