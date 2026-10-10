// Kịch bản xử lý cho cửa sổ popup của extension khi bấm vào biểu tượng
document.addEventListener('DOMContentLoaded', function () {
  const SoLuongLoiNhacSpan = document.getElementById('SoLuongLoiNhac');
  const DanhSachLoiNhacNhoDiv = document.getElementById('DanhSachLoiNhacNho');
  const NutSaoLuuDuLieuPopup = document.getElementById('NutSaoLuuDuLieuPopup');
  const CanvasPopup = document.getElementById('CanvasBieuDoPopup');
  const PopupNgayHomNaySpan = document.getElementById('PopupNgayHomNay');
  const PopupNhacViecHienTai = document.getElementById('PopupNhacViecHienTai');

  function ChuoiGioSangPhut(ChuoiGio) {
    if (!ChuoiGio || typeof ChuoiGio !== 'string') return 0;
    const Phan = ChuoiGio.split(':');
    return parseInt(Phan[0], 10) * 60 + parseInt(Phan[1], 10);
  }

  function LayThongTinHomNay() {
    const NgayHienTai = new Date();
    const ThuTrongTuan = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const TenThu = ThuTrongTuan[NgayHienTai.getDay()];
    const Ngay = String(NgayHienTai.getDate()).padStart(2, '0');
    const Thang = String(NgayHienTai.getMonth() + 1).padStart(2, '0');
    const Nam = NgayHienTai.getFullYear();

    return {
      TenThu: TenThu,
      ChuoiHienThi: `${TenThu}, ${Ngay}/${Thang}/${Nam}`,
      ChuoiNgayDayDu: `${Ngay}/${Thang}/${Nam}`
    };
  }

  // Đọc dữ liệu từ bộ nhớ cục bộ
  chrome.storage.local.get([
    'DanhSachLoiNhac',
    'DanhSachLoiNhacGhim',
    'DanhSachHoatDongHomNay',
    'NgayLuuHoatDong'
  ], function (KetQuaBoNho) {
    const DanhSachLoiNhac = KetQuaBoNho.DanhSachLoiNhac || [];
    const DanhSachLoiNhacGhim = KetQuaBoNho.DanhSachLoiNhacGhim || [];
    const DanhSachHoatDongHomNay = KetQuaBoNho.DanhSachHoatDongHomNay || [];
    const ThongTinHomNay = LayThongTinHomNay();

    if (PopupNgayHomNaySpan) {
      PopupNgayHomNaySpan.textContent = `${ThongTinHomNay.TenThu}, ${ThongTinHomNay.ChuoiNgayDayDu.slice(0, 5)}`;
    }

    // Hiển thị số lượng và danh sách lời nhắc
    if (SoLuongLoiNhacSpan) {
      SoLuongLoiNhacSpan.textContent = DanhSachLoiNhac.length;
    }

    if (DanhSachLoiNhacNhoDiv) {
      if (DanhSachLoiNhac.length === 0) {
        DanhSachLoiNhacNhoDiv.textContent = 'Chưa có lời nhắc nào.';
      } else {
        let ChuoiHtmlLoiNhac = '<ul style="margin: 0; padding: 0; list-style: none;">';
        const SoLuongHienThi = Math.min(DanhSachLoiNhac.length, 3);
        for (let ChiSo = 0; ChiSo < SoLuongHienThi; ChiSo++) {
          const Item = DanhSachLoiNhac[ChiSo];
          const MauItem = Item.MauSac || '#B71C1C';
          ChuoiHtmlLoiNhac += `
            <li style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${MauItem}; flex-shrink:0;"></span>
              <div style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap; font-size:12px;">
                <strong>${Item.TieuDe}</strong>${Item.GhiChu ? ': ' + Item.GhiChu : ''}
              </div>
            </li>
          `;
        }
        if (DanhSachLoiNhac.length > 3) {
          ChuoiHtmlLoiNhac += `<li style="font-size:11px; color:#888888; font-style:italic; margin-top:2px;">...và ${DanhSachLoiNhac.length - 3} lời nhắc khác</li>`;
        }
        ChuoiHtmlLoiNhac += '</ul>';
        DanhSachLoiNhacNhoDiv.innerHTML = ChuoiHtmlLoiNhac;
      }
    }

    // Hàm cập nhật biểu đồ và trạng thái hoạt động hiện tại
    function CapNhatGiaoDienPopup() {
      if (CanvasPopup && window.ThuVienTienIch) {
        window.ThuVienTienIch.VeBieuDoTronThoiGian(CanvasPopup, DanhSachHoatDongHomNay);
      }

      if (PopupNhacViecHienTai) {
        const BayGio = new Date();
        const PhutHienTai = BayGio.getHours() * 60 + BayGio.getMinutes();
        const ChuoiGioHienTai = BayGio.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        let HoatDongHienTai = null;
        let PhutConLaiHienTai = 0;
        let PhanTramTienDo = 0;
        let HoatDongTiepTheo = null;
        let PhutSapToi = 0;

        for (let ChiSo = 0; ChiSo < DanhSachHoatDongHomNay.length; ChiSo++) {
          const Item = DanhSachHoatDongHomNay[ChiSo];
          const PhutDau = ChuoiGioSangPhut(Item.GioBatDau);
          const PhutCuoi = ChuoiGioSangPhut(Item.GioKetThuc);

          if (PhutDau <= PhutHienTai && PhutHienTai < PhutCuoi) {
            HoatDongHienTai = Item;
            PhutConLaiHienTai = PhutCuoi - PhutHienTai;
            const TongPhut = PhutCuoi - PhutDau;
            PhanTramTienDo = (TongPhut > 0) ? Math.min(100, Math.max(0, Math.round(((PhutHienTai - PhutDau) / TongPhut) * 100))) : 0;
            break;
          } else if (PhutDau > PhutHienTai && !HoatDongTiepTheo) {
            HoatDongTiepTheo = Item;
            PhutSapToi = PhutDau - PhutHienTai;
          }
        }

        if (HoatDongHienTai) {
          const MauSac = HoatDongHienTai.MauSac || '#b71c1c';
          const ChuoiTiet = HoatDongHienTai.Tiet ? ` (${HoatDongHienTai.Tiet})` : '';
          const ChuoiGhiChu = HoatDongHienTai.GhiChu ? `<div class="GhiChuHienTai">📍 ${HoatDongHienTai.GhiChu}</div>` : '';
          const LoaiBadge = HoatDongHienTai.LaTheGhimTkb ? '📌 THẺ TKB' : '🏫 LỊCH HỌC';

          PopupNhacViecHienTai.innerHTML = `
            <div class="HopTrangThaiHienTai HopTrangThaiDangDienRa" style="border-left-color:${MauSac};">
              <div class="DongTrangThaiDau">
                <span class="BadgeDangDienRa" style="background-color:${MauSac};">
                  <span class="DotNhayTrangThai"></span>
                  ĐANG DIỄN RA
                </span>
                <span class="ThoiGianConLai">⏱️ Còn ${PhutConLaiHienTai}p</span>
              </div>
              <div class="TenViecHienTai" style="color:${MauSac}; font-size:12.5px;">${HoatDongHienTai.TenCongViec}</div>
              <div class="DongChiTietHienTai">
                <span class="BadgeKhungGio">🕒 ${HoatDongHienTai.GioBatDau} - ${HoatDongHienTai.GioKetThuc}${ChuoiTiet}</span>
                <span class="BadgeLoaiHienTai">${LoaiBadge}</span>
              </div>
              ${ChuoiGhiChu}
              <div class="ThanhTienDoKhung">
                <div class="ThanhTienDoChay" style="width:${PhanTramTienDo}%; background-color:${MauSac};"></div>
              </div>
            </div>
          `;
        } else {
          let HtmlTiepTheo = '';
          if (HoatDongTiepTheo) {
            const ChuoiTietTt = HoatDongTiepTheo.Tiet ? ` (${HoatDongTiepTheo.Tiet})` : '';
            HtmlTiepTheo = `
              <div class="HopViecTiepTheo">
                <div style="font-size:10.5px; font-weight:700; color:#1e293b; display:flex; justify-content:space-between;">
                  <span>👉 Sắp tới:</span>
                  <span style="color:#b71c1c;">(sau ${PhutSapToi}p)</span>
                </div>
                <div style="font-size:11.5px; font-weight:600; color:#0f172a; margin-top:2px;">
                  ${HoatDongTiepTheo.TenCongViec}
                </div>
                <div style="font-size:10.5px; color:#64748b;">
                  🕒 ${HoatDongTiepTheo.GioBatDau} - ${HoatDongTiepTheo.GioKetThuc}${ChuoiTietTt} ${HoatDongTiepTheo.GhiChu ? '• ' + HoatDongTiepTheo.GhiChu : ''}
                </div>
              </div>
            `;
          } else if (DanhSachHoatDongHomNay.length > 0) {
            HtmlTiepTheo = `<div style="font-size:10.5px; color:#16a34a; font-weight:600; margin-top:3px;">🎉 Đã hoàn thành các lịch trình hôm nay!</div>`;
          } else {
            HtmlTiepTheo = `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">Mở trang TKB PTIT để tự động đồng bộ lịch hôm nay.</div>`;
          }

          PopupNhacViecHienTai.innerHTML = `
            <div class="HopTrangThaiHienTai HopTrangThaiNghiNgoi">
              <div class="DongTrangThaiDau">
                <span class="BadgeNghiNgoi">☕ ĐANG RẢNH</span>
                <span class="GioHienTaiBadge">${ChuoiGioHienTai}</span>
              </div>
              <div class="TenViecHienTai" style="color:#475569; font-size:12px;">Hiện tại không có lịch học hoặc thẻ nhắc nhở nào.</div>
              ${HtmlTiepTheo}
            </div>
          `;
        }
      }
    }

    CapNhatGiaoDienPopup();
    setInterval(CapNhatGiaoDienPopup, 30000);

    // Xử lý nút tải về sao lưu toàn bộ cấu hình tiện ích
    if (NutSaoLuuDuLieuPopup) {
      NutSaoLuuDuLieuPopup.onclick = function () {
        const DuLieuSaoLuu = JSON.stringify({
          PhienBan: '1.0',
          ThoiGianLuu: new Date().toISOString(),
          DanhSachLoiNhac: DanhSachLoiNhac,
          DanhSachLoiNhacGhim: DanhSachLoiNhacGhim,
          DanhSachHoatDongHomNay: DanhSachHoatDongHomNay
        }, null, 2);

        const BlobSaoLuu = new Blob([DuLieuSaoLuu], { type: 'application/json;charset=utf-8' });
        const TenTepSaoLuu = 'CauHinhPTIT_' + new Date().toISOString().slice(0, 10) + '.json';

        if (window.ThuVienTienIch) {
          window.ThuVienTienIch.TaiTepVeMay(BlobSaoLuu, TenTepSaoLuu);
        }
      };
    }
  });
});
