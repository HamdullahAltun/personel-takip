# Personel Yönetim Sistemi

Bu proje, modern bir personel takip ve yönetim sistemidir. Next.js 16, Prisma (MongoDB), TailwindCSS ve PWA teknolojileri kullanılarak geliştirilmiştir.

## Özellikler

- **Yönetici Paneli (Admin):**
  - Personel ekleme, düzenleme ve silme.
  - QR Kod ile dinamik ofis giriş sistemi.
  - İzin, harcama ve görev yönetimi.
  - Detaylı raporlar ve grafikler.
  - Yapay zeka destekli yönetici özeti (AI Executive Report).

- **Personel Paneli (Mobil Uyumlu):**
  - QR Kod ile giriş/çıkış yapma (Konum doğrulama ile).
  - Profil yönetimi.
  - İzin talebi oluşturma ve takip.
  - Harcama fişi yükleme.
  - Görev takibi.
  - PWA desteği ile mobil uygulama deneyimi (Bildirimler vb.).

## Teknolojiler

- **Frontend:** Next.js 16 (App Router), React, TailwindCSS, Lucide Icons, Recharts.
- **Backend:** Next.js API Routes, Prisma ORM.
- **Veritabanı:** MongoDB.
- **Kimlik Doğrulama:** SMS (Mock) ve JWT tabanlı güvenli oturum.
- **AI:** Google Generative AI (Gemini).
- **Mobil:** PWA & Capacitor (Android APK desteği).

## Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Çevresel Değişkenleri Ayarlayın (.env):**
   - `DATABASE_URL` (MongoDB bağlantı stringi)
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - vb.

3. **Veritabanını Hazırlayın:**
   ```bash
   npx prisma generate
   ```

4. **Uygulamayı Başlatın:**
   ```bash
   npm run dev
   ```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Yönetici Hesabı Oluşturma

İlk yönetici hesabı oluşturmak için veritabanına manuel erişim veya API kullanabilirsiniz. Telefon numarası veritabanında `role: "ADMIN"` olarak ayarlanmalıdır.

---
Geliştirici: Hamdullah Altun
