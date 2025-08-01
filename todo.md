### Teknoloji Seçimi Onayı

Raporda önerilen **React (Frontend)**, **Node.js/Express.js (Backend)** ve **PostgreSQL/PostGIS (Veritabanı)** üçlüsü, projenizin gereksinimleri için **en uygun seçimdir**.

- **React**, modern ve hızlı kullanıcı arayüzleri oluşturmak için endüstri standardıdır.
- **Node.js**, Frontend ile aynı dili (JavaScript) kullanarak geliştirme sürecini hızlandırır.
- **PostgreSQL ve PostGIS eklentisi**, projenizin kalbi olan "en yakın konumu bulma" işlemini veritabanı seviyesinde, son derece performanslı bir şekilde yapmak için biçilmiş kaftandır. Bu iş için özel olarak tasarlanmıştır.

Bu nedenle, rapordaki teknoloji yığınını temel alarak size özel, adım adım bir yapılacaklar listesi hazırladım.

---

### Çalışan-Şube Atama Uygulaması (MVP) Yapılacaklar Listesi

Bu liste, projeyi sıfırdan başlayarak adım adım hayata geçirmeniz için tasarlanmıştır.

#### **Aşama 0: Proje Hazırlığı ve Ortam Kurulumu**

- [ ] **Gerekli Yazılımları Yükle:**
  - [ ] [Node.js](https://nodejs.org/en/) (npm ile birlikte gelir)
  - [ ] [PostgreSQL](https://www.postgresql.org/download/)
  - [ ] [Git](https://git-scm.com/downloads/)
  - [ ] Kod editörü (Örn: [Visual Studio Code](https://code.visualstudio.com/))
- [ ] **PostgreSQL'de PostGIS Eklentisini Aktif Et:**
  - [ ] PostgreSQL'e bağlandıktan sonra `CREATE EXTENSION postgis;` komutunu çalıştırarak coğrafi veri desteğini aktif et.
- [ ] **Proje Klasör Yapısını Oluştur:**
  - [ ] Ana bir proje klasörü oluştur (`calisan-sube-atama`).
  - [ ] İçerisine `backend` ve `frontend` adında iki ayrı klasör oluştur.
  - [ ] Ana klasörde Git reposu başlat (`git init`).

---

#### **Aşama 1: Backend Geliştirme (Node.js, Express.js, PostgreSQL/PostGIS)**

- [ ] **Backend Projesini Başlat:**
  - [ ] `backend` klasörüne gir ve `npm init -y` ile `package.json` dosyasını oluştur.
  - [ ] Google Maps API istemcisini kur: `npm install @googlemaps/google-maps-services-js`
  - [ ] Gerekli npm paketlerini kur: `npm install express pg cors dotenv`
  - [ ] Geliştirme için `nodemon` kur: `npm install -D nodemon`
  - [ ] **`.env` Dosyasını Yapılandır:**
  - [ ] `backend` klasöründe `.env` adında bir dosya oluştur.
  - [ ] İçine `Maps_API_KEY=API_ANAHTARINIZ_BURAYA` satırını ekle.
- [ ] **Veritabanı Tablolarını Oluştur:**
  - [ ] **`subeler` (Branches) tablosu:** `id`, `ad`, `adres`, `konum (GEOGRAPHY türünde)` sütunları.
  - [ ] **`calisanlar` (Employees) tablosu:** `id`, `ad`, `soyad`, `acik_adres (TEXT)`, `konum (GEOGRAPHY)`. `konum` sütunu Geocoding ile doldurulacak.
  - [ ] **`atamalar` (Assignments) tablosu:** `id`, `calisan_id` (calisanlar'a foreign key), `sube_id` (subeler'e foreign key), `atama_tarihi`.
- [ ] **API Uç Noktalarını (Endpoints) Geliştir:**
  - [ ] **Şube Yönetimi:**
    - [ ] `POST /api/subeler` → Yeni şube ekleme.
    - [ ] `GET /api/subeler` → Tüm şubeleri listeleme.
  - [ ] **Çalışan Yönetimi:**
    - [ ] `POST /api/calisanlar` → Yeni çalışan ekleme.
      1.  İstekle birlikte çalışanın adı, soyadı ve **açık adresi** alınır.
      2.  Google Geocoding API kullanılarak bu **açık adres** enlem/boylam koordinatlarına çevirilir.
      3.  Veritabanına hem `acik_adres` hem de Google'dan alınan `konum` bilgisi kaydedilir.
    - [ ] `GET /api/calisanlar` → Tüm çalışanları listeleme.
  - [ ] **Atama Mantığı (Projenin Kalbi):**
    - [ ] `GET /api/calisanlar/:id/en-yakin-subeler?n=5` → Belirli bir çalışana en yakın 'n' adet şubeyi getiren endpoint.
      - _İpucu: Bu endpoint içinde PostGIS'in `ST_Distance` fonksiyonunu kullanarak çalışan konumu ile tüm şubelerin konumları arasındaki mesafeyi hesaplayıp sıralama yapacaksın._
        1.  **Hızlı Filtreleme (PostGIS):** Veritabanındaki çalışanın `konum` bilgisi kullanılarak, PostGIS `ST_Distance` fonksiyonu ile en yakın 'n' adet şube bulunur. Bu, tüm şubeler için Google API'yi çağırmayı önler ve maliyeti düşürür.
        2.  **Detaylandırma (Google Distance Matrix API):** PostGIS ile bulunan 'n' adet şubenin koordinatları ile çalışanın koordinatı, Google Distance Matrix API'ye gönderilir.
        3.  **Zenginleştirilmiş Sonuç:** Google'dan gelen gerçek **yol mesafesi ("distance")** ve **seyahat süresi ("duration")** bilgileri, şube bilgileriyle birleştirilerek frontend'e gönderilir.
    - [ ] `POST /api/atamalar` → Bir çalışanı bir şubeye atayan endpoint.
    - [ ] `GET /api/calisanlar/:id/atamalar` → Bir çalışanın geçmiş atamalarını gösteren endpoint.
- [ ] **Veritabanı Bağlantısını Kur:**
  - [ ] `pg` paketini kullanarak Node.js uygulamasının PostgreSQL veritabanı ile iletişim kurmasını sağla.

---

#### **Aşama 2: Frontend Geliştirme (React)**

- [ ] **React Projesini Başlat:**
  - [ ] Ana dizindeyken `npx create-react-app frontend` komutu ile projeyi oluştur.
  - [ ] `frontend` klasörüne gir ve gerekli paketleri kur: `npm install axios react-router-dom`
- [ ] **Bileşenleri (Components) Oluştur:**
  - [ ] `SubeListesi.js`: Mevcut şubeleri listeleyen bileşen.
  - [ ] `CalisanListesi.js`: Mevcut çalışanları listeleyen bileşen.
  - [ ] `YeniSubeFormu.js`: Sisteme yeni şube eklemek için kullanılacak form.
  - [ ] `YeniCalisanFormu.js`: Sisteme yeni çalışan eklemek için kullanılacak form.
  - [ ] `AtamaPaneli.js`:
    - [ ] Bir çalışanın seçileceği bir dropdown/liste.
    - [ ] "En Yakın Şubeleri Bul" butonu.
    - [ ] Butona basıldığında backend'e istek atıp dönen en yakın şubelerin listelendiği alan.
    - [ ] Her şubenin yanında "Ata" butonu.
    - [ ] Yapılan atamaların geçmişini gösteren bir bölüm.
- [ ] **Sayfa Yapılarını (Routing) Oluştur:**
  - [ ] `react-router-dom` kullanarak farklı sayfalar arasında geçişi sağla (Örn: Ana Sayfa/Atama Paneli, Çalışanlar Sayfası, Şubeler Sayfası).
- [ ] **API Entegrasyonu:**
  - [ ] `axios` kullanarak React bileşenleri içinden backend'de oluşturduğun API uç noktalarına istekler at (veri çekme, veri gönderme).
  - [ ] Form gönderimlerini, liste güncellemelerini ve atama işlemlerini backend'e bağla.

---

#### **Aşama 3: Entegrasyon, Test ve Son Dokunuşlar**

- [ ] **Uçtan Uca Test:**
  - [ ] Arayüzden yeni bir çalışan ve birkaç şube oluştur.
  - [ ] Çalışanı seçip en yakın şubeleri bulma özelliğinin doğru çalıştığını kontrol et.
  - [ ] Listelenen şubelerden birine atama yap ve atamanın kaydedildiğini doğrula.
- [ ] **Hata Yönetimi:**
  - [ ] API'den hata dönmesi durumunda kullanıcıya anlamlı bir mesaj göster (Örn: "Şubeler getirilemedi.").
  - [ ] Formlarda basit doğrulamalar yap (Örn: İsim alanı boş bırakılamaz).
- [ ] **Basit Kimlik Doğrulama:**
  - [ ] Raporda belirtildiği gibi MVP için çok temel bir koruma ekle (örneğin, tüm API isteklerinde sabit bir API anahtarı (`API_KEY`) bekle).
