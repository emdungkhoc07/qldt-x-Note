// Dịch vụ nền quản lý báo thức hẹn giờ và thông báo trình duyệt
// Hàm phát thông báo desktop và chuông báo thức dùng chung cho cả báo thức tự động và nút ping kiểm tra
function PhatThongBaoVaChuongBaoThuc(TenBaoThuc, LoiNhacKichHoat, LaLoiNhacGhim) {
  let TieuDeHienThi = 'Nhắc nhở Thời khóa biểu PTIT';
  let NoiDungHienThi = 'Đã đến thời gian bạn đã đặt lịch!';

  if (LoiNhacKichHoat) {
    TieuDeHienThi = LoiNhacKichHoat.TieuDe || TieuDeHienThi;
    if (LaLoiNhacGhim && LoiNhacKichHoat.Thu) {
      const ThongTinTiet = LoiNhacKichHoat.Tiet ? (' - ' + LoiNhacKichHoat.Tiet) : ''; /* Cú pháp đầy đủ: let ThongTinTiet = ''; if (LoiNhacKichHoat.Tiet) { ThongTinTiet = ' - ' + LoiNhacKichHoat.Tiet; } */
      const ThongTinGio = LoiNhacKichHoat.GioBatDau ? (' lúc ' + LoiNhacKichHoat.GioBatDau) : ''; /* Cú pháp đầy đủ: let ThongTinGio = ''; if (LoiNhacKichHoat.GioBatDau) { ThongTinGio = ' lúc ' + LoiNhacKichHoat.GioBatDau; } */
      const ThongTinTruoc = (typeof LoiNhacKichHoat.SoPhutBaoTruoc === 'number') ? (' (Báo trước ' + LoiNhacKichHoat.SoPhutBaoTruoc + ' phút)') : ''; /* Cú pháp đầy đủ: let ThongTinTruoc = ''; if (typeof LoiNhacKichHoat.SoPhutBaoTruoc === 'number') { ThongTinTruoc = ' (Báo trước ' + LoiNhacKichHoat.SoPhutBaoTruoc + ' phút)'; } */
      NoiDungHienThi = 'Sắp diễn ra: ' + LoiNhacKichHoat.Thu + ThongTinTiet + ThongTinGio + ThongTinTruoc + ' - ' + (LoiNhacKichHoat.GhiChu || LoiNhacKichHoat.TieuDe);
    } else {
      NoiDungHienThi = LoiNhacKichHoat.GhiChu || 'Đã đến thời gian bạn đã đặt lịch!';
    }
  }

  // Tạo thông báo hiển thị trên màn hình máy tính (khung popup Action Center góc phải màn hình desktop)
  chrome.notifications.create(TenBaoThuc, {
    type: 'basic',
    iconUrl: 'bieu_tuong/icon128.png',
    title: '[PTIT] ' + TieuDeHienThi,
    message: NoiDungHienThi,
    priority: 2,
    requireInteraction: true
  }, function (MaThongBao) {
    if (chrome.runtime.lastError) {
      console.warn('Lỗi hiển thị thông báo Chrome:', chrome.runtime.lastError);
    }
  });

  // Gửi tín hiệu phát âm thanh và hiển thị thẻ thông báo nổi đến tất cả các tab đang mở trang web PTIT
  chrome.tabs.query({ url: '*://qldt.ptit.edu.vn/*' }, function (DanhSachTab) {
    if (DanhSachTab && DanhSachTab.length > 0) {
      for (let ChiSoTab = 0; ChiSoTab < DanhSachTab.length; ChiSoTab++) {
        chrome.tabs.sendMessage(DanhSachTab[ChiSoTab].id, {
          HanhDong: 'PhatChuongBaoThuc',
          TieuDe: TieuDeHienThi,
          NoiDung: NoiDungHienThi,
          MauSac: (LoiNhacKichHoat && LoiNhacKichHoat.MauSac) ? LoiNhacKichHoat.MauSac : '#B71C1C' /* Cú pháp đầy đủ: let Mau = '#B71C1C'; if (LoiNhacKichHoat && LoiNhacKichHoat.MauSac) { Mau = LoiNhacKichHoat.MauSac; } */
        }).catch(function () {});
      }
    }
  });
}

// Bắt sự kiện chuông báo thức đến hạn từ chrome.alarms
chrome.alarms.onAlarm.addListener(function (ThongTinBaoThuc) {
  const TenBaoThuc = ThongTinBaoThuc.name;

  // Lấy dữ liệu lời nhắc từ bộ nhớ cục bộ để hiển thị thông báo
  chrome.storage.local.get(['DanhSachLoiNhac', 'DanhSachLoiNhacGhim'], function (KetQuaBoNho) {
    const DanhSachLoiNhac = KetQuaBoNho.DanhSachLoiNhac || [];
    const DanhSachLoiNhacGhim = KetQuaBoNho.DanhSachLoiNhacGhim || [];
    let LoiNhacKichHoat = null;
    let LaLoiNhacGhim = false;

    for (let ChiSoGhim = 0; ChiSoGhim < DanhSachLoiNhacGhim.length; ChiSoGhim++) {
      if (DanhSachLoiNhacGhim[ChiSoGhim].MaGhim === TenBaoThuc) {
        LoiNhacKichHoat = DanhSachLoiNhacGhim[ChiSoGhim];
        LaLoiNhacGhim = true;
        break;
      }
    }

    if (!LoiNhacKichHoat) {
      for (let ChiSo = 0; ChiSo < DanhSachLoiNhac.length; ChiSo++) {
        if (DanhSachLoiNhac[ChiSo].MaDinhDanh === TenBaoThuc) {
          LoiNhacKichHoat = DanhSachLoiNhac[ChiSo];
          break;
        }
      }
    }

    PhatThongBaoVaChuongBaoThuc(TenBaoThuc, LoiNhacKichHoat, LaLoiNhacGhim);
  });
});

// Xử lý khi người dùng nhấn vào popup thông báo trên desktop
chrome.notifications.onClicked.addListener(function (MaThongBao) {
  chrome.notifications.clear(MaThongBao);
  chrome.tabs.query({ url: '*://qldt.ptit.edu.vn/*' }, function (DanhSachTab) {
    if (DanhSachTab && DanhSachTab.length > 0) {
      chrome.tabs.update(DanhSachTab[0].id, { active: true });
    }
  });
});

// Lắng nghe các yêu cầu cài đặt, hủy báo thức và ping thử thông báo từ giao diện
chrome.runtime.onMessage.addListener(function (ThongDiep, NguoiGui, PhanHoi) {
  if (ThongDiep.HanhDong === 'ThietLapBaoThuc') {
    const MaDinhDanh = ThongDiep.MaDinhDanh;
    const ThoiGianMiliGiay = Number(ThongDiep.ThoiGianMiliGiay);

    if (MaDinhDanh && ThoiGianMiliGiay && ThoiGianMiliGiay > Date.now()) {
      chrome.alarms.create(MaDinhDanh, { when: ThoiGianMiliGiay });
      PhanHoi({ ThanhCong: true });
    } else {
      PhanHoi({ ThanhCong: false, Loi: 'Thời gian báo thức không hợp lệ' });
    }
    return true;
  }

  if (ThongDiep.HanhDong === 'HuyBaoThuc') {
    const MaDinhDanh = ThongDiep.MaDinhDanh;
    if (MaDinhDanh) {
      chrome.alarms.clear(MaDinhDanh, function (DaHuy) {
        PhanHoi({ ThanhCong: DaHuy });
      });
    }
    return true;
  }

  // Ping thử thông báo sử dụng nguyên khối code phát thông báo của thẻ thời khóa biểu
  if (ThongDiep.HanhDong === 'PingThongBaoTkb') {
    chrome.storage.local.get(['DanhSachLoiNhacGhim', 'DanhSachLoiNhac'], function (KetQuaBoNho) {
      const DanhSachLoiNhacGhim = KetQuaBoNho.DanhSachLoiNhacGhim || [];
      const DanhSachLoiNhac = KetQuaBoNho.DanhSachLoiNhac || [];
      let LoiNhacPing = null;
      let LaLoiNhacGhim = false;

      // Ưu tiên dùng nguyên thẻ thời khóa biểu đã ghim thực tế của người dùng
      if (DanhSachLoiNhacGhim.length > 0) {
        LoiNhacPing = DanhSachLoiNhacGhim[DanhSachLoiNhacGhim.length - 1];
        LaLoiNhacGhim = true;
      } else if (DanhSachLoiNhac.length > 0) {
        LoiNhacPing = DanhSachLoiNhac[DanhSachLoiNhac.length - 1];
        LaLoiNhacGhim = false;
      } else {
        LoiNhacPing = {
          MaGhim: 'Ping_Thong_Bao_Mau_' + Date.now(),
          TieuDe: '[PING THỬ] Báo thức tiết học PTIT',
          GhiChu: 'Phòng học 302-A2 - Mang laptop và slide bài giảng C++',
          Thu: 'Thứ 2',
          Tiet: 'Tiết 1 - 2',
          GioBatDau: '07:00',
          SoPhutBaoTruoc: 15,
          MauSac: '#B71C1C'
        };
        LaLoiNhacGhim = true;
      }

      const MaThongBaoPing = 'Ping_BaoThuc_' + Date.now();
      PhatThongBaoVaChuongBaoThuc(MaThongBaoPing, LoiNhacPing, LaLoiNhacGhim);

      PhanHoi({
        ThanhCong: true,
        LoiNhac: LoiNhacPing
      });
    });
    return true;
  }
});
