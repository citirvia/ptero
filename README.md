# Ptero

Ptero, Discord botları ve Node.js/Python uygulamaları için geliştirilen bir sunucu yönetim panelidir. Pterodactyl Panel ve Wings API'leriyle entegre çalışarak sunucu oluşturma, yönetme ve izleme işlemlerini tek bir arayüz üzerinden sunar.

## Özellikler

- Gerçek zamanlı WebSocket konsolu ve kaynak izleme
- Sunucu oluşturma, başlatma, durdurma ve yeniden başlatma
- Dosya yönetimi ve dosya düzenleme
- Veritabanı oluşturma ve parola yenileme
- Yedekleme, geri yükleme ve indirme
- Zamanlanmış görev ve deployment yönetimi
- Kullanıcı, oturum, bildirim ve destek yönetimi
- Admin paneli, audit logları ve rol tabanlı yetkilendirme

## Mimari

Frontend, Next.js tabanlı bir dashboard sunar. Fastify ve TypeScript ile geliştirilen Backend-for-Frontend katmanı, Pterodactyl Panel ve Wings API'leriyle iletişim kurar. Pterodactyl API anahtarları yalnızca backend tarafında tutulur.

Uygulamaya ait kullanıcı, oturum, API anahtarı, bildirim ve audit log verileri PostgreSQL üzerinde Prisma ORM kullanılarak saklanır.

## Teknolojiler

- TypeScript
- Next.js ve React
- Node.js ve Fastify
- PostgreSQL ve Prisma
- WebSocket
- TanStack Query ve Zustand
- Zod
- Docker
- Pterodactyl API

## Kurulum

### Frontend

```bash
npm install
npm run dev
```

Frontend'i `http://localhost:3000` adresinden açabilirsiniz.

Backend bağlantısını etkinleştirmek için `.env.local` dosyasına API adresini ekleyin:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend için gerekli ortam değişkenleri:

```env
PTERO_PANEL_URL=
PTERO_APP_KEY=
PTERO_CLIENT_KEY=
JWT_SECRET=
DATABASE_URL=
ENCRYPTION_KEY=
CORS_ORIGIN=http://localhost:3000
```

PostgreSQL'i Docker ile başlatmak ve veritabanı şemasını uygulamak için:

```bash
docker compose up -d postgres
npm run prisma:deploy
```

## Test

Frontend testlerini çalıştırmak için:

```bash
npm test
```

Backend testlerini çalıştırmak için:

```bash
cd backend
npm test
```
