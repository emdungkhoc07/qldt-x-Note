// Thư viện các hàm tiện ích dùng chung: Vẽ biểu đồ tròn Canvas 24h, Âm thanh Web Audio và Tải tệp sao lưu
const ThuVienTienIch = {
  // Tải tệp xuống máy tính của người dùng
  TaiTepVeMay: function (DuLieuBlob, TenTepMacDinh) {
    const DuongDanTam = URL.createObjectURL(DuLieuBlob);
    const TheLienKet = document.createElement('a');
    TheLienKet.href = DuongDanTam;
    TheLienKet.download = TenTepMacDinh;
    document.body.appendChild(TheLienKet);
    TheLienKet.click();
    document.body.removeChild(TheLienKet);
    setTimeout(function () {
      URL.revokeObjectURL(DuongDanTam);
    }, 1500);
  },

  // Chuyển chuỗi thời gian HH:mm sang số thập phân giờ (ví dụ: 07:30 -> 7.5)
  ChuyenChuoiGioSangSoThapPhan: function (ChuoiGio) {
    if (typeof ChuoiGio === 'number') return ChuoiGio;
    if (!ChuoiGio || typeof ChuoiGio !== 'string') return 0;
    const CacPhan = ChuoiGio.split(/[:h]/);
    const Gio = parseFloat(CacPhan[0]) || 0;
    const Phut = parseFloat(CacPhan[1]) || 0;
    return (Gio + (Phut / 60)) % 24;
  },

  // Vẽ biểu đồ tròn đồng hồ thời gian biểu 24h với các khung giờ và chia tỉ lệ diện tích
  VeBieuDoTronThoiGian: function (TheCanvas, DanhSachCongViec) {
    if (!TheCanvas) return;
    const BoVe = TheCanvas.getContext('2d');
    const ChieuRong = TheCanvas.width;
    const ChieuCao = TheCanvas.height;
    const TamX = ChieuRong / 2;
    const TamY = ChieuCao / 2;
    const BanKinhNgoai = Math.min(TamX, TamY) - 26;
    const BanKinhTrong = BanKinhNgoai * 0.48;

    BoVe.clearRect(0, 0, ChieuRong, ChieuCao);

    // 1. Vẽ nền đĩa đồng hồ 24 giờ
    BoVe.beginPath();
    BoVe.arc(TamX, TamY, BanKinhNgoai, 0, Math.PI * 2);
    BoVe.fillStyle = '#f8fafc';
    BoVe.fill();
    BoVe.lineWidth = 1.5;
    BoVe.strokeStyle = '#e2e8f0';
    BoVe.stroke();

    const MauMacDinh = ['#B71C1C', '#1976D2', '#388E3C', '#7CB342', '#F57C00', '#7B1FA2', '#D81B60', '#795548', '#212121', '#616161'];
    let ViTriGioConTro = 7;

    // 2. Vẽ các rẻ quạt diện tích tương ứng các khoảng thời gian công việc
    if (DanhSachCongViec && DanhSachCongViec.length > 0) {
      for (let ChiSoCv = 0; ChiSoCv < DanhSachCongViec.length; ChiSoCv++) {
        const CongViec = DanhSachCongViec[ChiSoCv];
        let GioDau = 0;
        let GioCuoi = 0;

        if (CongViec.GioBatDau && CongViec.GioKetThuc) {
          GioDau = this.ChuyenChuoiGioSangSoThapPhan(CongViec.GioBatDau);
          GioCuoi = this.ChuyenChuoiGioSangSoThapPhan(CongViec.GioKetThuc);
          ViTriGioConTro = GioCuoi;
        } else {
          const SoGio = Number(CongViec.SoGio) || 1;
          GioDau = ViTriGioConTro;
          GioCuoi = (ViTriGioConTro + SoGio) % 24;
          ViTriGioConTro = GioCuoi;
        }

        const MauVe = CongViec.MauSac || MauMacDinh[ChiSoCv % MauMacDinh.length];

        // Vẽ cung vành khuyên từ mốc giờ A đến mốc giờ B trên mặt đồng hồ 24h
        function VeCungVanhKhuyen(Dau, Cuoi) {
          const GocDau = -Math.PI / 2 + (Dau / 24) * (Math.PI * 2);
          const GocCuoi = -Math.PI / 2 + (Cuoi / 24) * (Math.PI * 2);

          BoVe.beginPath();
          BoVe.arc(TamX, TamY, BanKinhNgoai, GocDau, GocCuoi, false);
          BoVe.arc(TamX, TamY, BanKinhTrong, GocCuoi, GocDau, true);
          BoVe.closePath();
          BoVe.fillStyle = MauVe;
          BoVe.fill();
          BoVe.lineWidth = 1.5;
          BoVe.strokeStyle = '#ffffff';
          BoVe.stroke();
        }

        if (GioCuoi > GioDau) {
          VeCungVanhKhuyen(GioDau, GioCuoi);
        } else if (GioCuoi < GioDau) {
          VeCungVanhKhuyen(GioDau, 24);
          VeCungVanhKhuyen(0, GioCuoi);
        }
      }
    }

    // 3. Vẽ các vạch chia giờ và chữ số khung giờ trên đồng hồ 24h
    for (let Gio = 0; Gio < 24; Gio++) {
      const GocGio = -Math.PI / 2 + (Gio / 24) * (Math.PI * 2);
      const LaMocChinh = (Gio % 6 === 0);
      const LaMocPhu = (Gio % 3 === 0);
      const DoDaiVach = LaMocChinh ? 8 : (LaMocPhu ? 5 : 3);
      const DoDayVach = LaMocChinh ? 2 : 1;

      const X1 = TamX + Math.cos(GocGio) * BanKinhNgoai;
      const Y1 = TamY + Math.sin(GocGio) * BanKinhNgoai;
      const X2 = TamX + Math.cos(GocGio) * (BanKinhNgoai + DoDaiVach);
      const Y2 = TamY + Math.sin(GocGio) * (BanKinhNgoai + DoDaiVach);

      BoVe.beginPath();
      BoVe.moveTo(X1, Y1);
      BoVe.lineTo(X2, Y2);
      BoVe.strokeStyle = LaMocChinh ? '#B71C1C' : (LaMocPhu ? '#334155' : '#94a3b8');
      BoVe.lineWidth = DoDayVach;
      BoVe.stroke();

      if (Gio % 2 === 0) {
        const KhoangCachChu = BanKinhNgoai + 16;
        const XChu = TamX + Math.cos(GocGio) * KhoangCachChu;
        const YChu = TamY + Math.sin(GocGio) * KhoangCachChu;

        BoVe.font = LaMocChinh ? 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        BoVe.fillStyle = LaMocChinh ? '#B71C1C' : '#64748b';
        BoVe.textAlign = 'center';
        BoVe.textBaseline = 'middle';
        BoVe.fillText(`${Gio}h`, XChu, YChu);
      }
    }

    // 4. Vẽ vòng tròn tâm đồng hồ
    BoVe.beginPath();
    BoVe.arc(TamX, TamY, BanKinhTrong, 0, Math.PI * 2);
    BoVe.fillStyle = '#ffffff';
    BoVe.fill();
    BoVe.lineWidth = 1.5;
    BoVe.strokeStyle = '#e2e8f0';
    BoVe.stroke();

    // 5. Kim chỉ giờ hiện tại theo thời gian thực
    const ThoiGianHienTai = new Date();
    const GioHienTaiThapPhan = ThoiGianHienTai.getHours() + (ThoiGianHienTai.getMinutes() / 60);
    const GocKimHienTai = -Math.PI / 2 + (GioHienTaiThapPhan / 24) * (Math.PI * 2);

    const KimX = TamX + Math.cos(GocKimHienTai) * (BanKinhNgoai + 2);
    const KimY = TamY + Math.sin(GocKimHienTai) * (BanKinhNgoai + 2);

    BoVe.beginPath();
    BoVe.moveTo(TamX, TamY);
    BoVe.lineTo(KimX, KimY);
    BoVe.strokeStyle = '#B71C1C';
    BoVe.lineWidth = 2;
    BoVe.stroke();

    BoVe.beginPath();
    BoVe.arc(KimX, KimY, 3.5, 0, Math.PI * 2);
    BoVe.fillStyle = '#B71C1C';
    BoVe.fill();

    BoVe.beginPath();
    BoVe.arc(TamX, TamY, 4, 0, Math.PI * 2);
    BoVe.fillStyle = '#B71C1C';
    BoVe.fill();

    const ChuoiGioHienTai = ThoiGianHienTai.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    BoVe.fillStyle = '#B71C1C';
    BoVe.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    BoVe.textAlign = 'center';
    BoVe.textBaseline = 'middle';
    BoVe.fillText(ChuoiGioHienTai, TamX, TamY - 6);

    BoVe.fillStyle = '#64748b';
    BoVe.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    BoVe.fillText('Đồng hồ 24h', TamX, TamY + 11);
  },

  // Phát âm thanh chuông báo thức thông qua Web Audio API không cần nạp tệp ngoài
  PhatAmThanhBaoThuc: function () {
    try {
      const BoPhatAmThanh = new (window.AudioContext || window.webkitAudioContext)();
      const DanhSachNotNhac = [
        { TanSo: 659.25, ThoiGian: 0.0, DoDai: 0.3 },
        { TanSo: 830.61, ThoiGian: 0.35, DoDai: 0.3 },
        { TanSo: 987.77, ThoiGian: 0.7, DoDai: 0.5 }
      ];

      for (let ChiSoNot = 0; ChiSoNot < DanhSachNotNhac.length; ChiSoNot++) {
        const NotHienTai = DanhSachNotNhac[ChiSoNot];
        const DaoDong = BoPhatAmThanh.createOscillator();
        const BoKuechDai = BoPhatAmThanh.createGain();

        DaoDong.type = 'sine';
        DaoDong.frequency.setValueAtTime(NotHienTai.TanSo, BoPhatAmThanh.currentTime + NotHienTai.ThoiGian);

        BoKuechDai.gain.setValueAtTime(0.001, BoPhatAmThanh.currentTime + NotHienTai.ThoiGian);
        BoKuechDai.gain.exponentialRampToValueAtTime(0.3, BoPhatAmThanh.currentTime + NotHienTai.ThoiGian + 0.05);
        BoKuechDai.gain.exponentialRampToValueAtTime(0.0001, BoPhatAmThanh.currentTime + NotHienTai.ThoiGian + NotHienTai.DoDai);

        DaoDong.connect(BoKuechDai);
        BoKuechDai.connect(BoPhatAmThanh.destination);

        DaoDong.start(BoPhatAmThanh.currentTime + NotHienTai.ThoiGian);
        DaoDong.stop(BoPhatAmThanh.currentTime + NotHienTai.ThoiGian + NotHienTai.DoDai);
      }
    } catch (LoiPhatAm) {
      console.warn('Không thể phát âm thanh báo thức:', LoiPhatAm);
    }
  }
};

// Đăng ký toàn cục cho môi trường trình duyệt và tiện ích mở rộng
if (typeof window !== 'undefined') {
  window.ThuVienTienIch = ThuVienTienIch;
}
if (typeof globalThis !== 'undefined') {
  globalThis.ThuVienTienIch = ThuVienTienIch;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThuVienTienIch;
}
