# 📋 Çalışan-Şube Atama Sistemi - Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Sistem Gereksinimleri
- ✅ **PostgreSQL** kurulu ve çalışır durumda
- ✅ **Node.js** (v16 veya üstü)
- ✅ **Google Maps API** anahtarı

### 2. Kurulum ve Başlatma

#### Adım 1: Database Hazırlığı
```bash
# PostgreSQL'e bağlan ve database oluştur (zaten yapıldı)
# PostGIS extension'ı aktifleştir (zaten yapıldı)
```

#### Adım 2: Uygulamayı Başlat
```bash
# Kolay yol: Batch script kullan
start-dev.bat

# Manuel yol:
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm start
```

#### Adım 3: Tarayıcıda Aç
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Adım Adım Kullanım

### 1. 👤 Kullanıcı Kaydı ve Giriş

1. **Kayıt Ol**: http://localhost:3000/register
   - Kullanıcı adı (en az 3 karakter)
   - Şifre (en az 6 karakter)

2. **Giriş Yap**: http://localhost:3000/login
   - Kayıt olduğunuz bilgilerle giriş yapın

### 2. 🏢 Şube Yönetimi

#### Manuel Şube Ekleme:
1. **Şubeler** sayfasına git
2. **"Yeni Şube"** butonuna tıkla
3. Bilgileri doldur:
   - Şube adı
   - Tam adres (Google Maps tarafından geocoding yapılacak)
   - Norm kadro (kapasite)

#### Toplu Şube Ekleme:
1. **"Excel Yükle"** butonuna tıkla
2. Excel dosyasında şu sütunlar olmalı:
   - `ad`: Şube adı
   - `adres`: Tam adres
   - `norm_kadro`: Kapasite sayısı

### 3. 👥 Çalışan Yönetimi

#### Manuel Çalışan Ekleme:
1. **Çalışanlar** sayfasına git
2. **"Yeni Çalışan"** butonuna tıkla
3. Bilgileri doldur:
   - Ad, Soyad
   - TCKN (opsiyonel)
   - Tam adres (önemli: detaylı adres verin)

#### Toplu Çalışan Ekleme:
1. **"Excel Yükle"** butonuna tıkla
2. Excel dosyasında şu sütunlar olmalı:
   - `ad`: Çalışan adı
   - `soyad`: Çalışan soyadı
   - `acik_adres`: Tam adres
   - `tckn`: TC Kimlik No (opsiyonel)

### 4. 🎯 Mesafe Analizi ve Atama

#### Tekli Analiz:
1. **Analiz** sayfasına git
2. **Çalışan seç** (dropdown'dan)
3. **Şube sayısı** belirle (3, 5, 10)
4. **Maksimum mesafe** ayarla (km)
5. **"Analiz Yap"** butonuna tıkla

#### Toplu Atama:
1. **Atama stratejisi** seç:
   - En yakın şube öncelikli
   - Kapasite dengeleyici
   - Hibrit (mesafe + kapasite)
2. **Maksimum mesafe** belirle
3. **"Toplu Atama Yap"** butonuna tıkla

### 5. 📊 Atama Yönetimi

1. **Atamalar** sayfasından:
   - Mevcut atamaları görüntüle
   - Excel'e aktarım yap
   - Atama geçmişini incele

## 🔧 Teknik Detaylar

### Mesafe Hesaplama Algoritması

1. **PostGIS Ön Filtreleme**:
   ```sql
   ST_Distance(ST_Transform(calisan_konum, 3857), ST_Transform(sube_konum, 3857)) / 1000
   ```
   - Hızlı kuş uçuşu mesafe hesaplama
   - En yakın N şubeyi bulma

2. **Google Distance Matrix**:
   - Gerçek yol mesafesi
   - Tahmini seyahat süresi
   - Trafik durumu dahil

3. **Akıllı Atama**:
   - Şube kapasitesi kontrolü
   - Mesafe optimizasyonu
   - Adil dağıtım algoritması

### API Endpoints

```bash
# Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify

# Çalışanlar
GET    /api/calisanlar
POST   /api/calisanlar
POST   /api/calisanlar/bulk
GET    /api/calisanlar/:id/en-yakin-subeler

# Şubeler  
GET    /api/subeler
POST   /api/subeler
POST   /api/subeler/bulk

# Atamalar
GET    /api/atamalar
POST   /api/atamalar
POST   /api/atamalar/bulk-optimize
```

## 🐛 Sorun Giderme

### Database Bağlantı Sorunu
```bash
# PostgreSQL çalışıyor mu kontrol et
pg_isready -h localhost -p 5432

# Şifre kontrolü
psql -h localhost -U postgres -d calisan_sube_db
```

### Geocoding Sorunu
- Google Maps API anahtarının geçerli olduğundan emin olun
- API key'in Geocoding ve Distance Matrix servislerine erişimi olmalı
- Adres bilgilerinin detaylı olduğundan emin olun

### Frontend Bağlantı Sorunu
- Backend server'ının çalıştığından emin olun (http://localhost:5000)
- CORS ayarlarını kontrol edin
- Browser Developer Tools'da network tab'ını inceleyin

## 📈 Performans İpuçları

1. **Şube Sayısı**: 100+ şube için iyi performans
2. **Çalışan Sayısı**: 1000+ çalışan için optimize edildi
3. **Geocoding**: Toplu işlemlerde rate limiting uygulanır
4. **Database**: PostGIS spatial indexing ile hızlı sorgular

## 🔒 Güvenlik

- JWT token ile authentication
- bcryptjs ile şifre şifreleme
- SQL injection koruması
- Rate limiting
- CORS ayarları

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Database loglarını kontrol edin
2. Browser console'u inceleyin  
3. API response'ları kontrol edin
4. README.md dosyasındaki detaylı bilgileri okuyun

---

**Geliştirme Sürümü**: v1.0.0  
**Son Güncelleme**: 2024  
**Teknoloji**: React + Node.js + PostgreSQL/PostGIS