# deha-video

Bir projeyi, modülü ya da özelliği **kodundan doğrulayıp** seslendirmeli tanıtım videosuna çeviren Claude Code skill'i.
Çıktı gerçek bir MP4'tür (H.264 + AAC); görüntü bir HTML animasyonundan kare kare alınır, ses Google Gemini ile üretilir.

Dehasoft'ta e-ticaret altyapısının tanıtım filmlerini (uzun tanıtım, 60 saniyelik lansman, BayiGöz, Hakediş, Teklif,
Kasa Arkası gibi modüllerin dikey videoları) üretirken kurulan yöntemin paketlenmiş hâlidir.

## Ne yapar

1. **Sorar.** Süre, ekran oranı, üretim modeli, ses; gerekirse konu, görünüm, film türü.
2. **Doğrular.** Üretim ajanı konunun kodunu okur; gerçekten çalışanları ve *iddia edilmeyecekleri* `OZELLIKLER.md`'ye yazar.
3. **Yazar ve seslendirir.** Teknik olmayan izleyiciye fayda diliyle anlatım; her ses klibi yazıya dökülüp metinle karşılaştırılır.
4. **Kurar.** Sahneler ses kliplerinin gerçek süresine bağlı kurulur: ses ya da metin değişince film kendiliğinden kayar.
5. **Render eder.** Başlıksız Chromium her kareyi alır, FFmpeg MP4'e çevirir, ses −16 LUFS'e karıştırılır.
6. **Denetler.** Kodek, boyut, süre, ses, siyah kare taraması ve göz kontrolü için kare şeritleri.

## Kurulum

```bash
git clone https://github.com/dehasoft-tr/deha-video.git
cd deha-video && ./kur.sh
```

`kur.sh` depoyu `~/.claude/skills/deha-video` olarak bağlar ve gereksinimleri denetler:

| Gereksinim | Kurulum |
|---|---|
| Node.js 20+ | [nodejs.org](https://nodejs.org) ya da `nvm` |
| FFmpeg | `brew install ffmpeg` |
| Playwright Chromium | `npx playwright install chromium` |
| Google AI Studio anahtarı | yalnız seslendirme için; aşağıya bakın |

macOS üzerinde geliştirildi ve denendi.

### API anahtarı

Anahtar **depoda durmaz**. Her kullanıcı kendi anahtarını kendi makinesine kaydeder:

```bash
pbpaste | ~/.claude/skills/deha-video/scripts/anahtar.sh kaydet   # panodaki anahtarı kaydeder
~/.claude/skills/deha-video/scripts/anahtar.sh test               # çalışıyor mu, hangi ses modelleri var
```

Anahtar `~/.config/deha-video/gemini.key` dosyasına, yalnız sahibinin okuyabileceği izinle yazılır. Araçlar oradan okur;
film klasörlerine, loglara ya da gite yazılmaz. Anahtarı [aistudio.google.com](https://aistudio.google.com) üzerinden alabilirsiniz.

## Kullanım

Claude Code'da, videosunu istediğiniz projenin klasöründe:

```
/deha-video
```

ya da doğrudan söyleyin: *"Hakediş modülü için 60 saniyelik dikey tanıtım videosu yap."* Skill eksik kalan seçimleri sorar:

| Soru | Seçenekler |
|---|---|
| Süre | 30 sn · 60 sn · 2–3 dk · 5 dk |
| Ekran | 9:16 dikey · 16:9 yatay · 1:1 kare · 4:5 |
| Üretim modeli | Sonnet · Fable · Opus · Haiku |
| Ses | Kadın · Erkek · Seslendirme yok |

Film, projenin yanında `<proje>-video/<film-adi>/` klasörüne üretilir; bitmiş video `out/final.mp4`'tür.
`index.html` tarayıcıda açılınca aynı film oynatıcıyla izlenir.

### Sonradan değiştirmek

Film klasöründe:

```bash
node tools/revoice.mjs --voice tr-tr-storyteller-1     # sesi değiştir, yeniden render et
node tools/tts.mjs --only c03 --force                  # tek cümleyi yeniden seslendir (metni narration.json'da düzelttikten sonra)
node tools/build-vo.mjs && node tools/render.mjs && node tools/mix.mjs
node tools/mix.mjs --music muzik.mp3 --music-gain 0.12 # müzik ekle
node tools/kontrol.mjs                                 # MP4'ü denetle, kare şeritlerini üret
```

## Şablonlar

```bash
scripts/yeni-film.sh --liste
scripts/yeni-film.sh ../proje-video/hakedis 9:16 --gorunum yakut --senaryo modul-tanitimi-60sn --baslik "Hakediş"
```

### Görünümler (`gorunumler/`)

| Ad | Karakter | Uygun olduğu konu |
|---|---|---|
| `gece` | Koyu lacivert, kehribar vurgu | Kurumsal, sinematik |
| `kum` | Sıcak açık zemin, mercan vurgu | Mobil uygulama, samimi |
| `orman` | Koyu yeşil, limon vurgu | Saha, harita, denetim |
| `yakut` | Bordo, altın vurgu | Ödül, kampanya, premium |
| `kagit` | Açık gri-mavi, lacivert ve turuncu | Belge, teklif, sözleşme |
| `neon` | Siyaha yakın, pembe ve camgöbeği | Veri, analiz, rapor |
| `nane` | Ferah yeşil-beyaz, kırmızı vurgu | Sepet, kasa, perakende |
| `seker` | Parlak pembe-turkuaz, sarı başlık | Oyunbaz, sosyal medya |

Görünüm bir başlangıç paletidir; üretim ajanı filme göre uyarlar. Yeni görünüm eklemek için aynı on bir CSS değişkenini
tanımlayan bir dosya koymak yeterlidir.

### Senaryolar (`senaryolar/`)

| Ad | Süre | Yapı |
|---|---|---|
| `lansman-30sn` | 30 sn | Kanca, üç vuruş, kapanış |
| `surum-notlari-45sn` | 45 sn | Yeni sürüm, üç yenilik, nasıl alınır |
| `modul-tanitimi-60sn` | 60 sn | Sorun, çözüm, üç yetenek, yönetici kazancı, kapanış |
| `once-sonra-60sn` | 60 sn | Eski düzen, dönüşüm, yeni düzen, kazanç |
| `nasil-yapilir-90sn` | 90 sn | Giriş, dört adım, sonuç |
| `urun-tanitimi-3dk` | 2,5–3 dk | Sorun, tek merkez, yetenekler (soru–çözüm–kazanç), final |

Senaryolar anlatım iskeletidir: bölüm adları, cümle başına ton yönlendirmesi ve yer tutucu metin içerir.

### Hazır sahne parçaları (`template/js/kit.js`)

Telefon, panel, satır listesi, kontrol listesi, sayı kutusu, ilerleme çubuğu, puan halkası, çubuk grafik, etiket ve
dokunma halkası. Hepsi tek bir ilerleme değerinden (0–1) çizilir, bu yüzden kare kare render ile uyumludur.
Kullanımı `references/brief.md` içinde ve başlangıç filminde (`template/js/film.js`) gösterilir.

## Klasör yapısı

```
SKILL.md              skill tanımı: soru akışı, üretim adımları, kurallar
kur.sh                kurulum ve gereksinim denetimi
scripts/
  anahtar.sh          API anahtarı: durum | kaydet | test
  yeni-film.sh        şablondan film klasörü kurar
references/
  brief.md            üretim ajanının yönergesi
  dersler.md          ses modelleri, kotalar, sesler, sık görülen kusurlar
gorunumler/           renk ön ayarları
senaryolar/           anlatım iskeletleri
template/             film iskeleti
  tools/              tts, transcribe, build-vo, render, mix, kontrol, revoice, still, modeller, taslak-timeline
  js/                 engine (zaman motoru), kit (parçalar), film (başlangıç filmi), player (oynatıcı)
  css/  assets/       stiller, yazı tipleri, ses efektleri, logo
```

## Kurallar

- **Uydurma yok.** Kodda karşılığı olmayan özellik, sayı, yüzde, hız, müşteri sayısı, üstünlük iddiası ve rakip
  karşılaştırması filme girmez. Araştırma çoğu zaman ilk fikri düzeltir; skill bunu size bildirir.
- **Fayda dili.** İzleyici teknik değildir; API, sunucu, framework adı geçmez.
- **Gizlilik.** `.env` açılmaz; gerçek müşteri verisi, şifre ya da anahtar hiçbir çıktıya girmez; ekranlar kurgusal veriyle çizilir.
- **Tek ses, tek model.** Bir filmin bütün klipleri aynı ses ve aynı modelle üretilir.
- **Dürüst teslim.** Skill sesi dinleyemez ve hareketi izleyemez; telaffuz ve tempo için son söz izleyen kişidedir.

## Bilinen sınırlar

- **Ses kotası.** Gemini seslendirme modellerinin günlük istek sınırı küçüktür (en iyi modelde ücretli ilk katmanda günde
  100 istek); 60 saniyelik bir film 12–15 istek harcar. Kota dolunca skill sıradaki modele geçer.
- **Marka adları** ses modelinde sık yanlış okunur; skill her klibi yazıya döküp denetler, yine de dinleyerek doğrulayın.
- **macOS varsayımı.** FFmpeg yolu ve Chromium bulma mantığı macOS'a göredir; `FFMPEG`, `FFPROBE`, `CHROME_PATH` ortam
  değişkenleriyle değiştirilebilir.

## İçerik kaynakları

- Yazı tipleri: Inter, Instrument Serif (SIL Open Font License 1.1)
- Ses efektleri: Freesound, CC0 1.0 — whoosh (Kinoton #351256), sweep (moogy73 #425700), ping (arseniiv #614833),
  shimmer (adh.dreaming #632344), impact (tgerginov #665093), drop (paespedro #174718)
- Seslendirme: Google Gemini TTS (yapay zekâ sesi)

Dehasoft iç kullanımı içindir.
