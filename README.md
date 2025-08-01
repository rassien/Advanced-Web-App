# Çalışan-Şube Atama Uygulaması

Modern web teknolojileri kullanılarak geliştirilmiş akıllı çalışan-şube atama sistemi. PostgreSQL/PostGIS ile coğrafi hesaplamalar ve Google Maps API entegrasyonu.

## 🚀 Teknoloji Stack

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - İlişkisel veritabanı
- **PostGIS** - Coğrafi veri uzantısı
- **Google Maps API** - Geocoding ve mesafe hesaplama
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifre şifreleme

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **React Query** - Server state yönetimi
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form yönetimi
- **React Hot Toast** - Bildirimler

## 📋 Özellikler

### 🔐 Kullanıcı Yönetimi
- Güvenli kayıt ve giriş sistemi
- JWT tabanlı kimlik doğrulama
- Şifre şifreleme (bcrypt)

### 👥 Çalışan Yönetimi
- Çalışan bilgilerini kaydetme
- Adres bazlı otomatik geocoding
- Toplu çalışan ekleme (Excel)
- TCKN doğrulama

### 🏢 Şube Yönetimi
- Şube bilgilerini kaydetme
- Konum bazlı şube ekleme
- Norm kadro yönetimi
- Toplu şube ekleme (Excel)

### 🎯 Akıllı Atama Sistemi
- **PostGIS Tabanlı Hesaplama**: En yakın şubeleri bul
- **Google Distance Matrix**: Gerçek yol mesafesi ve süre
- **Otomatik Optimizasyon**: Kapasiteye göre atama
- **Kısıtlı Atama**: Maksimum mesafe kontrolü

### 📊 Analiz ve Raporlama
- Mesafe ve süre analizi
- Atama geçmişi takibi
- Excel export özelliği
- Görsel dashboard

## 🗄️ Veritabanı Şeması

```sql
-- PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches table (Şubeler)
CREATE TABLE subeler (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(255) NOT NULL,
  adres TEXT NOT NULL,
  konum GEOMETRY(POINT, 4326),
  norm_kadro INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table (Çalışanlar)
CREATE TABLE calisanlar (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(255) NOT NULL,
  soyad VARCHAR(255) NOT NULL,
  tckn VARCHAR(11) UNIQUE,
  acik_adres TEXT NOT NULL,
  konum GEOMETRY(POINT, 4326),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table (Atamalar)
CREATE TABLE atamalar (
  id SERIAL PRIMARY KEY,
  calisan_id INTEGER REFERENCES calisanlar(id) ON DELETE CASCADE,
  sube_id INTEGER REFERENCES subeler(id) ON DELETE CASCADE,
  mesafe DECIMAL(10,2),
  sure INTEGER,
  atama_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(calisan_id, sube_id)
);
```

## 🔧 Kurulum

### Gereksinimler
- Node.js (v16+)
- PostgreSQL (v13+)
- PostGIS extension
- Google Maps API key

### 1. Repository'yi klonlayın
```bash
git clone <repository-url>
cd calisan-sube-atama
```

### 2. Dependencies yükleyin
```bash
npm run install:all
```

### 3. Veritabanı kurulumu
```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Veritabanı oluşturun
CREATE DATABASE calisan_sube_db;

# PostGIS extension'ı aktifleştirin
\c calisan_sube_db
CREATE EXTENSION postgis;
```

### 4. Environment variables
Backend `.env` dosyası:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/calisan_sube_db
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 5. Veritabanı tablolarını oluşturun
```bash
cd backend
node database-init.js
```

### 6. Uygulamayı başlatın
```bash
# Geliştirme modunda (hem backend hem frontend)
npm run dev

# Sadece backend
npm run backend:dev

# Sadece frontend
npm run frontend:dev
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/verify` - Token doğrulama

### Employees
- `GET /api/calisanlar` - Tüm çalışanları listele
- `POST /api/calisanlar` - Yeni çalışan ekle
- `GET /api/calisanlar/:id` - Çalışan detayı
- `PUT /api/calisanlar/:id` - Çalışan güncelle
- `DELETE /api/calisanlar/:id` - Çalışan sil
- `POST /api/calisanlar/bulk` - Toplu çalışan ekleme
- `GET /api/calisanlar/:id/en-yakin-subeler` - En yakın şubeleri bul

### Branches
- `GET /api/subeler` - Tüm şubeleri listele
- `POST /api/subeler` - Yeni şube ekle
- `GET /api/subeler/:id` - Şube detayı
- `PUT /api/subeler/:id` - Şube güncelle
- `DELETE /api/subeler/:id` - Şube sil
- `POST /api/subeler/bulk` - Toplu şube ekleme

### Assignments
- `GET /api/atamalar` - Tüm atamaları listele
- `POST /api/atamalar` - Yeni atama oluştur
- `DELETE /api/atamalar/:id` - Atama sil
- `GET /api/atamalar/calisan/:id` - Çalışanın atamalarını listele
- `POST /api/atamalar/bulk-optimize` - Otomatik toplu atama

## 🗺️ PostGIS Sorguları

### En yakın şubeleri bulma
```sql
SELECT 
  s.id,
  s.ad,
  s.adres,
  ST_Distance(
    ST_Transform(c.konum, 3857),
    ST_Transform(s.konum, 3857)
  ) / 1000 AS distance_km
FROM subeler s
CROSS JOIN calisanlar c
WHERE c.id = $1 
  AND s.konum IS NOT NULL 
  AND c.konum IS NOT NULL
  AND s.norm_kadro > 0
ORDER BY ST_Distance(c.konum, s.konum)
LIMIT $2;
```

## 🚀 Production Deployment

### Docker ile deploy
```bash
# Docker images oluştur
docker build -t calisan-sube-backend ./backend
docker build -t calisan-sube-frontend ./frontend

# Docker Compose ile çalıştır
docker-compose up -d
```

### Manuel deploy
```bash
# Production build
npm run build

# Backend'i başlat
cd backend
npm start
```

## 🧪 Testing

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilirsiniz.

---

**Geliştirici**: SuperClaude AI Framework  
**Versiyon**: 1.0.0  
**Son Güncelleme**: 2024