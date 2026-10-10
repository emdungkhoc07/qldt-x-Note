// Kịch bản giao diện tích hợp trực tiếp trên trang web Thời khóa biểu PTIT
(function () {
  'use strict';

  // Khởi tạo các biến lưu trữ trạng thái dữ liệu giao diện
  let DanhSachLoiNhac = [];
  let DanhSachLoiNhacGhim = [];
  let DanhSachHoatDongHomNay = [];
  let BangDieuKhienHienThi = false;
  let TayCamThuMucLuu = null;
  let TenThuMucLuuHienTai = '';
  let ThongTinTheGhimDangKeo = null;
  let ThongTinTheMauDangKeo = null;
  let MauLoiNhacDangChon = '#B71C1C';
  let BoLocMauHienTai = 'TAT_CA';
  let ExtensionConHoatDong = true;

  // Kiểm tra xem extension context có còn hoạt động không (bị invalidated sau khi reload extension)
  function KiemTraExtensionConSong() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        return true;
      }
    } catch (Loi) {}
    ExtensionConHoatDong = false;
    return false;
  }

  // Wrapper an toàn cho chrome.storage.local.set — không crash khi context bị invalidated
  function LuuDuLieuAnToan(DuLieu, HamSauKhiLuu) {
    if (!KiemTraExtensionConSong()) return;
    try {
      chrome.storage.local.set(DuLieu, function () {
        try {
          if (chrome.runtime && chrome.runtime.lastError) return;
        } catch (E) {
          ExtensionConHoatDong = false;
          return;
        }
        if (typeof HamSauKhiLuu === 'function') HamSauKhiLuu();
      });
    } catch (Loi) {
      ExtensionConHoatDong = false;
    }
  }

  // Wrapper an toàn cho chrome.storage.local.get
  function DocDuLieuAnToan(DanhSachKey, HamXuLy) {
    if (!KiemTraExtensionConSong()) return;
    try {
      chrome.storage.local.get(DanhSachKey, function (KetQua) {
        try {
          if (chrome.runtime && chrome.runtime.lastError) return;
        } catch (E) {
          ExtensionConHoatDong = false;
          return;
        }
        if (typeof HamXuLy === 'function') HamXuLy(KetQua);
      });
    } catch (Loi) {
      ExtensionConHoatDong = false;
    }
  }

  // Wrapper an toàn cho chrome.storage.local.remove
  function XoaDuLieuAnToan(DanhSachKey, HamSauKhiXoa) {
    if (!KiemTraExtensionConSong()) return;
    try {
      chrome.storage.local.remove(DanhSachKey, function () {
        try {
          if (chrome.runtime && chrome.runtime.lastError) return;
        } catch (E) {
          ExtensionConHoatDong = false;
          return;
        }
        if (typeof HamSauKhiXoa === 'function') HamSauKhiXoa();
      });
    } catch (Loi) {
      ExtensionConHoatDong = false;
    }
  }

  // Wrapper an toàn cho chrome.runtime.sendMessage
  function GuiTinNhanAnToan(ThongDiep, HamPhanHoi) {
    if (!KiemTraExtensionConSong()) return;
    try {
      chrome.runtime.sendMessage(ThongDiep, function (PhanHoi) {
        try {
          if (chrome.runtime && chrome.runtime.lastError) return;
        } catch (E) {
          ExtensionConHoatDong = false;
          return;
        }
        if (typeof HamPhanHoi === 'function') HamPhanHoi(PhanHoi);
      });
    } catch (Loi) {
      ExtensionConHoatDong = false;
    }
  }

  // Khởi chạy toàn bộ tiện ích khi trang web sẵn sàng
  function KhoiDongTienIch() {
    KhoiPhucTrangThaiGiaoDienWeb();
    KhoiChayNhipTimTuongTacPhu();
    TaiDuLieuTuBoNho(async function () {
      TaoThanhPhanGiaoDien();
      TheoDoiVaGanSuKienThoiKhoaBieu();
      DangKyLangNgheTinNhan();
      await KhoiPhucTayCamThuMuc();
      setTimeout(function () {
        TrichXuatLichTrinhNgayHomNay();
      }, 800);
    });
  }

  // Khôi phục trạng thái chuẩn cho giao diện trang web PTIT (khắc phục lỗi ẩn menu do cờ iframe)
  function KhoiPhucTrangThaiGiaoDienWeb() {
    try {
      if (sessionStorage.getItem('if') === '1') {
        sessionStorage.setItem('if', '0');
      }
    } catch (Loi) {}
  }

  // Phát nhịp tim tương tác phụ từ isolated context như lớp bảo vệ kép
  function KhoiChayNhipTimTuongTacPhu() {
    const IdNhipTim = setInterval(function () {
      if (!KiemTraExtensionConSong()) {
        clearInterval(IdNhipTim);
        return;
      }
      try {
        window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
      } catch (Loi) {}
    }, 15000);
  }

  // Lọc bỏ các thẻ ghim bị trùng lặp do sự kiện thả thẻ bị kích hoạt đúp
  function LocBoTheGhimTrungLap(DanhSachGhim) {
    if (!Array.isArray(DanhSachGhim) || DanhSachGhim.length <= 1) {
      return DanhSachGhim || [];
    }
    const DanhSachKetQua = [];
    for (let ChiSo = 0; ChiSo < DanhSachGhim.length; ChiSo++) {
      const ItemHienTai = DanhSachGhim[ChiSo];
      if (!ItemHienTai) continue;

      const LaTheTrungLap = DanhSachKetQua.some(function (ItemDaCo) {
        if (ItemDaCo.MaGhim === ItemHienTai.MaGhim) return true;
        const CungTieuDe = (ItemDaCo.TieuDe || '').trim() === (ItemHienTai.TieuDe || '').trim();
        const CungGhiChu = (ItemDaCo.GhiChu || '').trim() === (ItemHienTai.GhiChu || '').trim();
        const CungMauSac = (ItemDaCo.MauSac || '') === (ItemHienTai.MauSac || '');
        const CungThu = ItemDaCo.MaThu === ItemHienTai.MaThu || ItemDaCo.Thu === ItemHienTai.Thu;
        const CungGio = (ItemDaCo.GioBatDau || '').trim() === (ItemHienTai.GioBatDau || '').trim();
        const CungTiet = (ItemDaCo.Tiet || '').trim() === (ItemHienTai.Tiet || '').trim();
        const CungDong = ItemDaCo.ViTriDong === ItemHienTai.ViTriDong && ItemDaCo.ViTriCot === ItemHienTai.ViTriCot;
        const CungToaDoThuc = (typeof ItemDaCo.DongThuc === 'number' && ItemDaCo.DongThuc === ItemHienTai.DongThuc &&
                               typeof ItemDaCo.CotThuc === 'number' && ItemDaCo.CotThuc === ItemHienTai.CotThuc);

        const CungViTriO = CungDong || CungToaDoThuc || (CungThu && (CungGio || CungTiet));
        if (CungTieuDe && CungGhiChu && CungMauSac && CungViTriO) {
          const Ts1 = parseInt((ItemDaCo.MaGhim || '').replace('GHIM_', ''), 10);
          const Ts2 = parseInt((ItemHienTai.MaGhim || '').replace('GHIM_', ''), 10);
          if (!isNaN(Ts1) && !isNaN(Ts2) && Math.abs(Ts1 - Ts2) < 3000) {
            return true;
          }
        }
        return false;
      });

      if (!LaTheTrungLap) {
        DanhSachKetQua.push(ItemHienTai);
      }
    }
    return DanhSachKetQua;
  }

  // Tải dữ liệu đã lưu từ bộ nhớ chrome.storage.local
  function TaiDuLieuTuBoNho(HanhDongSauKhiTai) {
    DocDuLieuAnToan([
      'DanhSachLoiNhac',
      'DanhSachLoiNhacGhim',
      'DanhSachHoatDongHomNay',
      'TenThuMucLuuHienTai'
    ], function (KetQuaBoNho) {
      DanhSachLoiNhac = KetQuaBoNho.DanhSachLoiNhac || [];
      const DanhSachGhimGoc = KetQuaBoNho.DanhSachLoiNhacGhim || [];
      DanhSachLoiNhacGhim = LocBoTheGhimTrungLap(DanhSachGhimGoc);
      if (DanhSachLoiNhacGhim.length !== DanhSachGhimGoc.length) {
        LuuDuLieuAnToan({ DanhSachLoiNhacGhim: DanhSachLoiNhacGhim });
      }
      DanhSachHoatDongHomNay = KetQuaBoNho.DanhSachHoatDongHomNay || [];
      TenThuMucLuuHienTai = KetQuaBoNho.TenThuMucLuuHienTai || '';

      if (HanhDongSauKhiTai) HanhDongSauKhiTai();
    });
  }

  // Mở hoặc tạo cơ sở dữ liệu IndexedDB để lưu trữ tay cầm thư mục
  function MoCoSoDuLieuIndexedDb() {
    return new Promise(function (GiaiQuyet, TuChoi) {
      const YeuCauMo = indexedDB.open('PtitTienIchThuMucDb', 1);
      YeuCauMo.onupgradeneeded = function (SuKien) {
        const Csdl = SuKien.target.result;
        if (!Csdl.objectStoreNames.contains('KhoLuuTayCam')) {
          Csdl.createObjectStore('KhoLuuTayCam');
        }
      };
      YeuCauMo.onsuccess = function (SuKien) {
        GiaiQuyet(SuKien.target.result);
      };
      YeuCauMo.onerror = function (Loi) {
        TuChoi(Loi);
      };
    });
  }

  // Lưu đối tượng tay cầm thư mục vào IndexedDB
  async function LuuTayCamThuMuc(TayCam) {
    try {
      const Csdl = await MoCoSoDuLieuIndexedDb();
      const GiaoDich = Csdl.transaction('KhoLuuTayCam', 'readwrite');
      const KhoLuu = GiaoDich.objectStore('KhoLuuTayCam');
      KhoLuu.put(TayCam, 'TayCamThuMucMacDinh');
    } catch (Loi) {
      console.warn('Lỗi khi lưu tay cầm thư mục vào IndexedDB:', Loi);
    }
  }

  // Đọc lại tay cầm thư mục đã lưu từ IndexedDB
  async function DocTayCamThuMuc() {
    try {
      const Csdl = await MoCoSoDuLieuIndexedDb();
      return new Promise(function (GiaiQuyet) {
        const GiaoDich = Csdl.transaction('KhoLuuTayCam', 'readonly');
        const KhoLuu = GiaoDich.objectStore('KhoLuuTayCam');
        const YeuCau = KhoLuu.get('TayCamThuMucMacDinh');
        YeuCau.onsuccess = function () {
          GiaiQuyet(YeuCau.result || null);
        };
        YeuCau.onerror = function () {
          GiaiQuyet(null);
        };
      });
    } catch (Loi) {
      return null;
    }
  }

  // Xóa tay cầm thư mục khỏi IndexedDB
  async function XoaTayCamThuMuc() {
    try {
      const Csdl = await MoCoSoDuLieuIndexedDb();
      const GiaoDich = Csdl.transaction('KhoLuuTayCam', 'readwrite');
      const KhoLuu = GiaoDich.objectStore('KhoLuuTayCam');
      KhoLuu.delete('TayCamThuMucMacDinh');
    } catch (Loi) {}
  }

  // Khôi phục tay cầm thư mục khi tải lại trang web
  async function KhoiPhucTayCamThuMuc() {
    try {
      const TayCamDaLuu = await DocTayCamThuMuc();
      if (TayCamDaLuu) {
        TayCamThuMucLuu = TayCamDaLuu;
        TenThuMucLuuHienTai = TayCamDaLuu.name;

        const Quyen = await TayCamDaLuu.queryPermission({ mode: 'read' });
        if (Quyen === 'granted') {
          await TaiDuLieuTuThuMuc(false);
        }
      }
      CapNhatTrangThaiThuMuc();
    } catch (Loi) {
      CapNhatTrangThaiThuMuc();
    }
  }

  // Tạo đối tượng chứa toàn bộ dữ liệu cấu hình tiện ích
  function TaoDoiTuongCauHinhToanBo() {
    return {
      PhienBan: '1.0',
      ThoiGianLuu: new Date().toISOString(),
      DanhSachLoiNhac: DanhSachLoiNhac,
      DanhSachLoiNhacGhim: DanhSachLoiNhacGhim,
      DanhSachHoatDongHomNay: DanhSachHoatDongHomNay
    };
  }

  // Đồng bộ toàn bộ dữ liệu cấu hình tiện ích vào thư mục máy tính
  async function DongBoToanBoDuLieuVaoThuMuc() {
    if (!TayCamThuMucLuu) return;

    try {
      const Quyen = await TayCamThuMucLuu.queryPermission({ mode: 'readwrite' });
      if (Quyen !== 'granted') {
        const XinQuyen = await TayCamThuMucLuu.requestPermission({ mode: 'readwrite' });
        if (XinQuyen !== 'granted') return;
      }

      const DuLieuTongThe = TaoDoiTuongCauHinhToanBo();
      const TayCamCauHinh = await TayCamThuMucLuu.getFileHandle('CauHinhToanBoTienIch.json', { create: true });
      const LuongCauHinh = await TayCamCauHinh.createWritable();
      await LuongCauHinh.write(JSON.stringify(DuLieuTongThe, null, 2));
      await LuongCauHinh.close();

      const DuLieuLoiNhac = {
        DanhSachLoiNhac: DanhSachLoiNhac,
        DanhSachLoiNhacGhim: DanhSachLoiNhacGhim
      };
      const TayCamLoiNhac = await TayCamThuMucLuu.getFileHandle('LoiNhacHenGio.json', { create: true });
      const LuongLoiNhac = await TayCamLoiNhac.createWritable();
      await LuongLoiNhac.write(JSON.stringify(DuLieuLoiNhac, null, 2));
      await LuongLoiNhac.close();
    } catch (LoiDongBo) {
      console.warn('Lỗi khi đồng bộ vào thư mục:', LoiDongBo);
    }
  }

  // Lưu thủ công toàn bộ cấu hình vào thư mục
  async function LuuThuCongVaoThuMuc() {
    if (!TayCamThuMucLuu) {
      await ChonThuMucLuuTuDong();
      return;
    }

    try {
      const Quyen = await TayCamThuMucLuu.requestPermission({ mode: 'readwrite' });
      if (Quyen !== 'granted') {
        alert('Vui lòng cấp quyền ghi vào thư mục để lưu trữ dữ liệu!');
        return;
      }

      await DongBoToanBoDuLieuVaoThuMuc();
      alert('Đã lưu thành công cấu hình (' + DanhSachLoiNhacGhim.length + ' thẻ thời khóa biểu) vào thư mục: ' + TenThuMucLuuHienTai);
    } catch (Loi) {
      alert('Lỗi khi lưu dữ liệu vào thư mục: ' + Loi.message);
    }
  }

  // Đọc và khôi phục lại toàn bộ dữ liệu cấu hình từ thư mục
  async function TaiDuLieuTuThuMuc(CoBaoThanhCong) {
    const HienThongBao = (typeof CoBaoThanhCong === 'boolean') ? CoBaoThanhCong : true;
    if (!TayCamThuMucLuu) {
      if (HienThongBao) {
        alert('Chưa có thư mục nào được liên kết! Vui lòng chọn thư mục trước.');
      }
      return;
    }

    try {
      let Quyen = await TayCamThuMucLuu.queryPermission({ mode: 'read' });
      if (Quyen !== 'granted') {
        if (HienThongBao) {
          Quyen = await TayCamThuMucLuu.requestPermission({ mode: 'read' });
        }
        if (Quyen !== 'granted') {
          if (HienThongBao) {
            alert('Vui lòng cấp quyền đọc thư mục để tải lại dữ liệu!');
          }
          return;
        }
      }

      let DuLieuPhucHoi = null;
      try {
        const TayCamCauHinh = await TayCamThuMucLuu.getFileHandle('CauHinhToanBoTienIch.json');
        const TepCauHinh = await TayCamCauHinh.getFile();
        const VanBan = await TepCauHinh.text();
        DuLieuPhucHoi = JSON.parse(VanBan);
      } catch (LoiDocTong) {
        let DuLieuLoiNhacDoc = null;

        try {
          const TayCamLn = await TayCamThuMucLuu.getFileHandle('LoiNhacHenGio.json');
          const TepLn = await TayCamLn.getFile();
          DuLieuLoiNhacDoc = JSON.parse(await TepLn.text());
        } catch (e) {}

        if (DuLieuLoiNhacDoc) {
          DuLieuPhucHoi = {
            DanhSachLoiNhac: DuLieuLoiNhacDoc ? DuLieuLoiNhacDoc.DanhSachLoiNhac : [],
            DanhSachLoiNhacGhim: DuLieuLoiNhacDoc ? DuLieuLoiNhacDoc.DanhSachLoiNhacGhim : []
          };
        }
      }

      if (!DuLieuPhucHoi) {
        if (HienThongBao) {
          alert('Không tìm thấy tệp dữ liệu cấu hình hợp lệ trong thư mục này!');
        }
        return;
      }

      if (Array.isArray(DuLieuPhucHoi.DanhSachLoiNhac)) {
        DanhSachLoiNhac = DuLieuPhucHoi.DanhSachLoiNhac;
      }
      if (Array.isArray(DuLieuPhucHoi.DanhSachLoiNhacGhim)) {
        DanhSachLoiNhacGhim = LocBoTheGhimTrungLap(DuLieuPhucHoi.DanhSachLoiNhacGhim);
      }

      for (let ChiSoG = 0; ChiSoG < DanhSachLoiNhacGhim.length; ChiSoG++) {
        const ItemGhim = DanhSachLoiNhacGhim[ChiSoG];
        if (ItemGhim.ThoiGianBaoThuc && ItemGhim.ThoiGianBaoThuc > Date.now()) {
          GuiTinNhanAnToan({
            HanhDong: 'ThietLapBaoThuc',
            MaDinhDanh: ItemGhim.MaGhim,
            ThoiGianMiliGiay: ItemGhim.ThoiGianBaoThuc
          });
        }
      }

      LuuDuLieuAnToan({
        DanhSachLoiNhac: DanhSachLoiNhac,
        DanhSachLoiNhacGhim: DanhSachLoiNhacGhim
      });

      CapNhatGiaoDienLoiNhac();
      ChuanHoaBangThoiKhoaBieuWeb();
      TimKiemVaGanSuKienCacO();
      VeCacLoiNhacDaGhim();
      TrichXuatLichTrinhNgayHomNay();
      CapNhatTrangThaiThuMuc();

      if (HienThongBao) {
        alert('Đã tải và khôi phục thành công cấu hình (' + DanhSachLoiNhacGhim.length + ' thẻ thời khóa biểu) từ thư mục: ' + TenThuMucLuuHienTai);
      }
    } catch (LoiTai) {
      if (HienThongBao) {
        alert('Lỗi khi tải dữ liệu từ thư mục: ' + LoiTai.message);
      }
    }
  }

  // Xuất toàn bộ dữ liệu cấu hình tiện ích ra tệp tin JSON tải về máy
  function XuatTepCauHinhJson() {
    const DuLieu = TaoDoiTuongCauHinhToanBo();
    const ChuoiJson = JSON.stringify(DuLieu, null, 2);
    const TepBlob = new Blob([ChuoiJson], { type: 'application/json;charset=utf-8' });
    const TenTep = 'CauHinhPTIT_' + new Date().toISOString().slice(0, 10) + '.json';
    if (window.ThuVienTienIch) {
      window.ThuVienTienIch.TaiTepVeMay(TepBlob, TenTep);
    }
  }

  // Nhập lại toàn bộ dữ liệu cấu hình từ một tệp JSON đã lưu
  function NhapTepCauHinhJson(Tep) {
    if (!Tep) return;
    const BoDoc = new FileReader();
    BoDoc.onload = function (SuKienDoc) {
      try {
        const DuLieu = JSON.parse(SuKienDoc.target.result);
        if (Array.isArray(DuLieu.DanhSachLoiNhac)) {
          DanhSachLoiNhac = DuLieu.DanhSachLoiNhac;
        }
        if (Array.isArray(DuLieu.DanhSachLoiNhacGhim)) {
          DanhSachLoiNhacGhim = LocBoTheGhimTrungLap(DuLieu.DanhSachLoiNhacGhim);
        }
        if (Array.isArray(DuLieu.DanhSachBoThoiGianBieu) && DuLieu.DanhSachBoThoiGianBieu.length > 0) {
          DanhSachBoThoiGianBieu = DuLieu.DanhSachBoThoiGianBieu;
          BoThoiGianBieuDangChonId = DuLieu.BoThoiGianBieuDangChonId || DanhSachBoThoiGianBieu[0].MaBo;
        }

        LuuDuLieuAnToan({
          DanhSachLoiNhac: DanhSachLoiNhac,
          DanhSachLoiNhacGhim: DanhSachLoiNhacGhim,
          DanhSachBoThoiGianBieu: DanhSachBoThoiGianBieu,
          BoThoiGianBieuDangChonId: BoThoiGianBieuDangChonId
        });

        CapNhatGiaoDienLoiNhac();
        VeCacLoiNhacDaGhim();
        CapNhatGiaoDienBieuDo();

        if (TayCamThuMucLuu) {
          DongBoToanBoDuLieuVaoThuMuc();
        }

        alert('Đã nhập và khôi phục thành công cấu hình từ tệp tin!');
      } catch (LoiPhanTich) {
        alert('Tệp tin không đúng định dạng JSON cấu hình của tiện ích!');
      }
    };
    BoDoc.readAsText(Tep, 'UTF-8');
  }

  // Chọn thư mục trên máy tính để lưu trữ thủ công và đồng bộ dữ liệu
  async function ChonThuMucLuuTuDong() {
    if (!window.showDirectoryPicker) {
      alert('Trình duyệt hiện tại chưa hỗ trợ File System Access API. Vui lòng sử dụng Google Chrome bản mới!');
      return;
    }

    try {
      TayCamThuMucLuu = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      TenThuMucLuuHienTai = TayCamThuMucLuu.name;
      LuuDuLieuAnToan({ TenThuMucLuuHienTai: TenThuMucLuuHienTai });
      await LuuTayCamThuMuc(TayCamThuMucLuu);

      let CoTepCauHinh = false;
      try {
        await TayCamThuMucLuu.getFileHandle('CauHinhToanBoTienIch.json');
        CoTepCauHinh = true;
      } catch (LoiKiemTra1) {
        try {
          await TayCamThuMucLuu.getFileHandle('LoiNhacHenGio.json');
          CoTepCauHinh = true;
        } catch (LoiKiemTra2) {}
      }

      if (CoTepCauHinh) {
        await TaiDuLieuTuThuMuc(true);
      } else {
        await DongBoToanBoDuLieuVaoThuMuc();
        alert('Đã liên kết thành công với thư mục "' + TenThuMucLuuHienTai + '"! Dữ liệu cấu hình (' + DanhSachLoiNhacGhim.length + ' thẻ thời khóa biểu, Thời gian biểu 24h) đã được lưu vào thư mục này.');
      }
      CapNhatTrangThaiThuMuc();
    } catch (Loi) {
      if (Loi.name !== 'AbortError') {
        console.warn('Lỗi chọn thư mục:', Loi);
      }
    }
  }

  // Hủy liên kết thư mục lưu trữ
  async function HuyLienKetThuMucLuu() {
    TayCamThuMucLuu = null;
    TenThuMucLuuHienTai = '';
    XoaDuLieuAnToan(['TenThuMucLuuHienTai']);
    await XoaTayCamThuMuc();
    CapNhatTrangThaiThuMuc();
  }

  // Cập nhật thông tin thư mục đồng bộ trên giao diện
  function CapNhatTrangThaiThuMuc() {
    const DongThongTin = document.getElementById('DongThongTinThuMuc');
    const NutHuy = document.getElementById('NutHuyDongBoThuMuc');

    if (TenThuMucLuuHienTai) {
      if (DongThongTin) {
        DongThongTin.innerHTML = `Thư mục: <strong>${TenThuMucLuuHienTai}</strong>`;
        DongThongTin.style.color = '#166534';
      }
      if (NutHuy) NutHuy.style.display = 'inline-flex';
    } else {
      if (DongThongTin) {
        DongThongTin.textContent = 'Chưa chọn thư mục liên kết.';
        DongThongTin.style.color = '#64748b';
      }
      if (NutHuy) NutHuy.style.display = 'none';
    }
  }

  // Đăng ký nhận thông điệp từ dịch vụ nền để phát âm thanh báo thức và thông báo nổi
  function DangKyLangNgheTinNhan() {
    if (!KiemTraExtensionConSong()) return;
    try {
      chrome.runtime.onMessage.addListener(function (ThongDiep) {
        try {
          if (ThongDiep.HanhDong === 'PhatChuongBaoThuc') {
            if (window.ThuVienTienIch) {
              window.ThuVienTienIch.PhatAmThanhBaoThuc();
            }
            HienThiThongBaoNoiToastGocPhai(ThongDiep.TieuDe, ThongDiep.NoiDung, ThongDiep.MauSac);
          }
        } catch (Loi) {}
      });
    } catch (LoiDangKy) {
      ExtensionConHoatDong = false;
    }
  }

  // Hiển thị thẻ thông báo nổi góc dưới bên phải trang web mô phỏng popup desktop
  function HienThiThongBaoNoiToastGocPhai(TieuDe, NoiDung, MauSac) {
    try {
      const ThongBaoCu = document.getElementById('ThongBaoNoiToastGocPhai');
      if (ThongBaoCu) {
        ThongBaoCu.remove();
      }

      const HopThoaiToast = document.createElement('div');
      HopThoaiToast.id = 'ThongBaoNoiToastGocPhai';
      HopThoaiToast.className = 'ThongBaoNoiToastGocPhai';
      if (MauSac) {
        HopThoaiToast.style.borderLeftColor = MauSac;
      }

      const MauChuTieuDe = MauSac || '#b71c1c';

      HopThoaiToast.innerHTML = `
        <div class="DongTieuDeToastGocPhai">
          <span class="ChuTieuDeToastGocPhai" style="color:${MauChuTieuDe};">[PTIT] ${TieuDe || 'Báo thức thời khóa biểu'}</span>
          <button class="NutDongToastGocPhai">Đóng</button>
        </div>
        <p class="ChuNoiDungToastGocPhai">${NoiDung || 'Đã đến giờ nhắc nhở của bạn!'}</p>
      `;

      const NutDong = HopThoaiToast.querySelector('.NutDongToastGocPhai');
      if (NutDong) {
        NutDong.onclick = function () {
          HopThoaiToast.remove();
        };
      }

      document.documentElement.appendChild(HopThoaiToast);

      setTimeout(function () {
        if (HopThoaiToast && HopThoaiToast.parentNode) {
          HopThoaiToast.remove();
        }
      }, 8000);
    } catch (Loi) {
      console.warn('Lỗi hiển thị toast góc phải:', Loi);
    }
  }

  // Tạo và nhúng các thành phần giao diện chính vào DOM trang web
  function TaoThanhPhanGiaoDien() {
    if (document.getElementById('NutMoBangDieuKhien')) return;

    // Nút mở bảng điều khiển ở mép trái với icon '>'
    const NutMoBang = document.createElement('div');
    NutMoBang.id = 'NutMoBangDieuKhien';
    NutMoBang.className = 'NutMoBangDieuKhien';
    NutMoBang.innerHTML = '<span>PTIT</span><span style="font-size:15px; font-weight:bold;">&gt;</span>';
    NutMoBang.title = 'Mở bảng tiện ích PTIT (>)';
    NutMoBang.onclick = BatTatBangDieuKhien;
    document.documentElement.appendChild(NutMoBang);

    // Khung bảng điều khiển bên trái
    const BangDieuKhien = document.createElement('div');
    BangDieuKhien.id = 'BangDieuKhienChinh';
    BangDieuKhien.className = 'BangDieuKhienChinh';
    BangDieuKhien.style.display = 'none';

    BangDieuKhien.innerHTML = `
      <!-- Nút toggle đóng ở rìa phải bảng điều khiển với icon '<' -->
      <button id="NutToggleRiaPhai" class="NutToggleRiaPhai" title="Đóng bảng tiện ích (&lt;)">
        <span>&lt;</span>
      </button>

      <div class="TieuDeBangDieuKhien">
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 class="ChuTieuDeChinh">TKB x QLDT</h3>
          <span class="HuyHieuDangHoatDong" title="Tự động chống đăng xuất không bị ngắt kết nối">anti logout</span>
        </div>
      </div>

      <div class="ThanhChonTab">
        <button id="NutTabLoiNhac" class="NutChonTab NutChonTabDangChon">Lịch trình & Lời nhắc</button>
        <button id="NutTabBieuDo" class="NutChonTab">Thời gian biểu 24h</button>
      </div>

      <!-- Tab 1: Lịch trình và hẹn giờ -->
      <div id="NoiDungTabLoiNhac" class="KhungNoiDungTab">
        <!-- Khối nhập liệu tối giản diện tích -->
        <div class="KhoiNhomChucNang">
          <input type="text" id="ONhapTieuDeLoiNhac" class="OTextInput" placeholder="Tên lịch" />
          <input type="text" id="ONhapChiTietLoiNhac" class="OTextInput" placeholder="Nội dung chi tiết" />
          
          <div style="display:flex; gap:6px; align-items:center;">
            <select id="OChonSoPhutBaoTruoc" class="OSelectChung" style="flex:1;">
              <option value="15" selected>Nhắc trước 15 phút (-15p)</option>
              <option value="5">Nhắc trước 5 phút (-5p)</option>
              <option value="10">Nhắc trước 10 phút (-10p)</option>
              <option value="20">Nhắc trước 20 phút (-20p)</option>
              <option value="30">Nhắc trước 30 phút (-30p)</option>
              <option value="45">Nhắc trước 45 phút (-45p)</option>
              <option value="60">Nhắc trước 60 phút (-60p)</option>
              <option value="0">Báo đúng giờ học (0p)</option>
              <option value="TuyChinh">Tùy chỉnh...</option>
            </select>
            <input type="number" id="ONhapSoPhutTuyChinh" class="OTextInput" placeholder="Số phút" min="1" max="180" style="width:70px; display:none;" />
          </div>

          <div class="KhungBangMauNhan">
            <span class="NutChonMauNhan NutChonMauNhanDangChon" data-mau="#B71C1C" title="Đỏ PTIT" style="background-color:#B71C1C;"></span>
            <span class="NutChonMauNhan" data-mau="#1976D2" title="Xanh dương" style="background-color:#1976D2;"></span>
            <span class="NutChonMauNhan" data-mau="#388E3C" title="Xanh lá" style="background-color:#388E3C;"></span>
            <span class="NutChonMauNhan" data-mau="#7CB342" title="Xanh lá non" style="background-color:#7CB342;"></span>
            <span class="NutChonMauNhan" data-mau="#F57C00" title="Cam" style="background-color:#F57C00;"></span>
            <span class="NutChonMauNhan" data-mau="#7B1FA2" title="Tím" style="background-color:#7B1FA2;"></span>
            <span class="NutChonMauNhan" data-mau="#D81B60" title="Hồng" style="background-color:#D81B60;"></span>
            <span class="NutChonMauNhan" data-mau="#795548" title="Nâu" style="background-color:#795548;"></span>
            <span class="NutChonMauNhan" data-mau="#212121" title="Đen" style="background-color:#212121;"></span>
            <span class="NutChonMauNhan" data-mau="#616161" title="Xám" style="background-color:#616161;"></span>
          </div>

          <button id="NutThemLoiNhac" class="NutBamChung NutBamChinh">+ Thêm thẻ</button>
        </div>

        <!-- Khối danh sách thẻ mẫu dạng lưới hình vuông + phân loại theo màu -->
        <div class="KhoiNhomChucNang">
          <div class="ThanhPhanLoaiMau">
            <button class="NutLocMau NutLocMauDangChon" data-loc="TAT_CA">Tất cả</button>
            <button class="NutLocMauDot" data-loc="#B71C1C" style="background:#B71C1C;" title="Đỏ"></button>
            <button class="NutLocMauDot" data-loc="#1976D2" style="background:#1976D2;" title="Xanh dương"></button>
            <button class="NutLocMauDot" data-loc="#388E3C" style="background:#388E3C;" title="Xanh lá"></button>
            <button class="NutLocMauDot" data-loc="#7CB342" style="background:#7CB342;" title="Xanh non"></button>
            <button class="NutLocMauDot" data-loc="#F57C00" style="background:#F57C00;" title="Cam"></button>
            <button class="NutLocMauDot" data-loc="#7B1FA2" style="background:#7B1FA2;" title="Tím"></button>
            <button class="NutLocMauDot" data-loc="#D81B60" style="background:#D81B60;" title="Hồng"></button>
            <button class="NutLocMauDot" data-loc="#795548" style="background:#795548;" title="Nâu"></button>
            <button class="NutLocMauDot" data-loc="#212121" style="background:#212121;" title="Đen"></button>
            <button class="NutLocMauDot" data-loc="#616161" style="background:#616161;" title="Xám"></button>
          </div>
          <div id="KhungDanhSachLoiNhac" class="KhungDanhSachTheVuong"></div>
        </div>

        <!-- Nút gỡ nhanh tất cả thẻ đã ghim trên web -->
        <button id="NutXoaTatCaTheGhimTkb" class="NutBamChung NutBamXoa" style="width:100%;">
          🗑️ Gỡ tất cả thẻ đã gắn trên TKB
        </button>

        <!-- Khối sao lưu & đồng bộ dữ liệu -->
        <div class="KhoiNhomChucNang" style="margin-top:auto;">
          <div id="DongThongTinThuMuc" class="DongThongTinThuMuc">
            Chưa chọn thư mục liên kết.
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button id="NutChonThuMucLuuTuDong" class="NutBamChung NutBamChinh" style="flex:1; min-width:100px;">Chọn thư mục</button>
            <button id="NutLuuThuCongVaoThuMuc" class="NutBamChung NutBamPhu" style="flex:1; min-width:60px;">Lưu</button>
            <button id="NutTaiDuLieuTuThuMuc" class="NutBamChung NutBamPhu" style="flex:1; min-width:70px;">Tải lại</button>
            <button id="NutHuyDongBoThuMuc" class="NutBamChung NutBamXoa NutBamNho" style="display:none;">Hủy</button>
          </div>
          <div style="display:flex; gap:6px; margin-top:2px;">
            <button id="NutXuatTepCauHinh" class="NutBamChung NutBamPhu NutBamNho" style="flex:1;">Xuất file JSON</button>
            <button id="NutNhapTepCauHinh" class="NutBamChung NutBamPhu NutBamNho" style="flex:1;">Nhập file JSON</button>
            <input type="file" id="OTepNhapCauHinh" accept=".json" style="display:none;" />
          </div>
        </div>
      </div>

      <!-- Tab 2: Thời gian biểu 24h theo ngày hôm nay -->
      <div id="NoiDungTabBieuDo" class="KhungNoiDungTab" style="display:none;">
        <div class="KhungTieuDeHomNay">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span id="ChuNgayHomNay" class="ChuNgayHomNay">Thứ ..., ngày ...</span>
            <button id="NutLamMoiBieuDoHomNay" class="NutBamChung NutBamNho NutBamPhu" title="Cập nhật lại từ TKB">🔄 Cập nhật</button>
          </div>
        </div>

        <div id="KhungBieuDoThuNho" class="KhungChuaBieuDo">
          <canvas id="CanvasBieuDoTronThoiGian" class="CanvasBieuDoTron" width="280" height="280" style="width:250px; height:250px;"></canvas>
        </div>

        <!-- Khung hình chữ nhật nổi bật nhắc rõ hiện tại đang là giờ của công việc/thẻ TKB nào -->
        <div id="KhungNhacViecHienTai" class="KhungNhacViecHienTai"></div>

        <!-- Danh sách các khung giờ / hoạt động hôm nay theo timeline -->
        <div class="KhoiNhomChucNang">
          <div class="TieuDeNhomChucNang" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Lịch trình hôm nay (<span id="SoLuongLichHomNay">0</span>)</span>
            <span style="font-size:10px; color:#64748b; font-weight:normal;">Trích xuất từ TKB</span>
          </div>
          <div id="DanhSachLichTrinhHomNay" class="DanhSachLichTrinhHomNayCuon"></div>
        </div>
      </div>
    `;

    document.documentElement.appendChild(BangDieuKhien);

    // Xử lý chung khi con trỏ kéo thẻ lướt qua bảng điều khiển để xóa
    function XuLyKeoQuaVungXoa(SuKien) {
      if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) return;
      SuKien.preventDefault();
      if (SuKien.dataTransfer) {
        SuKien.dataTransfer.dropEffect = 'move';
      }
      BangDieuKhien.classList.add('BangDieuKhienNhanXoaThe');
    }

    function XuLyRoiKhoiVungXoa(SuKien) {
      if (SuKien && SuKien.relatedTarget && BangDieuKhien.contains(SuKien.relatedTarget)) return;
      BangDieuKhien.classList.remove('BangDieuKhienNhanXoaThe');
    }

    BangDieuKhien.addEventListener('dragenter', XuLyKeoQuaVungXoa);
    BangDieuKhien.addEventListener('dragover', XuLyKeoQuaVungXoa);
    BangDieuKhien.addEventListener('dragleave', XuLyRoiKhoiVungXoa);
    BangDieuKhien.addEventListener('drop', function (SuKien) {
      if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) return;
      XuLyThaXoaTheTkb(SuKien);
    });

    // Kéo thả thẻ vào nút mở ở mép trái để xóa khi bảng đang đóng
    NutMoBang.addEventListener('dragenter', function (SuKien) {
      if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) return;
      SuKien.preventDefault();
      if (SuKien.dataTransfer) SuKien.dataTransfer.dropEffect = 'move';
      NutMoBang.style.backgroundColor = '#ef4444';
    });
    NutMoBang.addEventListener('dragover', function (SuKien) {
      if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) return;
      SuKien.preventDefault();
      if (SuKien.dataTransfer) SuKien.dataTransfer.dropEffect = 'move';
      NutMoBang.style.backgroundColor = '#ef4444';
    });
    NutMoBang.addEventListener('dragleave', function () {
      NutMoBang.style.backgroundColor = '#b71c1c';
    });
    NutMoBang.addEventListener('drop', function (SuKien) {
      NutMoBang.style.backgroundColor = '#b71c1c';
      if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) return;
      XuLyThaXoaTheTkb(SuKien);
    });

    GanSuKienGiaoDien();
    CapNhatGiaoDienLoiNhac();
    CapNhatGiaoDienBieuDo();
  }

  // Bật hoặc tắt hiển thị bảng điều khiển bên trái
  function BatTatBangDieuKhien() {
    const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
    const NutMoBang = document.getElementById('NutMoBangDieuKhien');
    if (!BangDieuKhien) return;

    BangDieuKhienHienThi = !BangDieuKhienHienThi;
    BangDieuKhien.style.display = BangDieuKhienHienThi ? 'flex' : 'none';

    if (NutMoBang) {
      NutMoBang.style.display = BangDieuKhienHienThi ? 'none' : 'flex';
    }

    if (BangDieuKhienHienThi) {
      CapNhatGiaoDienBieuDo();
    }
  }

  // Gắn các sự kiện thao tác người dùng cho các nút và tab
  function GanSuKienGiaoDien() {
    const NutToggleRiaPhai = document.getElementById('NutToggleRiaPhai');
    if (NutToggleRiaPhai) NutToggleRiaPhai.onclick = BatTatBangDieuKhien;

    window.addEventListener('keydown', function (SuKien) {
      if (SuKien.key === 'Escape' && BangDieuKhienHienThi) {
        BatTatBangDieuKhien();
      }
    });

    const NutTabLoiNhac = document.getElementById('NutTabLoiNhac');
    const NutTabBieuDo = document.getElementById('NutTabBieuDo');
    const NoiDungTabLoiNhac = document.getElementById('NoiDungTabLoiNhac');
    const NoiDungTabBieuDo = document.getElementById('NoiDungTabBieuDo');

    function ChuyenTab(TabCanChon) {
      NutTabLoiNhac.className = 'NutChonTab';
      NutTabBieuDo.className = 'NutChonTab';
      NoiDungTabLoiNhac.style.display = 'none';
      NoiDungTabBieuDo.style.display = 'none';

      if (TabCanChon === 1) {
        NutTabLoiNhac.className = 'NutChonTab NutChonTabDangChon';
        NoiDungTabLoiNhac.style.display = 'flex';
      } else if (TabCanChon === 2) {
        NutTabBieuDo.className = 'NutChonTab NutChonTabDangChon';
        NoiDungTabBieuDo.style.display = 'flex';
        TrichXuatLichTrinhNgayHomNay();
      }
    }

    NutTabLoiNhac.onclick = function () { ChuyenTab(1); };
    NutTabBieuDo.onclick = function () { ChuyenTab(2); };

    // Nút làm mới dữ liệu lịch hôm nay
    const NutLamMoiBieuDoHomNay = document.getElementById('NutLamMoiBieuDoHomNay');
    if (NutLamMoiBieuDoHomNay) {
      NutLamMoiBieuDoHomNay.onclick = function () {
        TrichXuatLichTrinhNgayHomNay();
      };
    }

    // Thêm lời nhắc mới
    document.getElementById('NutThemLoiNhac').onclick = ThemMoiloiNhac;

    // Chọn màu nhãn
    const DanhSachNutMau = document.querySelectorAll('.NutChonMauNhan');
    function DongBoMauNhan(MauMoi) {
      if (!MauMoi) return;
      MauLoiNhacDangChon = MauMoi;
      for (let ChiSoM = 0; ChiSoM < DanhSachNutMau.length; ChiSoM++) {
        const NutM = DanhSachNutMau[ChiSoM];
        if (NutM.dataset.mau && NutM.dataset.mau.toUpperCase() === MauMoi.toUpperCase()) {
          NutM.classList.add('NutChonMauNhanDangChon');
        } else {
          NutM.classList.remove('NutChonMauNhanDangChon');
        }
      }
    }

    for (let ChiSoNut = 0; ChiSoNut < DanhSachNutMau.length; ChiSoNut++) {
      const NutMau = DanhSachNutMau[ChiSoNut];
      NutMau.onclick = function () {
        const MauChon = NutMau.dataset.mau;
        if (MauChon) {
          DongBoMauNhan(MauChon);
        }
      };
    }

    // Bộ lọc màu cho danh sách thẻ vuông
    const DanhSachNutLoc = document.querySelectorAll('.NutLocMau, .NutLocMauDot');
    for (let ChiSoL = 0; ChiSoL < DanhSachNutLoc.length; ChiSoL++) {
      const NutLoc = DanhSachNutLoc[ChiSoL];
      NutLoc.onclick = function () {
        for (let j = 0; j < DanhSachNutLoc.length; j++) {
          DanhSachNutLoc[j].classList.remove('NutLocMauDangChon');
        }
        NutLoc.classList.add('NutLocMauDangChon');
        BoLocMauHienTai = NutLoc.dataset.loc || 'TAT_CA';
        CapNhatGiaoDienLoiNhac();
      };
    }

    // Nút gỡ nhanh tất cả thẻ trên TKB
    const NutXoaTatCaThe = document.getElementById('NutXoaTatCaTheGhimTkb');
    if (NutXoaTatCaThe) {
      NutXoaTatCaThe.onclick = GoTatCaTheKhoiTkb;
    }

    const OChonSoPhutBaoTruoc = document.getElementById('OChonSoPhutBaoTruoc');
    const ONhapSoPhutTuyChinh = document.getElementById('ONhapSoPhutTuyChinh');
    if (OChonSoPhutBaoTruoc && ONhapSoPhutTuyChinh) {
      OChonSoPhutBaoTruoc.onchange = function () {
        ONhapSoPhutTuyChinh.style.display = (OChonSoPhutBaoTruoc.value === 'TuyChinh') ? 'block' : 'none';
      };
    }

    // Xử lý thư mục và sao lưu
    const NutChonThuMuc = document.getElementById('NutChonThuMucLuuTuDong');
    if (NutChonThuMuc) NutChonThuMuc.onclick = ChonThuMucLuuTuDong;

    const NutLuuThuMuc = document.getElementById('NutLuuThuCongVaoThuMuc');
    if (NutLuuThuMuc) NutLuuThuMuc.onclick = LuuThuCongVaoThuMuc;

    const NutTaiTuThuMuc = document.getElementById('NutTaiDuLieuTuThuMuc');
    if (NutTaiTuThuMuc) NutTaiTuThuMuc.onclick = function () { TaiDuLieuTuThuMuc(true); };

    const NutHuyDongBo = document.getElementById('NutHuyDongBoThuMuc');
    if (NutHuyDongBo) NutHuyDongBo.onclick = HuyLienKetThuMucLuu;

    const NutXuatCauHinh = document.getElementById('NutXuatTepCauHinh');
    if (NutXuatCauHinh) NutXuatCauHinh.onclick = XuatTepCauHinhJson;

    const NutNhapCauHinh = document.getElementById('NutNhapTepCauHinh');
    const OTepNhapCauHinh = document.getElementById('OTepNhapCauHinh');
    if (NutNhapCauHinh && OTepNhapCauHinh) {
      NutNhapCauHinh.onclick = function () {
        OTepNhapCauHinh.click();
      };
      OTepNhapCauHinh.onchange = function (SuKien) {
        if (SuKien.target.files && SuKien.target.files[0]) {
          NhapTepCauHinhJson(SuKien.target.files[0]);
          SuKien.target.value = '';
        }
      };
    }
  }

  // Thêm một lời nhắc mới
  function ThemMoiloiNhac() {
    const ONhapTieuDe = document.getElementById('ONhapTieuDeLoiNhac');
    const ONhapChiTiet = document.getElementById('ONhapChiTietLoiNhac');
    const OChonBaoTruoc = document.getElementById('OChonSoPhutBaoTruoc');
    const ONhapPhutTuyChinh = document.getElementById('ONhapSoPhutTuyChinh');

    const TieuDe = ONhapTieuDe.value.trim();
    if (!TieuDe) {
      alert('Vui lòng nhập tên lịch!');
      return;
    }

    let SoPhutBaoTruoc = 15;
    if (OChonBaoTruoc) {
      if (OChonBaoTruoc.value === 'TuyChinh') {
        SoPhutBaoTruoc = parseInt(ONhapPhutTuyChinh.value, 10) || 15;
      } else {
        SoPhutBaoTruoc = parseInt(OChonBaoTruoc.value, 10);
      }
    }

    const MaDinhDanhMoi = 'LN_' + Date.now();

    const LoiNhacMoi = {
      MaDinhDanh: MaDinhDanhMoi,
      TieuDe: TieuDe,
      GhiChu: ONhapChiTiet.value.trim(),
      MauSac: MauLoiNhacDangChon || '#B71C1C',
      SoPhutBaoTruoc: SoPhutBaoTruoc,
      ThoiGianBaoThuc: null
    };

    DanhSachLoiNhac.push(LoiNhacMoi);
    LuuDuLieuAnToan({ DanhSachLoiNhac: DanhSachLoiNhac });
    if (TayCamThuMucLuu) {
      DongBoToanBoDuLieuVaoThuMuc();
    }

    ONhapTieuDe.value = '';
    ONhapChiTiet.value = '';

    CapNhatGiaoDienLoiNhac();
  }

  // Cập nhật danh sách hiển thị các thẻ lời nhắc dạng hình vuông và phân loại theo màu
  function CapNhatGiaoDienLoiNhac() {
    const KhungDanhSach = document.getElementById('KhungDanhSachLoiNhac');
    if (!KhungDanhSach) return;

    KhungDanhSach.innerHTML = '';
    if (DanhSachLoiNhac.length === 0) {
      KhungDanhSach.innerHTML = '<div style="font-size:12px; color:#888888; text-align:center; padding:10px; width:100%;">Chưa có thẻ mẫu nào. Hãy nhập ở trên để tạo!</div>';
      return;
    }

    // Lọc theo màu nếu có chọn
    const DanhSachHienThi = DanhSachLoiNhac.filter(function (Item) {
      if (BoLocMauHienTai === 'TAT_CA') return true;
      return (Item.MauSac || '').toUpperCase() === BoLocMauHienTai.toUpperCase();
    });

    if (DanhSachHienThi.length === 0) {
      KhungDanhSach.innerHTML = '<div style="font-size:11px; color:#888888; text-align:center; padding:8px; width:100%;">Không có thẻ nào thuộc màu này.</div>';
      return;
    }

    for (let ChiSo = 0; ChiSo < DanhSachHienThi.length; ChiSo++) {
      const LoiNhac = DanhSachHienThi[ChiSo];
      const TheVuong = document.createElement('div');
      TheVuong.className = 'TheLoiNhacItemVuong';
      TheVuong.draggable = true;
      TheVuong.style.borderColor = LoiNhac.MauSac;
      TheVuong.dataset.maDinhDanh = LoiNhac.MaDinhDanh;
      TheVuong.dataset.duLieuJson = JSON.stringify(LoiNhac);

      const ChuoiPhutBao = (typeof LoiNhac.SoPhutBaoTruoc === 'number') ? `-${LoiNhac.SoPhutBaoTruoc}p` : '-15p';

      TheVuong.innerHTML = `
        <button class="NutXoaTheVuong" data-ma="${LoiNhac.MaDinhDanh}" title="Xóa thẻ">&times;</button>
        <div class="DauTheVuong" style="background-color:${LoiNhac.MauSac};">
          <span class="TieuDeTheVuong">${LoiNhac.TieuDe}</span>
        </div>
        <div class="ThanTheVuong">
          <span class="MoTaTheVuong">${LoiNhac.GhiChu || '...'}</span>
          <span class="BadgePhutBao" style="color:${LoiNhac.MauSac};">${ChuoiPhutBao}</span>
        </div>
      `;

      TheVuong.addEventListener('dragstart', function (SuKienKeo) {
        TheVuong.classList.add('DangDuocKeo');
        if (SuKienKeo.dataTransfer) {
          SuKienKeo.dataTransfer.effectAllowed = 'all';
          SuKienKeo.dataTransfer.setData('text/plain', JSON.stringify(LoiNhac));
        }
        ThongTinTheMauDangKeo = LoiNhac;
        ThongTinTheGhimDangKeo = null;
        document.body.classList.add('DangKeoTheGhimTkb');
      });

      TheVuong.addEventListener('dragend', function () {
        TheVuong.classList.remove('DangDuocKeo');
        document.body.classList.remove('DangKeoTheGhimTkb');
        XoaDuongChiViTriTha();
        setTimeout(function () {
          ThongTinTheMauDangKeo = null;
        }, 300);
      });

      const NutXoa = TheVuong.querySelector('.NutXoaTheVuong');
      if (NutXoa) {
        NutXoa.onclick = function (SuKien) {
          SuKien.stopPropagation();
          XoaLoiNhac(LoiNhac.MaDinhDanh);
        };
      }

      KhungDanhSach.appendChild(TheVuong);
    }
  }

  // Xóa lời nhắc khỏi danh sách và hủy báo thức
  function XoaLoiNhac(MaDinhDanh) {
    DanhSachLoiNhac = DanhSachLoiNhac.filter(function (Item) {
      return Item.MaDinhDanh !== MaDinhDanh;
    });
    LuuDuLieuAnToan({ DanhSachLoiNhac: DanhSachLoiNhac });
    GuiTinNhanAnToan({ HanhDong: 'HuyBaoThuc', MaDinhDanh: MaDinhDanh });
    if (TayCamThuMucLuu) {
      DongBoToanBoDuLieuVaoThuMuc();
    }
    CapNhatGiaoDienLoiNhac();
  }

  // Gỡ tất cả thẻ thời khóa biểu đã gắn trên web của extension
  function GoTatCaTheKhoiTkb() {
    if (!DanhSachLoiNhacGhim || DanhSachLoiNhacGhim.length === 0) {
      alert('Hiện không có thẻ nào đang gắn trên Thời khóa biểu!');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn gỡ toàn bộ ' + DanhSachLoiNhacGhim.length + ' thẻ đang gắn trên Thời khóa biểu?')) {
      return;
    }
    for (let ChiSo = 0; ChiSo < DanhSachLoiNhacGhim.length; ChiSo++) {
      const MaGhim = DanhSachLoiNhacGhim[ChiSo].MaGhim;
      GuiTinNhanAnToan({ HanhDong: 'HuyBaoThuc', MaDinhDanh: MaGhim });
    }
    DanhSachLoiNhacGhim = [];
    LuuDuLieuAnToan({ DanhSachLoiNhacGhim: [] });
    if (TayCamThuMucLuu) {
      DongBoToanBoDuLieuVaoThuMuc();
    }
    VeCacLoiNhacDaGhim();
    TrichXuatLichTrinhNgayHomNay();
    HienThiThongBaoNoiToastGocPhai('Đã gỡ tất cả thẻ', 'Đã xóa toàn bộ thẻ thời khóa biểu của tiện ích trên trang.', '#d32f2f');
  }

  // Lấy thông tin ngày và thứ hôm nay
  function LayThongTinNgayVaThuHomNay() {
    const HomNay = new Date();
    const ThuTrongTuan = HomNay.getDay(); // 0: CN, 1: T2, ..., 6: T7
    const MaThu = (ThuTrongTuan === 0) ? 8 : (ThuTrongTuan + 1);
    const TenThu = (MaThu === 8) ? 'Chủ Nhật' : ('Thứ ' + MaThu);

    const Ngay = HomNay.getDate();
    const Thang = HomNay.getMonth() + 1;
    const Nam = HomNay.getFullYear();

    const ChuoiNgay1 = ((Ngay < 10) ? ('0' + Ngay) : ('' + Ngay)) + '/' + ((Thang < 10) ? ('0' + Thang) : ('' + Thang)); // VD: 30/09
    const ChuoiNgay2 = Ngay + '/' + Thang; // VD: 30/9
    const ChuoiNgayDayDu = ((Ngay < 10) ? ('0' + Ngay) : ('' + Ngay)) + '/' + ((Thang < 10) ? ('0' + Thang) : ('' + Thang)) + '/' + Nam;

    return {
      MaThu: MaThu,
      TenThu: TenThu,
      Ngay: Ngay,
      Thang: Thang,
      Nam: Nam,
      ChuoiNgay1: ChuoiNgay1,
      ChuoiNgay2: ChuoiNgay2,
      ChuoiNgayDayDu: ChuoiNgayDayDu,
      ChuoiHienThi: `${TenThu}, ${ChuoiNgayDayDu}`
    };
  }

  // Bảng giờ chuẩn các tiết học tại PTIT
  const BangChiTietTietHocPtit = {
    1: { BatDau: '07:00', KetThuc: '07:50' },
    2: { BatDau: '07:55', KetThuc: '08:45' },
    3: { BatDau: '08:55', KetThuc: '09:45' },
    4: { BatDau: '09:55', KetThuc: '10:45' },
    5: { BatDau: '10:55', KetThuc: '11:45' },
    6: { BatDau: '12:00', KetThuc: '12:50' },
    7: { BatDau: '13:00', KetThuc: '13:50' },
    8: { BatDau: '13:55', KetThuc: '14:45' },
    9: { BatDau: '14:55', KetThuc: '15:45' },
    10: { BatDau: '15:55', KetThuc: '16:45' },
    11: { BatDau: '16:55', KetThuc: '17:45' },
    12: { BatDau: '17:55', KetThuc: '18:45' },
    13: { BatDau: '18:50', KetThuc: '19:40' },
    14: { BatDau: '19:45', KetThuc: '20:35' },
    15: { BatDau: '20:40', KetThuc: '21:30' },
    16: { BatDau: '21:35', KetThuc: '22:25' }
  };

  // Chuyển chuỗi HH:mm thành số phút từ 0h
  function ChuoiGioSangPhut(ChuoiGio) {
    if (!ChuoiGio || typeof ChuoiGio !== 'string') return 0;
    const CacPhan = ChuoiGio.split(/[:h]/);
    const Gio = parseInt(CacPhan[0], 10) || 0;
    const Phut = parseInt(CacPhan[1], 10) || 0;
    return (Gio * 60) + Phut;
  }

  // Chuyển số phút từ 0h sang chuỗi HH:mm
  function PhutSangChuoiGio(TongPhut) {
    const Gio = Math.floor(TongPhut / 60) % 24;
    const Phut = Math.floor(TongPhut % 60);
    return ((Gio < 10) ? ('0' + Gio) : ('' + Gio)) + ':' + ((Phut < 10) ? ('0' + Phut) : ('' + Phut));
  }

  // Trích xuất toàn bộ lịch trình/môn học từ cột ngày hôm nay của bảng Thời khóa biểu PTIT
  function TrichXuatLichTrinhNgayHomNay() {
    if (!KiemTraExtensionConSong()) return;
    const ThongTinHomNay = LayThongTinNgayVaThuHomNay();
    const DanhSachHoatDong = [];
    const Bang = document.querySelector('table');

    // 1. Trích xuất môn học chính khóa của trường trên cột ngày hôm nay của TKB
    if (Bang) {
      const HangDau = Bang.querySelector('thead tr') || Bang.rows[0];
      let ChiSoCotHomNay = -1;

      if (HangDau) {
        const CacOHeader = HangDau.querySelectorAll('th, td');
        for (let i = 0; i < CacOHeader.length; i++) {
          const TextHeader = (CacOHeader[i].innerText || CacOHeader[i].textContent || '').toLowerCase();
          // Kiểm tra ngày cụ thể trước (VD: 30/09 hoặc 30/9)
          if (TextHeader.includes(ThongTinHomNay.ChuoiNgay1) || TextHeader.includes(ThongTinHomNay.ChuoiNgay2)) {
            ChiSoCotHomNay = i;
            break;
          }
          // Hoặc kiểm tra thứ
          if (TextHeader.includes(ThongTinHomNay.TenThu.toLowerCase()) || TextHeader.includes('thứ ' + ThongTinHomNay.MaThu)) {
            ChiSoCotHomNay = i;
            break;
          }
        }
      }

      // Quét các ô thuộc cột hôm nay
      const DanhSachDong = Bang.querySelectorAll('tr');
      for (let ChiSoD = 0; ChiSoD < DanhSachDong.length; ChiSoD++) {
        const Dong = DanhSachDong[ChiSoD];
        if (Dong.querySelector('th') && !Dong.querySelector('td')) continue;

        const CacOTrongDong = Dong.querySelectorAll('td');
        for (let ChiSoO = 0; ChiSoO < CacOTrongDong.length; ChiSoO++) {
          const OCell = CacOTrongDong[ChiSoO];
          if (OCell.classList.contains('ONhanThoiGianMoRong') || OCell.classList.contains('bg-primary')) continue;

          // Kiểm tra ô có thuộc ngày hôm nay hay không
          const MaThuO = parseInt(OCell.dataset.ptitMaThu, 10);
          const ThuO = OCell.dataset.ptitThu;
          const NgayO = OCell.dataset.ptitNgay;
          const CotThucO = parseInt(OCell.dataset.ptitCotThuc, 10);

          let ThuocHomNay = false;
          if (NgayO && (NgayO.includes(ThongTinHomNay.ChuoiNgay1) || NgayO.includes(ThongTinHomNay.ChuoiNgay2))) {
            ThuocHomNay = true;
          } else if (MaThuO === ThongTinHomNay.MaThu || ThuO === ThongTinHomNay.TenThu) {
            ThuocHomNay = true;
          } else if (ChiSoCotHomNay >= 0 && (CotThucO === ChiSoCotHomNay || OCell.cellIndex === ChiSoCotHomNay)) {
            ThuocHomNay = true;
          }

          if (!ThuocHomNay) continue;

          // Kiểm tra có môn học của trường trong ô không
          const CoTheMonHoc = OCell.querySelector('.card, [class*="color_"], [class*="badge"], [ng-reflect-ng-class]');
          let TextCell = '';
          const CacNodeCon = Array.from(OCell.childNodes || []);
          for (let k = 0; k < CacNodeCon.length; k++) {
            const Node = CacNodeCon[k];
            if (Node.nodeType === 1) {
              const El = Node;
              if (El.classList && (El.classList.contains('NhacNhoGhimTrongTkb') || El.classList.contains('DuongChiViTriTha') || El.classList.contains('VatGiuChieuCaoTkb'))) {
                continue;
              }
            }
            TextCell += (Node.textContent || '') + '\n';
          }
          TextCell = TextCell.trim();

          if (CoTheMonHoc || TextCell.length > 5) {
            // Phân tích thông tin môn học của trường
            const CacDongText = TextCell.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            let TenMon = CacDongText[0] || 'Môn học PTIT';
            let PhongHoc = '';
            let GiangVien = '';
            let TietHoc = OCell.dataset.ptitTiet || '';
            let GioDau = OCell.dataset.ptitGio || '';
            let GioCuoi = '';

            for (let t = 0; t < CacDongText.length; t++) {
              const DongT = CacDongText[t];
              const KhopPhong = DongT.match(/(?:Phòng|P\.?|Room)[:\s]*([^\n,]+)/i) || DongT.match(/\b\d{3}-[A-Z0-9]+\b/i);
              if (KhopPhong && !PhongHoc) PhongHoc = KhopPhong[1] || KhopPhong[0];

              const KhopGv = DongT.match(/(?:GV|Giảng viên)[:\s]*([^\n,]+)/i);
              if (KhopGv && !GiangVien) GiangVien = KhopGv[1].trim();

              const KhopTiet = DongT.match(/(?:Tiết|Tiet)[:\s]*(\d+(?:\s*[\-\–]\s*\d+)?)/i);
              if (KhopTiet && !TietHoc) TietHoc = 'Tiết ' + KhopTiet[1];

              const KhopKhoang = DongT.match(/(\d{1,2})[h:](\d{2})\s*(?:[\-\–\>]|đến|to)\s*(\d{1,2})[h:](\d{2})/i);
              if (KhopKhoang && !GioDau) {
                GioDau = ((KhopKhoang[1].length === 1) ? ('0' + KhopKhoang[1]) : KhopKhoang[1]) + ':' + KhopKhoang[2];
                GioCuoi = ((KhopKhoang[3].length === 1) ? ('0' + KhopKhoang[3]) : KhopKhoang[3]) + ':' + KhopKhoang[4];
              }
            }

            // Nếu chưa có giờ bắt đầu / kết thúc, tính theo tiết học
            if (TietHoc) {
              const CacSoTiet = TietHoc.match(/\d+/g);
              if (CacSoTiet && CacSoTiet.length > 0) {
                const TietDau = parseInt(CacSoTiet[0], 10);
                const TietSau = parseInt(CacSoTiet[CacSoTiet.length - 1], 10);
                if (BangChiTietTietHocPtit[TietDau] && !GioDau) {
                  GioDau = BangChiTietTietHocPtit[TietDau].BatDau;
                }
                if (BangChiTietTietHocPtit[TietSau] && !GioCuoi) {
                  GioCuoi = BangChiTietTietHocPtit[TietSau].KetThuc;
                }
              }
            }

            if (!GioDau && OCell.dataset.ptitGio) {
              GioDau = OCell.dataset.ptitGio;
            }
            if (!GioCuoi && GioDau) {
              const PhutD = ChuoiGioSangPhut(GioDau);
              GioCuoi = PhutSangChuoiGio(PhutD + 50);
            }

            if (GioDau && GioCuoi) {
              let GhiChuFull = '';
              if (PhongHoc) GhiChuFull += 'P. ' + PhongHoc;
              if (GiangVien) GhiChuFull += (GhiChuFull ? ' • GV: ' : 'GV: ') + GiangVien;

              // Kiểm tra xem môn này đã có trong danh sách chưa (ghép tiết liên tục)
              const MonDaCo = DanhSachHoatDong.find(function (Item) {
                return Item.TenCongViec === TenMon && Item.LaMonHocTruong &&
                       (Item.GioBatDau === GioDau || Math.abs(ChuoiGioSangPhut(Item.GioKetThuc) - ChuoiGioSangPhut(GioDau)) <= 15);
              });

              if (MonDaCo) {
                if (ChuoiGioSangPhut(GioCuoi) > ChuoiGioSangPhut(MonDaCo.GioKetThuc)) {
                  MonDaCo.GioKetThuc = GioCuoi;
                }
                if (TietHoc && !MonDaCo.Tiet.includes(TietHoc)) {
                  MonDaCo.Tiet += ', ' + TietHoc;
                }
              } else {
                DanhSachHoatDong.push({
                  MaDinhDanh: 'MON_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                  TenCongViec: TenMon,
                  GhiChu: GhiChuFull,
                  GioBatDau: GioDau,
                  GioKetThuc: GioCuoi,
                  Tiet: TietHoc,
                  MauSac: '#0284C7',
                  LaMonHocTruong: true,
                  LaTheGhimTkb: false
                });
              }
            }
          }
        }
      }
    }

    // 2. Trích xuất các thẻ thời khóa biểu ghim tự tạo trong ngày hôm nay
    for (let ChiSoGhim = 0; ChiSoGhim < DanhSachLoiNhacGhim.length; ChiSoGhim++) {
      const ItemGhim = DanhSachLoiNhacGhim[ChiSoGhim];
      if (!ItemGhim) continue;

      let ThuocHomNay = false;
      if (ItemGhim.Ngay && (ItemGhim.Ngay.includes(ThongTinHomNay.ChuoiNgay1) || ItemGhim.Ngay.includes(ThongTinHomNay.ChuoiNgay2))) {
        ThuocHomNay = true;
      } else if (ItemGhim.MaThu === ThongTinHomNay.MaThu || ItemGhim.Thu === ThongTinHomNay.TenThu) {
        ThuocHomNay = true;
      }

      if (!ThuocHomNay) continue;

      let GioDau = ItemGhim.GioBatDau || '07:00';
      let GioCuoi = ItemGhim.GioKetThuc || '';

      if (!GioCuoi) {
        if (ItemGhim.Tiet) {
          const CacSoTiet = ItemGhim.Tiet.match(/\d+/g);
          if (CacSoTiet && CacSoTiet.length > 0) {
            const TietSau = parseInt(CacSoTiet[CacSoTiet.length - 1], 10);
            if (BangChiTietTietHocPtit[TietSau]) {
              GioCuoi = BangChiTietTietHocPtit[TietSau].KetThuc;
            }
          }
        }
        if (!GioCuoi) {
          const PhutD = ChuoiGioSangPhut(GioDau);
          GioCuoi = PhutSangChuoiGio(PhutD + 60);
        }
      }

      DanhSachHoatDong.push({
        MaDinhDanh: ItemGhim.MaGhim,
        TenCongViec: ItemGhim.TieuDe,
        GhiChu: ItemGhim.GhiChu || '',
        GioBatDau: GioDau,
        GioKetThuc: GioCuoi,
        Tiet: ItemGhim.Tiet || '',
        MauSac: ItemGhim.MauSac || '#B71C1C',
        SoPhutBaoTruoc: ItemGhim.SoPhutBaoTruoc,
        LaMonHocTruong: false,
        LaTheGhimTkb: true
      });
    }

    // 3. Tính toán số giờ và sắp xếp theo thời gian tăng dần
    for (let ChiSo = 0; ChiSo < DanhSachHoatDong.length; ChiSo++) {
      const Item = DanhSachHoatDong[ChiSo];
      const PhutDau = ChuoiGioSangPhut(Item.GioBatDau);
      let PhutCuoi = ChuoiGioSangPhut(Item.GioKetThuc);
      if (PhutCuoi <= PhutDau) PhutCuoi += 24 * 60;
      Item.SoGio = Number(((PhutCuoi - PhutDau) / 60).toFixed(1));
    }

    DanhSachHoatDong.sort(function (a, b) {
      return ChuoiGioSangPhut(a.GioBatDau) - ChuoiGioSangPhut(b.GioBatDau);
    });

    DanhSachHoatDongHomNay = DanhSachHoatDong;
    LuuDuLieuAnToan({
      DanhSachHoatDongHomNay: DanhSachHoatDongHomNay,
      NgayLuuHoatDong: ThongTinHomNay.ChuoiNgayDayDu
    });

    CapNhatGiaoDienBieuDo();
  }

  // Cập nhật biểu đồ tròn 24h, khung nổi bật việc hiện tại và danh sách lịch trình hôm nay
  function CapNhatGiaoDienBieuDo() {
    const ThongTinHomNay = LayThongTinNgayVaThuHomNay();
    const TienIch = window.ThuVienTienIch || (typeof ThuVienTienIch !== 'undefined' ? ThuVienTienIch : null);

    // Cập nhật tiêu đề ngày hôm nay
    const ChuNgayHomNay = document.getElementById('ChuNgayHomNay');
    if (ChuNgayHomNay) {
      ChuNgayHomNay.textContent = ThongTinHomNay.ChuoiHienThi;
    }

    // 1. Vẽ biểu đồ tròn 24h với dữ liệu lịch hôm nay
    const CanvasBieuDo = document.getElementById('CanvasBieuDoTronThoiGian');
    if (CanvasBieuDo && TienIch) {
      TienIch.VeBieuDoTronThoiGian(CanvasBieuDo, DanhSachHoatDongHomNay);
    }

    // 2. Xác định công việc đang diễn ra ngay lúc này
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

    // 3. Render khung hình chữ nhật nổi bật nhắc việc hiện tại
    const KhungNhacViec = document.getElementById('KhungNhacViecHienTai');
    if (KhungNhacViec) {
      if (HoatDongHienTai) {
        const MauSac = HoatDongHienTai.MauSac || '#b71c1c';
        const ChuoiTiet = HoatDongHienTai.Tiet ? ` (${HoatDongHienTai.Tiet})` : '';
        const ChuoiGhiChu = HoatDongHienTai.GhiChu ? `<div class="GhiChuHienTai">📍 ${HoatDongHienTai.GhiChu}</div>` : '';
        const LoaiBadge = HoatDongHienTai.LaTheGhimTkb ? '📌 THẺ TKB' : '🏫 LỊCH HỌC';

        KhungNhacViec.innerHTML = `
          <div class="HopTrangThaiHienTai HopTrangThaiDangDienRa" style="border-left-color:${MauSac};">
            <div class="DongTrangThaiDau">
              <span class="BadgeDangDienRa" style="background-color:${MauSac};">
                <span class="DotNhayTrangThai"></span>
                ĐANG DIỄN RA
              </span>
              <span class="ThoiGianConLai">⏱️ Còn ${PhutConLaiHienTai} phút</span>
            </div>
            <div class="TenViecHienTai" style="color:${MauSac};">${HoatDongHienTai.TenCongViec}</div>
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
          const GioBatDauTt = HoatDongTiepTheo.GioBatDau;
          const ChuoiTietTt = HoatDongTiepTheo.Tiet ? ` (${HoatDongTiepTheo.Tiet})` : '';
          HtmlTiepTheo = `
            <div class="HopViecTiepTheo">
              <div style="font-size:11px; font-weight:700; color:#1e293b; display:flex; justify-content:space-between;">
                <span>👉 Sắp tới trong ngày:</span>
                <span style="color:#b71c1c;">(sau ${PhutSapToi} phút)</span>
              </div>
              <div style="font-size:12px; font-weight:600; color:#0f172a; margin-top:2px;">
                ${HoatDongTiepTheo.TenCongViec}
              </div>
              <div style="font-size:11px; color:#64748b;">
                🕒 ${GioBatDauTt} - ${HoatDongTiepTheo.GioKetThuc}${ChuoiTietTt} ${HoatDongTiepTheo.GhiChu ? '• ' + HoatDongTiepTheo.GhiChu : ''}
              </div>
            </div>
          `;
        } else if (DanhSachHoatDongHomNay.length > 0) {
          HtmlTiepTheo = `<div style="font-size:11px; color:#16a34a; font-weight:600; margin-top:4px;">🎉 Bạn đã hoàn thành tất cả lịch trình hôm nay!</div>`;
        } else {
          HtmlTiepTheo = `<div style="font-size:11px; color:#64748b; margin-top:2px;">Hôm nay không có môn học nào trên TKB. Hãy kéo thẻ từ Tab 1 để thêm lịch!</div>`;
        }

        KhungNhacViec.innerHTML = `
          <div class="HopTrangThaiHienTai HopTrangThaiNghiNgoi">
            <div class="DongTrangThaiDau">
              <span class="BadgeNghiNgoi">☕ ĐANG RẢNH / NGHỈ NGƠI</span>
              <span class="GioHienTaiBadge">${ChuoiGioHienTai}</span>
            </div>
            <div class="TenViecHienTai" style="color:#475569; font-size:12.5px;">Hiện tại không có lịch học hoặc thẻ nhắc nhở nào.</div>
            ${HtmlTiepTheo}
          </div>
        `;
      }
    }

    // 4. Render danh sách các hoạt động trong ngày hôm nay
    const SoLuongLichSpan = document.getElementById('SoLuongLichHomNay');
    if (SoLuongLichSpan) {
      SoLuongLichSpan.textContent = DanhSachHoatDongHomNay.length;
    }

    const KhungDanhSach = document.getElementById('DanhSachLichTrinhHomNay');
    if (KhungDanhSach) {
      KhungDanhSach.innerHTML = '';
      if (DanhSachHoatDongHomNay.length === 0) {
        KhungDanhSach.innerHTML = '<div style="font-size:11.5px; color:#888888; text-align:center; padding:12px;">Hôm nay chưa có lịch học hoặc thẻ nhắc nhở nào.</div>';
        return;
      }

      for (let ChiSo = 0; ChiSo < DanhSachHoatDongHomNay.length; ChiSo++) {
        const Item = DanhSachHoatDongHomNay[ChiSo];
        const DongItem = document.createElement('div');
        const LaDangDienRa = (HoatDongHienTai && HoatDongHienTai.MaDinhDanh === Item.MaDinhDanh);
        DongItem.className = 'DongLichHomNayItem' + (LaDangDienRa ? ' DongLichDangDienRa' : '');

        const ChuoiTiet = Item.Tiet ? ` (${Item.Tiet})` : '';
        const ChuoiGhiChu = Item.GhiChu ? ` • ${Item.GhiChu}` : '';

        DongItem.innerHTML = `
          <div class="VachMauLichHomNay" style="background-color:${Item.MauSac};"></div>
          <div class="ThongTinLichHomNay">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <span class="TenLichHomNay">${Item.TenCongViec}</span>
              ${LaDangDienRa ? '<span class="BadgeDangHoc">Đang diễn ra</span>' : ''}
            </div>
            <div class="ChiTietLichHomNay">
              <span>🕒 ${Item.GioBatDau} - ${Item.GioKetThuc}${ChuoiTiet}</span>${ChuoiGhiChu}
            </div>
          </div>
          <span class="BadgeLoaiLich">${Item.LaTheGhimTkb ? '📌 Thẻ TKB' : '🏫 Môn học'}</span>
        `;

        KhungDanhSach.appendChild(DongItem);
      }
    }
  }

  // Định kỳ cập nhật trạng thái đồng hồ & đếm ngược mỗi 10 giây
  const IdIntervalDongHo = setInterval(function () {
    if (!KiemTraExtensionConSong()) {
      clearInterval(IdIntervalDongHo);
      return;
    }
    if (BangDieuKhienHienThi) {
      CapNhatGiaoDienBieuDo();
    }
  }, 10000);

  // Gắn sự kiện kéo thả vào các ô thời khóa biểu và theo dõi khi chuyển tuần
  function TheoDoiVaGanSuKienThoiKhoaBieu() {
    let HenGioCapNhat = null;
    try {
      const BoTheoDoi = new MutationObserver(function (DanhSachDotBien) {
        if (!KiemTraExtensionConSong()) {
          try { BoTheoDoi.disconnect(); } catch (E) {}
          return;
        }
        let CoThayDoiWebNgoai = false;
        if (DanhSachDotBien && DanhSachDotBien.length > 0) {
          for (let i = 0; i < DanhSachDotBien.length; i++) {
            const Muc = DanhSachDotBien[i];
            const Target = Muc.target;
            if (!Target) continue;
            if (Target.closest && (
              Target.closest('.NhacNhoGhimTrongTkb') ||
              Target.closest('#BangDieuKhienChinh') ||
              Target.closest('#NutMoBangDieuKhien') ||
              Target.closest('.DuongChiViTriTha')
            )) {
              continue;
            }
            CoThayDoiWebNgoai = true;
            break;
          }
        }
        if (!CoThayDoiWebNgoai) return;

        if (HenGioCapNhat) clearTimeout(HenGioCapNhat);
        HenGioCapNhat = setTimeout(function () {
          if (!KiemTraExtensionConSong()) return;
          ChuanHoaBangThoiKhoaBieuWeb();
          TimKiemVaGanSuKienCacO();
          CapNhatToanBoChieuCaoCacO();
          TrichXuatLichTrinhNgayHomNay();
        }, 400);
      });
      BoTheoDoi.observe(document.body, { childList: true, subtree: true });
    } catch (LoiTheoDoi) {}

    const IdIntervalQuetBang = setInterval(function () {
      if (!KiemTraExtensionConSong()) {
        clearInterval(IdIntervalQuetBang);
        return;
      }
      ChuanHoaBangThoiKhoaBieuWeb();
      TimKiemVaGanSuKienCacO();
      CapNhatToanBoChieuCaoCacO();
    }, 3000);
  }

  const BangGioTietHocPtit = {
    1: '07:00',
    2: '07:55',
    3: '08:55',
    4: '09:55',
    5: '10:55',
    6: '12:00',
    7: '13:00',
    8: '13:55',
    9: '14:55',
    10: '15:55',
    11: '16:55',
    12: '17:55',
    13: '18:50',
    14: '19:45',
    15: '20:40',
    16: '21:35'
  };

  function CapNhatNoiDungOTkb(OCell, ChuoiKhoangGio) {
    if (!OCell) return;
    const DanhSachPhanTuCon = OCell.querySelectorAll('p, span, small, div');
    for (let ChiSoCon = 0; ChiSoCon < DanhSachPhanTuCon.length; ChiSoCon++) {
      DanhSachPhanTuCon[ChiSoCon].innerText = ChuoiKhoangGio;
    }
    OCell.innerText = ChuoiKhoangGio;
  }

  function XacDinhViTriChenTrongO(OCell, ViTriConTroY) {
    if (!OCell) return { TheTruocDo: null, ChiSoChen: 0 };
    const DanhSachTheHienTai = Array.from(OCell.querySelectorAll('.NhacNhoGhimTrongTkb:not(.DangDuocKeo)'));
    if (DanhSachTheHienTai.length === 0) {
      return { TheTruocDo: null, ChiSoChen: 0 };
    }

    for (let ChiSo = 0; ChiSo < DanhSachTheHienTai.length; ChiSo++) {
      const TheHienTai = DanhSachTheHienTai[ChiSo];
      const HopThe = TheHienTai.getBoundingClientRect();
      const TrungTamY = HopThe.top + (HopThe.height / 2);
      if (ViTriConTroY < TrungTamY) {
        return { TheTruocDo: TheHienTai, ChiSoChen: ChiSo };
      }
    }

    return { TheTruocDo: null, ChiSoChen: DanhSachTheHienTai.length };
  }

  function CapNhatDuongChiViTriTha(OCell, ViTriConTroY) {
    if (!OCell) return;
    const DanhSachTheHienTai = Array.from(OCell.querySelectorAll('.NhacNhoGhimTrongTkb:not(.DangDuocKeo)'));
    if (DanhSachTheHienTai.length === 0) {
      XoaDuongChiViTriTha();
      return;
    }

    let DuongChi = document.querySelector('.DuongChiViTriTha');
    if (!DuongChi) {
      DuongChi = document.createElement('div');
      DuongChi.className = 'DuongChiViTriTha';
    }

    const DanhSachTatCaDuongChi = document.querySelectorAll('.DuongChiViTriTha');
    if (DanhSachTatCaDuongChi.length > 1) {
      for (let ChiSo = 1; ChiSo < DanhSachTatCaDuongChi.length; ChiSo++) {
        DanhSachTatCaDuongChi[ChiSo].remove();
      }
    }

    const ViTriChen = XacDinhViTriChenTrongO(OCell, ViTriConTroY);
    const KhungChua = OCell.querySelector('.KhungChuaTheGhimTrongO') || OCell;
    if (ViTriChen.TheTruocDo) {
      if (DuongChi.parentElement !== KhungChua || DuongChi.nextElementSibling !== ViTriChen.TheTruocDo) {
        KhungChua.insertBefore(DuongChi, ViTriChen.TheTruocDo);
      }
    } else {
      if (DuongChi.parentElement !== KhungChua || KhungChua.lastElementChild !== DuongChi) {
        KhungChua.appendChild(DuongChi);
      }
    }
  }

  function XoaTrangThaiSanSangNhanCacO(OBoQua) {
    const DanhSachOSanSang = document.querySelectorAll('.OTkbSanSangNhan');
    for (let ChiSo = 0; ChiSo < DanhSachOSanSang.length; ChiSo++) {
      if (OBoQua && DanhSachOSanSang[ChiSo] === OBoQua) {
        continue;
      }
      DanhSachOSanSang[ChiSo].classList.remove('OTkbSanSangNhan');
    }
  }

  function XoaDuongChiViTriTha() {
    const DanhSachDuongChi = document.querySelectorAll('.DuongChiViTriTha');
    for (let ChiSo = 0; ChiSo < DanhSachDuongChi.length; ChiSo++) {
      DanhSachDuongChi[ChiSo].remove();
    }
    XoaTrangThaiSanSangNhanCacO();
  }

  function KiemTraConTroNgoaiO(OCell, SuKien) {
    if (!OCell) return true;
    if (SuKien && SuKien.relatedTarget && OCell.contains(SuKien.relatedTarget)) {
      return false;
    }
    if (SuKien && typeof SuKien.clientX === 'number' && typeof SuKien.clientY === 'number') {
      const KhungO = OCell.getBoundingClientRect();
      const ToaDoX = SuKien.clientX;
      const ToaDoY = SuKien.clientY;
      if (ToaDoX >= KhungO.left && ToaDoX <= KhungO.right && ToaDoY >= KhungO.top && ToaDoY <= KhungO.bottom) {
        return false;
      }
    }
    return true;
  }

  function TaoHangThoiKhoaBieuMoRong(ChuoiKhoangGio, ChuoiGioDon, SoCotNgay, CoCotPhai, TenLopDanhDau) {
    const TheTr = document.createElement('tr');
    TheTr.className = 'DongThoiKhoaBieuMoRong' + (TenLopDanhDau ? (' ' + TenLopDanhDau) : '');

    const OTrai = document.createElement('td');
    OTrai.className = 'ONhanThoiGianMoRong bg-primary text-white text-center align-middle text-nowrap';
    OTrai.innerText = ChuoiKhoangGio;
    TheTr.appendChild(OTrai);

    for (let ChiSoCot = 0; ChiSoCot < SoCotNgay; ChiSoCot++) {
      const OCell = document.createElement('td');
      OCell.className = 'OCellMoRongTkb p-1';
      OCell.setAttribute('tabindex', '1');
      OCell.dataset.ptitDaGanKeoTha = 'true';
      OCell.dataset.ptitCot = ChiSoCot + 1;
      OCell.dataset.ptitCotThuc = ChiSoCot + 1;
      const MaThuCot = ChiSoCot + 2;
      OCell.dataset.ptitMaThu = MaThuCot;
      OCell.dataset.ptitThu = (MaThuCot === 8) ? 'Chủ Nhật' : ('Thứ ' + MaThuCot);
      OCell.dataset.ptitGio = ChuoiGioDon;
      OCell.dataset.ptitKhoangGio = ChuoiKhoangGio;
      OCell.dataset.ptitTiet = '';

      OCell.addEventListener('dragover', function (SuKien) {
        SuKien.preventDefault();
        SuKien.stopPropagation();
        if (SuKien.dataTransfer) {
          SuKien.dataTransfer.dropEffect = 'move';
        }
        XoaTrangThaiSanSangNhanCacO(OCell);
        OCell.classList.add('OTkbSanSangNhan');
        CapNhatDuongChiViTriTha(OCell, SuKien.clientY);
      });

      OCell.addEventListener('dragleave', function (SuKien) {
        if (!KiemTraConTroNgoaiO(OCell, SuKien)) return;
        OCell.classList.remove('OTkbSanSangNhan');
        XoaDuongChiViTriTha();
      });

      OCell.addEventListener('drop', function (SuKien) {
        if (SuKien._ptitDaXuLyTha) return;
        SuKien._ptitDaXuLyTha = true;
        SuKien.preventDefault();
        SuKien.stopPropagation();
        XoaTrangThaiSanSangNhanCacO();
        const ViTriConTroY = SuKien.clientY;
        XoaDuongChiViTriTha();
        XuLyThaTheVaoOTkb(OCell, SuKien, ViTriConTroY);
      });

      TheTr.appendChild(OCell);
    }

    if (CoCotPhai) {
      const OPhai = document.createElement('td');
      OPhai.className = 'ONhanThoiGianMoRong bg-primary text-white text-center align-middle text-nowrap';
      OPhai.innerText = ChuoiKhoangGio;
      TheTr.appendChild(OPhai);
    }

    return TheTr;
  }

  function KiemTraDongCoLichHoc(Dong) {
    if (!Dong) return false;

    const CoPhanTuMonHoc = Dong.querySelector('.card, [class*="color_"], [class*="badge"], [ng-reflect-ng-class], .text-danger, .badge');
    if (CoPhanTuMonHoc) {
      if (!CoPhanTuMonHoc.closest('.NhacNhoGhimTrongTkb') && !CoPhanTuMonHoc.classList.contains('NhacNhoGhimTrongTkb')) {
        return true;
      }
    }

    const DanhSachOTrongDong = Array.from(Dong.cells || []);
    for (let ChiSoO = 0; ChiSoO < DanhSachOTrongDong.length; ChiSoO++) {
      const OCell = DanhSachOTrongDong[ChiSoO];
      if (OCell.classList.contains('ONhanThoiGianMoRong') || OCell.classList.contains('bg-primary')) {
        continue;
      }

      let VanBanThucTe = '';
      const DanhSachCon = Array.from(OCell.childNodes || []);
      for (let ChiSoCon = 0; ChiSoCon < DanhSachCon.length; ChiSoCon++) {
        const NutCon = DanhSachCon[ChiSoCon];
        if (NutCon.nodeType === 1) {
          const PhanTuCon = NutCon;
          if (PhanTuCon.classList && (PhanTuCon.classList.contains('NhacNhoGhimTrongTkb') || PhanTuCon.classList.contains('DuongChiViTriTha'))) {
            continue;
          }
        }
        VanBanThucTe += (NutCon.textContent || '').trim();
      }

      if (VanBanThucTe.length > 0) {
        return true;
      }
    }

    return false;
  }

  function LayGioBatDauCuaDong(Dong, CoCotPhai) {
    if (!Dong) return -1;
    const OTrai = (Dong.cells && Dong.cells.length > 0) ? Dong.cells[0] : null;
    const OPhai = (Dong.cells && Dong.cells.length > 1 && CoCotPhai) ? Dong.cells[Dong.cells.length - 1] : null;
    const VanBanTrai = OTrai ? (OTrai.innerText || OTrai.textContent || '').trim() : '';
    const VanBanPhai = OPhai ? (OPhai.innerText || OPhai.textContent || '').trim() : '';
    const VanBan = VanBanTrai + ' ' + VanBanPhai;

    const KhopGio = VanBan.match(/(?:^|[^\d:])(\d{1,2})[h:](\d{2})/);
    if (KhopGio) {
      return parseInt(KhopGio[1], 10);
    }
    return -1;
  }

  function ChuanHoaBangThoiKhoaBieuWeb() {
    const DanhSachBang = document.querySelectorAll('table');
    if (!DanhSachBang || DanhSachBang.length === 0) return;

    for (let ChiSoBang = 0; ChiSoBang < DanhSachBang.length; ChiSoBang++) {
      const Bang = DanhSachBang[ChiSoBang];
      const HangDau = Bang.querySelector('tr');
      if (!HangDau) continue;

      const NoiDungDau = HangDau.innerText || HangDau.textContent || '';
      if (!NoiDungDau.includes('Thứ 2') && !NoiDungDau.includes('Thứ hai') && !NoiDungDau.includes('Thứ 3')) {
        continue;
      }

      const TBody = Bang.querySelector('tbody') || Bang;

      const DanhSachDongTietD = Array.from(TBody.querySelectorAll('tr')).filter(function (DongItem) {
        const VanBanDong = (DongItem.innerText || DongItem.textContent || '').trim();
        return /Tiết\s*D\d+/i.test(VanBanDong) && !KiemTraDongCoLichHoc(DongItem);
      });
      for (let ChiSoD = 0; ChiSoD < DanhSachDongTietD.length; ChiSoD++) {
        DanhSachDongTietD[ChiSoD].remove();
      }

      const DanhSachDong = Array.from(TBody.querySelectorAll('tr')).filter(function (DongItem) {
        return !DongItem.querySelector('th') || DongItem.querySelectorAll('td').length > 0;
      });

      if (DanhSachDong.length === 0) continue;

      let SoCotNgay = 7;
      if (HangDau.cells.length >= 8) {
        SoCotNgay = (HangDau.cells.length >= 9) ? 7 : (HangDau.cells.length - 1);
      }
      const CoCotPhai = (DanhSachDong[0].cells.length > SoCotNgay + 1);

      const DanhSachDongToiWeb = DanhSachDong.filter(function (DongItem) {
        if (DongItem.classList.contains('DongThoiKhoaBieuMoRong')) return false;
        const GioBatDauDong = LayGioBatDauCuaDong(DongItem, CoCotPhai);
        return GioBatDauDong >= 22;
      });

      let DongDau22 = null;
      let DongCuoi23 = null;

      if (DanhSachDongToiWeb.length >= 2) {
        DongDau22 = DanhSachDongToiWeb[0];
        DongDau22.style.display = '';
        DongDau22.classList.remove('DongLeBiAn');
        const OTraiDau = (DongDau22.cells && DongDau22.cells.length > 0) ? DongDau22.cells[0] : null;
        const OPhaiDau = (DongDau22.cells && DongDau22.cells.length > 1 && CoCotPhai) ? DongDau22.cells[DongDau22.cells.length - 1] : null;
        CapNhatNoiDungOTkb(OTraiDau, '22:00 - 23:00');
        if (OPhaiDau) CapNhatNoiDungOTkb(OPhaiDau, '22:00 - 23:00');

        DongCuoi23 = DanhSachDongToiWeb[DanhSachDongToiWeb.length - 1];
        DongCuoi23.style.display = '';
        DongCuoi23.classList.remove('DongLeBiAn');
        const OTraiCuoi = (DongCuoi23.cells && DongCuoi23.cells.length > 0) ? DongCuoi23.cells[0] : null;
        const OPhaiCuoi = (DongCuoi23.cells && DongCuoi23.cells.length > 1 && CoCotPhai) ? DongCuoi23.cells[DongCuoi23.cells.length - 1] : null;
        CapNhatNoiDungOTkb(OTraiCuoi, '23:00 - 24:00');
        if (OPhaiCuoi) CapNhatNoiDungOTkb(OPhaiCuoi, '23:00 - 24:00');

        for (let ChiSoGiua = 1; ChiSoGiua < DanhSachDongToiWeb.length - 1; ChiSoGiua++) {
          const DongGiua = DanhSachDongToiWeb[ChiSoGiua];
          if (KiemTraDongCoLichHoc(DongGiua)) {
            DongGiua.style.display = '';
            DongGiua.classList.remove('DongLeBiAn');
            continue;
          }
          DongGiua.classList.add('DongLeBiAn');
          DongGiua.style.display = 'none';
        }

        const HangMoRongCu22 = Bang.querySelector('.DongMoRong22h');
        if (HangMoRongCu22) HangMoRongCu22.remove();
        const HangMoRongCu24 = Bang.querySelector('.DongMoRong24hDay');
        if (HangMoRongCu24) HangMoRongCu24.remove();
      } else if (DanhSachDongToiWeb.length === 1) {
        DongDau22 = DanhSachDongToiWeb[0];
        DongDau22.style.display = '';
        DongDau22.classList.remove('DongLeBiAn');
        const OTraiDau = (DongDau22.cells && DongDau22.cells.length > 0) ? DongDau22.cells[0] : null;
        const OPhaiDau = (DongDau22.cells && DongDau22.cells.length > 1 && CoCotPhai) ? DongDau22.cells[DongDau22.cells.length - 1] : null;
        CapNhatNoiDungOTkb(OTraiDau, '22:00 - 23:00');
        if (OPhaiDau) CapNhatNoiDungOTkb(OPhaiDau, '22:00 - 23:00');

        const HangMoRongCu22 = Bang.querySelector('.DongMoRong22h');
        if (HangMoRongCu22) HangMoRongCu22.remove();

        let HangDayDaCo = Bang.querySelector('.DongMoRong24hDay');
        if (!HangDayDaCo) {
          HangDayDaCo = TaoHangThoiKhoaBieuMoRong('23:00 - 24:00', '23:00', SoCotNgay, CoCotPhai, 'DongMoRong24hDay');
          DongDau22.insertAdjacentElement('afterend', HangDayDaCo);
        }
      } else {
        let Hang22DaCo = Bang.querySelector('.DongMoRong22h');
        if (!Hang22DaCo) {
          Hang22DaCo = TaoHangThoiKhoaBieuMoRong('22:00 - 23:00', '22:00', SoCotNgay, CoCotPhai, 'DongMoRong22h');
          TBody.appendChild(Hang22DaCo);
        }
        let HangDayDaCo = Bang.querySelector('.DongMoRong24hDay');
        if (!HangDayDaCo) {
          HangDayDaCo = TaoHangThoiKhoaBieuMoRong('23:00 - 24:00', '23:00', SoCotNgay, CoCotPhai, 'DongMoRong24hDay');
          TBody.appendChild(HangDayDaCo);
        }
      }

      for (let ChiSoDong = 0; ChiSoDong < DanhSachDong.length; ChiSoDong++) {
        const DongKiemTra = DanhSachDong[ChiSoDong];
        if (DongKiemTra === DongDau22 || DongKiemTra === DongCuoi23 || DongKiemTra.classList.contains('DongThoiKhoaBieuMoRong')) {
          continue;
        }
        if (KiemTraDongCoLichHoc(DongKiemTra)) {
          DongKiemTra.style.display = '';
          DongKiemTra.classList.remove('DongLeBiAn');
          continue;
        }
        const GioBatDauDong = LayGioBatDauCuaDong(DongKiemTra, CoCotPhai);
        if (GioBatDauDong >= 22) {
          DongKiemTra.classList.add('DongLeBiAn');
          DongKiemTra.style.display = 'none';
        }
      }

      const HangDauDaCo = Bang.querySelector('.DongMoRong24hDau');
      const HangChinhDauTien = DanhSachDong.find(function (DongItem) {
        return !DongItem.classList.contains('DongThoiKhoaBieuMoRong');
      }) || DanhSachDong[0];

      if (!HangDauDaCo && HangChinhDauTien) {
        const DanhSachMocDau = [
          { BatDau: '00:00', KetThuc: '01:00' },
          { BatDau: '01:00', KetThuc: '02:00' },
          { BatDau: '02:00', KetThuc: '03:00' },
          { BatDau: '03:00', KetThuc: '04:00' },
          { BatDau: '04:00', KetThuc: '05:00' },
          { BatDau: '05:00', KetThuc: '06:00' },
          { BatDau: '06:00', KetThuc: '07:00' }
        ];

        for (let ChiSoDau = 0; ChiSoDau < DanhSachMocDau.length; ChiSoDau++) {
          const Moc = DanhSachMocDau[ChiSoDau];
          const ChuoiHienThi = Moc.BatDau + ' - ' + Moc.KetThuc;
          const HangMoi = TaoHangThoiKhoaBieuMoRong(ChuoiHienThi, Moc.BatDau, SoCotNgay, CoCotPhai, (ChiSoDau === 0) ? 'DongMoRong24hDau' : '');
          TBody.insertBefore(HangMoi, HangChinhDauTien);
        }
      }
    }
  }

  function LayMaThuTuChuoi(ChuoiThu) {
    if (!ChuoiThu) return 0;
    const Chuoi = ChuoiThu.toLowerCase().trim();
    if (Chuoi.includes('chủ nhật') || Chuoi.includes('chu nhat') || /\bcn\b/.test(Chuoi) || Chuoi === 'cn') {
      return 8;
    }
    const KhopSo = Chuoi.match(/(?:thứ|thu)?\s*([2-7])/);
    if (KhopSo) {
      return parseInt(KhopSo[1], 10);
    }
    if (Chuoi.includes('hai')) return 2;
    if (Chuoi.includes('ba')) return 3;
    if (Chuoi.includes('tư') || Chuoi.includes('tu') || Chuoi.includes('bốn') || Chuoi.includes('bon')) return 4;
    if (Chuoi.includes('năm') || Chuoi.includes('nam')) return 5;
    if (Chuoi.includes('sáu') || Chuoi.includes('sau')) return 6;
    if (Chuoi.includes('bảy') || Chuoi.includes('bay')) return 7;
    return 0;
  }

  function TimKiemVaGanSuKienCacO() {
    const DanhSachBang = document.querySelectorAll('table');
    if (!DanhSachBang || DanhSachBang.length === 0) return;

    for (let ChiSoBang = 0; ChiSoBang < DanhSachBang.length; ChiSoBang++) {
      const Bang = DanhSachBang[ChiSoBang];
      const HangDau = Bang.querySelector('tr');
      if (!HangDau) continue;

      const VanBanDau = (HangDau.innerText || HangDau.textContent || '').toLowerCase();
      if (!VanBanDau.includes('thứ 2') && !VanBanDau.includes('thứ hai') && !VanBanDau.includes('thứ 3')) {
        continue;
      }

      const DanhSachDong = Bang.querySelectorAll('tr');
      if (DanhSachDong.length === 0) continue;

      const MaTranBang = [];
      for (let ChiSoD = 0; ChiSoD < DanhSachDong.length; ChiSoD++) {
        if (!MaTranBang[ChiSoD]) MaTranBang[ChiSoD] = [];
        const DongHienTai = DanhSachDong[ChiSoD];
        const CacOTrongDong = DongHienTai.querySelectorAll('th, td');
        let CotAo = 0;

        for (let ChiSoCell = 0; ChiSoCell < CacOTrongDong.length; ChiSoCell++) {
          while (MaTranBang[ChiSoD][CotAo]) {
            CotAo++;
          }
          const OCell = CacOTrongDong[ChiSoCell];
          const SoDongSpan = OCell.rowSpan || 1;
          const SoCotSpan = OCell.colSpan || 1;

          for (let Dr = 0; Dr < SoDongSpan; Dr++) {
            for (let Dc = 0; Dc < SoCotSpan; Dc++) {
              if (!MaTranBang[ChiSoD + Dr]) MaTranBang[ChiSoD + Dr] = [];
              MaTranBang[ChiSoD + Dr][CotAo + Dc] = OCell;
            }
          }

          OCell.dataset.ptitCotThuc = CotAo;
          OCell.dataset.ptitDongThuc = ChiSoD;
          CotAo += SoCotSpan;
        }
      }

      Bang._ptitMaTran = MaTranBang;

      if (!Bang._ptitDaGanSuKienBang) {
        Bang._ptitDaGanSuKienBang = true;

        Bang.addEventListener('dragover', function (SuKien) {
          const OCell = SuKien.target.closest('td');
          if (!OCell) return;
          if (OCell.classList.contains('ONhanThoiGianMoRong') || OCell.classList.contains('bg-primary')) return;

          SuKien.preventDefault();
          if (SuKien.dataTransfer) {
            SuKien.dataTransfer.dropEffect = 'move';
          }
          XoaTrangThaiSanSangNhanCacO(OCell);
          OCell.classList.add('OTkbSanSangNhan');
          CapNhatDuongChiViTriTha(OCell, SuKien.clientY);
        });

        Bang.addEventListener('dragleave', function (SuKien) {
          const OCell = SuKien.target.closest('td');
          if (!OCell) return;
          if (!KiemTraConTroNgoaiO(OCell, SuKien)) return;
          OCell.classList.remove('OTkbSanSangNhan');
          XoaDuongChiViTriTha();
        });

        Bang.addEventListener('drop', function (SuKien) {
          if (SuKien._ptitDaXuLyTha) return;
          SuKien._ptitDaXuLyTha = true;
          const OCell = SuKien.target.closest('td');
          if (!OCell) return;
          if (OCell.classList.contains('ONhanThoiGianMoRong') || OCell.classList.contains('bg-primary')) return;

          SuKien.preventDefault();
          SuKien.stopPropagation();
          XoaTrangThaiSanSangNhanCacO();
          const ViTriConTroY = SuKien.clientY;
          XoaDuongChiViTriTha();
          XuLyThaTheVaoOTkb(OCell, SuKien, ViTriConTroY);
        });
      }

      for (let ChiSoDong = 0; ChiSoDong < DanhSachDong.length; ChiSoDong++) {
        const Dong = DanhSachDong[ChiSoDong];
        const DanhSachO = Dong.querySelectorAll('td');

        for (let ChiSoO = 0; ChiSoO < DanhSachO.length; ChiSoO++) {
          const OCell = DanhSachO[ChiSoO];

          if (OCell.classList.contains('ONhanThoiGianMoRong') || OCell.classList.contains('bg-primary')) {
            continue;
          }

          const ThongTinCot = LayThongTinThuVaNgayCot(Bang, OCell);
          let MaThu = LayMaThuTuChuoi(ThongTinCot.Thu);
          const ThongTinDong = LayThongTinTietVaGioDong(Dong, OCell);

          OCell.dataset.ptitDong = ChiSoDong;
          OCell.dataset.ptitCot = ChiSoO;

          if (!MaThu || MaThu <= 0) {
            const CotThuc = parseInt(OCell.dataset.ptitCotThuc, 10);
            if (!isNaN(CotThuc) && CotThuc >= 1 && CotThuc <= 7) {
              MaThu = CotThuc + 1;
              ThongTinCot.Thu = (MaThu === 8) ? 'Chủ Nhật' : ('Thứ ' + MaThu);
            }
          }

          if (MaThu > 0) {
            OCell.dataset.ptitMaThu = MaThu;
            OCell.dataset.ptitThu = ThongTinCot.Thu;
            if (ThongTinCot.Ngay) OCell.dataset.ptitNgay = ThongTinCot.Ngay;
          }
          if (Dong.classList.contains('DongThoiKhoaBieuMoRong')) {
            OCell.dataset.ptitTiet = '';
            if (ThongTinDong.GioBatDau) {
              OCell.dataset.ptitGio = ThongTinDong.GioBatDau;
            }
          } else {
            if (ThongTinDong.GioBatDau) {
              OCell.dataset.ptitGio = ThongTinDong.GioBatDau;
            }
            if (ThongTinDong.Tiet) {
              OCell.dataset.ptitTiet = ThongTinDong.Tiet;
            }
          }

          if (OCell.dataset.ptitDaGanKeoTha) continue;
          OCell.dataset.ptitDaGanKeoTha = 'true';

          OCell.addEventListener('dragover', function (SuKien) {
            SuKien.preventDefault();
            SuKien.stopPropagation();
            if (SuKien.dataTransfer) {
              SuKien.dataTransfer.dropEffect = 'move';
            }
            XoaTrangThaiSanSangNhanCacO(OCell);
            OCell.classList.add('OTkbSanSangNhan');
            CapNhatDuongChiViTriTha(OCell, SuKien.clientY);
          });

          OCell.addEventListener('dragleave', function (SuKien) {
            if (!KiemTraConTroNgoaiO(OCell, SuKien)) return;
            OCell.classList.remove('OTkbSanSangNhan');
            XoaDuongChiViTriTha();
          });

          OCell.addEventListener('drop', function (SuKien) {
            if (SuKien._ptitDaXuLyTha) return;
            SuKien._ptitDaXuLyTha = true;
            SuKien.preventDefault();
            SuKien.stopPropagation();
            XoaTrangThaiSanSangNhanCacO();
            const ViTriConTroY = SuKien.clientY;
            XoaDuongChiViTriTha();
            XuLyThaTheVaoOTkb(OCell, SuKien, ViTriConTroY);
          });
        }
      }
    }

    const DanhSachTheHienCo = document.querySelectorAll('.NhacNhoGhimTrongTkb');
    let CanVeLai = false;
    if (DanhSachTheHienCo.length !== DanhSachLoiNhacGhim.length) {
      CanVeLai = true;
    } else {
      for (let ChiSoKiemTra = 0; ChiSoKiemTra < DanhSachLoiNhacGhim.length; ChiSoKiemTra++) {
        const MaGhimKiemTra = DanhSachLoiNhacGhim[ChiSoKiemTra].MaGhim;
        if (!document.querySelector('.NhacNhoGhimTrongTkb[data-ma-ghim="' + MaGhimKiemTra + '"]')) {
          CanVeLai = true;
          break;
        }
      }
    }

    if (CanVeLai) {
      VeCacLoiNhacDaGhim();
    } else {
      CapNhatToanBoChieuCaoCacO();
    }
  }

  function LayThongTinThuVaNgayCot(Bang, OCell) {
    let ChuoiThu = '';
    let ChuoiNgay = '';
    if (!Bang || !OCell) return { Thu: ChuoiThu, Ngay: ChuoiNgay };

    const HangTieuDe = Bang.querySelector('thead tr') || Bang.rows[0];
    if (!HangTieuDe) return { Thu: ChuoiThu, Ngay: ChuoiNgay };

    let OHeaderPhuHop = null;
    try {
      const OBox = OCell.getBoundingClientRect();
      if (OBox && OBox.width > 0) {
        const TamX = OBox.left + (OBox.width / 2);
        const DanhSachOHeader = HangTieuDe.querySelectorAll('th, td');
        for (let ChiSoH = 0; ChiSoH < DanhSachOHeader.length; ChiSoH++) {
          const HBox = DanhSachOHeader[ChiSoH].getBoundingClientRect();
          if (TamX >= (HBox.left - 2) && TamX <= (HBox.right + 2)) {
            OHeaderPhuHop = DanhSachOHeader[ChiSoH];
            break;
          }
        }
      }
    } catch (LoiToaDo) {}

    if (!OHeaderPhuHop && OCell.dataset.ptitCotThuc !== undefined) {
      const ChiSoCotThuc = parseInt(OCell.dataset.ptitCotThuc, 10);
      if (HangTieuDe.cells && HangTieuDe.cells[ChiSoCotThuc]) {
        OHeaderPhuHop = HangTieuDe.cells[ChiSoCotThuc];
      }
    }

    if (!OHeaderPhuHop && typeof OCell.cellIndex === 'number' && HangTieuDe.cells[OCell.cellIndex]) {
      OHeaderPhuHop = HangTieuDe.cells[OCell.cellIndex];
    }

    if (OHeaderPhuHop) {
      const NoiDungHeader = (OHeaderPhuHop.innerText || OHeaderPhuHop.textContent || '').trim();
      const KhopThu = NoiDungHeader.match(/(Thứ\s*[2-7]|Thứ\s*(?:hai|ba|tư|bốn|năm|sáu|bảy)|Chủ\s*Nhật|CN)/i);
      if (KhopThu) {
        ChuoiThu = KhopThu[0].replace(/\s+/g, ' ');
      }
      const KhopNgay = NoiDungHeader.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
      if (KhopNgay) {
        ChuoiNgay = KhopNgay[0];
      }
    }

    return { Thu: ChuoiThu, Ngay: ChuoiNgay };
  }

  function LayThongTinTietVaGioDong(Dong, OCell) {
    let ChuoiTiet = '';
    let ChuoiGioBatDau = '';
    let ChuoiGioKetThuc = '';

    if (!Dong) return { Tiet: ChuoiTiet, GioBatDau: ChuoiGioBatDau, GioKetThuc: ChuoiGioKetThuc };

    if (Dong.classList.contains('DongThoiKhoaBieuMoRong')) {
      for (let ChiSoDongMoRong = 0; ChiSoDongMoRong < Dong.cells.length; ChiSoDongMoRong++) {
        const VanBanCell = (Dong.cells[ChiSoDongMoRong].innerText || Dong.cells[ChiSoDongMoRong].textContent || '').trim();
        const KhopGioMoRong = VanBanCell.match(/(\d{1,2}):(\d{2})\s*(?:[\-\–\>]|đến|to)\s*(\d{1,2}):(\d{2})/i);
        if (KhopGioMoRong) {
          const GioDau = (KhopGioMoRong[1].length === 1) ? ('0' + KhopGioMoRong[1]) : KhopGioMoRong[1];
          const GioCuoi = (KhopGioMoRong[3].length === 1) ? ('0' + KhopGioMoRong[3]) : KhopGioMoRong[3];
          ChuoiGioBatDau = GioDau + ':' + KhopGioMoRong[2];
          ChuoiGioKetThuc = GioCuoi + ':' + KhopGioMoRong[4];
          break;
        }
        const KhopGioDon = VanBanCell.match(/(?:^|[^\d:])(\d{1,2})[h:](\d{2})(?:[^\d:]|$)/);
        if (KhopGioDon && !ChuoiGioBatDau) {
          const GioDau = (KhopGioDon[1].length === 1) ? ('0' + KhopGioDon[1]) : KhopGioDon[1];
          ChuoiGioBatDau = GioDau + ':' + KhopGioDon[2];
        }
      }
      return { Tiet: '', GioBatDau: ChuoiGioBatDau, GioKetThuc: ChuoiGioKetThuc };
    }

    const DanhSachOTrongDong = Array.from(Dong.cells || []);
    if (OCell && !DanhSachOTrongDong.includes(OCell)) {
      DanhSachOTrongDong.push(OCell);
    }

    for (let ChiSoKt = 0; ChiSoKt < DanhSachOTrongDong.length; ChiSoKt++) {
      const NoiDungKiemTra = (DanhSachOTrongDong[ChiSoKt].innerText || DanhSachOTrongDong[ChiSoKt].textContent || '').trim();
      if (!NoiDungKiemTra) continue;

      if (!ChuoiTiet) {
        const KhopTiet = NoiDungKiemTra.match(/(?:Tiết|Tiet)[:\s]*(\d+(?:\s*[\-\–\,]\s*\d+)?)/i);
        if (KhopTiet) {
          ChuoiTiet = 'Tiết ' + KhopTiet[1];
        }
      }

      if (!ChuoiGioBatDau) {
        const KhopKhoangGio = NoiDungKiemTra.match(/(\d{1,2})[h:](\d{2})\s*(?:[\-\–\>]|đến|to)\s*(\d{1,2})[h:](\d{2})/i);
        if (KhopKhoangGio) {
          const GioDau = (KhopKhoangGio[1].length === 1) ? ('0' + KhopKhoangGio[1]) : KhopKhoangGio[1];
          const GioCuoi = (KhopKhoangGio[3].length === 1) ? ('0' + KhopKhoangGio[3]) : KhopKhoangGio[3];
          ChuoiGioBatDau = GioDau + ':' + KhopKhoangGio[2];
          ChuoiGioKetThuc = GioCuoi + ':' + KhopKhoangGio[4];
        } else {
          const KhopGioDon = NoiDungKiemTra.match(/(?:^|[^\d:])(\d{1,2})[h:](\d{2})(?:[^\d:]|$)/);
          if (KhopGioDon) {
            const GioDau = (KhopGioDon[1].length === 1) ? ('0' + KhopGioDon[1]) : KhopGioDon[1];
            ChuoiGioBatDau = GioDau + ':' + KhopGioDon[2];
          }
        }
      }
    }

    if (!ChuoiGioBatDau && ChuoiTiet) {
      const KhopSoTiet = ChuoiTiet.match(/\d+/);
      if (KhopSoTiet) {
        const SoTietDau = parseInt(KhopSoTiet[0], 10);
        if (BangGioTietHocPtit[SoTietDau]) {
          ChuoiGioBatDau = BangGioTietHocPtit[SoTietDau];
        }
      }
    }

    if (ChuoiGioBatDau === '22:00' || ChuoiGioBatDau === '23:00') {
      ChuoiTiet = '';
    }

    return { Tiet: ChuoiTiet, GioBatDau: ChuoiGioBatDau, GioKetThuc: ChuoiGioKetThuc };
  }

  function TinhToanThoiGianBaoThucThongMinh(NgayChuoi, GioBatDauChuoi, SoPhutBaoTruoc) {
    const NgayHomNay = new Date();
    let NgaySo = NgayHomNay.getDate();
    let ThangSo = NgayHomNay.getMonth();
    let NamSo = NgayHomNay.getFullYear();

    if (NgayChuoi) {
      const KhopNgay = NgayChuoi.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
      if (KhopNgay) {
        NgaySo = parseInt(KhopNgay[1], 10);
        ThangSo = parseInt(KhopNgay[2], 10) - 1;
        if (KhopNgay[3]) {
          NamSo = parseInt(KhopNgay[3], 10);
          if (NamSo < 100) NamSo += 2000;
        }
      }
    }

    let GioSo = 7;
    let PhutSo = 0;
    if (GioBatDauChuoi) {
      const KhopGio = GioBatDauChuoi.match(/(\d{1,2})[h:](\d{2})/);
      if (KhopGio) {
        GioSo = parseInt(KhopGio[1], 10);
        PhutSo = parseInt(KhopGio[2], 10);
      }
    }

    const ThoiDiemBatDauLop = new Date(NamSo, ThangSo, NgaySo, GioSo, PhutSo, 0, 0);
    const SoPhutTruocSo = (typeof SoPhutBaoTruoc === 'number') ? SoPhutBaoTruoc : 15;
    const ThoiDiemBaoThuc = new Date(ThoiDiemBatDauLop.getTime() - (SoPhutTruocSo * 60 * 1000));

    const GioBaoSo = ThoiDiemBaoThuc.getHours();
    const PhutBaoSo = ThoiDiemBaoThuc.getMinutes();
    const ChuoiGioBao = ((GioBaoSo < 10) ? ('0' + GioBaoSo) : ('' + GioBaoSo)) + ':' + ((PhutBaoSo < 10) ? ('0' + PhutBaoSo) : ('' + PhutBaoSo));
    const ChuoiNgayBao = ThoiDiemBaoThuc.toLocaleDateString('vi-VN');

    return {
      ThoiDiemBaoThuc: ThoiDiemBaoThuc.getTime(),
      ChuoiGioBao: ChuoiGioBao,
      ChuoiNgayBao: ChuoiNgayBao
    };
  }

  let ThoiGianThaTheCuoi = 0;

  function XuLyThaTheVaoOTkb(OCell, SuKien, ViTriConTroY) {
    if (!OCell) return;

    const BayGio = Date.now();
    if (BayGio - ThoiGianThaTheCuoi < 400) {
      return;
    }
    ThoiGianThaTheCuoi = BayGio;

    try {
      let ThongTinLoiNhac = null;

      if (SuKien && SuKien.dataTransfer) {
        const DuLieuChuoi = SuKien.dataTransfer.getData('text/plain');
        if (DuLieuChuoi) {
          try {
            ThongTinLoiNhac = JSON.parse(DuLieuChuoi);
          } catch (LoiParse) {}
        }
      }

      if (!ThongTinLoiNhac && ThongTinTheMauDangKeo) {
        ThongTinLoiNhac = ThongTinTheMauDangKeo;
      }

      if (!ThongTinLoiNhac && ThongTinTheGhimDangKeo) {
        ThongTinLoiNhac = ThongTinTheGhimDangKeo;
      }

      if (!ThongTinLoiNhac) {
        const TheMauDom = document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo');
        if (TheMauDom && TheMauDom.dataset.duLieuJson) {
          try {
            ThongTinLoiNhac = JSON.parse(TheMauDom.dataset.duLieuJson);
          } catch (LoiParseDom) {}
        }
      }

      if (!ThongTinLoiNhac) {
        const TheGhimDom = document.querySelector('.NhacNhoGhimTrongTkb.DangDuocKeo');
        if (TheGhimDom && TheGhimDom.dataset.maGhim) {
          const MaGhim = TheGhimDom.dataset.maGhim;
          ThongTinLoiNhac = DanhSachLoiNhacGhim.find(function (Item) {
            return Item.MaGhim === MaGhim;
          });
        }
      }

      if (!ThongTinLoiNhac) {
        console.warn('Không trích xuất được thông tin thẻ kéo thả vào ô');
        return;
      }

      ThongTinTheMauDangKeo = null;
      ThongTinTheGhimDangKeo = null;

      GhimLoiNhacVaoOTkb(OCell, ThongTinLoiNhac, ViTriConTroY);
    } catch (LoiChung) {
      console.warn('Lỗi xử lý thả thẻ vào ô:', LoiChung);
    }
  }

  function GhimLoiNhacVaoOTkb(OCell, ThongTinLoiNhac, ViTriConTroY) {
    let ItemCu = null;
    if (ThongTinLoiNhac.MaGhim) {
      const ChiSoCu = DanhSachLoiNhacGhim.findIndex(function (Item) {
        return Item.MaGhim === ThongTinLoiNhac.MaGhim;
      });
      if (ChiSoCu >= 0) {
        ItemCu = DanhSachLoiNhacGhim[ChiSoCu];
        DanhSachLoiNhacGhim.splice(ChiSoCu, 1);
      }
    }

    const MaGhim = (ItemCu && ItemCu.MaGhim) ? ItemCu.MaGhim : ('GHIM_' + Date.now());
    const ViTriDong = OCell.dataset.ptitDong;
    const ViTriCot = OCell.dataset.ptitCot;
    let ViTriDongThuc = (OCell.dataset.ptitDongThuc !== undefined && OCell.dataset.ptitDongThuc !== '') ? parseInt(OCell.dataset.ptitDongThuc, 10) : null;
    let ViTriCotThuc = (OCell.dataset.ptitCotThuc !== undefined && OCell.dataset.ptitCotThuc !== '') ? parseInt(OCell.dataset.ptitCotThuc, 10) : null;
    const Bang = OCell.closest('table') || document.querySelector('table');
    const Dong = OCell.closest('tr');

    if (ViTriCotThuc === null && typeof OCell.cellIndex === 'number') {
      ViTriCotThuc = OCell.cellIndex;
    }
    if (ViTriDongThuc === null && Dong && typeof Dong.rowIndex === 'number') {
      ViTriDongThuc = Dong.rowIndex;
    }

    const ThongTinCot = LayThongTinThuVaNgayCot(Bang, OCell);
    const ThongTinDong = LayThongTinTietVaGioDong(Dong, OCell);

    let MaThu = parseInt(OCell.dataset.ptitMaThu, 10) || LayMaThuTuChuoi(ThongTinCot.Thu);
    let TenThu = OCell.dataset.ptitThu || ThongTinCot.Thu;
    let TenNgay = OCell.dataset.ptitNgay || ThongTinCot.Ngay;
    let TenGio = OCell.dataset.ptitGio || ThongTinDong.GioBatDau;
    let TenTiet = OCell.dataset.ptitTiet || ThongTinDong.Tiet;

    if (!MaThu || MaThu <= 0) {
      const ChiSoCot = (typeof ViTriCotThuc === 'number' && !isNaN(ChiSoCotThuc) && ViTriCotThuc > 0) ? ViTriCotThuc : OCell.cellIndex;
      if (typeof ChiSoCot === 'number' && ChiSoCot >= 1 && ChiSoCot <= 7) {
        MaThu = ChiSoCot + 1;
        TenThu = (MaThu === 8) ? 'Chủ Nhật' : ('Thứ ' + MaThu);
      }
    }

    if (!TenGio && TenTiet) {
      const KhopSoTiet = TenTiet.match(/\d+/);
      if (KhopSoTiet) {
        const SoTietDau = parseInt(KhopSoTiet[0], 10);
        if (BangGioTietHocPtit[SoTietDau]) {
          TenGio = BangGioTietHocPtit[SoTietDau];
        }
      }
    }
    if (!TenGio && ThongTinLoiNhac.GioBatDau) {
      TenGio = ThongTinLoiNhac.GioBatDau;
    }

    let SoPhutBaoTruoc = (typeof ThongTinLoiNhac.SoPhutBaoTruoc === 'number') ? ThongTinLoiNhac.SoPhutBaoTruoc : 15;

    let ThoiGianBaoThucMoi = null;
    if (TenGio) {
      const KetQuaTinh = TinhToanThoiGianBaoThucThongMinh(TenNgay, TenGio, SoPhutBaoTruoc);
      ThoiGianBaoThucMoi = KetQuaTinh.ThoiDiemBaoThuc;
    } else if (ThongTinLoiNhac.ThoiGianBaoThuc) {
      ThoiGianBaoThucMoi = ThongTinLoiNhac.ThoiGianBaoThuc;
    }

    const LoiNhacGhimMoi = {
      MaGhim: MaGhim,
      ViTriDong: ViTriDong,
      ViTriCot: ViTriCot,
      DongThuc: ViTriDongThuc,
      CotThuc: ViTriCotThuc,
      TieuDe: ThongTinLoiNhac.TieuDe,
      GhiChu: ThongTinLoiNhac.GhiChu,
      MauSac: ThongTinLoiNhac.MauSac || '#B71C1C',
      MaThu: MaThu,
      Thu: TenThu,
      Ngay: TenNgay,
      Tiet: TenTiet,
      GioBatDau: TenGio,
      GioKetThuc: ThongTinDong.GioKetThuc,
      SoPhutBaoTruoc: SoPhutBaoTruoc,
      ThoiGianBaoThuc: ThoiGianBaoThucMoi
    };

    let DaChen = false;
    if (typeof ViTriConTroY === 'number') {
      const KetQuaViTri = XacDinhViTriChenTrongO(OCell, ViTriConTroY);
      if (KetQuaViTri.TheTruocDo && KetQuaViTri.TheTruocDo.dataset.maGhim) {
        const ChiSoTrongMang = DanhSachLoiNhacGhim.findIndex(function (Item) {
          return Item.MaGhim === KetQuaViTri.TheTruocDo.dataset.maGhim;
        });
        if (ChiSoTrongMang >= 0) {
          DanhSachLoiNhacGhim.splice(ChiSoTrongMang, 0, LoiNhacGhimMoi);
          DaChen = true;
        }
      } else {
        const DanhSachTheTrongO = Array.from(OCell.querySelectorAll('.NhacNhoGhimTrongTkb:not(.DangDuocKeo)'));
        if (DanhSachTheTrongO.length > 0) {
          const TheCuoiCung = DanhSachTheTrongO[DanhSachTheTrongO.length - 1];
          if (TheCuoiCung && TheCuoiCung.dataset.maGhim) {
            const ChiSoCuoi = DanhSachLoiNhacGhim.findIndex(function (Item) {
              return Item.MaGhim === TheCuoiCung.dataset.maGhim;
            });
            if (ChiSoCuoi >= 0) {
              DanhSachLoiNhacGhim.splice(ChiSoCuoi + 1, 0, LoiNhacGhimMoi);
              DaChen = true;
            }
          }
        }
      }
    }

    const BayGioGhim = Date.now();
    const TheSinhDoiVuaGhim = DanhSachLoiNhacGhim.find(function (Item) {
      if (Item.MaGhim === MaGhim) return false;
      const CungTieuDe = (Item.TieuDe || '').trim() === (ThongTinLoiNhac.TieuDe || '').trim();
      const CungGhiChu = (Item.GhiChu || '').trim() === (ThongTinLoiNhac.GhiChu || '').trim();
      const CungThu = Item.MaThu === MaThu || Item.Thu === TenThu;
      const CungGio = (Item.GioBatDau || '').trim() === (TenGio || '').trim();
      const CungTiet = (Item.Tiet || '').trim() === (TenTiet || '').trim();
      const CungDong = Item.ViTriDong === ViTriDong && Item.ViTriCot === ViTriCot;
      const CungToaDoThuc = (typeof Item.DongThuc === 'number' && Item.DongThuc === ViTriDongThuc &&
                            typeof Item.CotThuc === 'number' && Item.CotThuc === ViTriCotThuc);
      const CungViTriO = CungDong || CungToaDoThuc || (CungThu && (CungGio || CungTiet));
      if (CungTieuDe && CungGhiChu && CungViTriO) {
        const Ts = parseInt((Item.MaGhim || '').replace('GHIM_', ''), 10);
        if (!isNaN(Ts) && Math.abs(BayGioGhim - Ts) < 2000) {
          return true;
        }
      }
      return false;
    });

    if (TheSinhDoiVuaGhim) {
      return;
    }

    if (!DaChen) {
      DanhSachLoiNhacGhim.push(LoiNhacGhimMoi);
    }

    LuuDuLieuAnToan({ DanhSachLoiNhacGhim: DanhSachLoiNhacGhim });
    if (TayCamThuMucLuu) {
      DongBoToanBoDuLieuVaoThuMuc();
    }

    if (ThoiGianBaoThucMoi && ThoiGianBaoThucMoi > Date.now()) {
      GuiTinNhanAnToan({
        HanhDong: 'ThietLapBaoThuc',
        MaDinhDanh: MaGhim,
        ThoiGianMiliGiay: ThoiGianBaoThucMoi
      });
    }

    VeCacLoiNhacDaGhim();

    const TheTrenGiaoDien = document.querySelector('.NhacNhoGhimTrongTkb[data-ma-ghim="' + MaGhim + '"]');
    if (!TheTrenGiaoDien) {
      OCell.classList.add('OCellChuaTheGhimTkb');
      const TheGhimTrucTiep = TaoPhanTuTheGhim(LoiNhacGhimMoi);
      if (KiemTraOCoLichHoc(OCell)) {
        OCell.classList.add('OCellCoLichHocTruong');
        OCell.appendChild(TheGhimTrucTiep);
      } else {
        OCell.classList.remove('OCellCoLichHocTruong');
        let KhungChua = OCell.querySelector('.KhungChuaTheGhimTrongO');
        if (!KhungChua) {
          KhungChua = document.createElement('div');
          KhungChua.className = 'KhungChuaTheGhimTrongO';
          OCell.appendChild(KhungChua);
        }
        KhungChua.appendChild(TheGhimTrucTiep);
      }
    }
    CapNhatChieuCaoTheTrongO(OCell);
    TrichXuatLichTrinhNgayHomNay();
  }

  function TimOTkbChinhXac(Bang, ItemGhim) {
    if (!Bang || !ItemGhim) return null;

    if (!Bang._ptitMaTran) {
      TimKiemVaGanSuKienCacO();
    }

    const MaThuMucTieu = ItemGhim.MaThu || LayMaThuTuChuoi(ItemGhim.Thu);
    const GioMucTieu = (ItemGhim.GioBatDau || '').trim();
    const TietMucTieu = (ItemGhim.Tiet || '').trim();
    const KhopTietHoc = TietMucTieu.match(/(?:Tiết|Tiet)[:\s]*(\d+)/i);

    if (Bang._ptitMaTran && typeof ItemGhim.DongThuc === 'number' && typeof ItemGhim.CotThuc === 'number') {
      const DongMaTran = Bang._ptitMaTran[ItemGhim.DongThuc];
      if (DongMaTran && DongMaTran[ItemGhim.CotThuc]) {
        const OMaTran = DongMaTran[ItemGhim.CotThuc];
        const MaThuOMaTran = parseInt(OMaTran.dataset.ptitMaThu, 10);
        if (!MaThuMucTieu || !MaThuOMaTran || isNaN(MaThuOMaTran) || MaThuOMaTran === MaThuMucTieu) {
          return OMaTran;
        }
      }
    }

    if (MaThuMucTieu > 0) {
      const DanhSachO = Array.from(Bang.querySelectorAll('td')).filter(function (Cell) {
        const MaThuCell = parseInt(Cell.dataset.ptitMaThu, 10);
        if (MaThuCell === MaThuMucTieu) return true;
        const CotThucCell = parseInt(Cell.dataset.ptitCotThuc, 10);
        if (!isNaN(CotThucCell) && (CotThucCell + 1) === MaThuMucTieu) return true;
        if (Cell.cellIndex && (Cell.cellIndex + 1) === MaThuMucTieu) return true;
        return false;
      });

      if (GioMucTieu) {
        const OKhopGio = DanhSachO.find(function (Cell) {
          const GioCell = (Cell.dataset.ptitGio || '').trim();
          return GioCell && (GioCell === GioMucTieu || GioCell.startsWith(GioMucTieu) || GioMucTieu.startsWith(GioCell));
        });
        if (OKhopGio) return OKhopGio;
      }

      if (TietMucTieu) {
        const OKhopTiet = DanhSachO.find(function (Cell) {
          const TietCell = (Cell.dataset.ptitTiet || '').trim();
          return TietCell && (TietCell === TietMucTieu || TietCell.includes(TietMucTieu) || TietMucTieu.includes(TietCell));
        });
        if (OKhopTiet) return OKhopTiet;
      }

      if (KhopTietHoc) {
        const SoTietMucTieu = parseInt(KhopTietHoc[1], 10);
        const OKhopSoTiet = DanhSachO.find(function (Cell) {
          const DongCuaO = Cell.closest('tr');
          if (DongCuaO && DongCuaO.classList.contains('DongThoiKhoaBieuMoRong')) return false;

          const ChuoiTietCuaCell = (Cell.dataset.ptitTiet || '').trim();
          const KhopSo = ChuoiTietCuaCell.match(/(?:Tiết|Tiet)[:\s]*(\d+)/i);
          return KhopSo && parseInt(KhopSo[1], 10) === SoTietMucTieu;
        });
        if (OKhopSoTiet) return OKhopSoTiet;
      }

      if (Bang._ptitMaTran && Bang.rows && Bang.rows.length > 0) {
        const HangDau = Bang.rows[0];
        let CotIndex = -1;
        for (let ChiSoC = 0; ChiSoC < HangDau.cells.length; ChiSoC++) {
          const TextHeader = HangDau.cells[ChiSoC].innerText || HangDau.cells[ChiSoC].textContent || '';
          if (LayMaThuTuChuoi(TextHeader) === MaThuMucTieu) {
            CotIndex = ChiSoC;
            break;
          }
        }

        if (CotIndex < 0 && MaThuMucTieu >= 2 && MaThuMucTieu <= 8) {
          CotIndex = MaThuMucTieu - 1;
        }

        if (CotIndex >= 0) {
          for (let ChiSoR = 1; ChiSoR < Bang.rows.length; ChiSoR++) {
            const HangKiemTra = Bang.rows[ChiSoR];
            if (HangKiemTra.classList.contains('DongThoiKhoaBieuMoRong') && KhopTietHoc) {
              continue;
            }
            const VanBanDong = HangKiemTra.innerText || HangKiemTra.textContent || '';
            const KhopDongGio = GioMucTieu && VanBanDong.includes(GioMucTieu);
            const KhopDongTiet = TietMucTieu && VanBanDong.includes(TietMucTieu);
            if (KhopDongGio || KhopDongTiet) {
              if (Bang._ptitMaTran[ChiSoR] && Bang._ptitMaTran[ChiSoR][CotIndex]) {
                return Bang._ptitMaTran[ChiSoR][CotIndex];
              }
            }
          }
        }
      }

      if (GioMucTieu || TietMucTieu) {
        const OKhopDong = DanhSachO.find(function (Cell) {
          const Dong = Cell.closest('tr');
          if (!Dong) return false;
          if (Dong.classList.contains('DongThoiKhoaBieuMoRong') && KhopTietHoc) return false;
          const VanBanDong = (Dong.innerText || Dong.textContent || '').trim();
          if (GioMucTieu && VanBanDong.includes(GioMucTieu)) return true;
          if (TietMucTieu && VanBanDong.includes(TietMucTieu)) return true;
          return false;
        });
        if (OKhopDong) return OKhopDong;
      }
    }

    if (ItemGhim.ViTriDong !== undefined && ItemGhim.ViTriCot !== undefined) {
      const OFallback = Bang.querySelector('td[data-ptit-dong="' + ItemGhim.ViTriDong + '"][data-ptit-cot="' + ItemGhim.ViTriCot + '"]');
      if (OFallback) return OFallback;
    }

    if (typeof ItemGhim.DongThuc === 'number' && typeof ItemGhim.CotThuc === 'number') {
      if (Bang.rows && Bang.rows[ItemGhim.DongThuc] && Bang.rows[ItemGhim.DongThuc].cells && Bang.rows[ItemGhim.DongThuc].cells[ItemGhim.CotThuc]) {
        return Bang.rows[ItemGhim.DongThuc].cells[ItemGhim.CotThuc];
      }
    }

    return null;
  }

  function LayChuoiThoiGianNoThuc(ItemGhim) {
    if (!ItemGhim) return '06:45';

    if (typeof ItemGhim.ThoiGianBaoThuc === 'number' && !isNaN(ItemGhim.ThoiGianBaoThuc)) {
      const NgayHen = new Date(ItemGhim.ThoiGianBaoThuc);
      if (!isNaN(NgayHen.getTime())) {
        const Gio = NgayHen.getHours();
        const Phut = NgayHen.getMinutes();
        const ChuoiGio = (Gio < 10) ? ('0' + Gio) : ('' + Gio);
        const ChuoiPhut = (Phut < 10) ? ('0' + Phut) : ('' + Phut);
        return ChuoiGio + ':' + ChuoiPhut;
      }
    }

    const SoPhutLui = (typeof ItemGhim.SoPhutBaoTruoc === 'number') ? ItemGhim.SoPhutBaoTruoc : 15;

    let GioHoc = ItemGhim.GioBatDau;
    if (!GioHoc && ItemGhim.Tiet) {
      const KhopTiet = ItemGhim.Tiet.match(/\d+/);
      if (KhopTiet) {
        const SoTietDau = parseInt(KhopTiet[0], 10);
        if (BangGioTietHocPtit[SoTietDau]) {
          GioHoc = BangGioTietHocPtit[SoTietDau];
        }
      }
    }

    if (GioHoc) {
      const KhopGio = GioHoc.match(/(\d{1,2})[h:](\d{2})/);
      if (KhopGio) {
        const GioGoc = parseInt(KhopGio[1], 10);
        const PhutGoc = parseInt(KhopGio[2], 10);
        let TongPhut = (GioGoc * 60 + PhutGoc) - SoPhutLui;
        if (TongPhut < 0) {
          TongPhut += 24 * 60;
        }
        const GioMoi = Math.floor(TongPhut / 60) % 24;
        const PhutMoi = TongPhut % 60;
        const ChuoiGioMoi = (GioMoi < 10) ? ('0' + GioMoi) : ('' + GioMoi);
        const ChuoiPhutMoi = (PhutMoi < 10) ? ('0' + PhutMoi) : ('' + PhutMoi);
        return ChuoiGioMoi + ':' + ChuoiPhutMoi;
      }
    }

    if (ItemGhim.GioBatDau) {
      return ItemGhim.GioBatDau;
    }

    return '06:45';
  }

  function TaoPhanTuTheGhim(ItemGhim) {
    const TheGhim = document.createElement('div');
    TheGhim.className = 'NhacNhoGhimTrongTkb';
    TheGhim.dataset.maGhim = ItemGhim.MaGhim;
    TheGhim.style.backgroundColor = ItemGhim.MauSac || '#B71C1C';
    TheGhim.style.color = '#ffffff';
    TheGhim.draggable = true;

    TheGhim.addEventListener('dragstart', function (SuKienKeo) {
      TheGhim.classList.add('DangDuocKeo');
      if (SuKienKeo.dataTransfer) {
        SuKienKeo.dataTransfer.effectAllowed = 'all';
        SuKienKeo.dataTransfer.setData('text/plain', JSON.stringify(Object.assign({}, ItemGhim, { LaDiChuyenNoiBo: true })));
      }
      ThongTinTheGhimDangKeo = ItemGhim;
      ThongTinTheMauDangKeo = null;
      document.body.classList.add('DangKeoTheGhimTkb');
    });

    TheGhim.addEventListener('dragend', function () {
      TheGhim.classList.remove('DangDuocKeo');
      document.body.classList.remove('DangKeoTheGhimTkb');
      const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
      if (BangDieuKhien) {
        BangDieuKhien.classList.remove('BangDieuKhienNhanXoaThe');
      }
      XoaDuongChiViTriTha();
      setTimeout(function () {
        ThongTinTheGhimDangKeo = null;
      }, 300);
    });

    const ChuoiThoiGianNoThuc = LayChuoiThoiGianNoThuc(ItemGhim);

    TheGhim.title = ItemGhim.TieuDe + (ItemGhim.GhiChu ? ('\n' + ItemGhim.GhiChu) : '') + (ChuoiThoiGianNoThuc ? ('\nBáo lúc: ' + ChuoiThoiGianNoThuc) : '');

    TheGhim.innerHTML = `
      <div class="TieuDeLoiNhacGhim">${ItemGhim.TieuDe}</div>
      ${ItemGhim.GhiChu ? `<div class="NoiDungLoiNhacGhim">${ItemGhim.GhiChu}</div>` : ''}
      ${ChuoiThoiGianNoThuc ? `
        <div class="DongThoiGianGocPhaiGhim">
          <span class="ThoiGianNoTinNhanGhim">${ChuoiThoiGianNoThuc}</span>
        </div>
      ` : ''}
    `;

    return TheGhim;
  }

  function KiemTraOCoLichHoc(OCell) {
    if (!OCell) return false;
    const CoPhanTuMonHoc = OCell.querySelector('.card, [class*="color_"], [class*="badge"], [ng-reflect-ng-class], .text-danger');
    if (CoPhanTuMonHoc && !CoPhanTuMonHoc.closest('.NhacNhoGhimTrongTkb') && !CoPhanTuMonHoc.closest('.KhungChuaTheGhimTrongO') && !CoPhanTuMonHoc.classList.contains('NhacNhoGhimTrongTkb')) {
      return true;
    }
    let VanBanThucTe = '';
    const DanhSachCon = Array.from(OCell.childNodes || []);
    for (let ChiSoCon = 0; ChiSoCon < DanhSachCon.length; ChiSoCon++) {
      const NutCon = DanhSachCon[ChiSoCon];
      if (NutCon.nodeType === 1) {
        const PhanTuCon = NutCon;
        if (PhanTuCon.classList && (
          PhanTuCon.classList.contains('NhacNhoGhimTrongTkb') ||
          PhanTuCon.classList.contains('DuongChiViTriTha') ||
          PhanTuCon.classList.contains('KhungChuaTheGhimTrongO') ||
          PhanTuCon.classList.contains('VatGiuChieuCaoTkb')
        )) {
          continue;
        }
      }
      VanBanThucTe += (NutCon.textContent || '').trim();
    }
    if (VanBanThucTe.length > 5 && !VanBanThucTe.includes('Tiết') && !/\d{1,2}:\d{2}/.test(VanBanThucTe)) {
      return true;
    }
    return false;
  }

  function CapNhatChieuCaoTheTrongO(OCell) {
    if (!OCell) return;
    const CoLichHocTruong = KiemTraOCoLichHoc(OCell);

    if (CoLichHocTruong) {
      OCell.classList.add('OCellCoLichHocTruong');
      const DanhSachThe = Array.from(OCell.querySelectorAll('.NhacNhoGhimTrongTkb'));
      for (let ChiSoThe = 0; ChiSoThe < DanhSachThe.length; ChiSoThe++) {
        DanhSachThe[ChiSoThe].style.removeProperty('height');
      }
      return;
    }

    OCell.classList.remove('OCellCoLichHocTruong');
    OCell.style.setProperty('padding', '0px', 'important');
    OCell.style.setProperty('margin', '0px', 'important');
    OCell.style.setProperty('vertical-align', 'top', 'important');

    let KhungChua = OCell.querySelector('.KhungChuaTheGhimTrongO');
    const DanhSachThe = Array.from(OCell.querySelectorAll('.NhacNhoGhimTrongTkb:not(.DangDuocKeo)'));
    const TongSoThe = DanhSachThe.length;

    if (TongSoThe === 0) {
      if (KhungChua) KhungChua.remove();
      const VatGiuCu = OCell.querySelector('.VatGiuChieuCaoTkb');
      if (VatGiuCu) VatGiuCu.remove();
      OCell.classList.remove('OCellChuaTheGhimTkb');
      return;
    }

    if (!KhungChua) {
      KhungChua = document.createElement('div');
      KhungChua.className = 'KhungChuaTheGhimTrongO';
      OCell.appendChild(KhungChua);
    }

    for (let ChiSoThe = 0; ChiSoThe < TongSoThe; ChiSoThe++) {
      const The = DanhSachThe[ChiSoThe];
      The.style.removeProperty('height');
      if (The.parentElement !== KhungChua) {
        KhungChua.appendChild(The);
      }
    }

    let VatGiu = OCell.querySelector('.VatGiuChieuCaoTkb');
    if (!VatGiu) {
      VatGiu = document.createElement('div');
      VatGiu.className = 'VatGiuChieuCaoTkb';
      OCell.insertBefore(VatGiu, OCell.firstChild);
    }

    const ChieuCaoToiThieu = Math.max(40, TongSoThe * 42);
    VatGiu.style.height = ChieuCaoToiThieu + 'px';
  }

  function CapNhatToanBoChieuCaoCacO(DatLaiTuDong) {
    const DanhSachOCellChuaThe = document.querySelectorAll('.OCellChuaTheGhimTkb');
    if (!DanhSachOCellChuaThe || DanhSachOCellChuaThe.length === 0) return;

    if (DatLaiTuDong) {
      const DanhSachThe = document.querySelectorAll('.NhacNhoGhimTrongTkb');
      for (let ChiSoThe = 0; ChiSoThe < DanhSachThe.length; ChiSoThe++) {
        DanhSachThe[ChiSoThe].style.removeProperty('height');
      }
    }

    for (let ChiSoO = 0; ChiSoO < DanhSachOCellChuaThe.length; ChiSoO++) {
      CapNhatChieuCaoTheTrongO(DanhSachOCellChuaThe[ChiSoO]);
    }
  }

  function VeCacLoiNhacDaGhim() {
    const DanhSachTheCu = document.querySelectorAll('.NhacNhoGhimTrongTkb');
    for (let ChiSoCu = 0; ChiSoCu < DanhSachTheCu.length; ChiSoCu++) {
      DanhSachTheCu[ChiSoCu].remove();
    }

    const DanhSachKhungCu = document.querySelectorAll('.KhungChuaTheGhimTrongO, .VatGiuChieuCaoTkb');
    for (let ChiSoKhung = 0; ChiSoKhung < DanhSachKhungCu.length; ChiSoKhung++) {
      DanhSachKhungCu[ChiSoKhung].remove();
    }

    const DanhSachOCu = document.querySelectorAll('.OCellChuaTheGhimTkb');
    for (let ChiSoOCu = 0; ChiSoOCu < DanhSachOCu.length; ChiSoOCu++) {
      DanhSachOCu[ChiSoOCu].classList.remove('OCellChuaTheGhimTkb');
      DanhSachOCu[ChiSoOCu].classList.remove('OCellCoLichHocTruong');
    }

    const DanhSachBang = document.querySelectorAll('table');
    if (!DanhSachBang || DanhSachBang.length === 0) return;

    for (let ChiSoGhim = 0; ChiSoGhim < DanhSachLoiNhacGhim.length; ChiSoGhim++) {
      const ItemGhim = DanhSachLoiNhacGhim[ChiSoGhim];
      let OPhuHop = null;

      for (let ChiSoBang = 0; ChiSoBang < DanhSachBang.length; ChiSoBang++) {
        const Bang = DanhSachBang[ChiSoBang];
        const HangDau = Bang.querySelector('tr');
        if (HangDau) {
          const VanBanDau = (HangDau.innerText || HangDau.textContent || '').toLowerCase();
          if (!VanBanDau.includes('thứ 2') && !VanBanDau.includes('thứ hai') && !VanBanDau.includes('thứ 3')) {
            continue;
          }
        }
        OPhuHop = TimOTkbChinhXac(Bang, ItemGhim);
        if (OPhuHop) break;
      }

      if (OPhuHop) {
        OPhuHop.classList.add('OCellChuaTheGhimTkb');
        const TheGhim = TaoPhanTuTheGhim(ItemGhim);
        const CoLichHocTruong = KiemTraOCoLichHoc(OPhuHop);

        if (CoLichHocTruong) {
          OPhuHop.classList.add('OCellCoLichHocTruong');
          OPhuHop.appendChild(TheGhim);
        } else {
          OPhuHop.classList.remove('OCellCoLichHocTruong');
          let KhungChua = OPhuHop.querySelector('.KhungChuaTheGhimTrongO');
          if (!KhungChua) {
            KhungChua = document.createElement('div');
            KhungChua.className = 'KhungChuaTheGhimTrongO';
            OPhuHop.appendChild(KhungChua);
          }
          KhungChua.appendChild(TheGhim);
        }
      }
    }

    CapNhatToanBoChieuCaoCacO();
  }

  function KiemTraConTroTrongVungExtension(SuKien) {
    if (!SuKien) return false;
    const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
    const NutMoBang = document.getElementById('NutMoBangDieuKhien');

    if (BangDieuKhien && BangDieuKhien.style.display !== 'none') {
      const HopBang = BangDieuKhien.getBoundingClientRect();
      if (SuKien.clientX >= HopBang.left && SuKien.clientX <= HopBang.right &&
          SuKien.clientY >= HopBang.top && SuKien.clientY <= HopBang.bottom) {
        return true;
      }
    }

    if (NutMoBang && NutMoBang.style.display !== 'none') {
      const HopNut = NutMoBang.getBoundingClientRect();
      if (SuKien.clientX >= HopNut.left && SuKien.clientX <= HopNut.right &&
          SuKien.clientY >= HopNut.top && SuKien.clientY <= HopNut.bottom) {
        return true;
      }
    }

    return false;
  }

  function XuLyThaXoaTheTkb(SuKien) {
    if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) {
      return;
    }

    if (SuKien) {
      SuKien.preventDefault();
      SuKien.stopPropagation();
    }

    const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
    if (BangDieuKhien) {
      BangDieuKhien.classList.remove('BangDieuKhienNhanXoaThe');
    }

    try {
      let ThongTin = null;
      if (SuKien && SuKien.dataTransfer) {
        const DuLieuChuoi = SuKien.dataTransfer.getData('text/plain');
        if (DuLieuChuoi) {
          try {
            ThongTin = JSON.parse(DuLieuChuoi);
          } catch (LoiGiaiMa) {}
        }
      }

      if ((!ThongTin || !ThongTin.MaGhim) && ThongTinTheGhimDangKeo) {
        ThongTin = ThongTinTheGhimDangKeo;
      }

      if (!ThongTin || !ThongTin.MaGhim) {
        const TheDangKeoTrenTrang = document.querySelector('.NhacNhoGhimTrongTkb.DangDuocKeo');
        if (TheDangKeoTrenTrang && TheDangKeoTrenTrang.dataset.maGhim) {
          const MaGhim = TheDangKeoTrenTrang.dataset.maGhim;
          ThongTin = DanhSachLoiNhacGhim.find(function (Item) {
            return Item.MaGhim === MaGhim;
          });
        }
      }

      if (ThongTin && ThongTin.MaGhim) {
        const TenThe = ThongTin.TieuDe || 'Không tên';
        GoLoiNhacKhoiTkb(ThongTin.MaGhim);
        HienThiThongBaoNoiToastGocPhai('Đã xóa thẻ thời khóa biểu', 'Đã gỡ thẻ "' + TenThe + '" khỏi thời khóa biểu.', '#d32f2f');
        ThongTinTheGhimDangKeo = null;
        XoaDuongChiViTriTha();
      }
    } catch (Loi) {
      console.warn('Lỗi xử lý thả thẻ vào bảng điều khiển để xóa:', Loi);
    }
  }

  function GoLoiNhacKhoiTkb(MaGhim) {
    DanhSachLoiNhacGhim = DanhSachLoiNhacGhim.filter(function (Item) {
      return Item.MaGhim !== MaGhim;
    });
    LuuDuLieuAnToan({ DanhSachLoiNhacGhim: DanhSachLoiNhacGhim });
    GuiTinNhanAnToan({ HanhDong: 'HuyBaoThuc', MaDinhDanh: MaGhim });
    if (TayCamThuMucLuu) {
      DongBoToanBoDuLieuVaoThuMuc();
    }
    VeCacLoiNhacDaGhim();
    TrichXuatLichTrinhNgayHomNay();
  }

  window.addEventListener('dragover', function (SuKien) {
    if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) {
      return;
    }
    if (ThongTinTheGhimDangKeo || document.querySelector('.NhacNhoGhimTrongTkb.DangDuocKeo')) {
      if (KiemTraConTroTrongVungExtension(SuKien)) {
        SuKien.preventDefault();
        if (SuKien.dataTransfer) {
          SuKien.dataTransfer.dropEffect = 'move';
        }
        const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
        if (BangDieuKhien) {
          BangDieuKhien.classList.add('BangDieuKhienNhanXoaThe');
        }
      }
    }
  });

  window.addEventListener('drop', function (SuKien) {
    if (document.querySelector('.TheLoiNhacItemVuong.DangDuocKeo') || ThongTinTheMauDangKeo) {
      return;
    }
    if (ThongTinTheGhimDangKeo || document.querySelector('.NhacNhoGhimTrongTkb.DangDuocKeo')) {
      if (KiemTraConTroTrongVungExtension(SuKien)) {
        XuLyThaXoaTheTkb(SuKien);
      }
    }
  });

  window.addEventListener('dragend', function () {
    ThongTinTheMauDangKeo = null;
    document.body.classList.remove('DangKeoTheGhimTkb');
    const BangDieuKhien = document.getElementById('BangDieuKhienChinh');
    if (BangDieuKhien) {
      BangDieuKhien.classList.remove('BangDieuKhienNhanXoaThe');
    }
    XoaDuongChiViTriTha();
    XoaTrangThaiSanSangNhanCacO();
    setTimeout(function () {
      ThongTinTheGhimDangKeo = null;
    }, 300);
  });

  window.addEventListener('resize', function () {
    CapNhatToanBoChieuCaoCacO(true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', KhoiDongTienIch);
  } else {
    KhoiDongTienIch();
  }
})();
