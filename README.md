# Personel Yönetim Sistemi

Bu proje, şirketlerin personel takibini, vardiya yönetimini, LMS (Eğitim), İSG ve performans değerlendirmelerini yapabileceği kapsamlı bir yönetim platformudur.

## Özellikler

- 📅 **Akıllı Vardiya Yönetimi**: AI destekli otomatik vardiya planlama (Groq/Llama 3).
- 🕒 **Yoklama ve Takip**: QR Kod ve Geofence (Coğrafi Sınır) destekli giriş-çıkış takibi.
- 💬 **İç İletişim**: Sosyal duvar, mesajlaşma ve sentiment (duygu) analizi.
- 🏆 **Gamification**: Puan sistemi, rozetler ve ödül marketi.
- 📊 **Yönetici Paneli**: Gerçek zamanlı istatistikler, bütçe takibi ve attrition (işten ayrılma riski) tahmini.
- 📱 **PWA & Mobil**: Capacitor ile iOS ve Android desteği.

## Teknoloji Yığını

- **Framework**: Next.js 15+ (App Router)
- **Veritabanı**: MongoDB & Prisma ORM
- **Styling**: Tailwind CSS 4
- **AI**: Groq SDK (Llama 3), Google Gemini
- **Real-time**: Socket.io
- **Mobil**: Capacitor & PWA
- **Auth**: JWT & Firebase

## Kurulum

1. Depoyu klonlayın.
2. `npm install` ile bağımlılıkları yükleyin.
3. `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli anahtarları girin.
4. `npx prisma generate` ile Prisma istemcisini oluşturun.
5. `npm run dev` ile geliştirme sunucusunu başlatın.

## Katkıda Bulunma

Bir hata bulursanız veya bir özellik eklemek isterseniz lütfen bir issue açın veya pull request gönderin.
