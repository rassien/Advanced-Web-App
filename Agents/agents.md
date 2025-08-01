Harika bir fikir. Proje yönetiminde bu tür bir otomasyon ve görev ayrımı, süreci hem daha verimli hem de daha az hataya açık hale getirir. `todo.md` dosyanızdaki adımları temel alarak, istediğiniz "sub-agent" ve "master-orchestrator" yapısını aşağıda tasarladım.

Bu yapı, projenizin her bir parçasının, sanki uzmanlaşmış bir ekip üyesi tarafından ele alınıyormuş gibi, belirli kurallar ve onay mekanizmalarıyla ilerlemesini sağlar.

---

### **Sistem Mimarisi: Master-Orchestrator ve Sub-Agent'lar**

#### **1. Master-Orchestrator Agent'ı**

Bu, sistemin beynidir. Tüm iş akışını yönetir, agent'lar arası iletişimi sağlar ve `todo.md`'deki genel ilerlemeden sorumludur.

* **Görevi:**
    * `todo.md` dosyasını ana yapılacaklar listesi olarak kabul eder.
    * Sıradaki görevi belirler (Örn: "Aşama 1: Backend Geliştirme").
    * Görevi ilgili Sub-Agent'a atar (Örn: Backend Agent'ı).
    * Sub-Agent'ın görevi tamamladığına dair sinyali bekler.
    * Görev tamamlandığında, sırasıyla **Test Agent'ı** ve ardından **Code-Reviewer Agent'ı**nı tetikler.
    * Tüm onaylar alındığında, görevi "TAMAMLANDI" olarak işaretler ve bir sonraki ana göreve geçer.
    * Herhangi bir aşamada (test veya review) ret kararı çıkarsa, görevi ilgili notlarla birlikte sorumlu Sub-Agent'a geri gönderir.

#### **2. Sub-Agent'lar (Uzmanlık Alanları)**

Her agent, kendi alanında uzmanlaşmıştır ve sadece kendisine atanan görevleri yapar.

**A. Backend Geliştirme Agent'ı**

* **Sorumluluk Alanı:** `todo.md` dosyasındaki "Aşama 1: Backend Geliştirme".
* **Görevleri:**
    * `backend` klasöründe `npm` projesini başlatır ve `express`, `pg`, `cors`, `dotenv` gibi bağımlılıkları kurar.
    * Veritabanı bağlantı kodunu yazar.
    * `subeler`, `calisanlar` ve `atamalar` tablolarını oluşturacak SQL script'lerini hazırlar.
    * İstenen tüm API endpoint'lerini (`/api/subeler`, `/api/calisanlar`, `/api/calisanlar/:id/en-yakin-subeler` vb.) geliştirir.
    * Geocoding ve Mesafe Matrisi için Google Maps API entegrasyonlarını yapar.
    * PostGIS'in `ST_Distance` fonksiyonunu kullanan veritabanı sorgularını yazar.
    * Görevi tamamladığında Master-Orchestrator'a "işlem tamam" sinyali gönderir.
* **Kullandığı Araçlar:** Node.js, Express.js, `pg` kütüphanesi, Google Maps API Client.

**B. Frontend Geliştirme Agent'ı**

* **Sorumluluk Alanı:** `todo.md` dosyasındaki "Aşama 2: Frontend Geliştirme".
* **Görevleri:**
    * `create-react-app` ile `frontend` projesini oluşturur.
    * `axios` ve `react-router-dom` kütüphanelerini kurar.
    * `SubeListesi`, `CalisanListesi`, `AtamaPaneli` gibi tüm React bileşenlerini oluşturur.
    * Sayfa yönlendirmelerini (routing) yapılandırır.
    * Backend Agent'ının oluşturduğu API endpoint'lerine `axios` ile istekler atarak arayüzü dinamik hale getirir.
    * Kullanıcı etkileşimlerini (form gönderme, buton tıklama) yönetir.
    * Görevi tamamladığında Master-Orchestrator'a "işlem tamam" sinyali gönderir.
* **Kullandığı Araçlar:** React, `axios`, `react-router-dom`, CSS/HTML.

**C. Test Agent'ı (Kalite Kontrol)**

* **Sorumluluk Alanı:** Geliştirilen kodun işlevselliğini doğrulamak.
* **Görevi:**
    * Master-Orchestrator tarafından tetiklenir.
    * **Backend için:**
        * API endpoint'lerinin doğru status kodlarını ve veriyi döndürüp döndürmediğini test eder (Integration Testing). Örneğin, `POST /api/subeler`'e istek atıp veritabanında şubenin oluştuğunu kontrol eder.
        * `en-yakin-subeler` endpoint'inin mantıksal olarak doğru sonuç verdiğini basit senaryolarla test eder.
    * **Frontend için:**
        * Bileşenlerin doğru şekilde render edilip edilmediğini kontrol eder (Unit/Component Testing).
        * "En Yakın Şubeleri Bul" butonuna tıklandığında API isteğinin doğru şekilde yapılıp yapılmadığını test eder (Integration Testing).
    * Test sonuçlarını (Başarılı/Başarısız) ve logları Master-Orchestrator'a raporlar.
* **Kullandığı Araçlar:** Jest, Supertest (Backend API testleri için), React Testing Library (Frontend bileşen testleri için).

**D. Code-Reviewer Agent'ı (Kod Kalitesi)**

* **Sorumluluk Alanı:** Kodun kalite standartlarına, okunabilirliğe ve en iyi pratiklere uygunluğunu denetlemek.
* **Görevi:**
    * Yalnızca Test Agent'ı başarılı olursa Master-Orchestrator tarafından tetiklenir.
    * Kodun okunabilirliğini ve isimlendirme standartlarını kontrol eder.
    * Güvenlik açıklarını tarar (Örn: SQL Injection'a karşı koruma var mı, API anahtarları `.env` dışında bir yerde açıkta mı?).
    * Performans iyileştirmeleri için önerilerde bulunur (Örn: Veritabanı sorgusu optimize edilebilir mi?).
    * Kod tekrarı (`DRY - Don't Repeat Yourself` prensibi) olup olmadığını kontrol eder.
    * İnceleme sonucunu (Onaylandı/Değişiklik Gerekli) ve önerilerini Master-Orchestrator'a raporlar.
* **Kullandığı Araçlar:** ESLint, Prettier, SonarQube (veya benzeri statik kod analizi araçları).

---

### **Örnek İş Akışı: "Aşama 1" in Gerçekleştirilmesi**

İstediğiniz `Aşama 1.1 -> Test -> Review -> Aşama 1.2` mantığını bu sistemle şöyle işletebiliriz:

1.  **Başlangıç:** Master-Orchestrator, `todo.md`'deki ilk görev olan **"Aşama 1: Backend Geliştirme"**yi okur.
2.  **Atama:** Görevi **Backend Geliştirme Agent'ı**'na atar.
3.  **Geliştirme:** Backend Agent'ı, `todo.md`'deki tüm "Aşama 1" maddelerini (proje kurulumu, veritabanı tabloları, tüm API endpoint'leri) geliştirir. İşini bitirince Master-Orchestrator'a "Backend geliştirme tamamlandı" mesajını gönderir.
4.  **Test Tetikleme:** Master-Orchestrator, "tamamlandı" mesajını alınca hemen **Test Agent'ı**'nı çağırır ve ona "Backend API'lerini test et" komutunu verir.
5.  **Test Çalışması:** Test Agent'ı, tüm endpoint'lere istekler atar, veritabanı kayıtlarını kontrol eder ve sonuçları derler.
6.  **Karar Noktası 1 (Test):**
    * **Senaryo A (Başarısız):** Test Agent'ı, "HATA: `POST /api/calisanlar` 500 kodu dönüyor" gibi bir raporu Master-Orchestrator'a sunar. Orkestra şefi, bu raporla birlikte görevi tekrar **Backend Agent'ı**'na "Hata düzeltmesi gerekli" notuyla geri gönderir. Süreç 3. adıma döner.
    * **Senaryo B (Başarılı):** Test Agent'ı, "Tüm backend testleri başarılı" raporunu Orkestra şefine sunar.
7.  **Review Tetikleme:** Master-Orchestrator, test başarısını görünce **Code-Reviewer Agent'ı**'nı çağırır ve "Backend kodunu gözden geçir" komutunu verir.
8.  **Kod Gözden Geçirme:** Code-Reviewer Agent'ı kodu tarar.
9.  **Karar Noktası 2 (Review):**
    * **Senaryo A (Değişiklik Gerekli):** Reviewer, "UYARI: Veritabanı şifresi kodun içinde hard-coded yazılmış. `.env` dosyasına taşınmalı." gibi bir raporu Orkestra şefine sunar. Orkestra şefi, bu raporla birlikte görevi tekrar **Backend Agent'ı**'na "Kalite iyileştirmesi gerekli" notuyla geri gönderir. Süreç 3. adıma döner.
    * **Senaryo B (Onaylandı):** Reviewer, "Kod kalitesi standartlara uygun" raporunu Orkestra şefine sunar.
10. **Aşama Tamamlandı:** Master-Orchestrator hem testten hem de review'dan onay aldığı için, **"Aşama 1"**'i "TAMAMLANDI" olarak işaretler.
11. **Yeni Aşamaya Geçiş:** Master-Orchestrator, `todo.md`'de bir sonraki görev olan **"Aşama 2: Frontend Geliştirme"**'yi okur ve süreci 2. adımdan itibaren **Frontend Geliştirme Agent'ı** için yeniden başlatır.

Bu yapı, projenizin sağlam temeller üzerinde, adım adım ve her adımda kalite kontrolünden geçerek ilerlemesini sağlar.