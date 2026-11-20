# Seslendirme modelleri, sesler ve dersler

Kasım 2026'da on dört film üretirken ölçülenler. Model listesi ve kotalar değişir: önce
`~/.claude/skills/deha-video/scripts/anahtar.sh test` ile güncel listeye bak, bilmediğin bir model ya da hata görürsen
ai.google.dev belgelerine danış.

## Modeller (Google AI Studio, Gemini TTS)

| Model | Uç nokta | Ton yönlendirmesi | Not |
|---|---|---|---|
| `gemini-3.8-flash-tts` | `interactions` | `speech_metadata.style` alanı | En iyi kalite. Ücretli 1. katmanda **günde 100 istek**; bir günde üç film bunu bitirdi. |
| `gemini-3.8-flash-lite-tts` | `interactions` | aynı | Kotası ayrı. Aoede bu modelde "Dehasoft"u yanlış okudu; Leda doğru okudu. |
| `gemini-3.1-flash-tts-preview` | `interactions` | `speech_metadata`'yı REDDEDER; yön metnin başına `[ton]` etiketi olarak girer | Ham PCM döner; araç WAV'a sarar. Etiket seslendirilmedi (yazıya dökümle doğrulandı). |
| `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts` | `generateContent`, `responseModalities: ["AUDIO"]` | Metnin başına düz cümle | 24 kHz 16 bit mono PCM döner. |

`tools/tts.mjs` bu dört biçimin hepsini bilir. Dakikada yaklaşık 10 istek sınırı vardır; araç 3 kez dener, günlük kota
hatasında çıkış kodu 2 ile durur.

Varsayılan sıra (tek film): `gemini-3.8-flash-tts` → `gemini-3.8-flash-lite-tts` → `gemini-3.1-flash-tts-preview` →
`gemini-2.5-flash-preview-tts` → `gemini-2.5-pro-preview-tts`. Aynı anda birkaç film üretiliyorsa her ajana sırayı
farklı bir modelden başlat ki kotalar dağılsın. 60 saniyelik bir film 9–10 klip + birkaç yeniden üretim ≈ 12–15 istek
harcar; 5 dakikalık film ≈ 55–65 istek.

Farklı modeller aynı sesi biraz farklı tınlatır: bir seriyi tek modelle üretmek tutarlılık için daha iyidir, kota izin
verirse.

## Sesler

| Ses | Tür | Gözlem |
|---|---|---|
| `Leda` | Kadın, stüdyo sesi (anadili Türkçe değil) | Lite, 2.5 ve 3.1 modellerinde Türkçeyi ve marka adlarını doğru okudu; ≈13,5 karakter/sn. Kadın ses için varsayılan. |
| `tr-tr-tutor-1` | Kadın, anadili Türkçe | Enerjik, sıcak; ≈14 karakter/sn. Yalnız 3.8 modellerinde denendi. Bir denemede "DehaSoft Bayi Göz" diye böldü. |
| `Aoede` | Kadın, stüdyo | Yavaş (≈11,4 karakter/sn); lite modelde marka adını yanlış okudu. |
| `Despina` | Kadın, stüdyo | Bir denemede kelimeyi değiştirdi ("Satıcı" → "satışı"). |
| `tr-tr-storyteller-1` | Erkek, anadili Türkçe | Derin, ağır tempolu. Erkek ses için ilk denenecek; enerjik film için yavaş kalabilir. |
| `alnilam` | Erkek, stüdyo (anadili Türkçe değil) | Sert, net, enerjik; ≈15,6 karakter/sn. 60 saniyelik lansman filminde kullanıldı. |
| `Charon` | Erkek, stüdyo | Yalnız denemede dinlendi. |

Diğer kadın stüdyo sesleri (Türkçe okuyuşları denenmedi): Autonoe, Achernar, Callirrhoe, Laomedeia, Erinome, Gacrux, Kore.
Ses listesi API'den 500 kayıtla sınırlı döndü; başka Türkçe sesler olabilir.

Ses seçerken: ajan sesi DUYAMAZ. Elindeki tek ölçü yazıya döküm doğruluğu ve hızdır. Kullanıcı ses tınısı konusunda
kararsızsa aynı iki cümleyi 3–5 sesle üretip (`node tools/tts.mjs --voice X --out out/deneme/X --only c00,c01`)
dosyaları kullanıcıya dinlet; sonra `revoice.mjs` ile tek komutta değiştir.

## Tekrar tekrar öğrenilenler

- **Ajan raporu kanıt değil.** Her filmde kareleri kendin aç. Ajanların "temiz" dediği filmlerde yarım başlık, boş kart,
  sıfırda sayaç bulundu.
- **Kod, fikri düzeltir.** Filmlerin çoğunda araştırma çalışma fikrini değiştirdi: simülasyon yalnız aktif kampanyayı
  değerlendiriyordu, "devir" alınmayan değil alınan miktardı, havale eşleştirme her zaman otomatik değildi, uygulamada
  kamera henüz yoktu. Slogan kodla çelişiyorsa bunu kullanıcıya açıkça söyle ve kararı ona bırak.
- **Marka adı en sık bozulan şeydir.** Her filmde en az bir klipte yanlış çıktı; bir kez rakip bir firmanın adı okundu.
  Marka geçen her klibi yazıya dökmeden film bitmiş sayılmaz.
- **Süreyi metin belirler.** Sabit süre ızgarası (ör. 300 sn'ye yayılmış sessiz sahneler) film yavaş hissettirir. Sahne
  süreleri klip sürelerinden hesaplanır; boş bekleyiş kalmaz.
- **Dikeyde boş alt bölüm** en yaygın yerleşim kusuru; Haiku ilk denemede telefonu küçük, ekranın üçte birini boş bıraktı.
- **`npm install` yanlış klasörde** bir kez ev klasörüne paket kurdu. `yeni-film.sh` kurulumu film klasöründe yapar;
  ajanlar ayrıca `npm` çalıştırmak zorunda değildir.
- **Paralel üretim** makineyi ve kotayı zorlar: on ajan aynı anda çalışırken yük ortalaması 50'yi geçti, render süreleri
  uzadı ama hepsi bitti. Film başına 3 render işçisi ve dağıtılmış model sırası bunu yönetilebilir tutar.
- **Haiku** altyapıyı kopyalayıp uyarlayabiliyor ama iki kez yarıda bıraktı (kota engeli, render'ı başlatıp durma) ve
  yerleşimi zayıf kaldı. Kullanıcı Haiku seçerse eksik adımları (miks, kontrol) kendin tamamlamaya hazır ol.
- **Anahtar** hiçbir film klasöründe bulunmadı (her seferinde arandı). Sohbete açık yazılmış bir anahtar varsa kullanıcıya
  iş bitince yenilemesini öner.
