/**
 * Naql Content Data and Constants
 * Contains all naql text content and reference abbreviations
 */

import React from 'react';
import './nuqool.css';

//
// REFERENCES (ABBREVIATIONS)
//

export const KHUDA_T = "Khuda e Ta'ala";
export const R_SAWS = "Rasool Allah S.A.W.S";
export const Q = "Qur'an";
export const MAS = "Mahdi e Ma'ud A.S";
export const HMAS = "Hazrat Mahdi A.S";
export const IMAS = "Imam Mahdi A.S"
export const AAS = "AanHazrat A.S";
export const HBM = "Hazrat Bandagi Miyan";
export const BM = "Bandagi Miyan";

// Books
export const MUW = "Ma'arij-ul-Wilayat";
export const SUW = "Shawahid-ul-Wilayat";
export const TUK = "Taswiyat-ul-Khatimain A.S"
export const NBMAR = "Naqliyat BM Abdul Rasheed RH"

//
// NAQL CONTENT
//

export const nuqoolObject = {
  1: (
    <p>
      Naql hai ke Hz. {MAS} ne farmaya agar koi shakhs bande se
      naql kare toh chahiye ke us naql ko dekhein. Agar {KHUDA_T} ke
      kalaam ke muwafiq hai to woh naql bande ki hai, aur agar {KHUDA_T} ke kalaam ke muwafiq nahi hai to woh naql bande ki nahi, ya woh shakhs
      hamari baat samjha nahi hai.
      <br />
      <br />
      <br />
      <cite>
        Insaaf Nama pgno: 5,
        <br />
        Siraj-ul-Absar pgno. 5,
        <br />
        {NBMAR} pgno. 1
      </cite>
    </p>
  ),
  2:  (
        <p>
          {HMAS} ne farmaya ke "<strong>hum kisi mazhab ke muqayyad nahi hain aur agar koi hamare sidq ko maloom karna chahta hai to us ko chahiye ke kalaam-e-khuda ki muwafiqat aur {R_SAWS} ki ittiba ka hamare ahwaal wa a'maal me dhoondein aur samajh lein.</strong>"
          <br />
          <br />
          <br />
          <cite>
            Aqeeda Sharifa pgno. 4
          </cite>
        </p>
      ),
  3: (
    <p>
      {HMAS} ne farmaya ke "<strong>jo shakhs mujhe naql karta hai agar woh naql {KHUDA_T} ke kalaam ke muwafiq hai to woh naql durust hai aur agar woh naql {KHUDA_T} ke kalaam ke muwafiq nahi hai to mujh se nahi hai ya naaqil ka dil sun'ne ke waqt haazir nahi raha hoga. Is liye sahu hua hai.</strong>
      <br />
      <br />
      <br />
      <cite>
        {NBMAR} pgno. 1
      </cite>
    </p>
  ),
  4: (
    <p>
      {HMAS} ne farmaya ke "<strong>meri naql woh hai jo mutabiq e {Q} ho."</strong>
      <br/><br/><br/>
      <cite>
        {MUW} pgno. 368
      </cite>
    </p>
  ),
  5: (
    <p>
      Naql hai {HBM} Dilawar R.Z ne farmaya <strong>"agar koi shakhs {Q} ki ayat {HMAS} ki naql se tatbeeq dein to (us ka bayan) sahih hai"</strong>
      <br/>
      Pas is ibaarat ko {HMAS} ke saamne Sahaba R.Z ne arz kiya. {HMAS} ne farmaya Jo shakhs fana ke darje ko pahuncha ho woh shakhs {Q} ki ayat ko naql se tatbeeq dega.
      <br/><br/><br/>
      <cite>Panj Fazail pgno. 100</cite>
    </p>
  ),
  6: (
    <p>
      Is majzoob ne apni naak se rassi nikal di us ke ba'ad {HMAS} se sawal kiya ke "{MAS} se koi baat posheeda nahi hai. Allah ki zaat ka bayan karo." {MAS} ne farmaya <strong>"Allah ki zaat bayan mein nahi aati. Allah ke sifaat bayan mein nahi aate hain lekin main beenai ki lazzat bayan karta hoon - 
      <br />
      ke kisi shakhs ke naak mein rassi daal kar tamaam zameen par phirayen aur us ko {KHUDA_T} ki beenai suyi ke soraakh mein hojaye to us ko aisi raahat ho phir woh kahe ke hum ko hazaar saal zameen par phirayen taake hum ko aisi raahat ho."</strong>
      <br /><br /><br />
      <cite>Hashiya pgno. 199</cite>
    </p>
  ),
  7: (
    <p>
      Pas Zunnoon isi tarteeb se aaya jab us ke aane ka balwa yaaron ke kaan mein pahuncha to ba'az yaaron ne kaha ke kis qadr qahhari aawazein aati hain yakayak balwa ka wuqoo hua ke Hindiyon ko qatl karne ke liye Meer Zunnoon aa raha hai us waqt ek mard (mard-e-khuda) ne {HMAS} ke huzoor mein arz kiya ke Aye Khudawand badshah ka wazir aata hai. Imam {MAS} ne us par tang (bezar) aakar farmaya ke badshah ek hai us ko wazir ki haajat nahi.
      <br /><br /><br />
      <cite>
        Hujjat-ul-Munsafeen pgno. 28
        <br />
        Jannat-ul-Wilayat pgno. 48
        <br />
        {SUW} pgno. 224
        <br />
        {MUW} pgno. 164
      </cite>
    </p>
  ),
  8: (
    <p>
      Naql hai {HMAS} ne farmaya <strong>"ma'roof Allah hi ki zaat hai."</strong>
      <br /><br /><br />
      <cite>
        Naqliyat Miyan Syed Alam (RH) pgno. 12
      </cite>
    </p>
  ),
  9: (
    <p>
      Naql hai {HMAS} ne farmaya ke <strong>"Aye baar-e-Khuda tu qaadir hai ke Adam A.S ko tu ne mitti se paida kiya aur Nooh A.S, Ibrahim A.S, Moosa A.S, Isa A.S aur Muhammad S.A.W.S ko bhi tune mitti se paida kiya aur {MAS} ko bhi tune mitti se paida kiya."</strong>
      <br /><br /><br />
      <cite>
        Naqliyat Miyan Syed Alam (RH) pgno. 87
        <br />
        Matla-ul-Wilayat pgno. 59
        <br />
        {MUW} pgno. 74
        </cite>
    </p>
  ),
  10: (
    <p>
      Naql hai ke {HMAS} ne Qazi Qadan se poochha ke tum kahan ke qazi ho unhon ne jawab diya ke mulk-e-Sindh ka qazi hoon phir 
      <br /><br />{HMAS} ne farmaya ke Sindh kis ka mulk hai unhon ne jawab diya ke Jaam ka. 
      <br /><br />Phir {AAS} ne farmaya ke Jaam kis ka hai. Unhon ne jawab diya ke {KHUDA_T} ka hai. 
      <br /><br />Phir {AAS} ne farmaya ke {KHUDA_T} kis ka hai unhon ne jawab diya ke yahan tak apne ilm se main ne jawabaat diye is jagah hamara ilm khatam ho chuka hai jo kuch Khundkar farmayein wahi tehqeeq hai. 
      <br /><br />{AAS} ne farmaya <strong>"Aye Qazi {KHUDA_T} usi ka hai jo {KHUDA_T} ko haasil kare."</strong>
      <br /><br /><br />
      <cite>
        {SUW} pgno. 199
        <br />
        {MUW} pgno. 148
      </cite>
    </p>
  ),
  11: (
    <p>
      Naql hai {HMAS} ne farmaya <strong>"Ya Allah agar tu fazl kare ek jau ke barabar to zinda rahe, zinda rahe, zinda rahe aur agar tu adl(insaaf) kare ek baal ke barabar toh mar jaaye, mar jaaye, mar jaaye."</strong>
      <br /><br /><br />
      <cite>Hashiya pgno.217</cite>
    </p>
  ),
  12: (
    <p>
      {HMAS} ne farmaya <strong>"fazl usi ke liye hai jis par Allah fazl kare na ke amal aur zaat ke a'ala hone se."</strong>
      <br /><br /><br />
      <cite>Hashdah Aayat pgno. 24</cite>     
    </p>
  ),
  13: (
    <p>
      Naql hai {HMAS} ne farmaya <strong>"Maqam-e-Mahmood Allah ki Wilayat hai."</strong>
      <br /><br /><br />
      <cite>
        Hashiya pgno. 114
        <br />
        Naqliyat {BM} Syed Aalam RH pgno. 45
      </cite>
    </p>
  ),
  14: (
    <p>
      Naql hai ke ek roz {BM} Shaikh Bheek R.Z ko jazba-e-haq hua un ki zuban se baar baar yahi nikal raha tha ke <strong>"Hama Haq Ast (Sab Haq hai)"</strong> bana bareen {HMAS} un ke sarhaane tashreef farma hue aur {AAS} ne farmaya <strong>"ke dekhte ho ya kehte ho?"</strong> Unhon ne wahi jawab diya <strong>"Hama Haq Ast (Sab Haq hai)"</strong> {HMAS} ne farmaya ke <strong>"haan jaanna imaan kehna kufr hai."</strong> Unhon ne jawab mein jaha ke Hama Haq Ast. {HMAS} ne teen baar takraar farmaya ke <strong>"kyun Khuda-e-kuhna ke saath muqayyad ho gaye ho? Aage badho aur yeh bait bhi {AAS} ne padhi."</strong>
      <br />
      <strong>
        Bizaar hua hoon main tere kohne khuda se <br />
        Har lahza mere waaste ek taaza khuda hai
      </strong>
      <br /><br /><br />
      <cite>
        {SUW} pgno.58
      </cite>
    </p>
  ),
  15: (
    <p>
      Is ke ba'ad {HMAS} ne un ko dam-e-zikr-e-khafi se jo zikr-e-paas-e-anfaas hai talqeen farmayi yeh jazbe ke haal mein mustaghriq hokar be-hosh kokar gir pade. {AAS} ne farmaya ke <strong>"Nizam apne wajood mein nahi raha balke sar se paaon tak zaat-e-ahad ban gaya"</strong> is ke ba'ad {AAS} ne yeh ruba'i padhi.
      <br />
      <strong>"Badan mein mere bhar gaya ishq-e-dost, Awaz-e-khoon ke jumla dar rag wa post, Khudhi se kiya khaali ik aan mein Bhara dost ko mere tan jaan main Mere jis qadr hain yeh azw-e-wajood Hue sar basra dost main hoon nabood Sarapa mera hai sarapa-e-dost Raha bas mara naam hai jumla Oost"</strong>
      <br /><br /><br />
      <cite>
        Tazkirat-us-Saliheen pgno. 263
        <br />
        Intikhab-ul-Mawalid pgno. 62
      </cite>
    </p>
  ),
  16: (
    <p>
      Dooyi ko door karo: {HMAS} ke huzoor mein kisi ne yeh sher padha. 
      <br />
      Jo shakhs apna sar nahi haarta hai bulandi par kab qadam rakh sakta hai. Aye dil yeh ishq ka koocha hai khala ka ghar nahi.
      <br />
      {MAS} ne jawaban yeh sher padha.
      <br />
      "<strong>Dooyi ko door kar aur zameen aur aasmaan mein ek dekh jab tujhe yeh mayassar hojaye to yahi khala ka ghar hai.</strong>"
      La yuzhiru minal wahdati illal wahdah "Wahdat se wahdat hi zaahir hoti hai."
      <br /><br /><br />
      <cite>
        Siraj-e-Muneer pgno. 71
        <br />
        Sharah Sadd Barg pgno. 21
      </cite>
    </p>
  ),
  17: (
    <p>
      Naql hai {HMAS} se kisi ne sawal kiya ke yagaangi behtar hai ya dooyi? {HMAS} ne farmaya ke <strong>"dooyi behtar hai kyun ke yagaangi ko pehchaan sakta hai, agar dooyi na hoti to yagaangi ko koi na pehchaanta"</strong>
      <br /><br /><br />
      <cite>
        Hashiya pgno. 227
        <br />
        Naqliyat {BM} Syed Aalam RH pgno. 10
      </cite>
    </p>
  ),
  18: (
    <p>
      Naiz {HMAS} ne apni dono ungaliyan ek doosre mein milayein aur farmaya ke Muhammad aur khuda aise (wasl) ho gaye. Chunanche Haq Subhanahu wa Ta'ala ne farmaya ke 
      <div className="quran">ثُمَّ دَنَا فَتَدَلَّىٰ ٨ فَكَانَ قَابَ قَوْسَيْنِ أَوْ أَدْنَىٰ ٩</div>
      "Phir nazdeek hua aur phir aur nazdeek hua pas do kamanon ya us se bhi qareeb fasla reh gaya."
      <br /><br /><br />
      <cite> Surah najm Ayat 8,9</cite>
    </p>
  ),
  19: (
    <p>
      Naiz naql hai hum ne (yeh naql) {BM} Syed Khundmeer R.Z, Miyan Ne'mat R.Z Miyan Dilawar R.Z aur bahut se muhajireen se suni hai ke {HMAS} ne farmaya ke tamaam ambiya ki inteha Mustafa SAWS ki ibteda aur khatm-e-nabuwwat-e-Muhammad SAWS ki inteha aur khatm-e-wilayat-e-Muhammad SAWS ki ibteda
      <br /><br /><br />
      <cite>
        Insaf Nama Bab 12 pgno. 279
        <br />
        {MUW} pgno. 343
      </cite>
    </p>
  ),
  20: (
    <p>
      Naql hai {HMAS} se ba'azon ne poochha ke kya Nabi SAWS ko wilayat nahi thi farmaya ke <strong>"sar ta paa wilayat thi lekin zaahir karne ka hukum nahi tha. Bande ko farman hai ke zaahir karo."</strong>
      <br /><br /><br />
      <cite>
        Naqliyat {BM} Syed Aalam RH pgno. 90
        <br />
        {TUK} pgno. 1
      </cite>
    </p>
  ),
  21: (
    <p>
      Phir Ulama ne poochha ke Mahdi ka naam Muhammad bin Adbullah hoga aur Aap ka naam Muhammad bin Syed Khan hai. Imam A.S ne farmaya ke khuda se kaho ke Syed Khan ke farzand ko kis liye Mahdi banaya. {KHUDA_T} qaadir hai jo kuch chahta hai karta hai. Phir farmaya ke Hazrat Risalat Panah S.A.W.S ke baap mushrik the (but parast the). Allah ke bande kaise ho sakte hain. (Jahan Muhammad bin Abdullah likha hua hai) woh sahu-e-kitaab hai dar-asl ibaarat Muhammad Abdullah aur Mahdi bhi Abdullah hai.
      <br /><br /><br />
      <cite>
        Maulood pgno. 67
      </cite>
    </p>
  ),
  22: (
    <p>
      Aur farmaya {MAS} ne ke jo koi Khuda aur Rasool e Khuda ke darmiyan palak maarne ke barabar der ki judaai ka bhi gumaan kare to ziyan-kaar hoga.
      <br /><br /><br />
      <cite>
        {TUK} pgno. 2
      </cite>
    </p>
  ),
  23: (
    <p>
      Manqool hai ke {HMAS} ek roz hadees AlWilayatu... ...ila akhirihi (Wilayat afzal hai Nabuwwat se) ka bayan farma rahe the ek taalib-e-ilm ne kaha ke yahan Nabi S.A.W.S ki Nabuwwat par Nabi S.A.W.S ki Wilayat ka fazl maloon hota hai farmaya ke main kab kehta hoon ke meri wilayat Nabi S.A.W.S par fazeelat rakhti hai ya bande ko Nabi SAWS par fazl hai. Ya kisi wali ko kisi Nabi par fazeelat hai lekin banda bhi waisa hi kehta hai ke Nabi SAWS ki Nabuwwat par Nabi ki Wilayat ko fazl hai.
      <br /><br /><br />
      <cite>
        {TUK} pgno. 6
      </cite>
    </p>
  ),
  24: (
    <p>
      {IMAS} se bhi riwayat ki gayi hai ke farmaya {R_SAWS} mab'oos hue taake kuffar se kufr ka qala qama karein aur Islam ko aashkara karein taake deen tamaam tar Allah ke liye hojaye. Jaisa ke irshad-e- Baari Ta'ala hai 
      <div className="quran">هُوَ ٱلَّذِىٓ أَرْسَلَ رَسُولَهُۥ بِٱلْهُدَىٰ وَدِينِ ٱلْحَقِّ لِيُظْهِرَهُۥ عَلَى ٱلدِّينِ كُلِّهِۦ</div>
      "Woh aisa hai jis ne apne Rasool ko hidayat ke saath deen-e-haq de kar bheja taake us ko doosre tamaam deenon par ghaalib kar de."
      <br /><br /><br />
      <cite>
        Surah Saff Ayat 9
        <br />
        Raunaq-ul-Muttaqeen pgno. 22
      </cite>
    </p>
  ),
  25: (
    <p>
      Farmaya {IMAS} ne ke tamaam ambiya A.S munteh waasil hain aur Muhammad Nabi aur Muhammad Wali mubtadi taalib hain. Yaaron ne arz kiya ke Meeranji yeh kis tarah hai. Farmaya ke <strong>"is tarah ke Khuda ki Khudaai ko inteha nahi aur un ki talab (Khatimain A.S ki talab) ko bhi inteha nahi."</strong> Gujri zuban me farmaya <strong>"Khuda ki khudaai ko chhe (inteha) nahi isi tarah bande ki talab ko chhe nahi"</strong>
      <br /><br /><br />
      <cite>
        Intikhab-ul-Mawalid pgno. 319
      </cite>
    </p>
  ),
  26: (
    <p>
      {HMAS} farmate hain <strong>"Jis ne mujhe pehchana us ne {KHUDA_T} ko pehchana"</strong>, phir farmate hain <strong>"Jis ne mujhe dekha us ne Khuda ko dekha."</strong>
      <br /><br />
      <cite>
        Sharah Aqeeda Sharifa pgno. 177
      </cite>
      <br />
      Kama Qaalan Nabi SAWS <div className="hadees">مَنْ رَآنِي فَقَدْ رَأَى الْحَقَّ ،</div>
      <strong>"Jis ne mujhe dekha us ne Haq dekha."</strong>
      <br />
      <cite>Bukhari Hadees 6997</cite>
    </p>
  ),
  27: (
    <p>
      Qaalal {IMAS} "<strong>ullimtu minallahi bila waasitatin Jadeedil-yaum inni Abdullah taabe Muhammad Rasoolillah</strong>"<br />
      Farmaya {IMAS} ne <strong>"taleem diya gaya hoon main Allah se baghair kisi waaste ke har roz keh ke main Allah ka banda Muhammad {R_SAWS} ka taabey hoon."</strong>
      <br /><br /><br />
      <cite>
        Aqeeda Sharifa pgno. 22
        <br />
        Hashiya pgno. 9
        <br />
        {NBMAR} pgno. 3
      </cite>
    </p>
  ),
  28: (
    <p>
      {HMAS} ne farmaya hai har hukum jo main bayan karta hoon khuda ki taraf se aur khuda ka hukum se bayan karta hoon jo koi in ahkaam se ek harf ka munkir ho woh Allah ke paas ma'khooz hoga.
      <br /><br /><br />
      <cite>
        Aqeeda Sharifa pgno. 1
        <br />
        Insaf Nama pgno. 22, 30
        <br />
        {NBMAR} pgno. 13
      </cite>
    </p>
  ),
  29: (
    <p>

      Meeran AS ne farmaya ke is bande ke aage tas;heeh hoti hai jo yahan maqbool hua woh khuda ke paas maqbool hai aur jo mere paas sahih na  hoo woh khuda ke paas mardood hai.
      <br /><br /><br />
      <cite>
        Aqeeda Sharifa pgno. 3
        <br />
        Insaf Nama pgno. 80, 177
        <br />
        {NBMAR} pgno. 31
      </cite>
    </p>
  ),
  30: (
    <p>
      Aur naiz {HMAS} se manqool hai ke da'wa-e-mahdiyat zaahir karne se pehle bees saal aap ko Allah ka farman hota raha ke ti Mahdi-e-Mao'ud hai {HMAS} ne (is farman ko) bees saal zaahir nahi farmaya jab Aap qasba badli mein tashreef laaye to farman-e-Baari hua ke kyuun ti apne da'wa-e-mahdiyat ko zaahir nahi karta hai balke itaab aamez farman hua ke tu makhlooq se darta hai. Ba'ad Aap ne da'wa-e-mahdiyat ko zahir farmaya.
      <br /><br /><br />
      <cite>
        Insaf Nama pgno. 23
      </cite>
    </p>
  ),
  31: (
    <p>
      {HMAS} ne farmaya ke Haq Ta'ala ne bande ko ambiya, auliya, momineen aur mominaat ke maraatib aur tamaam maujoodat ka ahwaal aisa maloom kiya hai jaisa ke ek shakhs ek cheez haath mein rakhta hai aur har taraf us ko paltata hai taake us ko achhi tarah pehchaane haisa ke sarraaf (rupiya ashrafi ka parakhne wala) karta hai taake sikka nuqra ke khare khotte se waaqif hojaye.
      <br /><br /><br />
      <cite>
        Insaf Nama Baab 5 pgno. 59
        <br />
        {NBMAR} pgno. 4
      </cite>
    </p>
  ),
  32: (
    <p>
      Mulla'on ne phir kaha ke hum aap ke saath kaise beha kar sakte hain, aap to muqayyad mazhab nahi rakhte jo kuch jawab dete ho mutlaq Quran se jawab dete ho aur hum Quran nahi samajh sakte aur hum Imam-e-Azam RH ke mazhab par muqauuad hain is ke ba'ad {HMAS} ne farmaya ke <strong>"agarche main kisi mazhab par muqayyad nahi mera mazhab kitabullah aur Ittiba e {R_SAWS} hai.</strong> phir farmaya ke isi par qayam ho jao aur (kaho ke) jo koi Imam-e-Azam RH ke mazhab se baahar ho jaaye aur mazhab ke khilaf amal kare to us par kya hukum hoga is ke ba'ad {MAS} ne farmaya ke naadaan mazhab ka ma'ni kya jaante mazhab ka ma'ni Imam e Azam RH ki raftaar hai na ke guftaar. Aur Paighambar SAWS ki sunnat Paighambar SAWS ke amal ko kehte hain na ke guftaar-e-Paighambar AS ko tamaam sharai mua'milat ho fiqh ki kitabo mein mazkoor hain Paighambar AS ki guftaar hai na ke amal-e-Paighambar AS pas Imam e Azam RH ka mazhab amal hai jo mash'hoor hai.
      <br /><br /><br />
      <cite>
        Insaf Nama Baab 5 pgno 88
        <br />
        Maulood pgno. 70
      </cite>
    </p>
  ),
  33: (
    <p>
      Aur naiz naql hai ke {HMAS} ne farmaya ke banda ki ek nazar hazaar saal ki maqboola ibadat see behtar hai.
      <br /><br /><br />
      <cite>
        Insaf Nama bab 8 pgno. 175
        <br />
        Hashiya pgno. 67
        <br />
        {NBMAR} pgno. 29
      </cite>
    </p>
  ),
  34: (
    <p>
      Miyan Bhai Mujahir RZ se manqool hai ke {HMAS} ne farmaya jo shakhs ke {MAS} ki suhbat mein itni der raha jitni ke jootiyon ki gard jhaadne mein lagti hai to pehle us ne ho kuch gunaah kiya tha sab muaaf ho jayenge.
      <br /><br /><br />
      <cite>
        Insaf Nama Baab 8 pgno. 175
        <br />
        Hashiya pgno. 66
        <br />
        {NBMAR} pgno. 19
      </cite>
    </p>
  ),
  35: (
    <p>
      Bandagi Meeran AS ne farmaya ke banda {R_SAWS} ke qadam bar qadam hai.
      <br /><br /><br />
      <cite>
        Insaf Nama Baab 12 pgno. 271
      </cite>
    </p>
  ),
  36: (
    <p>
      Naql hai {HMAS} ne farmaya ke farman-e-Khudae Ta'ala hota hai ke hum ne imaan ke khazana ki kunjiya tere haath mein de di hain aur hum ne tujh ko khaas deen-e-Muhammadi SAWS ki nusrat karne wala kiya hai aur main teri musrat karne wala hoon ja da'wat kar jis ne tijh ko qubool kiya momin hai aur jis ne tera inkaar kiya kaafir hai.
      <br /><br /><br />
      <cite>
        Hasihya pgno. 9
        <br />
        {NBMAR} pgno. 3
        <br />
        {SUW} pgno. 50
        <br />
        {MUW} pgno. 37
      </cite>
    </p>
  ),
  37: (
    <p>
      Naql hai {HMAS} ne farmaya ke is bande ke saamne tas'heeh hoti hai aur farman-e-khuda hota hai ke Aye Syed Muhammad jo shakhs tere saamne sahih hua woh hamari baargah mein maqbool hai aur ho shakhs tere saamne sahih na hua woh Allah ke paas mardood hai.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 95
      </cite>
    </p>
  ),
  38: (
    <p>
      Naql hai {HMAS} ke huzoor mein mulla'on ne arz kiya ke Mahdi aalam ka badshsh hoga {HMAS} ne farmaya haan wa lekin ghodon ki leed nahi kheinche ga. is ke ba'ad {MAS} ne yeh nahi farmaya ke {MAS} ke giroh se koi badshsh hoga ho falaan shahar fatah kare wa lekin Isa AS badshah-e-aalam honge.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 80
      </cite>
    </p>
  ),
  39: (
    <p>
      Naql hai {HMAS} ne farmaya ke banda faqiron ka sadqa khata hai.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 94
        <br />
        {NBMAR} pgno. 45
      </cite>
    </p>
  ),
  40: (
    <p>
      Aur naiz {HMAS} ne farmaya ke bande ki baatini parwarish faqiron ke waaste se hoti hai.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 94
        <br />
        {NBMAR} pgno. 94
      </cite>
    </p>
  ),
  41: (
    <p>
      Naql hai {HMAS} ne farmaya ke ho log bande ke roobaru inteqaal kiye kaamyaab gaye jo log bande ke ba'ad rahenge un becharon ke sar par museebat hai. Phir {HMAS} ne farmaya ke hum  in logon ko khuda ke hawale karke jaate hain.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 98
        <br />
        {NBMAR} pgno. 33
      </cite>
    </p>
  ),
  42: (
    <p>
      Naql hai {HMAS} ne farmaya ke kisi ne bande ka daaman nahi pakda ke hum ko Khudae Ta'ala tak pahunchao.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 105
        <br />
        {NBMAR} pgno. 65
      </cite>
    </p>
  ),
  43: (
    <p>
      Naql hai {HMAS} ne farmaya ke banda apne kaan se jo kuch khuda ki awaaz sunta hai zuban se ada karta hai tum amal karo ya na karo tum jaano aur khuda jaane.
      <br /><br /><br />
      <cite>
        Hashiya pgno. 116
        <br />
        {NBMAR} pgno. 14, 92
      </cite>
    </p>
  ),
  
  // Add more nuqool entries here as: 2: (<p>...</p>)
};

export default nuqoolObject;
