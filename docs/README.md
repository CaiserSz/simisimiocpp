# Şarj İstasyonu Simülatörü - Dokümantasyon

**Proje:** Şarj İstasyonu Simülatörü  
**Oluşturma Tarihi:** 2025-01-11  
**Son Güncelleme:** 2025-01-11

---

## 📚 Dokümantasyon İndeksi

Bu klasörde şarj istasyonu simülatörü projesine ait tüm detaylı planlama dokümantasyonu bulunmaktadır.

### Ana Dokümantasyon Dosyaları

1. **[DETAILED_PROJECT_PLAN.md](./DETAILED_PROJECT_PLAN.md)**
   - High-level ve low-level mimari tasarım
   - Detaylı sistem bileşenleri
   - Teknik gereksinimler
   - Risk yönetimi
   - Başarı kriterleri
   - **Önerilen Başlangıç:** Bu dosyadan başlayın

2. **[SPRINT_DETAILED_PLANS.md](./SPRINT_DETAILED_PLANS.md)**
   - 3 Sprint'in detaylı planları
   - Hafta bazlı görev dağılımı
   - Görev süreleri ve sorumluluklar
   - Bağımlılıklar ve paralel çalışma fırsatları
   - Sprint başarı kriterleri

3. **[PROJECT_TEAM.md](./PROJECT_TEAM.md)**
   - Proje organizasyon şeması
   - Tüm ekip üyelerinin sorumlulukları
   - Görev dağılımları
   - İletişim matrisi
   - Yetkilendirme matrisi

4. **[ROADMAP.md](./ROADMAP.md)**
   - Güncel yol haritası ve timeline
   - Sprint özetleri
   - İlerleme durumu
   - Önemli tarihler
   - Başarı metrikleri

5. **[SPRINT-1.md](./SPRINT-1.md)**
   - Sprint 1 detayları (mevcut/önceki sprint)
   - Tamamlanan ve devam eden görevler

---

## 🎯 Hızlı Başlangıç

### Projeyi Anlamak İçin:
1. Önce `ROADMAP.md` dosyasını okuyun - Genel bakış için
2. Sonra `DETAILED_PROJECT_PLAN.md` dosyasını inceleyin - Teknik detaylar için
3. `SPRINT_DETAILED_PLANS.md` ile sprint planlarını detaylı inceleyin
4. `PROJECT_TEAM.md` ile ekip yapısını öğrenin

### Geliştirici Olarak Başlamak İçin:
1. `DETAILED_PROJECT_PLAN.md` - Bölüm 3 (Low-Level Teknik Tasarım)
2. `SPRINT_DETAILED_PLANS.md` - İlgili sprint'in haftalık planları
3. `PROJECT_TEAM.md` - Kendi sorumluluklarınızı öğrenin

### Proje Yöneticisi Olarak:
1. `ROADMAP.md` - Timeline ve milestone'lar
2. `SPRINT_DETAILED_PLANS.md` - Detaylı sprint planları
3. `PROJECT_TEAM.md` - Ekip yapısı ve iletişim
4. `DETAILED_PROJECT_PLAN.md` - Risk yönetimi ve başarı kriterleri

---

## 📊 Proje Özeti

### Proje Kapsamı
- **OCPP 1.6J ve OCPP 2.0.1** protokol desteği
- **Çoklu istasyon** simülasyonu ve yönetimi
- **CSMS entegrasyonu** (Central System Management System)
- **Şarj simülasyonu** (araç bağlantı, şarj başlat/durdur)
- **Senaryo profilleri** ve otomasyon
- **Yönetim ve izleme panelleri**

### Teknik Stack
- **Backend:** Node.js, Express.js, MongoDB, Redis
- **Frontend:** React, Material-UI, Recharts
- **Protocols:** OCPP 1.6J, OCPP 2.0.1
- **DevOps:** Docker, Prometheus, Grafana

### Zaman Çizelgesi
- **Sprint 1:** 11.01.2025 - 08.02.2025 (4 hafta)
- **Sprint 2:** 09.02.2025 - 09.03.2025 (4 hafta)
- **Sprint 3:** 10.03.2025 - 06.04.2025 (4 hafta)
- **Toplam:** 12 hafta (3 ay)

---

## 👥 Ekip Yapısı (Özet)

### Yönetim
- Proje Yöneticisi
- Teknik Lider
- DevOps Lead
- QA Lead

### Geliştirme Ekipleri
- **Backend Team:** 11 kişi (1 Lead + 8 Senior + 3 Mid-Level)
- **Frontend Team:** 6 kişi (1 Lead + 3 Senior + 3 Mid-Level)
- **DevOps:** 2 kişi
- **Test:** 3 kişi
- **Dokümantasyon:** 1 kişi

**Toplam:** ~23 kişi

---

## 🎯 Sprint Hedefleri

### Sprint 1: Temel Altyapı
- OCPP 1.6J ve 2.0.1 çekirdeği
- İstasyon yönetimi
- Temel API ve frontend

### Sprint 2: Simülasyon Motoru
- Şarj simülasyonu
- CSMS entegrasyonu
- Senaryo motoru

### Sprint 3: Gelişmiş Özellikler
- İzleme paneli
- Metrikler ve görselleştirme
- Test ve optimizasyon

---

## 📈 İlerleme Takibi

Güncel ilerleme durumu için `ROADMAP.md` dosyasındaki "İlerleme Durumu" bölümüne bakınız.

---

## 🔗 İlgili Kaynaklar

### Proje Dosyaları
- Ana proje: `/workspace`
- Server kodları: `/workspace/server`
- Client kodları: `/workspace/client`
- Test dosyaları: `/workspace/client/cypress`

### Dış Kaynaklar
- [OCPP 1.6J Specification](https://www.openchargealliance.org/)
- [OCPP 2.0.1 Specification](https://www.openchargealliance.org/)

---

## 📝 Dokümantasyon Güncelleme

Bu dokümantasyon proje ilerledikçe güncellenecektir. Her önemli değişiklik için:
1. İlgili dokümantasyon dosyası güncellenir
2. "Son Güncelleme" tarihi güncellenir
3. Versiyon numarası artırılır

---

**Notlar:**
- Tüm tarihler YYYY-MM-DD formatındadır
- Sprint süreleri yaklaşık olup, proje gereksinimlerine göre değişebilir
- Ekip yapısı proje gereksinimlerine göre esnek olarak ayarlanabilir

---

**Dokümantasyon Versiyonu:** 1.0  
**Son Güncelleme:** 2025-01-11