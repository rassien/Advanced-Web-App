---

### **Güncellenmiş Çalışan-Şube Atama Uygulaması Yapılacaklar Listesi**

#### **Aşama 0: Proje Hazırlığı ve Ortam Kurulumu (Güncellendi)**

- [ ] **Gerekli Yazılımları Yükle:** (Bu adım aynı kalıyor)
    - [ ] Node.js, PostgreSQL, Git, VS Code
- [ ] **PostgreSQL'de PostGIS Eklentisini Aktif Et:** (Bu adım aynı kalıyor)
    - [ ] `CREATE EXTENSION postgis;` komutunu çalıştır.
- [ ] **Google Maps API Anahtarı Al (Yeni Adım):**
    - [ ] [Google Cloud Console](https://console.cloud.google.com/)'a gidin ve bir proje oluşturun.
    - [ ] Projeniz için aşağıdaki API'leri etkinleştirin:
        - [ ] **Geocoding API:** Açık adresleri enlem/boylam koordinatlarına çevirmek için.
        - [ ] **Distance Matrix API:** Bir başlangıç noktası ile birden çok varış noktası arasındaki gerçek yol mesafesini ve seyahat süresini hesaplamak için.
        - [ ] **Maps JavaScript API:** Konumları harita üzerinde görselleştirmek için (Frontend'de kullanılacak).
    - [ ] API anahtarınızı (API Key) oluşturun ve güvenli bir yere not edin.
- [ ] **Proje Klasör Yapısını Oluştur:** (Bu adım aynı kalıyor)
    - [ ] Ana klasör (`calisan-sube-atama`) ve içinde `backend`, `frontend` klasörleri.
    - [ ] `git init` ile Git reposu başlatma.

---

#### **Aşama 1: Backend Geliştirme (Node.js, Express.js) (Güncellendi)**

- [ ] **Backend Projesini Başlat ve Paketleri Kur:**
  - [ ] `npm init -y`
  - [ ] Gerekli npm paketlerini kur: `npm install express pg cors dotenv`
  - [ ] **Yeni Paket:** Google Maps API istemcisini kur: `npm install @googlemaps/google-maps-services-js`
  - [ ] Geliştirme için `nodemon` kur: `npm install -D nodemon`
- [ ] **`.env` Dosyasını Yapılandır:**
  - [ ] `backend` klasöründe `.env` adında bir dosya oluştur.
  - [ ] İçine `Maps_API_KEY=API_ANAHTARINIZ_BURAYA` satırını ekle.
- [ ] **Veritabanı Tablolarını Oluştur:** (Yapı aynı, kullanım amacı netleşti)
  - [ ] `subeler` tablosu: `id`, `ad`, `adres`, `konum (GEOGRAPHY)`.
  - [ ] `calisanlar` tablosu: `id`, `ad`, `soyad`, `acik_adres (TEXT)`, `konum (GEOGRAPHY)`. `konum` sütunu Geocoding ile doldurulacak.
  - [ ] `atamalar` tablosu: `id`, `calisan_id`, `sube_id`, `atama_tarihi`.
- [ ] **API Uç Noktalarını (Endpoints) Geliştir (Mantık Değişikliği):**
  - [ ] **Şube Yönetimi:** (`POST /api/subeler`, `GET /api/subeler`) - Bu kısım aynı.
  - [ ] **Çalışan Yönetimi (Güncellendi):**
    - [ ] `POST /api/calisanlar` → **Yeni Mantık:**
      1.  İstekle birlikte çalışanın adı, soyadı ve **açık adresi** alınır.
      2.  Google Geocoding API kullanılarak bu **açık adres** enlem/boylam koordinatlarına çevirilir.
      3.  Veritabanına hem `acik_adres` hem de Google'dan alınan `konum` bilgisi kaydedilir.
  - [ ] **Atama Mantığı (Güncellendi ve Güçlendirildi):**
    - [ ] `GET /api/calisanlar/:id/en-yakin-subeler?n=5` → **Yeni Mantık:**
      1.  **Hızlı Filtreleme (PostGIS):** Veritabanındaki çalışanın `konum` bilgisi kullanılarak, PostGIS `ST_Distance` fonksiyonu ile en yakın 'n' adet şube bulunur. Bu, tüm şubeler için Google API'yi çağırmayı önler ve maliyeti düşürür.
      2.  **Detaylandırma (Google Distance Matrix API):** PostGIS ile bulunan 'n' adet şubenin koordinatları ile çalışanın koordinatı, Google Distance Matrix API'ye gönderilir.
      3.  **Zenginleştirilmiş Sonuç:** Google'dan gelen gerçek **yol mesafesi ("distance")** ve **seyahat süresi ("duration")** bilgileri, şube bilgileriyle birleştirilerek frontend'e gönderilir.

---

#### **Aşama 2: Frontend Geliştirme (React) (Güncellendi)**

- [ ] **React Projesini Başlat ve Paketleri Kur:**
  - [ ] `npx create-react-app frontend`
  - [ ] `npm install axios react-router-dom`
  - [ ] **Yeni Paket:** Harita entegrasyonu için: `npm install @react-google-maps/api`
- [ ] **Bileşenleri (Components) Oluştur (Güncellendi):**
  - [ ] `YeniCalisanFormu.js`: Artık enlem/boylam yerine `Açık Adres` girmek için bir metin alanı içerecek.
  - [ ] `AtamaPaneli.js`:
    - [ ] Backend'den gelen en yakın şubeleri listelerken artık şu formatta gösterecek: "Şube Adı - **Mesafe: 12 km** - **Tahmini Süre: 18 dakika**".
  - [ ] **Yeni Bileşen:** `HaritaGorunumu.js`:
    - [ ] `@react-google-maps/api` kullanarak bir harita bileşeni oluşturulacak.
    - [ ] Seçilen çalışanın konumu ve en yakın şubelerin konumları harita üzerinde işaretçi (marker) olarak gösterilecek. Bu, raporda belirtilen "Harita Entegrasyonu" adımını MVP'ye dahil etmemizi sağlar.
- [ ] **API Entegrasyonu:**
  - [ ] `axios` ile backend'in güncellenmiş API'lerine istek atılacak ve gelen zenginleştirilmiş veri (mesafe, süre) arayüzde gösterilecek.

---

#### **Aşama 3: Entegrasyon, Test ve Son Dokunuşlar**

- [ ] Bu aşamadaki adımlar genel olarak aynı kalmakla birlikte, test senaryoları güncellenmelidir:
  - [ ] Arayüzden **açık adres** girerek yeni bir çalışan oluştur.
  - [ ] Veritabanında çalışanın `konum` sütununun Geocoding ile doğru bir şekilde dolduğunu kontrol et.
  - [ ] "En Yakın Şubeleri Bul" butonuna basıldığında gelen listede **gerçek yol mesafesi ve süre** bilgilerinin göründüğünü doğrula.
  - [ ] Haritanın doğru konumları gösterdiğini kontrol et.
