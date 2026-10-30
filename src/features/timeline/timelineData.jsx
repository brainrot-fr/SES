/**
 * timelineData.jsx
 * Static timeline event definitions.
 *
 * - Exports an array of event objects rendered by the timeline page.
 * - Each event includes year, title, summary, and expanded detail markup.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export function NaqlLink({ n }) {
  return <Link className="text-primary underline underline-offset-4" to={`/nuqool/${n}`}>Naql {n}</Link>;
}


/*
 * ── Add or edit events freely — Timeline renders them in array order ──────────
 * Each object defines the year, title, summary and expanded detail shown
 * when the user taps the event card.
 */

export const timelineEvents = [
  {
    id: 1,
    year: '847 AH · 1443 CE',
    title: 'Wiladat — Birth in Jaunpur',
    summary: 'Born into a noble Sayyid household in Jaunpur, India.',
    title_ur: 'ولادت — جونپور میں پیدائش',
    summary_ur: 'ہندوستان کے شہر جونپور میں ایک معزز سادات گھرانے میں پیدائش ہوئی۔',
    detail: (
      <>
        <p>
          Hazrat Syed Muhammad Jaunpuri A.S was born on <strong>14th Jumada al-Awwal,
          847 AH (1443 CE)</strong> in the city of Jaunpur, present-day Uttar Pradesh, India.
        </p>
        <p>
          His father was Syed Abdullah, and his lineage traces back to the Ahl-ul-Bayt
          through Imam Zain-ul-Abidin A.S. The blessed household in which he was raised
          was known for piety, learning, and love of the Prophet S.A.W.S.
        </p>
        <p>
          Even at birth, those present bore witness to signs that distinguished this child
          from others.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>حضرت سید محمد جونپوری علیہ السلام کی پیدائش <strong>۱۴ جمادی الاولیٰ، ۸۴۷ ہجری (۱۴۴۳ عیسوی)</strong> کو موجودہ بھارتی ریاست اتر پردیش کے شہر جونپور میں ہوئی۔</p>
        <p>آپ کے والد سید عبداللہ تھے۔ آپ کا نسب امام زین العابدین کے واسطے سے اہلِ بیت تک پہنچتا ہے۔ آپ کا گھرانہ تقویٰ، علم اور رسول اللہ ﷺ کی محبت کے لیے معروف تھا۔</p>
        <p>آپ کی ولادت کے وقت موجود لوگوں نے آپ میں نمایاں علامات دیکھیں۔</p>
      </>
    ),
  },
  {
    id: 2,
    year: '847–862 AH',
    title: 'Childhood & Early Upbringing',
    summary: 'Raised in Jaunpur; extraordinary qualities noted from the earliest years.',
    title_ur: 'بچپن اور ابتدائی تربیت',
    summary_ur: 'جونپور میں پرورش پائی؛ ابتدائی عمر ہی سے غیر معمولی اوصاف نمایاں تھے۔',
    detail: (
      <>
        <p>
          The childhood of Hazrat Mahdi A.S was spent in Jaunpur under the care of his
          blessed parents. From the very beginning his temperament was marked by a deep
          and instinctive connection to the Divine — a quality visible to those around him.
        </p>
        <p>
          Elders and companions who knew him as a child recalled an unusual detachment
          from worldly pursuits, a natural inclination toward zikr, and a profound
          inner stillness uncommon in one so young.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>حضرت مہدی علیہ السلام کا بچپن جونپور میں والدین کی سرپرستی میں گزرا۔ ابتدا ہی سے آپ کی طبیعت میں اللہ تعالیٰ سے گہرا تعلق نمایاں تھا۔</p>
        <p>آپ کو جاننے والے بزرگوں اور ساتھیوں نے دنیاوی مشاغل سے بے رغبتی، ذکر کی طرف فطری میلان اور غیر معمولی قلبی سکون کا ذکر کیا۔</p>
      </>
    ),
  },
  {
    id: 3,
    year: '862–880 AH',
    title: 'Spiritual Formation',
    summary: 'Years of intensive worship, reflection, and inner development.',
    title_ur: 'روحانی تربیت',
    summary_ur: 'عبادت، غور و فکر اور باطنی نشوونما کے بھرپور سال۔',
    detail: (
      <>
        <p>
          This period marks the deepening of the inner life of Hazrat Mahdi A.S. Through
          intense prayer, fasting, and prolonged contemplation, the foundations of his later
          teachings were being laid in lived experience — not in theory.
        </p>
        <p>
          The core principles that would define his message — strict adherence to the
          Quran, unconditional love of the Prophet S.A.W.S, rejection of blind taqleed,
          and the primacy of fana — took root and matured in these years.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>یہ زمانہ حضرت مہدی علیہ السلام کی باطنی زندگی کے گہرے ہونے کا دور تھا۔ عبادت، روزے اور طویل غور و فکر کے ذریعے آپ کی آئندہ تعلیمات کی بنیاد عملی تجربے میں استوار ہوئی۔</p>
        <p>قرآن سے مضبوط وابستگی، رسول اللہ ﷺ سے محبت، تقلیدِ جامد سے اجتناب اور فنا کی اہمیت جیسے اصول اسی عرصے میں پختہ ہوئے۔</p>
      </>
    ),
  },
  {
    id: 4,
    year: '901 AH · 1496 CE',
    title: "I'laan-e-Mahdaviyat — Declaration in Mecca",
    summary: 'Publicly declared Mahdaviyat before scholars and pilgrims in the Holy City.',
    title_ur: 'اعلانِ مہدویت — مکہ مکرمہ میں اعلان',
    summary_ur: 'مقدس شہر میں علماء اور حجاج کے سامنے مہدویت کا علانیہ اعلان کیا۔',
    detail: (
      <>
        <p>
          The pivotal turning point came in <strong>901 AH (1496 CE)</strong> during the
          pilgrimage to Mecca. Before a gathering of scholars and pilgrims at the Sacred
          House, Hazrat Mahdi A.S announced his claim as <em>Mahdi-e-Ma'ud</em> — the
          Promised Mahdi — citing the authority of the Quran and Sunnah as his sole
          evidence.
        </p>
        <p>
          He made clear that his obedience is not bound to any madhab but is the pure
          obedience of Allah and His Rasool S.A.W.S — a position preserved in <NaqlLink n={2} /> of
          this collection: <em>"hum kisi mazhab ke muqayyad nahi hain."</em>
        </p>
        <p>
          This declaration sent ripples through the scholarly world of the time and
          attracted both fervent acceptance and fierce opposition.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>فیصلہ کن موڑ <strong>۹۰۱ ہجری (۱۴۹۶ عیسوی)</strong> میں حج کے موقع پر آیا۔ بیت اللہ کے پاس علماء اور حجاج کے مجمع میں حضرت مہدی علیہ السلام نے قرآن و سنت کو دلیل بناتے ہوئے اپنے مہدی موعود ہونے کا اعلان کیا۔</p>
        <p>آپ نے واضح فرمایا کہ آپ کی اطاعت کسی مذہب کی پابند نہیں بلکہ اللہ اور اس کے رسول ﷺ کی اطاعت ہے۔ اس موقف کا ذکر اس مجموعے کے <NaqlLink n={2} /> میں محفوظ ہے: <em>"hum kisi mazhab ke muqayyad nahi hain."</em></p>
        <p>اس اعلان سے اس زمانے کے علمی حلقوں میں بحث چھڑ گئی؛ بعض نے قبول کیا اور بعض نے سخت مخالفت کی۔</p>
      </>
    ),
  },
  {
    id: 5,
    year: '901–905 AH',
    title: 'Return Journey — Spreading the Message',
    summary: 'Traveled through major Indian cities; thousands accepted the call.',
    title_ur: 'واپسی کا سفر — پیغام کی اشاعت',
    summary_ur: 'ہندوستان کے بڑے شہروں میں سفر کیا اور بہت سے لوگوں نے دعوت قبول کی۔',
    detail: (
      <>
        <p>
          After the declaration in Mecca, Hazrat Mahdi A.S returned through cities and
          towns of the subcontinent, conveying his message openly. The gatherings (sohbat)
          of this period were the source of many of the narrations preserved in the Nuqool.
        </p>
        <p>
          Scholars debated with him; many were convinced. Ordinary people and spiritual
          seekers alike accepted bayah at his hands. The community of disciples that would
          carry his teachings forward took shape in these years.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>مکہ مکرمہ میں اعلان کے بعد حضرت مہدی علیہ السلام برصغیر کے شہروں اور قصبوں سے گزرتے ہوئے کھلے عام اپنا پیغام پہنچاتے رہے۔ اس زمانے کی صحبتیں بہت سے محفوظ نقول کا ماخذ بنیں۔</p>
        <p>علماء نے آپ سے گفتگو اور مناظرہ کیا؛ بہت سے قائل ہوئے۔ عام لوگوں اور روحانی طالبوں نے بھی آپ کے ہاتھ پر بیعت کی، اور شاگردوں کی جماعت نے ان تعلیمات کو آگے پہنچانے کی صورت اختیار کی۔</p>
      </>
    ),
  },
  {
    id: 6,
    year: '905–908 AH',

    title: 'Journeys through Gujarat & the Deccan',
    summary: 'Extended stays at major centres of learning; deep Nuqool-era teachings.',
    title_ur: 'گجرات اور دکن کے سفر',
    summary_ur: 'علمی مراکز میں قیام اور نقول کے دور کی اہم تعلیمات۔',
    detail: (
      <>
        <p>
          These years saw Hazrat Mahdi A.S journeying through Ahmedabad, Gujarat, and
          parts of the Deccan. Large gatherings took place and notable figures gave bayah.
        </p>
        <p>
          Core teachings on fana (annihilation of the ego in Allah), the nature of
          Wilayat, the reality of the Quran as the living guide, and the meaning of
          true ittiba were delivered in this period — many recorded in the Nuqool of this
          very collection.
        </p>
        <p>
          Encounters such as those with Qazi Qadan (<NaqlLink n={10} />) and the dialogues on
          yagaangi and dooyi (<NaqlLink n={17} />) date from the sohbat of these years.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>ان برسوں میں حضرت مہدی علیہ السلام نے احمدآباد، گجرات اور دکن کے علاقوں کا سفر کیا۔ بڑی صحبتیں منعقد ہوئیں اور معروف شخصیات نے بیعت کی۔</p>
        <p>فنا، ولایت، قرآنِ کریم کی بطور زندہ رہنما حقیقت اور اتباع کے مفہوم پر تعلیمات اسی دور میں بیان ہوئیں، جن میں سے بہت سی نقول میں محفوظ ہیں۔</p>
        <p>قاضی قادن سے ملاقات (<NaqlLink n={10} />) اور یگانگی و دویی پر گفتگو (<NaqlLink n={17} />) اسی زمانے کی صحبتوں سے متعلق ہیں۔</p>
      </>
    ),
  },
  {
    id: 7,
    year: '908–910 AH',
    title: 'Final Journey toward Khorasan',
    summary: 'Last major travel; companions received the deepest teachings.',
    title_ur: 'خراسان کی جانب آخری سفر',
    summary_ur: 'آخری بڑے سفر میں رفقاء نے گہری تعلیمات حاصل کیں۔',
    detail: (
      <>
        <p>
          In the final years, Hazrat Mahdi A.S set out westward toward Khorasan —
          present-day Afghanistan. His closest companions and disciples accompanied him
          on what would become his last major journey.
        </p>
        <p>
          The narrations and conversations of this period carry a quality of finality and
          summation: distillations of a lifetime of realisation, given to those nearest
          to him as a trust to carry forward.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>آخری برسوں میں حضرت مہدی علیہ السلام خراسان، موجودہ افغانستان، کی طرف روانہ ہوئے۔ آپ کے قریبی ساتھی اور شاگرد اس آخری بڑے سفر میں ہمراہ تھے۔</p>
        <p>اس دور کے نقول اور مکالموں میں زندگی بھر کے عرفان کا خلاصہ ملتا ہے، جو قریب ترین ساتھیوں کے سپرد امانت کے طور پر کیا گیا۔</p>
      </>
    ),
  },
  {
    id: 8,
    year: '910 AH · 1505 CE',
    title: 'Wisal — Departure from This World',
    summary: 'Passed away in Farah, Afghanistan. His legacy and lineage endure.',
    title_ur: 'وصال — دنیا سے رخصتی',
    summary_ur: 'افغانستان کے شہر فراح میں وصال ہوا؛ آپ کا ورثہ اور سلسلہ جاری ہے۔',
    detail: (
      <>
        <p>
          Hazrat Syed Muhammad Jaunpuri — Mahdi-e-Ma'ud A.S — passed from this world
          in <strong>910 AH (1505 CE)</strong> in the city of <strong>Farah</strong>,
          in what is today western Afghanistan.
        </p>
        <p>
          His blessed resting place in Farah remains a site of visitation and reverence
          for his followers across generations.
        </p>
        <p>
          Though he departed physically, the chain of teaching, the narrations, and the
          community of disciples he established continue to be a living guide. This
          collection of Nuqool — <em>Al Lu'lu wal Marjan fi Nuqoolil Mahdi il
          Ma'ood Alaihissalam</em> — is itself a testament to that enduring legacy.
        </p>
      </>
    ),
    detail_ur: (
      <>
        <p>حضرت سید محمد جونپوری، مہدی موعود علیہ السلام، <strong>۹۱۰ ہجری (۱۵۰۵ عیسوی)</strong> میں موجودہ مغربی افغانستان کے شہر <strong>فراح</strong> میں اس دنیا سے رخصت ہوئے۔</p>
        <p>فراح میں آپ کا مبارک مزار آج بھی نسل در نسل آپ کے پیروکاروں کے لیے زیارت اور عقیدت کا مقام ہے۔</p>
        <p>آپ کے ظاہری وصال کے باوجود تعلیم و تربیت کا سلسلہ، نقول اور شاگردوں کی جماعت رہنمائی کا ذریعہ ہیں۔ نقول کا یہ مجموعہ اسی جاری ورثے کی ایک شہادت ہے۔</p>
      </>
    ),
  },
  /* new object template */
  /*
  {
    id: x,
    year: '',
    title: '',
    summary: '',
    detail: (
      <>
        <p>

        </p>
        <p>

        </p>
      </>
    )
  },
  */
];
