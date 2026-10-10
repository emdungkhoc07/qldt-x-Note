// Kịch bản anti-logout duy trì phiên đăng nhập vĩnh viễn trên website PTIT (Chạy trong môi trường MAIN World)
(function () {
  'use strict';

  if (window.PtitTienIchGiuDangNhapKhoiChay) return;
  window.PtitTienIchGiuDangNhapKhoiChay = true;

  // Khôi phục giá trị 'if' về '0' nếu bị đặt thành '1' (chế độ iframe gây ẩn toàn bộ danh mục nút menu)
  try {
    if (sessionStorage.getItem('if') === '1') {
      sessionStorage.setItem('if', '0');
    }
  } catch (Loi) {}

  // ============================
  // 1. Phát nhịp tim tương tác giả lập mỗi 15 giây để reset bộ đếm userIdle phía client
  // ============================
  function BatDauPhatNhipTimTuongTac() {
    function PhatNhipTim() {
      try {
        var SuKienChuot = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: 200 + Math.floor(Math.random() * 100),
          clientY: 200 + Math.floor(Math.random() * 100)
        });
        window.dispatchEvent(SuKienChuot);
        document.dispatchEvent(SuKienChuot);

        var SuKienPhim = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Shift',
          code: 'ShiftLeft'
        });
        document.dispatchEvent(SuKienPhim);
      } catch (LoiPhat) {}
    }

    PhatNhipTim();
    setInterval(PhatNhipTim, 15000);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        PhatNhipTim();
      }
    });
  }

  // ============================
  // 2. Chặn yêu cầu đăng xuất ngầm — can thiệp fetch và XMLHttpRequest
  // ============================
  function ChanYeuCauDangXuat() {
    function LaUrlLogout(Url) {
      if (!Url || typeof Url !== 'string') return false;
      var UrlThuong = Url.toLowerCase();
      return (UrlThuong.indexOf('/logout') !== -1 || UrlThuong.indexOf('/sign-out') !== -1 || UrlThuong.indexOf('/signout') !== -1);
    }

    // --- Can thiệp fetch ---
    try {
      var FetchGoc = window.fetch;
      window.fetch = function (UrlHoacRequest, TuyChon) {
        try {
          var UrlKiemTra = '';
          if (typeof UrlHoacRequest === 'string') {
            UrlKiemTra = UrlHoacRequest;
          } else if (UrlHoacRequest && UrlHoacRequest.url) {
            UrlKiemTra = UrlHoacRequest.url;
          }
          if (LaUrlLogout(UrlKiemTra)) {
            console.log('[Anti-Logout] Đã chặn fetch logout:', UrlKiemTra);
            return Promise.resolve(new Response('{"success":true}', {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        } catch (Loi) {}
        return FetchGoc.apply(this, arguments);
      };
    } catch (LoiFetch) {}

    // --- Can thiệp XMLHttpRequest.open để đánh dấu URL logout ---
    try {
      var MoGoc = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (PhuongThuc, Url) {
        this._ptitUrl = Url || '';
        this._ptitBlocked = false;
        if (LaUrlLogout(this._ptitUrl)) {
          this._ptitBlocked = true;
          console.log('[Anti-Logout] Đã đánh dấu chặn XHR logout:', PhuongThuc, Url);
        }
        return MoGoc.apply(this, arguments);
      };
    } catch (LoiOpen) {}

    // --- Can thiệp XMLHttpRequest.send để chặn gửi request logout ---
    try {
      var GuiGoc = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        if (this._ptitBlocked) {
          console.log('[Anti-Logout] Đã chặn gửi XHR logout:', this._ptitUrl);
          // Không gửi request, không cần giả lập response — chỉ bỏ qua im lặng
          return;
        }
        return GuiGoc.apply(this, arguments);
      };
    } catch (LoiSend) {}
  }

  // ============================
  // 3. Gia hạn phiên máy chủ định kỳ — gửi ping Bearer Token mỗi 2 phút
  // ============================
  function BatDauGiaHanPhienDinhKy() {
    function LayBearerToken() {
      try {
        var ChuoiNguoiDung = sessionStorage.getItem('CURRENT_USER');
        if (ChuoiNguoiDung) {
          var ObjNguoiDung = JSON.parse(ChuoiNguoiDung);
          if (ObjNguoiDung && ObjNguoiDung.access_token) return ObjNguoiDung.access_token;
          if (ObjNguoiDung && ObjNguoiDung.token) return ObjNguoiDung.token;
        }
      } catch (Loi) {}

      try {
        var ChuoiLocal = localStorage.getItem('CURRENT_USER');
        if (ChuoiLocal) {
          var ObjLocal = JSON.parse(ChuoiLocal);
          if (ObjLocal && ObjLocal.access_token) return ObjLocal.access_token;
          if (ObjLocal && ObjLocal.token) return ObjLocal.token;
        }
      } catch (Loi2) {}

      // Quét tất cả key trong sessionStorage tìm token
      try {
        for (var i = 0; i < sessionStorage.length; i++) {
          var Key = sessionStorage.key(i);
          var GiaTri = sessionStorage.getItem(Key);
          if (GiaTri && GiaTri.length > 50 && GiaTri.indexOf('"access_token"') !== -1) {
            var Obj = JSON.parse(GiaTri);
            if (Obj && Obj.access_token) return Obj.access_token;
          }
        }
      } catch (Loi3) {}

      return null;
    }

    function GuiPingGiaHanPhien() {
      try {
        var Token = LayBearerToken();
        if (!Token) return;

        // Sử dụng fetch gốc (đã lưu trước khi override) để tránh bị chặn bởi chính mình
        var FetchDung = window._ptitFetchGoc || window.fetch;

        FetchDung('/api/sch/w-locdkytheonamhoc', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + Token,
            'Content-Type': 'application/json'
          }
        }).then(function (Res) {
          if (Res.ok) {
            console.log('[Anti-Logout] Ping gia hạn phiên thành công. Status:', Res.status);
          } else if (Res.status === 401) {
            console.log('[Anti-Logout] Token có thể đã hết hạn. Status:', Res.status);
          }
        }).catch(function () {
          // Thử fallback endpoint
          FetchDung('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + Token,
              'Content-Type': 'application/json'
            }
          }).then(function (Res2) {
            console.log('[Anti-Logout] Ping fallback. Status:', Res2.status);
          }).catch(function () {});
        });
      } catch (LoiPing) {}
    }

    // Lưu fetch gốc trước khi bị override
    window._ptitFetchGoc = window.fetch;

    // Ping ngay sau 5 giây, rồi lặp lại mỗi 2 phút
    setTimeout(GuiPingGiaHanPhien, 5000);
    setInterval(GuiPingGiaHanPhien, 120000);
  }

  // ============================
  // 4. Lá chắn bảo vệ CURRENT_USER — chống xóa sessionStorage ngoài ý muốn
  // ============================
  function BatDauBaoVeCurrentUser() {
    var BanSaoCurrentUser = null;

    function SaoLuuCurrentUser() {
      try {
        var GiaTri = sessionStorage.getItem('CURRENT_USER');
        if (GiaTri && GiaTri.length > 10) {
          BanSaoCurrentUser = GiaTri;
        }
      } catch (Loi) {}
    }

    function KhoiPhucNeuBiXoa() {
      try {
        var GiaTriHienTai = sessionStorage.getItem('CURRENT_USER');
        if ((!GiaTriHienTai || GiaTriHienTai.length < 10) && BanSaoCurrentUser) {
          sessionStorage.setItem('CURRENT_USER', BanSaoCurrentUser);
          console.log('[Anti-Logout] Đã khôi phục CURRENT_USER từ bản sao lưu.');
        } else if (GiaTriHienTai && GiaTriHienTai.length > 10) {
          BanSaoCurrentUser = GiaTriHienTai;
        }
      } catch (Loi) {}
    }

    SaoLuuCurrentUser();

    // Kiểm tra và khôi phục mỗi 5 giây (an toàn, không override native API)
    setInterval(KhoiPhucNeuBiXoa, 5000);

    // Bắt sự kiện storage thay đổi
    window.addEventListener('storage', function (SuKien) {
      try {
        if (SuKien.key === 'CURRENT_USER' && (!SuKien.newValue || SuKien.newValue.length < 10)) {
          if (BanSaoCurrentUser) {
            sessionStorage.setItem('CURRENT_USER', BanSaoCurrentUser);
            console.log('[Anti-Logout] Đã chặn xóa CURRENT_USER qua event storage.');
          }
        }
      } catch (Loi) {}
    });
  }

  // ============================
  // 5. Triệt tiêu modal cảnh báo "Phiên hết hạn" và chặn chuyển hướng về login
  // ============================
  function BatDauTrietTieuModalVaLogin() {
    // --- Quét và xóa modal cảnh báo hết hạn phiên ---
    function XoaModalHetHan() {
      try {
        var DanhSachModal = document.querySelectorAll('.cdk-overlay-container, .modal, .swal2-container, [role="dialog"]');
        for (var i = 0; i < DanhSachModal.length; i++) {
          var Modal = DanhSachModal[i];
          var NoiDung = (Modal.textContent || '').toLowerCase();

          var LienQuanHetPhien = (
            (NoiDung.indexOf('phiên') !== -1 && (NoiDung.indexOf('hết') !== -1 || NoiDung.indexOf('đã hết') !== -1)) ||
            (NoiDung.indexOf('session') !== -1 && (NoiDung.indexOf('expired') !== -1 || NoiDung.indexOf('timeout') !== -1)) ||
            (NoiDung.indexOf('đăng nhập lại') !== -1) ||
            (NoiDung.indexOf('login again') !== -1) ||
            (NoiDung.indexOf('unauthorized') !== -1)
          );

          if (LienQuanHetPhien) {
            // Ẩn modal thay vì remove để tránh lỗi Angular
            Modal.style.setProperty('display', 'none', 'important');
            Modal.style.setProperty('visibility', 'hidden', 'important');
            Modal.style.setProperty('opacity', '0', 'important');
            Modal.style.setProperty('pointer-events', 'none', 'important');
            console.log('[Anti-Logout] Đã ẩn modal cảnh báo hết phiên.');

            // Tự click nút đóng nếu có (thay vì xóa modal)
            var NutDong = Modal.querySelector('button.close, button[aria-label="Close"], .btn-close, .modal-close');
            if (NutDong) {
              NutDong.click();
            }
          }
        }

        // Ẩn backdrop/overlay liên quan
        var DanhSachBackdrop = document.querySelectorAll('.cdk-overlay-backdrop, .modal-backdrop, .swal2-backdrop-show');
        for (var j = 0; j < DanhSachBackdrop.length; j++) {
          var Backdrop = DanhSachBackdrop[j];
          // Chỉ ẩn nếu không phải của extension
          if (!Backdrop.closest || !Backdrop.closest('#BangDieuKhienChinh')) {
            Backdrop.style.setProperty('display', 'none', 'important');
          }
        }
      } catch (LoiModal) {}
    }

    // Quét modal mỗi 3 giây
    setInterval(XoaModalHetHan, 3000);

    // --- Chống chuyển hướng về trang login ---
    var HashTruocDo = window.location.hash;

    setInterval(function () {
      try {
        var HashHienTai = window.location.hash;

        // Cập nhật hash trước đó nếu đang ở trang bình thường
        if (HashHienTai && HashHienTai.length > 3 && HashHienTai !== '#/login' && HashHienTai !== '#/auth/login') {
          HashTruocDo = HashHienTai;
          return;
        }

        // Phát hiện bị chuyển về login trong khi vẫn còn CURRENT_USER
        if (
          (HashHienTai === '#/login' || HashHienTai === '#/auth/login' || HashHienTai === '#/' || HashHienTai === '') &&
          HashTruocDo && HashTruocDo.length > 3 && HashTruocDo !== '#/login'
        ) {
          var CuUser = sessionStorage.getItem('CURRENT_USER');
          if (CuUser && CuUser.length > 10) {
            console.log('[Anti-Logout] Đã chặn chuyển hướng về login. Quay lại:', HashTruocDo);
            window.location.hash = HashTruocDo;
          }
        }
      } catch (Loi) {}
    }, 2000);
  }

  // ============================
  // Khởi động toàn bộ hệ thống anti-logout
  // ============================
  function KhoiDongGiuDangNhap() {
    // Lưu fetch gốc trước mọi override
    window._ptitFetchGoc = window.fetch;

    BatDauPhatNhipTimTuongTac();
    ChanYeuCauDangXuat();
    BatDauGiaHanPhienDinhKy();
    BatDauBaoVeCurrentUser();
    BatDauTrietTieuModalVaLogin();
    console.log('[Anti-Logout] Hệ thống anti-logout đã khởi động đầy đủ 5 lớp bảo vệ.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', KhoiDongGiuDangNhap);
  } else {
    KhoiDongGiuDangNhap();
  }
})();
