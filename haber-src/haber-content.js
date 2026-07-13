/* ═══ TARİH AJANI HABER — İÇERİK (tek kaynak) ═══
   Hem ön sayfa (tarayıcı) hem de ayrı haber sayfaları (Node derleyici)
   bu dosyadan beslenir. Görsel: /assets/haber/<slug>.jpg. */
var CATS = {
  savas:  {ad:'SAVAŞ',       ico:'⚔️'},
  siyaset:{ad:'SİYASET',     ico:'🏛️'},
  sir:    {ad:'SIR DOSYASI', ico:'🔍'},
  felaket:{ad:'FELAKET',     ico:'🌋'},
  bilim:  {ad:'KEŞİF',       ico:'🔬'},
  ekonomi:{ad:'EKONOMİ',     ico:'⚖️'}
};

var HABER = [
  {slug:'istanbul-fethi',cat:'savas',md:'05-29',tarih:'29 Mayıs 1453',yil:'1453',yer:'KONSTANTİNOPOLİS',img:'/assets/haber/istanbul-fethi.jpg',
   baslik:'Konstantinopolis düştü: Bin yıllık Bizans sona erdi',
   spot:'Surlar 53 günlük kuşatmanın ardından yarıldı; 21 yaşındaki Sultan Mehmed şehre girdi. Bir çağ kapandı, yenisi açıldı.',
   pull:'Surlar bin yıl dayandı; elli üç günde düştü.',
   govde:[
     'Şehri bin yıldan fazla ayakta tutan Theodosius surları, 6 Nisan’da başlayan elli üç günlük kuşatmanın ardından bu sabah gün doğarken yarıldı. Osmanlı birlikleri açılan gedikten içeri akarken, savunmanın belkemiği olan Bizans hattı saatler içinde çöktü. Kuşatma boyunca aralıksız top ateşiyle örselenen surlar, son genel hücuma dayanamadı.',
     'Kuşatmanın kaderini, Macar dökümcü Urban’ın Edirne’de döktüğü dev bronz toplar belirledi. Sekiz metreye yaklaşan ana bombardanın, altmış çift öküz ve dört yüzü aşkın adamla cepheye taşındığı bildiriliyor. Kaynaklara göre Urban hizmetini önce imparatora sunmuş, parasız kalan saray ödeme yapamayınca genç sultana geçmişti. Sultan II. Mehmed’in emriyle donanmanın bir gecede karadan kızaklarla yürütülüp Haliç’e indirilmesi ise savunmayı iki yönden kıskaca aldı.',
     'Son gece verilen genel hücumun üç dalga hâlinde geldiği belirtiliyor: önce yardımcı birlikler, ardından muvazzaf kuvvetler, en sonda da seçkin yeniçeriler surlara yüklendi. Bu son dalgada savunmanın kadın ve çocukları dahi mevziye sürmek zorunda kaldığı aktarılıyor. Surlardaki küçük bir arka kapının — Kerkoporta’nın — kapatılmadan kaldığı ve Osmanlı sancaklarının kuleye buradan dikildiği yönündeki iddialar araştırılıyor; kimi tanıklar bu ayrıntıyı doğrularken kimi kaynaklar reddediyor.',
     'İmparator XI. Konstantin’den bu satırların yazıldığı saatlerde haber alınamıyor; son ana kadar yaya olarak surlarda çarpıştığı, tacını ve mührünü bırakıp er gibi savaştığı rivayet ediliyor. Hücuma katılan bir yeniçeri, “Gedik açıldığında savunma bir anda dağıldı” dedi. Genç sultanın ordusuna, mabetlere dokunulmaması ve şehrin bir daha ayağa kaldırılması yönünde talimat verdiği bildirildi.',
     'Tarih yazarları düşüşü yalnızca bir şehrin değil, bir çağın kapanışı olarak okuyor. Bir müverrih, “Bugün Orta Çağ’ın son günü olarak anılacak; matbaadan yeni deniz yollarına uzanan başka bir dünya başlıyor” değerlendirmesini yaptı. Bin yıllık Doğu Roma’nın haritadan silinmesiyle, Akdeniz ticaretinin ve Avrupa siyasetinin dengelerinin kökten değişeceği konuşuluyor.'
   ]},
  {slug:'ankara-savasi',cat:'savas',md:'07-28',tarih:'28 Temmuz 1402',yil:'1402',yer:'ÇUBUK OVASI',img:'/assets/haber/ankara-savasi.jpg',
   baslik:'Yıldırım esir düştü: İki cihangir Çubuk Ovası’nda karşılaştı',
   spot:'Timur ile Yıldırım Bayezid’in orduları Ankara yakınlarında çarpıştı. Susuz bırakılan ve kanatları saf değiştiren Osmanlı ordusu bozuldu.',
   pull:'Bir cihangir esir, bir imparatorluk on bir yıl askıda.',
   govde:[
     'Doğu ile batının iki büyük hükümdarı bugün Ankara yakınındaki Çubuk Ovası’nda karşı karşıya geldi. Gün boyu süren kanlı çarpışmanın sonunda Osmanlı ordusu bozguna uğradı; Sultan Bayezid meydanda sağ olarak esir alındı. Bu, Osmanlı tarihinde bir padişahın bizzat esir düştüğü ilk ve tek olay olarak kayda geçiyor.',
     'Yenilginin tohumlarının savaştan önce atıldığı belirtiliyor: Timur, iki ordunun da bağlı olduğu Çubuk deresini bir gölete çevirerek Osmanlı kuvvetlerini susuz bıraktı. Sıcak yaz gününde susuzluk ve yorgunlukla savaşa giren Osmanlı ordusunda çözülme, muharebenin ilk saatlerinde başladı.',
     'Dengeyi asıl bozan gelişme, saf değiştirmeler oldu. Muharebenin ortasında Kara Tatar birliklerinin ve Anadolu beyliklerinden gelen kuvvetlerin karşı tarafa geçmesi, Osmanlı kanatlarını bir anda çökertti. Bir sipahi, “Kanatlar çözülünce merkez yapayalnız kaldı” dedi. Bayezid’in seçkin birlikleriyle son ana kadar direndiği, ancak çemberin kapandığı bildirildi.',
     'Timur’un, esir düşen sultana başlangıçta saygı gösterdiği yönünde haberler gelirken, Osmanlı hanedanı içinde taht mücadelesinin şimdiden başladığı konuşuluyor. Bayezid’in oğullarının Anadolu’nun dört bir yanına dağıldığı, her birinin kendi bölgesinde hâkimiyet ilan etme hazırlığında olduğu öğrenildi.',
     'Gözlemciler, bu yenilginin genç imparatorluğu “Fetret Devri” denen uzun bir belirsizliğe sürükleyeceği görüşünde. Yarım yüzyıl önce kurulan devletin dağılma tehlikesiyle yüz yüze geldiği belirtiliyor. Yine de bazı kaynaklar, Osmanlı’nın bu darbeden birkaç on yıl içinde toparlanıp daha da güçlü çıkabileceğine dikkat çekiyor.'
   ]},
  {slug:'sezar-suikasti',cat:'sir',md:'03-15',tarih:'15 Mart MÖ 44',yil:'MÖ 44',yer:'ROMA SENATOSU',img:'/assets/haber/sezar-suikasti.jpg',
   baslik:'Sezar senatoda öldürüldü: Tam 23 hançer darbesi',
   spot:'Roma’nın en güçlü adamı senato toplantısında bir grup senatör tarafından kuşatıldı. Aralarında en güvendiği Brütüs de vardı.',
   pull:'Cumhuriyeti kurtarmak istediler; imparatorluğu doğurdular.',
   govde:[
     'Roma’nın “ömür boyu diktatör” unvanını taşıyan Julius Caesar, bugün Pompey Tiyatrosu’na bağlı senato salonunda bir grup senatörün saldırısında hayatını kaybetti. Kaynaklar, gövdesinde tam 23 hançer yarası sayıyor; suikaste altmışa yakın senatörün karıştığı belirtiliyor.',
     'Kâhin Spurinna’nın “Mart’ın 15’ine dikkat et” uyarısını hatırlayan Caesar’ın, salona girerken kâhinle karşılaştığında “İşte Mart’ın 15’i geldi ve ben hâlâ ayaktayım” dediği, Spurinna’nın ise “Geldi ama daha geçmedi” yanıtını verdiği aktarılıyor. Uyarının umursanmadığı belirtiliyor.',
     'Suikastın, senatör Tillius Cimber’in sürgündeki kardeşi için dilekçe sunma bahanesiyle başladığı bildirildi. Cimber’in Caesar’ın togasını omuzlarından kavrayıp onu yerinden kalkamaz hâle getirdiği, boynunu açıkta bıraktığı ve ilk darbenin bu anda vurulduğu öğrenildi. Suikastçılar arasında Caesar’ın yakın dostu Marcus Brutus da vardı. Ünlü “Sen de mi Brutus?” sözünün gerçekten söylenip söylenmediği tartışmalı; bir senatör, “Neredeyse tek kelime etmeden yere yığıldı” dedi.',
     'Olayın ardından kentte gerginlik hâkim. Suikastçıların soluğu Capitolium’da aldığı, halkı “özgürlük geri geldi” diye ikna etmeye çalıştıkları bildirildi. Ancak halkın bir bölümü onları hain, bir bölümü ise cumhuriyetin kurtarıcısı olarak görüyor; kentin bölündüğü belirtiliyor.',
     'Siyaset gözlemcileri, bu cinayetin cumhuriyeti güçlendirmek yerine yeni iç savaşları tetikleyeceği ve Roma’yı tam da suikastçıların korktuğu şeye — tek adam yönetimine, yani imparatorluğa — taşıyacağı uyarısında bulunuyor. Caesar’ın vârisi genç Octavianus’un adının şimdiden konuşulmaya başlandığı öğrenildi.'
   ]},
  {slug:'vezuv-pompeii',cat:'felaket',md:'08-24',tarih:'24 Ağustos 79',yil:'MS 79',yer:'POMPEII',img:'/assets/haber/vezuv-pompeii.jpg',
   baslik:'Vezüv patladı: Pompeii saatler içinde kül altında',
   spot:'Dağın tepesi göğe fırladı; kızgın kül ve gaz bulutu kenti yuttu. Binlerce kişi kaçamadan olduğu yerde kaldı.',
   pull:'Öğleden sonra gökyüzü karardı; gece kent yok oldu.',
   govde:[
     'Napoli Körfezi’ndeki Vezüv Yanardağı bugün öğleden sonra şiddetle patladı. Gökyüzüne yirmi-otuz kilometre yükseldiği belirtilen dev kül, taş ve gaz sütunu, kısa sürede Pompeii ve çevresindeki yerleşimleri karanlığa gömdü. Rüzgârın külü Pompeii üzerine sürüklediği, kentin saatler içinde metrelerce süngertaşı altında kaldığı bildiriliyor.',
     'Felaketin iki aşamada geldiği anlaşılıyor. İlk aşamada üzerine kül ve süngertaşı yağan kentte panik yaşandı; halkın bir bölümü bu sırada kaçmayı başardı. Ancak gün ağarırken sütun çöktü ve dağın yamaçlarından kentin üzerine, saatte yüz kilometreye varan hızla ve yüzlerce dereceyi bulan sıcaklıkta kızgın gaz-kül selleri indi. Bu akışların, kaçamayanları oldukları yerde mühürlediği belirtiliyor.',
     'Daha kuzeydeki Herculaneum’un ise farklı bir kaderi paylaştığı öğrenildi; rüzgâr külü başlangıçta bu kentten uzağa taşımış, ama gece inen kızgın çamur ve gaz akıntıları burayı da yuttu. Limandan kayıklarla kaçmaya çalışanların kıyıda mahsur kaldığı bildiriliyor.',
     'Bölgeye yakın bir donanma komutanının — aynı zamanda tanınmış bir doğa bilimcisinin — halkı tahliye etmek ve olayı yakından görmek için gemilerle karşı kıyıya geçtiği, ancak zehirli gaz bulutunda hayatını kaybettiği öğrenildi. Körfezin öte yakasından felaketi izleyen genç bir yeğeninin gördüklerini not ettiği, bu kayıtların olayın tek görgü tanığı anlatısı olabileceği belirtiliyor.',
     'Kayıp boyutunun günler içinde netleşmesi bekleniyor; binlerce kişinin öldüğünden korkuluyor. Uzmanlar, külün altında bir anda donan kentin — sofradaki ekmeği, duvardaki yazısı, sokaktaki insanıyla — ileride “antik yaşamın en eksiksiz fotoğrafı” olarak ortaya çıkabileceğini söylüyor.'
   ]},
  {slug:'malazgirt',cat:'savas',md:'08-26',tarih:'26 Ağustos 1071',yil:'1071',yer:'MALAZGİRT',img:'/assets/haber/malazgirt.jpg',
   baslik:'İmparator esir: Anadolu’nun kapısı ardına dek açıldı',
   spot:'Sultan Alp Arslan’ın ordusu, Bizans imparatoru Romen Diyojen’i Malazgirt’te bozguna uğrattı. İmparator sağ ele geçirildi.',
   pull:'Bir imparator esir; bir kıtanın kapısı aralandı.',
   govde:[
     'Selçuklu Sultanı Alp Arslan komutasındaki ordu, bugün Malazgirt Ovası’nda Bizans imparatoru Romanos Diogenes’in sayıca çok üstün ordusunu bozguna uğrattı. İmparator savaş meydanında sağ olarak esir alındı — Bizans tarihinde ender görülen bir olay.',
     'Selçuklu kuvvetlerinin, bozkır savaşının klasik taktiğini ustaca uyguladığı belirtiliyor. Hilal biçiminde açılan ordunun sahte çekilmelerle Bizans hattını ovanın içine doğru çektiği, düşman düzeni gerildikçe kanatlardan sarma manevrasına giriştiği aktarılıyor. Bir okçu, “Onları ovanın ortasına çektik, sonra çember kapandı” dedi.',
     'Bozgunu hızlandıran gelişmenin, Bizans ordusunun içinden geldiği öğrenildi. Ardçı kuvvetlerin başındaki komutan Andronikos Dukas’ın, imparatoru destekleyeceğine kritik anda birlikleriyle geri çekildiği; bu ayrılığın “savaş kaybedildi” söylentisini yayarak paniği tetiklediği belirtiliyor. Kimi kaynaklar bunu açık bir ihanet, kimileri ise kopuk haberleşmenin yol açtığı bir çözülme olarak değerlendiriyor.',
     'Sultan Alp Arslan’ın esir imparatora saygılı davrandığı, onu sofrasına oturttuğu ve bir barış antlaşmasının ardından serbest bıraktığı bildirildi. Ancak Diogenes’in başkente döndüğünde tahtını kaybetmiş, hatta gözden çıkarılmış olabileceği konuşuluyor.',
     'Askerî gözlemciler, bu zaferin ardından Anadolu’nun içlerinin Türk boylarına açılacağını ve bölgenin kalıcı bir kültürel dönüşüme gireceğini değerlendiriyor. Kimi çevreler, Bizans’ın bu darbenin yaralarını sarmak için Batı’dan yardım isteyeceğini ve bu çağrının uzun vadede Haçlı Seferleri’ni tetikleyebileceğini öne sürüyor.'
   ]},
  {slug:'marat-suikasti',cat:'sir',md:'07-13',tarih:'13 Temmuz 1793',yil:'1793',yer:'PARİS',img:'/assets/haber/marat-suikasti.jpg',
   baslik:'Devrimin sesi banyoda öldürüldü',
   spot:'Gazeteci ve devrim önderi Jean-Paul Marat, cilt hastalığı için girdiği küvette bıçaklanarak öldürüldü. Katil kapıdan bizzat girmişti.',
   pull:'Bir kalem, bir bıçak, bir tablo — ve bitmeyen bir hesap.',
   govde:[
     'Devrimin en sert kalemlerinden gazeteci Jean-Paul Marat, bugün Paris’teki evinde, cilt hastalığı nedeniyle uzun saatler geçirdiği küvette bıçaklanarak öldürüldü. Küvette çalışmaya alışkın olan Marat’ın, saldırganı bizzat içeri kabul ettiği bildirildi.',
     'Saldırganın, taşradan gelen 24 yaşındaki Charlotte Corday olduğu açıklandı. Corday’ın, ihbar edeceği isimlerin listesini getirdiğini söyleyerek görüşme kopardığı, kısa konuşmanın ardından sakladığı bıçağı tek darbede Marat’ın göğsüne sapladığı belirtiliyor. Görgü tanıkları, Marat’ın son çığlığıyla evi ayağa kaldırdığını anlatıyor.',
     'Corday olay yerinde yakalandı. Sorgusunda pişmanlık göstermediği, eylemini “yüz bin kişiyi kurtarmak için bir adamı öldürdüm” sözleriyle savunduğu öğrenildi. Marat’ı geçen yılki Eylül Katliamları’ndan sorumlu tuttuğu ve devrimin gidişatını durdurmak istediği belirtiliyor.',
     'Cinayetin, devrimin şiddet sarmalını yatıştırmak bir yana daha da körükleyeceğinden endişe ediliyor. Marat’ı yücelten çevrelerin onu bir “devrim şehidi” ilan etme hazırlığında olduğu, kentte gerginliğin tırmandığı bildirildi.',
     'Marat’ın küvetteki son anlarının, yakın dostu ressam Jacques-Louis David’in bir tablosuyla ölümsüzleşeceği konuşuluyor. Bir kaynağa göre David, elinde kalemi ve Corday’ın kanlı mektubuyla uzanan Marat’ı, adeta bir azizi resmeder gibi çizmeye başladı bile. Corday’ın birkaç gün içinde yargılanıp giyotine gönderilmesi bekleniyor.'
   ]},
  {slug:'termopylae',cat:'savas',md:'',tarih:'MÖ 480, yaz',yil:'MÖ 480',yer:'TERMOPYLAE',img:'/assets/haber/termopylae.jpg',
   baslik:'Dar geçit tutuldu: Küçük kuvvet dev orduyu günlerce oyaladı',
   spot:'Kral Leonidas komutasındaki seçkin birlik, Pers ordusunu Termopylae’nin dar boğazında durdurdu. İhanetle açılan patika her şeyi değiştirdi.',
   pull:'Sayı değil, zemin konuştu.',
   govde:[
     'Sparta Kralı Leonidas komutasındaki küçük ama seçkin Yunan birliği, sayıca kat kat üstün Pers ordusunu Termopylae’nin dar dağ geçidinde günlerce durdurdu. Dağlar ile deniz arasına sıkışan boğazda, Pers ordusunun ezici sayısal üstünlüğü bir işe yaramadı; savaş, geçidin darlığında bire bir bir boğuşmaya dönüştü.',
     'İlk günlerde Pers hücumlarının birbiri ardına kırıldığı, kralın en seçkin muhafız birliğinin bile geçidi aşamadığı belirtiliyor. Dar cephede aynı anda ancak az sayıda askerin çarpışabilmesi, ağır zırhlı Yunan hoplitlerine büyük üstünlük sağladı.',
     'Savunmanın, bir yerlinin gizli bir dağ patikasını düşmana göstermesiyle çöktüğü belirtiliyor. Bu patikadan dolanan Pers birliklerinin Yunanları arkadan sarmaya başladığı öğrenildi. Kuşatıldığını anlayan Leonidas’ın, ordusunun büyük bölümünü geri gönderip en yakın adamlarıyla — ve geri çekilmeyi reddeden birkaç müttefik kentin askeriyle — mevzide kaldığı bildirildi.',
     'Geride kalan birliğin son ana dek çarpıştığı, kralın da bu çarpışmada düştüğü aktarılıyor. Bir komutan, “Az sayıda ama doğru mevzilenmiş asker, orduları oyalayabilir” dedi. Askerî çevreler, savaşın taktik açıdan bir yenilgi olsa da moral açıdan Yunan direnişini alevlendireceği görüşünde.',
     'Geçidin düşmesiyle Pers ilerleyişinin güneye, Atina yönüne kaydığı öğrenildi. Ancak gözlemciler, bu küçük kuvvetin kazandırdığı zamanın Yunan kentlerine toparlanma fırsatı verdiğini; asıl hesaplaşmanın denizde ve ovada görüleceğini belirtiyor.'
   ]},
  {slug:'iskender-olumu',cat:'sir',md:'06-11',tarih:'11 Haziran MÖ 323',yil:'MÖ 323',yer:'BABİL',img:'/assets/haber/iskender-olumu.jpg',
   baslik:'Büyük İskender 32 yaşında öldü: Sebep hâlâ tartışmalı',
   spot:'Üç kıtaya yayılan imparatorluğun sahibi Babil’de aniden hastalanıp öldü. Zehir mi, humma mı — kaynaklar çelişiyor.',
   pull:'“Krallığı en güçlüye” — ve savaş başladı.',
   govde:[
     'Üç kıtaya yayılan bir imparatorluk kuran Makedon kralı Büyük İskender, bugün Babil Sarayı’nda 32 yaşında hayatını kaybetti. On günlük ateşli bir hastalığın ardından gelen ölüm, sarayı ve orduyu şoka soktu. Batıda Yunanistan’dan doğuda Hindistan sınırına uzanan devasa ülke, bir gecede sahipsiz kaldı.',
     'Ölümün nedeni tartışmalı: bazı kaynaklar aşırı içki, yorgunluk ve bir bataklık hummasını işaret ederken, bazıları zehirlenme ihtimalini konuşuyor. Kralın son günlerinde yüksek ateşle yattığı, giderek konuşma ve hareket yeteneğini yitirdiği aktarılıyor. Askerlerinin, ölmek üzere olan komutanlarını görmek için odasının önünden tek tek geçtiği bildirildi.',
     'Yakın çevresinden bir subay, “Krallığı kime bırakıyorsun?” sorusuna kralın “en güçlü olana” yanıtını verdiğini aktardı. Bu belirsiz vasiyetin, generaller arasında daha cenaze kalkmadan bir güç mücadelesini ateşlediği belirtiliyor.',
     'Naaşının olağandışı biçimde uzun süre bozulmadan kaldığı yönündeki söylentiler kentte konuşuluyor; kimi bunu kutsallık işareti sayıyor, kimi ise ölümün sanılandan geç gerçekleştiğine yoruyor. Cenazenin nereye ve nasıl gömüleceği bile şimdiden bir çekişme konusu.',
     'Gözlemciler, halefini net biçimde belirlemeden ölen kralın ardından imparatorluğun generaller — “Diadokhlar” — arasında paylaşılacağı ve uzun, kanlı savaşların kapıda olduğu uyarısını yapıyor. Tek bir çatı altında toplanan Doğu ile Batı’nın yeniden parçalara ayrılabileceği belirtiliyor.'
   ]},
  {slug:'kartaca',cat:'savas',md:'',tarih:'MÖ 146',yil:'MÖ 146',yer:'KARTACA',img:'/assets/haber/kartaca.jpg',
   baslik:'Kartaca yerle bir edildi: Bir kent haritadan silindi',
   spot:'Üç Pön Savaşı’nın sonunda Roma rakibi Kartaca’yı kuşatıp yaktı. “Toprağa tuz ekildiği” ise büyük olasılıkla sonraki bir efsane.',
   pull:'Akdeniz’in en zengin limanı, günlerce yandı.',
   govde:[
     'Yüzyıllık rekabetin ardından Roma orduları, Kuzey Afrika’nın büyük ticaret kenti Kartaca’yı ele geçirip ateşe verdi. Üçüncü Pön Savaşı, bir uygarlığın sonuyla kapandı. Bir zamanlar Akdeniz’in en zengin limanı olan kentin, artık yalnızca bir yangın yeri olduğu bildiriliyor.',
     'Roma senatosunda yıllardır her konuşmanın sonuna eklenen “Ceterum censeo — Kartaca yıkılmalıdır” çağrısının nihayet yerine geldiği konuşuluyor. Kuşatmayı yürüten Romalı komutanın, aylarca süren ablukanın ardından kente son hücumu emrettiği belirtiliyor.',
     'Kentin sokak sokak, ev ev savunulduğu; son direnişin, limana bakan Byrsa Tepesi’ndeki kalede kırıldığı aktarılıyor. Kütüphaneleri, tapınakları ve tersaneleriyle bir dünya kenti olan Kartaca’nın, günlerce süren yangında yok olduğu bildirildi. Sağ kalanların köle pazarına sürüldüğü öğrenildi.',
     'Halk arasında yayılan “toprağa tuz ekilip bir daha ekin bitmesin diye lanetlendiği” anlatısının ise, olaydan çok sonra doğmuş bir efsane olduğu değerlendiriliyor. Yıkımın kendisi, bu tür süslemelere zaten ihtiyaç bırakmayacak kadar tam.',
     'Gözlemciler, bu zaferle Roma’nın Batı Akdeniz’in tek egemen gücü hâline geldiğini vurguluyor. Aynı yıl doğuda bir başka büyük kentin daha Roma’nın önünde diz çöktüğü hatırlatılarak, Akdeniz’in bir “Roma gölüne” dönüşme yolunda olduğu belirtiliyor.'
   ]},
  {slug:'roma-yagmasi',cat:'savas',md:'08-24',tarih:'24 Ağustos 410',yil:'410',yer:'ROMA',img:'/assets/haber/roma-yagmasi.jpg',
   baslik:'Ebedi şehir yağmalandı: Roma 800 yıl sonra ilk kez düştü',
   spot:'Alarik komutasındaki Vizigotlar üç gün boyunca Roma’yı yağmaladı. “Yıkılmaz” sanılan kent sarsıldı.',
   pull:'“Roma düşmez” inancı, üç günde çatladı.',
   govde:[
     'Sekiz yüz yıldır surlarında düşman yüzü görmeyen Roma, bugün Alarik komutasındaki Vizigot ordusunun eline geçti. Kent üç gün boyunca yağmalandı. Bir yabancı ordunun Roma’yı bu şekilde ele geçirmesi, sekiz asrı aşkın bir aradan sonra ilk kez yaşanıyor.',
     'Yıllardır imparatorlukla pazarlık yürüten, toprak ve erzak talep eden Alarik’in, taleplerinin karşılıksız kalması üzerine kenti kuşattığı belirtiliyor. Açlık ve kuşatmayla tükenen şehirde, kapılardan birinin içeriden açıldığı, ordunun geceleyin kente bu gedikten girdiği öne sürülüyor.',
     'Yağmanın ağırlıklı olarak zenginliğe yönelik olduğu, Vizigotların Hristiyan oldukları için başlıca kiliselere ve buralara sığınanlara dokunmadığı bildirildi. Üç günün sonunda ordunun ganimetle güneye çekildiği öğrenildi. Bir kentli, “Roma’nın düşebileceğine kimse inanmazdı” dedi.',
     'Olayın maddi zarardan çok manevi bir sarsıntı yarattığı belirtiliyor. “Ebedi şehrin” dokunulmazlığına duyulan inancın çöküşü, imparatorluğun dört bir yanında derin bir şok dalgası yarattı; kimi çevreler felaketi eski tanrıların terk edilmesine, kimileri ise çürümüş bir düzenin faturasına bağlıyor.',
     'Tarih yazarları, bu yağmayı Batı Roma’nın uzun çöküşünün en görünür işaretlerinden biri olarak kaydediyor. Başkentin çoktan başka kentlere taşınmış olmasına rağmen, Roma’nın simgesel değerinin bu darbeyle onarılmaz biçimde çatladığı; olayın çağdaşlarca adeta bir dünyanın sonu gibi karşılandığı belirtiliyor.'
   ]},
  {slug:'grek-atesi',cat:'bilim',md:'',tarih:'672 civarı',yil:'672',yer:'İSTANBUL',img:'/assets/haber/grek-atesi.jpg',
   baslik:'Bizans’ın gizli silahı: Suda bile sönmeyen ateş',
   spot:'Tunç borulardan fışkıran, su üstünde yanmaya devam eden bir sıvı ateş düşman donanmalarını yaktı. Formülü devlet sırrıydı.',
   pull:'Su döktükçe daha çok yandı.',
   govde:[
     'Bizans donanması, deniz savaşlarında düşman gemilerini yakan olağanüstü bir silah kullanıyor: gemilerin başındaki tunç borulardan basınçla fışkıran ve su üstünde bile sönmeyen bir sıvı ateş. “Grek Ateşi” denen bu silahın, başkenti büyük deniz kuşatmalarından defalarca kurtardığı belirtiliyor.',
     'Silahın, başkente sığınan bir mühendis tarafından geliştirildiği rivayet ediliyor. Ateşin bir tür pompa ve ısıtma düzeneğiyle borudan püskürtüldüğü, hedefe yapışıp yanmaya devam ettiği aktarılıyor. Suyla söndürülemediği için düşman gemilerinin çaresiz kaldığı bildirildi.',
     'Karışımın bileşimi devlet sırrı olarak korunuyor; formülü yalnızca birkaç ailenin bildiği, kuşaktan kuşağa gizlice aktarıldığı söyleniyor. Uzmanlar, karışımın ham petrol, reçine, kükürt ve çeşitli katkılardan oluşabileceğini tahmin ediyor. Bir denizci, “Alevin suya değince yayıldığını gözlerimle gördüm” dedi.',
     'Sırrın bu denli iyi saklanması, silahın caydırıcılığını artırıyor: düşman, karşılaştığı tehdidin ne olduğunu ve nasıl korunacağını bilmiyor. Kimi kaynaklar, birkaç büyük kuşatmanın tam da bu silah sayesinde püskürtüldüğünü öne sürüyor.',
     'Gözlemciler Grek Ateşi’ni, tarihin bilinen ilk “gizli askerî teknolojilerinden” biri olarak niteliyor. Bir devletin, tek bir buluşu sır olarak koruyarak yüzyıllarca stratejik üstünlük sağlamasının çarpıcı bir örneği olduğu belirtiliyor.'
   ]},
  {slug:'kudus-1099',cat:'savas',md:'07-15',tarih:'15 Temmuz 1099',yil:'1099',yer:'KUDÜS',img:'/assets/haber/kudus-1099.jpg',
   baslik:'Kudüs kuşatması sona erdi: Şehir el değiştirdi',
   spot:'Birinci Haçlı Seferi’nin orduları, aylarca süren kuşatmanın ardından Kudüs surlarını aştı. Kentin düşüşü ağır bir bilançoyla anıldı.',
   pull:'Kutsal şehir el değiştirdi; hesap yüzyıllara yayıldı.',
   govde:[
     'Yıllar süren zorlu bir yolculuğun ve haftalarca süren kuşatmanın ardından Birinci Haçlı Seferi’nin orduları bugün Kudüs’ü ele geçirdi. Kentin surları, ağaçtan yapılan kuşatma kuleleri ve merdivenlerle aşıldı.',
     'Su ve erzak sıkıntısıyla geçen haftaların ordu içinde bunalıma yol açtığı, komutanların son bir genel hücum kararı aldığı belirtiliyor. Sahilden getirilen keresteyle inşa edilen hareketli kulelerden birinin surlara dayanmasıyla savunmanın kritik bir noktadan yarıldığı bildirildi.',
     'Kentin düşüşünün, dönemin anlatılarında son derece ağır bir bilanço olarak kaydedildiği belirtiliyor. Sokaklarda yaşandığı öne sürülen kıyımın ölçüsü tarihçiler arasında tartışmalı; kimi kaynakların rakamları abartılı bulunuyor. Yine de olayın büyük bir şiddet içerdiği konusunda görüş birliği var.',
     'Kentte kurulacak yeni Latin yönetiminin bölgedeki dengeleri kökten değiştireceği değerlendiriliyor. Haçlı önderlerinin, ele geçirilen topraklarda kalıcı devletler kurma hazırlığında olduğu öğrenildi.',
     'Gözlemciler, Kudüs’ün el değiştirmesinin bir sonuç değil, bir başlangıç olduğu görüşünde. Bölgede iki yüzyıl sürecek bir mücadelenin fitilinin ateşlendiği; bu kentin daha nice kez el değiştireceği belirtiliyor.'
   ]},
  {slug:'bagdat-1258',cat:'felaket',md:'02-13',tarih:'13 Şubat 1258',yil:'1258',yer:'BAĞDAT',img:'/assets/haber/bagdat-1258.jpg',
   baslik:'Bağdat yıkıldı: Bilgelik Evi Dicle’ye döküldü',
   spot:'Hülagü’nün Moğol ordusu İslam dünyasının bilim başkentini kuşatıp aldı. Rivayete göre nehir mürekkepten günlerce siyah aktı.',
   pull:'Nehir, günlerce mürekkepten aktı.',
   govde:[
     'İslam dünyasının beş asırlık bilim ve kültür başkenti Bağdat, bugün Hülagü Han komutasındaki Moğol ordusunun eline geçti. Yüz binlerce nüfuslu kent, kısa süren bir kuşatmanın ardından düştü ve günlerce yağmalandı. Abbasi halifeliğinin de bu düşüşle fiilen sona erdiği bildiriliyor.',
     'Kentin, surları aşan Moğol ordusuna uzun süre dayanamadığı belirtiliyor. Son halifenin teslim görüşmelerinin sonuçsuz kaldığı, kentin kapılarının zorlandığı öğrenildi. Yağma ve kıyımın günlerce sürdüğü, kayıpların çağdaş anlatılarda çok yüksek verildiği aktarılıyor.',
     'Efsaneye göre, dünyanın en büyük ilim merkezlerinden biri olan “Beytü’l-Hikme” (Bilgelik Evi) kütüphanesindeki sayısız kitap Dicle’ye atıldı; nehrin, mürekkebin akan suyla karışmasıyla günlerce simsiyah aktığı anlatılıyor. Bir kâtip, “Yüzyılların birikimi bir haftada dağıldı” dedi.',
     'Kentteki yıkımın, yalnızca bir başkentin değil, matematikten tıbba, astronomiden felsefeye uzanan bir çağın ilim mirasının kaybı anlamına geldiği belirtiliyor. Sağ kalan âlimlerin çevre kentlere dağıldığı öğrenildi.',
     'Tarih yazarları, çağdaşların olayı adeta “dünyanın ışığının sönmesi” olarak yaşadığını kaydediyor. İslam dünyasının entelektüel merkezinin bu darbeyle Bağdat’tan başka merkezlere kayacağı; bölgenin siyasi haritasının Moğol hâkimiyetiyle yeniden çizileceği değerlendiriliyor.'
   ]},
  {slug:'kara-olum',cat:'felaket',md:'',tarih:'1347, sonbahar',yil:'1347',yer:'AKDENİZ',img:'/assets/haber/kara-olum.jpg',
   baslik:'Kara Ölüm limanlara ulaştı: Salgın hızla yayılıyor',
   spot:'Gemilerle taşınan veba, birkaç yıl içinde Avrupa nüfusunun büyük bölümünü yok etti. Kentler kapılarını kapatmaya başladı.',
   pull:'Gemiler yanaştı; kentler kapılarını kapadı.',
   govde:[
     'Doğu limanlarından gelen ticaret gemileriyle Akdeniz kıyılarına ulaşan ölümcül bir salgın hızla yayılıyor. İlk vakaların, Sicilya’nın Messina limanına yanaşan gemilerde — güvertesinde ölülerin ve ağır hastaların bulunduğu belirtilen gemilerde — görüldüğü bildirildi. “Kara Ölüm” denen hastalığın iç bölgelere de sıçramasından korkuluyor.',
     'Hastalığın, kara lekeler ve şişkin urlarla seyrettiği; kimi hastaların birkaç gün içinde öldüğü aktarılıyor. Bulaş yolu tam bilinmese de, kimi hekimler hastalığın gemilerdeki farelerin taşıdığı pireler yoluyla yayıldığından şüpheleniyor. Elde avuçta işe yarar bir çare bulunmadığı belirtiliyor.',
     'Bazı kentlerin, gelen gemileri belirli bir süre karaya yanaştırmayarak “kırk gün” bekletmeye başladığı — bu uygulamanın bugün karantina olarak anıldığı — bildirildi. Kapılarını kapatan, panzehir arayan, hatta günah çıkarmak için sokaklara dökülen toplulukların haberleri geliyor.',
     'Ölü sayısının bazı yerleşimlerde nüfusun yarısına yaklaştığı, mezarlıkların dolduğu, toplu çukurların açıldığı belirtiliyor. Kimi köylerin tamamen boşaldığı, tarlaların biçilmeden kaldığı öğrenildi.',
     'Uzmanlar, salgının yalnızca can kaybı değil; sağ kalanların değerini artıran bir işçi kıtlığı, çöken üretim ve köklü bir toplumsal altüst oluş da getireceği uyarısında bulunuyor. Orta Çağ’ın alışılmış düzeninin bu salgından sonra bir daha eskisi gibi olmayabileceği değerlendiriliyor.'
   ]},
  {slug:'timur-olumu',cat:'siyaset',md:'02-18',tarih:'18 Şubat 1405',yil:'1405',yer:'OTRAR',img:'/assets/haber/timur-olumu.jpg',
   baslik:'Timur Çin seferinde öldü: Dev ordu geri döndü',
   spot:'Asya’yı titreten cihangir, büyük Çin seferinin başında Otrar’da hastalanıp öldü. Sefer daha başlamadan bitti.',
   pull:'Sefer başlamadan bitti; ordu geri döndü.',
   govde:[
     'Asya’nın büyük bölümünü hâkimiyeti altına alan cihangir Timur, uzun süredir hazırladığı Çin seferinin henüz başında, Otrar’da hastalanarak hayatını kaybetti. Kışın ortasında yola çıkan yüz binlerce kişilik ordu, komutanının ölümüyle durdu.',
     'Timur’un, dünyanın en güçlü devletlerinden birine — Çin’e — karşı çıktığı bu seferi hayatının zirvesi olarak gördüğü belirtiliyor. Ancak sert kış koşullarının ve ilerlemiş yaşının hükümdarı yolda yatağa düşürdüğü, kısa sürede öldüğü aktarılıyor.',
     'Ölüm haberinin ordu içinde gizli tutulmaya çalışıldığı, ancak toplanan devasa kuvvetin kısa sürede dağılmaya başladığı bildirildi. Sefer için biriktirilen tüm hazırlığın bir anda anlamını yitirdiği belirtiliyor. Timur’un naaşının başkent Semerkant’a taşınacağı öğrenildi.',
     'Hükümdarın ölümünün, kurduğu geniş imparatorluk içinde daha cenaze kalkmadan bir taht mücadelesini tetiklediği konuşuluyor. Oğulları ve torunları arasında hâkimiyet kavgasının kapıda olduğu belirtiliyor. Timur’un mezarına dair sonradan doğacak “lanet” anlatılarının şimdiden dilden dile dolaştığı da öğrenildi.',
     'Gözlemciler, imparatorluğun kısa sürede parçalanabileceğini; ancak Timur’un mirasının, özellikle torunları eliyle bilim ve sanatta parlak bir çağa dönüşebileceğini değerlendiriyor. Semerkant’ın, gökyüzünü inceleyen bir hükümdar torunun elinde bir ilim merkezine dönüşebileceği konuşuluyor.'
   ]},
  {slug:'fatih-olumu',cat:'sir',md:'05-03',tarih:'3 Mayıs 1481',yil:'1481',yer:'GEBZE',img:'/assets/haber/fatih-olumu.jpg',
   baslik:'Fatih ani öldü: Zehir şüphesi konuşuluyor',
   spot:'Yeni bir sefere çıkan Fatih Sultan Mehmed yolda aniden hastalanıp öldü. Ölümün ardındaki neden o günden beri tartışılıyor.',
   pull:'Hedefi gizli sefer, sultanla birlikte durdu.',
   govde:[
     'İstanbul’un fatihi Sultan II. Mehmed, yeni bir sefere çıktığı sırada bugün Gebze yakınlarındaki ordugâhta aniden hastalanarak hayatını kaybetti. Seferin hedefinin sıkı biçimde gizli tutulduğu, ordunun dahi nereye yöneleceğini bilmediği bildirildi. Bu gizlilik, sultanın ölümünün ardından pek çok soru işareti bıraktı.',
     'Ölümün nedeni tartışmalı: bazı kaynaklar sultanın uzun süredir çektiği ağır bir rahatsızlığa — gut ya da benzeri bir hastalığa — işaret ederken, bazıları zehirlenme ihtimalini konuşuyor. Saray çevresinden bir görevli, “Çok ani oldu” demekle yetindi; kesin bir bulgu paylaşılmadı.',
     'Hükümdarın son yıllarda tuttuğu hekimlerden birinin adının, zehir söylentileriyle birlikte anıldığı öğrenildi. Ancak bu iddiaların doğrulanmadığı, konunun bir “açık dosya” olarak kaldığı belirtiliyor.',
     'Ölüm haberinin başkente ulaşmasıyla taht için hazırlıkların başladığı, hanedan içinde iki şehzade — Bayezid ile Cem — arasında gerginliğin tırmandığı öğrenildi. Yeniçeriler arasında hareketlilik olduğu, İstanbul’da tedirgin bir bekleyiş hâkim olduğu bildirildi.',
     'Gözlemciler, otuz yıl boyunca bir çağı kapatıp yenisini açan bir hükümdarın ardında bıraktığı bu ani ölümün, tıpkı hayatı gibi uzun süre tartışılacağını değerlendiriyor. Fatih’in yarım kalan seferinin hedefinin ne olduğu ise belki de hiç öğrenilemeyecek.'
   ]},
  {slug:'tutankamun-hancer',cat:'bilim',md:'',tarih:'MÖ 1323',yil:'MÖ 1323',yer:'KRALLAR VADİSİ',img:'/assets/haber/tutankamun-hancer.jpg',
   baslik:'Firavunun hançeri gökten: Meteor demirinden yapılmış',
   spot:'Tutankamun’un mezarından çıkan hançerin, o çağda eşi görülmemiş bir malzemeden — gökten düşen meteor demirinden — yapıldığı anlaşıldı.',
   pull:'Firavun, gökten düşen bir metali kuşanmış.',
   govde:[
     'Genç firavun Tutankamun’un defin hazırlıklarında dikkat çeken bir eser, uzmanları şaşırttı: kralın bedenine sarılan sargıların arasına konan bir hançerin, çağın bilinen madenlerinden değil, gökten düşen meteor demirinden yapıldığı belirlendi. Altın işçiliğinin doruğunda bir uygarlıkta, asıl değerli görülen şeyin bu demir olması dikkat çekiyor.',
     'Bıçağın, bronzun hüküm sürdüğü, demir işçiliğinin ise henüz yaygınlaşmadığı bir çağda üretilmiş olması, eseri olağanüstü kılıyor. Binlerce yıl paslanmadan kalması da onu benzerlerinden ayırıyor.',
     'İncelemeyi yürüten uzmanların, taşınabilir bir ışın cihazıyla yaptıkları ölçümlerde bıçağın yüksek oranda nikel — yüzde ona yakın — ve az miktarda kobalt içerdiğini saptadıkları bildirildi. Bu oranların, yeryüzü demirinde değil, ancak gökten düşen demir göktaşlarında görüldüğü belirtiliyor.',
     'Bir saray ustası, eski Mısır’ın gökten düşen metale “gökyüzünün demiri” dediğini ve bu malzemeyi kutsal saydığını hatırlattı. Hançerin, bu inancın somut bir kanıtı olduğu değerlendiriliyor.',
     'Uzmanlar, eserin hem bir statü sembolü hem de dönemin gök cisimlerine yüklediği kutsallığın bir belgesi olduğu görüşünde. Bir firavunun öbür dünyaya, tam anlamıyla “gökten inen” bir silahla uğurlanmış olması, çağın gökyüzüyle kurduğu ilişkiye ışık tutuyor.'
   ]},
  {slug:'otzi',cat:'sir',md:'',tarih:'MÖ ~3300',yil:'MÖ 3300',yer:'ÖTZTAL ALPLERİ',img:'/assets/haber/otzi.jpg',
   baslik:'5300 yıllık cinayet: Buz Adam sırtından vurulmuş',
   spot:'Alp buzullarında donmuş bulunan “Ötzi”, çağının en iyi korunmuş insanı. İncelemeler onun bir suç kurbanı olduğunu ortaya koydu.',
   pull:'Beş bin yıllık en eski “soğuk vaka”.',
   govde:[
     'Alp buzullarında donmuş hâlde korunan Bakır Çağı’ndan bir adam — “Ötzi” — çağının en iyi korunmuş insanı olarak kayıtlara geçti. Dövmeleri, giysileri, silahları ve son yemeğiyle birlikte donan beden, taş devri yaşamına eşsiz bir pencere açtı. Bedenin, adeta olay yerinden hiç oynatılmamış bir kanıt gibi bozulmadan kaldığı belirtiliyor.',
     'İlk bakışta bir dağ kazası sanılan olay, sol omza saplanmış bir ok ucunun bulunmasıyla bambaşka bir yöne döndü. Bu ucun, adamın ana atardamarını kestiği ve onun dakikalar içinde kan kaybından öldüğü belirlendi. Okun arkadan ve aşağıdan geldiği; saldırganın yamaçta daha aşağıda durup uzaktan ateş ettiği değerlendiriliyor.',
     'Bedenin sağ elinde, bıçak kavramaktan doğduğu düşünülen derin bir savunma yarası bulundu. Bu yaranın iyileşmeye başlamış olması, ölümden birkaç gün önce başka bir boğuşma yaşandığına işaret ediyor. Uzmanlar, “Bu bir tek olay değil, günlere yayılan bir kovalamaca olabilir” diyor.',
     'Çarpıcı bir ayrıntı da, saldırganın adamın en değerli eşyasına — o çağda küçük bir servet sayılan bakır baltasına — dokunmamış olması. Bu durum, olayın basit bir soygun olmadığını; kişisel bir hesaplaşma ya da bir topluluk kavgası olabileceğini düşündürüyor.',
     'Bedenindeki onlarca dövmenin, ağrıyan eklem ve bel noktalarına denk geldiği; bunun bir tür tedavi amacı taşıyabileceği belirtiliyor. Uzmanlar, beş bin yıldır açık kalan bu dosyayı tarihin bilinen en eski “soğuk vakası” olarak niteliyor.'
   ]},
  {slug:'vasa',cat:'felaket',md:'08-10',tarih:'10 Ağustos 1628',yil:'1628',yer:'STOCKHOLM',img:'/assets/haber/vasa.jpg',
   baslik:'Gururun batışı: Vasa ilk seferinde battı',
   spot:'İsveç’in en görkemli savaş gemisi Vasa, limandan ayrıldıktan birkaç dakika sonra hafif bir rüzgârla yan yatıp battı.',
   pull:'Gösteriş, mühendisliğin önüne geçti.',
   govde:[
     'İsveç’in en görkemli savaş gemisi olarak tanıtılan Vasa, bugün Stockholm Limanı’ndan ayrıldıktan yalnızca birkaç dakika ve bir kilometreyi aşkın kısa bir yol sonra battı. Faciayı, töreni izlemek için kıyıya toplanan kalabalık kendi gözleriyle gördü.',
     'Yüzlerce oymanın ve yaldızlı heykelin süslediği geminin, gövdesine göre fazla yüksek ve tepesi ağır tasarlandığı belirtiliyor. Onlarca ağır bronz topun büyük bölümünün üst güvertelere yerleştirildiği, buna karşılık gemiyi dengede tutacak safranın yetersiz kaldığı bildirildi.',
     'Geminin, ilk güçlü esintide yana yattığı; ikinci bir rüzgâr darbesiyle iyice devrildiği aktarılıyor. Selam atışı için açılan alt kat top kapaklarının, su hattına yalnızca birkaç adım mesafede olduğu; gemi yan yatınca bu açık kapaklardan içeri suyun dolduğu belirtildi. Bir tersane tanığı, “Su top kapaklarından girdi, gemi dakikalar içinde dibi boyladı” dedi.',
     'Kayıpların ve sorumluluğun soruşturulacağı bildirildi. Sağ kurtulan kaptanın derhal sorguya alındığı, kısa süre içinde bir kurul önünde geminin neden battığının araştırılacağı öğrenildi. Ancak geminin ölçülerinin en tepeden verilen talimatlarla belirlendiği düşünülürse, kesin bir suçlu bulunmasının zor olduğu belirtiliyor.',
     'Gözlemciler, bu görkemli başarısızlığın ileride hiç beklenmedik bir hazineye dönüşebileceğini söylüyor: soğuk suyun dibinde neredeyse hiç bozulmadan kalan geminin, bir gün su yüzüne çıkarıldığında koca bir çağı olduğu gibi gözler önüne serebileceği değerlendiriliyor.'
   ]},
  {slug:'ea-nasir',cat:'ekonomi',md:'',tarih:'MÖ ~1750',yil:'MÖ 1750',yer:'UR',img:'/assets/haber/ea-nasir.jpg',
   baslik:'Tarihin ilk şikâyeti: “Bana kötü bakır gönderdin”',
   spot:'3750 yıllık bir kil tablet, memnuniyetsiz bir müşterinin bakır tüccarı Ea-Nasir’e yazdığı sert şikâyet mektubu çıktı.',
   pull:'“Beni ne sanıyorsun sen?”',
   govde:[
     'Antik Ur kentinden çıkarılan bir kil tablet, insanlık tarihinin bilinen en eski müşteri şikâyeti olarak dikkat çekiyor. Nanni adlı bir müşterinin, bakır tüccarı Ea-Nasir’e yazdığı çivi yazılı mektup, hem gönderilen malın kalitesiz oluşundan hem de kendisine yapılan kötü muameleden yakınıyor.',
     'Tablette Nanni, tüccarın kaliteli bakır sözü verdiğini ancak sözünü tutmadığını; ulağının önüne kötü külçeler koyup “ister al ister git” dercesine davrandığını anlatıyor. Müşterinin sitemi tarihe geçen bir cümlede özetleniyor: “Beni ne sanıyorsun ki bana böyle davranıyorsun?”',
     'Kayıtlar, Ea-Nasir’e yalnızca Nanni’den değil, başka müşterilerden de benzer şikâyetler geldiğini gösteriyor. Aynı evde bulunan çok sayıda şikâyet tabletinin, tüccarın alışverişte pek de güvenilir biri olmadığına işaret ettiği belirtiliyor.',
     'Uzmanlar, tabletin ticaretin, sözleşmenin ve müşteri memnuniyetsizliğinin en az insanlık kadar eski olduğunu kanıtladığını vurguluyor. Yaklaşık dört bin yıl önce bir alışverişin bu kadar ayrıntılı biçimde kayda geçirilmiş olması, dönemin ticari hayatının ne denli kurumsallaştığını da gösteriyor.',
     'Bir araştırmacı, “Aradan yaklaşık dört bin yıl geçmiş ama duygu bugün de tanıdık: söz verilen kalite, çıkan başka mal, kırgın bir müşteri ve tutulmayan bir söz” dedi. Tabletin bugün bir müzede sergilendiği, çağdaş okurlar arasında büyük ilgi gördüğü belirtiliyor.'
   ]}
];

/* ── TARİH BORSASI (temsilî dönem fiyatları) ──
   Öğe: [ad (birim), fiyat, yön(1 ▲ / -1 ▼), star(en değerli)] */
var P2 = [
  ['OSMANLI ALTINI (sultani)','1.200 dinar',1,1],
  ['İPEK (libre)','300 dinar',-1],
  ['ROMA ALTINI (aureus)','25 dinar',1],
  ['KARABİBER (libre)','15 dinar',1],
  ['BUĞDAY (modius)','12 as',-1],
  ['PAPİRÜS (top)','2 drahmi',1],
  ['GÜMÜŞ (Atina)','1 drahmi',-1],
  ['TUZ (modius)','1 as',1]
];

/* ── KATEGORİ BÖLÜMLERİ ── */
var GRUPLAR=[
  {ad:'SAVAŞ & SİYASET',cats:['savas','siyaset']},
  {ad:'SIR DOSYALARI',cats:['sir']},
  {ad:'KEŞİF & BİLİM',cats:['bilim']},
  {ad:'FELAKET & EKONOMİ',cats:['felaket','ekonomi']}
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATS:CATS, HABER:HABER, P2:P2, GRUPLAR:GRUPLAR };
}
