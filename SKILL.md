---
name: deha-video
description: Bir projeyi, modülü, özelliği ya da işi kod tabanından doğrulayıp seslendirmeli tanıtım/anlatım videosuna (HTML animasyon → gerçek MP4) çevirir; Google AI Studio (Gemini TTS) anahtarını saklar ve kullanır. Kullanıcı "video yap", "tanıtım videosu", "bunu videolaştır", "reels/shorts/dikey video", "modül tanıtımı", "seslendirmeli video", "/deha-video" dediğinde ya da var olan bir deha-video filmini revize ettirmek (ses değiştir, metni düzelt, yeniden render) istediğinde kullan. Başlamadan önce süre, ekran oranı, üretim modeli ve ses gibi seçimleri kullanıcıya sorar.
---

# deha-video — projeyi doğrula, videoya çevir

Bu skill tek bir işi yapar: gerçek bir ürünün ya da işin **gerçekten var olan** yanlarını bulur, teknik olmayan izleyiciye
fayda diliyle anlatan bir film yazar, filmi zamanın saf fonksiyonu olan bir HTML animasyonu olarak kurar, yapay zekâ
sesiyle seslendirir ve kare kare gerçek bir MP4'e çevirir. Skill klasörü: `~/.claude/skills/deha-video/`.

- `scripts/anahtar.sh` — API anahtarı (durum / kaydet / test)
- `scripts/yeni-film.sh` — şablondan film klasörü kurar (oran, fps)
- `template/` — çalışan iskelet: `tools/` (seslendirme, render, miks, doğrulama), `js/engine.js`, `js/player.js`,
  `js/kit.js` (hazır sahne parçaları: telefon, panel, liste, kontrol listesi, sayaç, halka, grafik), yazı tipleri, CC0 ses efektleri
- `gorunumler/` — sekiz renk ön ayarı (gece, kum, orman, yakut, kagit, neon, nane, seker)
- `senaryolar/` — altı anlatım iskeleti (lansman-30sn, modul-tanitimi-60sn, once-sonra-60sn, surum-notlari-45sn, nasil-yapilir-90sn, urun-tanitimi-3dk)
- `references/brief.md` — üretim ajanına verilecek ortak yönerge (ajan bunu okur)
- `references/dersler.md` — ses modelleri, kotalar, sesler, sık yapılan hatalar

## 0. Anahtar

`~/.claude/skills/deha-video/scripts/anahtar.sh durum` çalıştır. Anahtar skill klasöründe DEĞİL,
`~/.config/deha-video/gemini.key` dosyasında (izin 600) durur; araçlar onu oradan kendileri okur.

- Yoksa ya da `anahtar.sh test` hata veriyorsa kullanıcıdan Google AI Studio anahtarını iste ve
  `printf '%s' '<anahtar>' | ~/.claude/skills/deha-video/scripts/anahtar.sh kaydet` ile kaydet.
- Anahtarı hiçbir zaman ekrana yazdırma, film klasörüne, betiklere, loglara, CREDITS dosyasına ya da gite koyma.
  Ajanlara anahtarın kendisini değil, "araçlar anahtarı kendileri okur" bilgisini ver.
- Kullanıcı seslendirme istemiyorsa anahtar gerekmez.

## 1. Sor (AskUserQuestion)

Kullanıcının mesajında zaten yanıtı olan soruyu sorma. Kalanları **tek** AskUserQuestion çağrısında sor (en çok dört soru);
gerekiyorsa ikinci bir çağrıyla devam et. Önerdiğin seçeneği başa koy.

Birinci çağrı:

| Soru | Seçenekler |
|---|---|
| Süre | 30 sn · 60 sn · 2–3 dk · 5 dk (başka süre "Other" ile) |
| Ekran | 9:16 dikey (Reels/Shorts) · 16:9 yatay · 1:1 kare · 4:5 |
| Üretim modeli | Sonnet 5.5 (önerilen: hız/kalite dengesi) · Fable 5.2 (en yetenekli, pahalı) · Opus 5.5 · Haiku 5.5 (hızlı, kalite düşer, sıkı denetim ister) |
| Ses | Kadın · Erkek · Seslendirme yok (yalnız yazı ve efekt) |

İkinci çağrı (yalnız belirsizse):

| Soru | Seçenekler |
|---|---|
| Konu | Kullanıcı konu vermediyse: kodu hızlıca tarayıp 3–4 somut konu öner (her biri bir video). Birden çok seçilebilir. |
| Görünüm | Ajan seçsin (önerilen) · Marka renkleriyle · Koyu ve sinematik (gece, orman, yakut, neon) · Aydınlık ve canlı (kum, kagit, nane, seker) |
| Film türü | Modül/özellik tanıtımı · Lansman/duyuru · Önce–sonra · Nasıl yapılır · Sürüm notları (senaryo iskeletini belirler) |
| Dil | Türkçe · İngilizce |
| Müzik/efekt | Yalnız ses efekti (önerilen) · Efekt yok · Kullanıcının vereceği müzik dosyası |

Sormadan varsay ve yanıtta belirt: 30 fps; çıktı klasörü projenin YANINDA `<proje>-video/<film-adi>/` (commit zorunluluğu
olan depoların içine yazma; kullanıcı başka yer derse oraya); seslendirme modeli sırası `references/dersler.md`'deki gibi.

Kelime bütçesi: Türkçe anlatım yaklaşık 13–14 karakter/sn akar. 30 sn ≈ 45–50 kelime, 60 sn ≈ 90–100, 3 dk ≈ 280–300,
5 dk ≈ 470–500. Bölüm sayısı: 30 sn 3–4, 60 sn 6–7, daha uzun filmde her 12–18 saniyeye bir bölüm.

## 2. Kur

Her film için:

```
~/.claude/skills/deha-video/scripts/yeni-film.sh "<hedef klasör>" <9:16|16:9|1:1|4:5|ENxBOY> \
    --baslik "<başlık>" --gorunum <ad> --senaryo <ad> [--fps 30]
~/.claude/skills/deha-video/scripts/yeni-film.sh --liste      # görünümler ve senaryolar, açıklamalarıyla
```

Betik şablonu kopyalar, boyutu ve seçilen görünümü (`css/gorunum.css`) yazar, senaryo iskeletini `tools/narration.json`
olarak koyar, `npm install`'ı film klasörünün içinde çalıştırır ve taslak bir çizelge üretir; kurulumdan hemen sonra
`node tools/still.mjs out/s --beats` çalışır durumdadır. `npm`'i asla başka bir klasörde çalıştırma.

Görünüm bir başlangıç paletidir, zorunluluk değil: ajan renkleri filme göre değiştirebilir. Bir seride her filme farklı
görünüm ver. Senaryo iskeletindeki köşeli parantezli satırlar yer tutucudur; ajan hepsini gerçek metinle değiştirir.

## 3. Ürettir

Her film için bir üretim ajanı başlat (Agent aracı, `model`: kullanıcının seçtiği `sonnet` / `fable` / `opus` / `haiku`).
Birden çok film birbirinden bağımsızdır: hepsini aynı mesajda başlat. Ajan görev metni kısa olur; ortak kurallar
`references/brief.md`'dedir ve ajan onu okur. Görev metninde şunlar bulunur:

1. "Önce `~/.claude/skills/deha-video/references/brief.md` dosyasını oku ve tamamen uy."
2. Film klasörü (kurulmuş), konu ve izleyicinin sorusu ("... nasıl yaparım?").
3. Kaynaklar: hangi depolar/klasörler okunacak; varsa önceden yapılmış özellik envanteri.
4. Kullanıcının seçimleri: süre ve kelime bütçesi, oran, dil, ses (ad), seslendirme modeli sırası, efekt/müzik.
5. Görünüm: palet ve "yinelenen sahne" fikri. Seride her filme FARKLI bir görünüm ver; aynı görünümü iki kez verme.
6. Kullanıcının kendi beyanıyla gelen iddialar (kodda yoksa bile kullanılacaksa) ve yasaklar.

Aynı anda birkaç ajan çalışacaksa: her birine farklı seslendirme modeli sırası ver (günlük kotalar küçük ve ortaktır) ve
render için en çok 3 işçi kullanmalarını söyle. Haiku ile üretimde ajan sık sık yarıda bırakır: eksik adımı kendin tamamla.

Ajanın işi beş adımdır ve sırası değişmez: (1) kodu oku, doğrulananları ve "iddia edilmeyecekler"i `OZELLIKLER.md`'ye yaz;
(2) anlatım metnini yaz ve seslendir, her klibi yazıya döküp metinle karşılaştır; (3) sahneleri gerçek klip sürelerine
bağlı kur; (4) kare kare bakıp düzelt; (5) render, miks, doğrulama.

## 4. Kendin doğrula

Ajanın raporu kanıt değildir. Her film için:

```
cd "<film klasörü>" && node tools/kontrol.mjs
```

Bu, kodek/boyut/fps/süre/ses/siyah kare denetimini yapar ve `out/kontrol-a.jpg`, `out/kontrol-b.jpg` şeritlerini üretir.
**Şeritleri Read ile aç ve bak.** Aradıkların: yarım kesilmiş başlık, boş alt bölüm, üst üste binen yazı, boş kart,
sıfırda kalmış sayaç, okunmayacak kadar küçük etiket, yanlış Türkçe harf. Ayrıca film klasöründe anahtar dizgisini ara
(olmamalı) ve `OZELLIKLER.md`'deki "iddia edilmeyecekler" ile anlatımı karşılaştır.

## 5. Sun

Kullanıcıya her film için: MP4'ün tam yolu, süre ve boyut; bölüm bölüm içerik (süre + ne anlatıyor); **kod araştırmasının
filme almadığı ya da düzelttiği iddialar**; gördüğün pürüzler; ses modeli ve ses adı. Açıkça söyle: sesi dinleyemezsin,
hareketi izleyemezsin; telaffuz ve tempo kullanıcının kulağına kalır. Kanıtlamadığın şeyi "hazır" diye sunma.

## Revizyon

Film klasöründe, yeniden ajan başlatmadan:

| İstek | Komut |
|---|---|
| Sesi değiştir | `node tools/revoice.mjs --voice <ad>` (gerekirse `--model <ad>`) |
| Tek cümleyi değiştir | `tools/narration.json`'da metni düzelt → `node tools/tts.mjs --only c03 --force` → `node tools/transcribe.mjs` → `node tools/build-vo.mjs` → `node tools/render.mjs` → `node tools/mix.mjs` |
| Yalnız görsel düzeltme | `js/`/`css/` düzelt → `node tools/still.mjs out/s <sn> ...` ile bak → `node tools/render.mjs` → `node tools/mix.mjs` |
| Müzik ekle | `node tools/mix.mjs --music <dosya> --music-gain 0.12` |
| Erişilen ses modelleri | `node tools/modeller.mjs` |

Metin değişince klip süreleri, dolayısıyla bütün çizelge kayar; sahneler kliplere bağlı kurulduğu için kendiliğinden uyar.
Büyük görsel değişiklikte (yeni sahne, yeni görünüm) filmi yapan ajana SendMessage ile devam ettir ya da yeni ajan başlat.

## Değişmez kurallar

- **Uydurma yok.** Kodda karşılığı olmayan özellik, sayı, yüzde, hız, müşteri sayısı, üstünlük iddiası ("en …"),
  rakip karşılaştırması filme girmez. Kullanıcının kendi beyanı kullanılabilir, ama `OZELLIKLER.md`'de "kullanıcı beyanı"
  diye işaretlenir ve kullanıcıya kodda bulunamadığı söylenir.
- **Fayda dili.** İzleyici teknik değildir: API, sunucu, veritabanı, framework adı ekranda ve seste geçmez.
- **Gizlilik.** `.env` açılmaz; gerçek müşteri/kişi verisi, şifre, anahtar hiçbir çıktıya girmez; ekranlar kurgusal
  veriyle çizilir ("Bayi A", "Örnek Ürün").
- **Belirlenimcilik.** Her kare zamanın saf fonksiyonudur: `Date.now()`, kare başına `Math.random()`, önceki kareye
  bağımlılık yok. `window.seek(t)` ve `window.renderAt(t)` vardır.
- **Gerçek MP4.** H.264 + yuv420p + AAC; WebM'i yeniden adlandırmak yok. Üretilemediyse bunu açıkça söyle.
- **Tek ses, tek model.** Bir filmin bütün klipleri aynı model ve aynı sesle üretilir; kota biterse hepsi yeni modelle
  baştan üretilir. Eksik anlatımla final render alınmaz.
