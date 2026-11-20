# deha-video üretim yönergesi (üretim ajanı bunu okur)

Tek bir film üretiyorsun: deterministik bir HTML animasyonu, yapay zekâ seslendirmesi ve bundan render edilmiş gerçek bir
MP4. Konu, film klasörü, süre, oran, ses, görünüm ve kaynaklar görev mesajındadır; geri kalan her şey burada.

## Sınırlar
- Yalnızca kendi film klasöründe yaz. Diskteki başka her şey salt okunurdur: başka yerde düzenleme, git commit yok.
  Başka ajanlar kardeş klasörlerde çalışıyor olabilir; onlara dokunma.
- `npm` yalnızca film klasöründe çalışır; önce `pwd` ile doğrula. Klasör zaten kurulu ve `npm install` yapılmış gelir.
- `.env` dosyalarını açma. Hiçbir çıktıya sır, kimlik bilgisi, gerçek müşteri ya da kişi verisi koyma.
- API anahtarını araçlar kendileri okur (`~/.config/deha-video/gemini.key`). Dosyayı açma, içeriğini yazdırma, kopyalama.
- Onay isteme. İşi baştan sona kendin bitir (metin, ses, sahneler, render, miks, doğrulama). Gerçekten yapılamayan bir şey
  varsa dur; neyin eksik olduğunu ve devam etmek için gereken komutları aynen yaz.

## Film klasöründe hazır olanlar
- `film.config.json` — genişlik, yükseklik, fps. Bütün araçlar buradan okur; `assets/config.js` aynı değerleri sayfaya verir.
- `index.html`, `css/style.css`, `js/engine.js`, `js/film.js`, `js/player.js` — çalışan ama bilerek sade bir iskelet.
  `engine.js` ve `player.js`'i koru; `film.js`, `css` ve `index.html`'deki katmanları kendi sahnelerinle değiştir
  (gerekirse `js/` altına yeni dosyalar ekle ve `index.html`'e `film.js`'ten önce bağla).
- `css/gorunum.css` — seçilen renk ön ayarı (`--bg --bg2 --ink --mu --ac --ac2 --card --cardink --line --ok --warn`).
  Başlangıç noktasıdır: filmin konusuna göre değiştir, ama renkleri bu değişkenler üzerinden kullan.
- `js/kit.js` + `css/kit.css` — hazır sahne parçaları (aşağıda). İstediğini kullan, yetmeyeni kendin çiz; filmin
  kahraman öğesi (harita, belge, ağ, raf…) çoğu zaman sana özgü olacaktır. Başlangıç `film.js`'i bunların nasıl
  kurulup zamana bağlandığını gösterir.
- `tools/narration.json` — bir senaryo iskeleti gelmiş olabilir: `[köşeli parantezli]` satırlar yer tutucudur, hepsini
  gerçek metinle değiştir; bölüm sayısını ve adlarını konuya göre uyarlayabilirsin. `_aciklama` alanı yalnız nottur.
- `assets/fonts` (Inter değişken, Instrument Serif italik; ikisi de Türkçe harfleri içerir), `assets/sfx`
  (CC0: whoosh, sweep, ping, shimmer, impact, drop), `assets/logo-dehasoft.png` (yalnız Dehasoft filmlerinde kullan;
  başka projede o projenin logosunu depodan bul ve `assets/` içine kopyala).
- `tools/` — aşağıdaki komutlar. Hepsi film klasöründen `node tools/<ad>.mjs` ile çalışır.

| Araç | Ne yapar |
|---|---|
| `taslak-timeline.mjs [--cps 13.5]` | Ses yokken metin uzunluğundan tahmini çizelge (`assets/timeline.js`, `provisional`) |
| `tts.mjs [--model M] [--voice V] [--only c02,c05] [--force]` | `tools/narration.json`'daki klipleri seslendirir → `assets/vo/raw/*.wav`; günlük kota dolunca çıkış kodu 2 |
| `transcribe.mjs` | Her klibi yazıya döker, metinle karşılaştırır (AYNI / FARKLI) |
| `build-vo.mjs [--tempo 1.0] [--gap 0.3] [--tail 2.6]` | Klipleri düzeyler, gerçek sürelerden `assets/timeline.js` yazar, film süresini verir |
| `still.mjs out/s --beats` ya da `still.mjs out/s 3.0 10.5 …` | Belirtilen anların karesini PNG alır |
| `render.mjs [--workers 4]` | Bütün kareleri başlıksız Chromium ile alıp `out/video.mp4` yazar |
| `mix.mjs [--music dosya]` | Seslendirme + kısılmış efektler, −16 LUFS → `out/final.mp4` |
| `kontrol.mjs` | ffprobe, ses yüksekliği, siyah kare taraması, 12 karelik iki şerit (`out/kontrol-a/b.jpg`) |
| `modeller.mjs` | Anahtarın eriştiği seslendirme modelleri (kota harcamaz) |

## Motor sözleşmesi (`js/engine.js` → `ENG`)
- `addLayer((t) => { … })`: her karede çağrılır. Bütün görünüm yalnızca `t`'den hesaplanır; durum tutma, `Date.now()` ve
  kare başına `Math.random()` kullanma (tohumlu `rnd(i)` var). Öğeleri bir kez oluştur, katmanda yalnız stil güncelle.
- Zamanlama kliplerden gelir, sabit saniyeden değil: `T('c03', 1.2)` (klibin başından 1,2 sn sonra),
  `P('c03', 'ifade')` (metindeki ifadenin yaklaşık söylenme anı), `B('cozum').a / .b` (bölümün başı / sonu).
  Böylece ses ya da metin değişince sahneler kendiliğinden kayar.
- `ramp(t, a, b, E.out5)` giriş/çıkış, `kf(t, [[t0,v0],[t1,v1,E.io],…])` anahtar kare, `mixc('#aabbcc','#ddeeff',u)` renk.
- `film.js` şunları tanımlamak zorundadır: `window.SFX = [{ t, id, g }]` ve `window.READY` (yazı tipleri yüklenince
  çözülen Promise). `window.BEATS` motor tarafından `narration.json`'daki `beat` adlarından üretilir.
- Sahne `film.config.json`'daki piksel boyutundadır; bütün ölçüleri bu koordinatlarda yaz (`ENG.W`, `ENG.H`).

## Hazır parçalar (`js/kit.js` → `KIT`)
Her kurucu bir DOM öğesi döndürür; görünümü değiştiren işlevler yalnızca verilen 0–1 ilerleme değerinden hesap yapar
(durum tutmazlar). Ölçek `em` ile verilir: parçanın `font-size`'ı gövde yazısının piksel boyutudur.

| Parça | Kurucu | Zamana bağlama |
|---|---|---|
| Telefon | `KIT.phone({ w, h, em, title })` → `{ el, body, title }` | içeriği `body`'ye ekle |
| Panel/kart | `KIT.panel({ w, h, em, title, tag, tabs, on })` → `{ el, body, setTab }` | içeriği `body`'ye ekle |
| Satır listesi | `KIT.rows([{ t, sub, val, pill, tone }])` → `{ el, rows, reveal }` | `reveal(u)`: satırlar sırayla girer |
| Kontrol listesi | `KIT.checklist(['…'])` → `{ el, check }` | `check(u)`: kutular sırayla işaretlenir |
| Sayı kutusu | `KIT.stat({ label, from, to, pre, suf, dec, accent })` → `{ el, set }` | `set(u)`: sayar; `from`'u anlamlı seç |
| İlerleme çubuğu | `KIT.progress()` → `{ el, set }` | `set(u)` |
| Puan halkası | `KIT.ring({ size, to, pre, suf })` → `{ el, set }` | `set(u)`; sayı dolmaya başlayınca görünür |
| Çubuk grafik | `KIT.bars([0–1…], vurgulu)` → `{ el, grow }` | `grow(u)` |
| Düğme, etiket | `KIT.button(t)`, `KIT.chip(t, em, koyu)` | — |
| Dokunma halkası | `KIT.tapRing(em)` | `KIT.tap(el, x, y, u)` |
| Konumlama | `KIT.place(el, x, y, ölçek, açı, opaklık)` | her karede çağır |

Tipik kullanım: `const u = ramp(t, T('c04', .3), T('c04', 1.8), E.lin); liste.reveal(u);`

## Adım 1 — konuyu kodda doğrula
Film yalnızca kodun gerçekten yaptığını iddia edebilir. Görev mesajındaki kaynakları oku: önce README ve belgeler, sonra
rotalar → denetleyici/servis → model/migration → ekran. Belgeler ipucudur, kanıt koddur. Kullanılmayan, yorum satırı
olmuş, "yakında" diye işaretli ya da rotası olmayan kod özellik değildir. Üreticinin kendi kullanıcıya dönük yardım
metinleri varsa oku: ifade seçimi için en iyi rehber odur.

Şunu çıkar: kim kullanıyor, adım adım ne yapıyor, ne kendiliğinden oluyor, sahibi ne görüyor ya da ne kazanıyor.
Film klasörüne `OZELLIKLER.md` yaz: doğrulanan her yetenek (kaynak dosya yollarıyla, bir cümle müşteri faydasıyla) ve
**"İddia edilmeyecekler"** listesi (bulunamayan, yarım, kapalı gelen, yalnız bazı durumlarda geçerli olan). Filmdeki her
iddia bu dosyada olmalı. Görev mesajındaki çalışma fikri kodla çelişiyorsa fikri değil kodu izle ve raporda belirt.

Asla iddia etme: uydurma sayı, yüzde, ciro artışı, hız, kullanıcı sayısı; üstünlük sıfatı; rakip karşılaştırması ya da
"başkasında yok"; görev mesajında izin verilmedikçe banka, ödeme sağlayıcı, ERP, yapay zekâ sağlayıcı adı; uygulama
mağazasında bulunma. Ekrandaki örnek veriler apaçık kurgusal olsun ve rakam içeren rapor ekranları "Örnek veri" diye
işaretlensin.

## Adım 2 — anlatım ve ses
- İzleyici teknik değildir. Hikâye: izleyicinin yaşadığı sorun → ürünün yaptığı → kazancı → kapanış cümlesi ve logo.
  Bölüm başına tek fikir. Anlatım ekrandaki yazıyı okumaz, ondan fazlasını söyler. Kısa cümleler, konuşma dili,
  ilk 4 saniyede kanca, akılda kalan kapanış.
- Metni `tools/narration.json`'a yaz: her klip `id` (c00, c01…), `beat` (bölüm adı), `style` (o cümlenin tonu: İngilizce
  kısa yönlendirme) ve `t` (metin). Bir klip bir-iki cümledir. Kelime bütçesi görev mesajındadır.
- Önce bir klip üret ve hızını ölç (karakter/sn); metni buna göre boyutla ki anlatım filmin bitişinden yaklaşık 3 sn önce
  bitsin. Tempo ayarı 0,95–1,12 arasında kalsın; daha fazlası gerekiyorsa metni kısalt ya da uzat.
- Kotalar küçüktür: her klibi bir kez üret, yalnız yazıya dökümü yanlış çıkanı yeniden üret. Dakikada yaklaşık 10 istek
  sınırı vardır; araç bekleyip yeniden dener. Model günlük kotayı doldurursa (çıkış kodu 2) görev mesajındaki sıradaki
  modele geç ve **bütün klipleri o modelle baştan üret**; bir filmde model ya da ses karıştırma.
- Hiçbir modelde kota kalmadıysa: kalan her şeyi bitir (sahneler, taslak çizelgeyle kare denetimi), eksik anlatımla final
  render ALMA, hangi kliplerin var olduğunu ve devam komutlarını raporla.
- Marka ve modül adları yanlış okunur (örnek: "Dehasoft" → "Deha Soft", "İdeaSoft"). Adı cümlenin ortasına ya da sonuna
  koy, `style` içine tek kelime olduğunu ve nasıl okunduğunu yaz ("Dehasoft is one word, pronounced de-ha-soft"),
  `transcribe.mjs` ile doğrula, doğru çıkana kadar o klibi yeniden üret. Düzelmiyorsa cümleyi yeniden kur.
- Seslendirme yoksa: `narration.json`'ı yine yaz (ekran yazılarının zamanlaması için), klip başına istersen `dur` ver,
  `taslak-timeline.mjs` çalıştır; `tts` ve `build-vo` atlanır, `mix.mjs` yalnız efektleri karıştırır.

## Adım 3 — sahneler
Asıl beklenti animasyon kalitesidir.
- **Yinelenen bir sahne** seç (harita, belge, telefon, ağ, raf, tablo…) ve film boyunca onu dönüştür: bir bölümün öğesi
  sonrakinin öğesine dönüşsün (iğne telefona, liste puan halkasına, satır karta). Düz kararıp açılma, sırayla gelen kart
  slayt gösterisi, rastgele süzülme yok.
- Hareket sürekli ve amaçlı olsun: yumuşak, fiziksel eğriler; derinlik/paralaks; çizilen çizgiler; sayan sayaçlar; ekran
  içlerinde kademeli küçük hareketler. Ama yazı okunabilir kalsın.
- Görsel, anlatıcı o noktaya geldiği anda gelsin (`T`, `P`); önce ya da sonra değil.
- Ekranlar, okuduğun gerçek panel/mağaza/uygulama ekranlarından modellenmiş HTML/CSS çizimleridir: gerçek ekran adları,
  etiketler, sütun başlıkları, dil. Raporda hangilerinin gerçek koddan modellendiğini, hangilerinin senin çizimin
  olduğunu yaz. Gerçek ekranda olmayan bir düğmeyi (ör. "ara" düğmesi) varmış gibi çizme.
- Görev mesajındaki görünümü uygula. Seride her filmin görünümü bilerek farklıdır; örnek filmlerin görünümüne kayma.

Yerleşim (piksel değerleri 1080 genişlikli dikey sahne içindir; diğer oranlarda orantıla):

| | 9:16 (1080×1920) | 16:9 (1920×1080) | 1:1 (1080×1080) |
|---|---|---|---|
| Güvenli alan | yan 90, üst 200, alt 260 | yan 120, üst 90, alt 100 | yan 80, üst 80, alt 80 |
| Başlık | 110 px+ | 84 px+ | 84 px+ |
| Destek yazısı | 44 px+ | 36 px+ | 36 px+ |
| Ekran içi etiket | 30 px+ | 22 px+ | 24 px+ |

- **Kadrajı doldur.** Dikeyde alt üçte biri boş bırakma: kahraman öğe (telefon, harita, belge) başlığın altındaki
  yüksekliğin çoğunu kaplasın. Yatayda yazı bir yanda, kahraman öğe diğer yanda ve büyük.
- **Sessiz kuyruk bırakma.** Anlatım filmin bitişinden yaklaşık 3 sn önce biter; logo son cümlenin üstüne gelir.
- Türkçe harfleri her yerde denetle (ı İ ş ğ ü ö ç), büyük İ dahil. `text-transform: uppercase` Türkçede i→I yapar;
  büyük harfli metni elle yaz ya da öğeye `lang="tr"` ver.

Bu seride tekrar tekrar çıkan kusurlar; kare denetiminde özellikle bunlara bak:
1. **Yarım kesilmiş başlık:** eski başlık çıkarken yenisi girer ve bir karede ikisi de yarım görünür. Eski başlığın çıkışı
   yeni başlığın girişinden ÖNCE bitsin; satır maskesinin dolgusu yükselen/inen harfleri kesmesin.
2. **Boş kart:** panel ya da rapor kartı, satırları gelmeden önce bir süre boş durur. Kart içeriğiyle birlikte gelsin.
3. **Sıfırda sayaç:** sayaç dolmadan önce "₺0", "0 adet" gibi yanıltıcı bir değer görünür. Sayaç görünür olduğu anda
   anlamlı bir değerde olsun ya da görünmeden saymaya başlasın.
4. **Tutarsız rakam:** aynı şeyin iki sahnedeki değeri farklı (ara animasyon değeri ya da kopyalama hatası).
5. **Süs öğesinin yazıya binmesi:** uçuşan parçacık, para, konfeti başlığı ya da logoyu kapatır.
6. **Kenardan taşan kart** ve güvenli alanın dışına çıkan yazı.
7. **Üst üste binen kayan yazı şeridi:** süs amaçlı kayan şerit kullanacaksan tekrar aralığını metin genişliğinden hesapla.

## Adım 4 — ses, render, doğrulama
- Seslendirme yaklaşık −16 LUFS; geçişlerde ve önemli açılışlarda birkaç CC0 efekt, seslendirmenin altında kısılmış
  (`mix.mjs` yapar). Efekti her saniyeye koyma. Görev mesajı istemedikçe müzik yok.
- `CREDITS.md` yaz: seslendirme modeli ve sesi (yapay zekâ sesi olduğu), efektler (şablondakiler Freesound CC0: whoosh
  Kinoton #351256, sweep moogy73 #425700, ping arseniiv #614833, shimmer adh.dreaming #632344, impact tgerginov #665093,
  drop paespedro #174718), yazı tipleri (Inter ve Instrument Serif, SIL OFL 1.1), logo kaynağı.
- **Tam renderdan önce:** `node tools/still.mjs out/s --beats` (bölüm başına üç kare) ve geçiş anlarından kareler al;
  her birini Read ile aç ve bak; yukarıdaki kusurları düzelt; düzelttikten sonra o kareyi yeniden alıp doğrula.
- Render: `node tools/render.mjs --workers 4` (başka filmler aynı makinede render ediyorsa 3), sonra `node tools/mix.mjs`.
- **Renderdan sonra:** `node tools/kontrol.mjs` çalıştır, `out/kontrol-a.jpg` ve `out/kontrol-b.jpg`'yi aç ve bak. Süre
  hedefin ±2 saniyesinde mi, ses akışı var mı, siyah bölüm yok mu. Film klasöründe (node_modules hariç) anahtar dizgisi
  aranır; bulunmamalıdır.

## Rapor
İlk satır: bitti mi, MP4'ün tam yolu. Ardından: doğrulanan ve kullanılan yetenekler ile "iddia edilmeyecekler" listesi
(özellikle görev mesajındaki fikri değiştiren bulgular); bölümler ve gerçek süreleri; anlatım metninin tamamı; model ve
ses, yeniden üretilen klipler; gerçek koddan modellenen ekranlar; ffprobe ve ses yüksekliği; kare dosyalarının yolları;
doğrulayamadıkların (sesi dinleyemez, hareketi izleyemezsin) ve bildiğin kusurlar. Denetlemediğin şeyi başarı diye yazma.
