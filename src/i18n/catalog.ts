import type { Locale } from "./locale";
import coversEn from "@/data/covers-en.json";
import type { Newspaper } from "@/data/newspapers";
import type { OpeningType, Theme } from "@/data/themes";

const COVER_EN = coversEn as Record<string, string>;

const THEME_TITLES: Record<string, string> = {
  "zumrut-yesili-cocukluk-aski": "Emerald Childhood Love",
  "akdeniz-masali": "Mediterranean Tale",
  "gun-batimi-davetiyem": "Sunset",
  "kis-masali": "Winter Tale",
  "al-gulum-davetiyem": "Red Rose",
  "siyah-inci": "Black Pearl",
  "bahar-yolu": "Spring Path",
  "guz-masali": "Autumn Tale",
  "yesil-dus": "Green Dream",
  "barok-kapi": "Baroque Door",
  "fildisi-kemer": "Ivory Arch",
  "mavi-bahar-kapisi": "Blue Spring Gate",
  "gul-bahcesi-kapisi": "Rose Garden Gate",
  "yaldizli-saray-kapisi": "Gilded Palace Gate",
  "rokoko-esintisi": "Rococo Breeze",
  "fildisi-rokoko": "Ivory Rococo",
  "ceviz-oyma-kapi": "Carved Walnut Door",
  "begonvil-bahcesi": "Bougainvillea Garden",
  "nil-kelebegi": "Nile Butterfly",
  "sakura-bahcesi": "Sakura Garden",
  "elhamra-avlusu": "Alhambra Courtyard",
  "hus-kemeri": "Birch Arch",
  "lavanta-kemeri": "Lavender Arch",
  "lale-terasi": "Tulip Terrace",
  "tavuslu-cini": "Peacock Tile",
  "ege-sutunlari": "Aegean Columns",
  "sakura-koprusu": "Sakura Bridge",
  "fildisi-madalyon": "Ivory Medallion",
  "altin-yelpaze": "Gold Fan",
  "sakayik-tulu": "Peony Veil",
  "yildiz-tozu": "Stardust",
  "gol-kiyisi-goblen": "Lakeside Tapestry",
  "kaftan-perdesi": "Kaftan Curtain",
  "pembe-rokoko": "Pink Rococo",
  "inci-saten": "Pearl Satin",
  "mor-salkim": "Wisteria",
  "tek-gul": "A Single Rose",
  "gul-dantel": "Rose Lace",
  "opera-gecesi": "Opera Night",
  "sakura-ipek": "Sakura Silk",
  "vitray-ruyasi": "Stained-Glass Dream",
  "saray-lalesi": "Palace Tulip",
  "adacayi-madalyon": "Sage Medallion",
  "inci-zambak": "Pearl Lily",
  "bordo-muhur": "Burgundy Seal",
  "altin-hilal": "Gold Crescent",
  "gul-kurusu-muhur": "Dusty Rose Seal",
  "fildisi-muhur": "Ivory Seal",
  "ilk-ask-lalesi": "First Love Tulip",
  "lacivert-madalyon": "Navy Medallion",
  "lacivert-hikaye": "Navy Story",
  "pudra-kabartma": "Powder Emboss",
  "inci-ve-gul": "Pearl and Rose",
  "lale-devri": "Tulip Era",
  "zumrut-muhur": "Emerald Seal",
  "sampanya-cicegi": "Champagne Bloom",
};

const THEME_SPECIAL: Record<string, { eyebrow: string; description: string }> = {
  "zumrut-yesili-cocukluk-aski": {
    eyebrow: "Digital invitation with an embossed emerald cover and childhood-love reliefs",
    description: "An emerald digital invitation that opens through a door, works on any phone, and is shared with a single link.",
  },
  "akdeniz-masali": {
    eyebrow: "Digital invitation with a fine tulle curtain and a Mediterranean view",
    description: "An elegant, luminous invitation that opens onto a Mediterranean view from behind lace curtains.",
  },
  "siyah-inci": {
    eyebrow: "Digital invitation with a sealed anthracite envelope and black embossed pages",
    description: "A Black Pearl digital invitation that opens with a wax seal, works on any phone, and is shared with a single link.",
  },
  "bahar-yolu": {
    eyebrow: "Digital invitation with nature waking and a new beginning in bloom",
    description: "A Spring Path digital invitation that opens with an envelope, works on any phone, and is shared with a single link.",
  },
  "guz-masali": {
    eyebrow: "Digital invitation with autumn romance and an animated wedding car",
    description:
      "Invite your guests on a storybook journey: a decorated wedding car travels a forest road of crimson and gold leaves, and a “We are getting married” line appears among the leaves.",
  },
  "barok-kapi": {
    eyebrow: "Digital invitation with an embossed baroque door and gold details",
    description: "A grand, classical welcome that begins with an embossed baroque door.",
  },
  "tavuslu-cini": {
    eyebrow: "Digital invitation with a peacock-tile door opening",
    description: "Traditional elegance in peacock motifs and Iznik-style tile patterns.",
  },
  "opera-gecesi": {
    eyebrow: "Digital invitation with a velvet stage curtain and gold fringe",
    description: "A gala-night atmosphere of velvet stage curtains and gold fringe.",
  },
  "bordo-muhur": {
    eyebrow: "Digital invitation with a burgundy seal and couture details",
    description: "A couture opening of burgundy velvet and a gold seal.",
  },
};

const OPENING_EYEBROW: Record<OpeningType, string> = {
  envelope: "Digital invitation with an envelope opening",
  door: "Digital invitation with a door opening",
  seal: "Digital invitation with a sealed opening",
  curtain: "Digital invitation with a curtain opening",
};

const OPENING_WITH: Record<OpeningType, string> = {
  envelope: "an envelope",
  door: "a door",
  seal: "a wax seal",
  curtain: "a curtain",
};

const TAGS: Record<string, string> = {
  akdeniz: "mediterranean",
  "akdeniz masalı": "mediterranean tale",
  "al gülüm": "red rose",
  altın: "gold",
  "altın mühür": "gold seal",
  "animasyonlu davetiye": "animated invitation",
  avlu: "courtyard",
  bahar: "spring",
  "bahar yolu": "spring path",
  barok: "baroque",
  begonvil: "bougainvillea",
  bordo: "burgundy",
  ceviz: "walnut",
  dantel: "lace",
  "düğün davetiyesi": "wedding invitation",
  ege: "aegean",
  elhamra: "alhambra",
  fildişi: "ivory",
  gece: "night",
  goblen: "tapestry",
  göl: "lake",
  gül: "rose",
  "gül dantel": "rose lace",
  "gül kurusu": "dusty rose",
  "gün batımı": "sunset",
  "güz masalı": "autumn tale",
  hikâye: "story",
  hilal: "crescent",
  inci: "pearl",
  kabartma: "embossed",
  kaftan: "kaftan",
  "kapı açılışı": "door opening",
  kemer: "arch",
  "kış masalı": "winter tale",
  lacivert: "navy",
  lale: "tulip",
  lavanta: "lavender",
  madalyon: "medallion",
  "mor salkım": "wisteria",
  mühür: "seal",
  nil: "nile",
  "oyma kapı": "carved door",
  pembe: "pink",
  perde: "curtain",
  "perde açılışı": "curtain opening",
  pudra: "powder",
  rokoko: "rococo",
  sakura: "sakura",
  saray: "palace",
  "siyah inci": "black pearl",
  sütun: "column",
  "tek gül": "single rose",
  teras: "terrace",
  yaldız: "gilt",
  yelpaze: "fan",
  "yeşil düş": "green dream",
  yıldız: "star",
  zambak: "lily",
  "zarf açılışı": "envelope opening",
  zümrüt: "emerald",
  "zümrüt yeşili": "emerald green",
  çini: "tile",
  "çocukluk aşkı": "childhood love",
  şakayık: "peony",
  şampanya: "champagne",
};

export const STUDIO_CATEGORY_EN: Record<string, string> = {
  wedding: "Engagement & wedding",
  multievent: "Multiple events",
  henna: "Henna night",
  circumcision: "Circumcision",
  baby: "For babies",
  birthday: "Birthday",
  corporate: "Corporate",
};

export const STUDIO_NAME_EN: Record<string, string> = {
  "altin-madalyon": "Gold Medallion",
  "gul-celengi": "Rose Wreath",
  "lacivert-gece": "Navy Night",
  "minimal-zarafet": "Minimal Elegance",
  "adacayi-celenk-nikah": "Sage Wreath",
  "adacayi-elli-yas": "Sage at Fifty",
  "adacayi-kabartma-dugun": "Sage Emboss",
  "ak-hus-dugun": "White Birch",
  "al-halka-kina": "Red Ring Henna",
  "allik-dantel-nisan": "Blush Lace",
  "altin-serit-sunnet": "Gold Ribbon",
  "odul-gecesi-antrasit": "Anthracite Awards Night",
  "art-deco-yelpaze-dugun": "Art Deco Fan",
  "ay-halkasi-dugun": "Moon Ring",
  "ay-isigi-mevlut": "Moonlight Mevlüt",
  "bahar-penceresi-dugun": "Spring Window",
  "balon-senligi-dogum-gunu": "Balloon Celebration",
  "barok-kina-dugun": "Baroque Two Nights",
  "bayrakli-cocuk-partisi": "Bunting Party",
  "bebegimiz-geliyor": "Our Baby Is Coming",
  "bebek-mevludu": "Baby Mevlüt",
  "begonvil-avlusu-nisan": "Bougainvillea Courtyard",
  "begonvil-bahce-partisi": "Bougainvillea Garden Party",
  "bindalli-kadife-kina": "Bindallı Velvet",
  "bordo-editoryal-nisan": "Burgundy Editorial",
  "bordo-solen-sunnet": "Burgundy Celebration",
  "bordo-yaldiz-nikah": "Burgundy Gilt",
  "bulutlar-arasinda-mevlut": "Among the Clouds",
  "buyuk-gun-sunnet": "The Big Day",
  "buyuk-rakam-tarihi-ayirin": "Large Numerals",
  "ceviz-oyma-kina": "Carved Walnut Henna",
  "cinsiyet-partisi": "Gender Reveal Party",
  "cicekli-isim-gunu": "Floral Name Day",
  "cini-lale-kina": "Tile Tulip",
  "deco-mermer-dugun": "Deco Marble",
  "dis-bugdayi-kutlamasi": "First Tooth Celebration",
  "dogum-gunu": "Birthday",
  "editoryal-siyah-beyaz-dugun": "Editorial Black and White",
  "ege-acilis-toreni": "Aegean Opening Ceremony",
  "elhamra-avlusu-nikah": "Alhambra Courtyard",
  "fildisi-esinti-nisan": "Ivory Breeze",
  "fildisi-kamea-nikah": "Ivory Cameo",
  "fildisi-nikah-dugun": "Ivory Nikah and Wedding",
  "fildisi-rokoko-dugun": "Ivory Rococo",
  "firuze-kemer-nikah": "Turquoise Arch",
  "gokkusagi-dogum-gunu": "Rainbow Day",
  "gul-kapisi-nisan": "Rose Gate",
  "gul-kemerli-kina": "Rose-Arch Henna",
  "gul-kurusu-soz-nisan": "Dusty Rose Promise",
  "hos-geldin-bebek": "Welcome, Baby",
  "hus-kemeri-soz": "Birch Arch",
  "ilk-yas-gunu-gul": "First Birthday Rose",
  "inci-kina-dugun-yatay": "Pearl Two Nights",
  "inci-saten-soz": "Pearl Satin",
  "inci-zambak-dugun": "Pearl Lily",
  "incili-prens-sunnet": "Pearl Prince",
  "kadife-perde-soz": "Velvet Curtain",
  "kiraz-dali-tarihi-ayirin": "Cherry Branch",
  "zirve-konferans-programi": "Conference Programme",
  "kraliyet-taci-sunnet": "Royal Crown",
  "on-yil-kurulus-yildonumu": "Tenth Anniversary",
  "kurumsal-gala": "Corporate Gala",
  "kucuk-sehzade-sunnet": "Little Prince",
  "lacivert-madalyon-dugun": "Navy Medallion",
  "lale-bahcesi-kina": "Tulip Garden Henna",
  "lale-iftar-daveti": "Tulip Iftar Invitation",
  "lale-terasi-nikah": "Tulip Terrace",
  "lavanta-kina-dugun": "Lavender Henna and Wedding",
  "leylek-getirdi": "The Stork Brought",
  "lila-celenk-baby-shower": "Lilac Wreath",
  "mavi-fiyonk-mevlit": "Blue Bow",
  "mavi-goblen-nikah": "Blue Tapestry",
  "mor-salkim-dugun": "Wisteria",
  "mum-isigi-kina": "Candlelight",
  "muhur-monogram-nisan": "Sealed Monogram",
  "nar-cicegi-kina": "Pomegranate Blossom",
  "pembe-gul-mevlut": "Pink Rose Mevlüt",
  "pembe-monogram-kina": "Pink Monogram Henna",
  "portakal-avlusu-dugun": "Orange Courtyard",
  "prens-madalyonu-sunnet": "Prince Medallion",
  "prenses-cay-partisi": "Princess Tea Party",
  "pudra-kabartma-nisan": "Powder Emboss",
  "pudra-on-sekiz-yas": "Powder Eighteen",
  "renk-bloklari-dugun": "Colour Blocks",
  "retro-seksenler-partisi": "Retro Eighties",
  "sakayik-tulu-dugun": "Peony Veil",
  "sakura-penceresi-dugun": "Sakura Window",
  "sakura-soz": "Sakura Promise",
  "saray-lalesi-kina": "Palace Tulip",
  "siyah-altin-kirk-yas": "Black and Gold Forty",
  "sunnet-mevlidi": "Circumcision Mevlüt",
  "sunnet-soleni": "Circumcision Celebration",
  "surpriz-parti-sari": "Surprise Party",
  "sakayik-soz-nisan": "Peony Promise and Engagement",
  "sampanya-bant-nikah": "Champagne Band",
  "sampanya-takvim-dugun": "Champagne Calendar",
  "tavuslu-cini-dugun": "Peacock Tile",
  "terrakota-kemer-dugun": "Terracotta Arch",
  "uzay-macerasi-dogum-gunu": "Space Adventure",
  "uc-toren-takvimi": "Three-Ceremony Calendar",
  "mercan-urun-lansmani": "Product Launch",
  "vitray-bordo-nisan": "Burgundy Stained Glass",
  "yar-yar-kina-gecesi": "Yar Yar Night",
  "yil-sonu-partisi": "Year-End Party",
  "yildizli-solen-sunnet": "Starry Celebration",
  "zumrut-gala-yemegi": "Emerald Gala Dinner",
  "zumrut-kina": "Emerald Henna",
  "zumrut-madalyon-kina": "Emerald Medallion",
  "zumrut-mermer-dugun": "Emerald Marble",
  "zumrut-nikah-dugun": "Emerald Nikah and Wedding",
};

type PaperEn = { title: string; eyebrow: string; description: string; headline: string };

const PAPER_EN: Record<string, PaperEn> = {
  "ask-bulteni": {
    title: "Love Bulletin",
    eyebrow: "Love Bulletin newspaper template",
    headline: "LOVE BULLETIN",
    description:
      "Carry your story in a warm newspaper voice, with pink hearts, handwritten notes, and a large “Love Bulletin” headline. Your couple photo leads the cover; inside are your timeline, favourite frames, and a thank-you to your guests. Read it by turning pages, or print it at A3 or A2 as the keepsake everyone wants on the wedding table.",
  },
  "sonunda-evleniyorlar": {
    title: "They Are Finally Getting Married",
    eyebrow: "They Are Finally Getting Married newspaper template",
    headline: "THEY ARE FINALLY GETTING MARRIED",
    description:
      "Announce the wedding like news, with a “They are finally getting married!” headline, a black-and-white couple portrait, and magazine-style type. Inside: a timeline from the first meeting to the proposal, a photo collage, and kind words from the people you love. A page-turning reader and an A3/A2 print make it both shareable and worth keeping.",
  },
  "ask-kazandi": {
    title: "Love Won",
    eyebrow: "Love Won newspaper template",
    headline: "LOVE WON",
    description:
      "A nostalgic paper that says “Yes, love won,” with worn paper, taped Polaroids, torn notes, and dried flowers. Tell the story on a timeline, build a collage of dozens of photos, and carry messages from the people you love onto the pages. Read it digitally, or turn the A3/A2 print into a real memory book.",
  },
  evleniyoruz: {
    title: "We Are Getting Married",
    eyebrow: "We Are Getting Married newspaper template",
    headline: "WE ARE GETTING MARRIED",
    description:
      "A simple, striking wedding paper with a large “We are getting married!” headline, black-and-white portraits, and handwritten notes. A numbered timeline tells the story step by step; a memory page and a thank-you cover turn the paper into a family album. Turn the pages digitally, or place an A3/A2 print on the tables.",
  },
  "kolaj-gazetesi": {
    title: "Collage Gazette",
    eyebrow: "Collage Gazette newspaper template",
    headline: "COLLAGE GAZETTE",
    description:
      "A handmade memory-book of a wedding paper, dressed with postcards, stamps, wax seals, and pastel flowers. Polaroid frames and handwritten notes carry the story from the first meeting to the proposal. A romantic keepsake as a page-turning reader or an A3/A2 print.",
  },
  "yolculuk-gazetesi": {
    title: "Journey Gazette",
    eyebrow: "Journey Gazette newspaper template",
    headline: "JOURNEY GAZETTE",
    description:
      "A modern paper with airy white pages, terracotta accents, and magazine type under the headline “The most beautiful page of the same story.” An icon timeline, a memory collage, and a thank-you page tell the journey with ease. Read it digitally, or turn an A3/A2 print into a refined keepsake.",
  },
  "manset-gazetesi": {
    title: "Front-Page Gazette",
    eyebrow: "Front-Page Gazette newspaper template",
    headline: "FRONT-PAGE GAZETTE",
    description:
      "A nostalgic issue in sepia, with engraved ornaments and a classic newspaper grid that says “Our love story made the front page.” Column stories, a timeline, words from people you love, and a gift-note page recall the papers of another century. A timeless keepsake as a digital page-turner or an A3/A2 print.",
  },
  "altin-cag": {
    title: "Golden Age",
    eyebrow: "Golden Age newspaper template",
    headline: "GOLDEN AGE",
    description:
      "A wedding paper in the dazzling elegance of the 1920s, with gold art-deco frames, fan motifs, and a large “We are getting married!” headline. Story pages and a memory collage take on a cinematic air in black and white. Turn the pages digitally, or print at A3/A2 for a gala keepsake.",
  },
  "askin-manseti": {
    title: "The Headline of Love",
    eyebrow: "The Headline of Love newspaper template",
    headline: "THE HEADLINE OF LOVE",
    description:
      "A large “Headline of Love,” a couple photograph, and short news boxes announce the wedding like a front page. Inside are your meeting story, the wedding details, and your favourite moments. Guests turn the pages digitally or hold an A3/A2 print. Classic newspaper type, and a keepsake that does not date.",
  },
  "balayi-postasi": {
    title: "Honeymoon Post",
    eyebrow: "Honeymoon Post newspaper template",
    headline: "HONEYMOON POST",
    description:
      "Share the journey after the wedding: an airmail-striped cover that says “And we set off,” a departure board, and a toast. Inside, a dashed route map, taped Polaroid stops, a typewritten log, a telegram, and a travel glossary. The back cover is a postcard with passport stamps. Sepia paper, four pages, ready for A3 and A2.",
  },
  "bulmaca-eki": {
    title: "Puzzle Supplement",
    eyebrow: "Puzzle Supplement newspaper template",
    headline: "PUZZLE SUPPLEMENT",
    description:
      "Keep guests busy at the table: a crossword, word search, sudoku, anagrams, riddles, a coded message, a love forecast, and guest horoscopes, laid out like a real puzzle supplement. Answers sit on the last page, printed upside down the way newspapers do. Newsprint texture, four pages, ready for A3 and A2.",
  },
  "gunun-manseti": {
    title: "Today’s Headline",
    eyebrow: "Today’s Headline newspaper template",
    headline: "TODAY’S HEADLINE",
    description:
      "Like a real morning paper: a gothic masthead, a huge headline, your story running in columns, a chronology, an hour-by-hour wedding guide, horoscopes, and small ads that will make guests smile. Aged newsprint, four pages, ready for A3 and A2.",
  },
  "nisan-haberi": {
    title: "Engagement News",
    eyebrow: "Engagement News newspaper template",
    headline: "ENGAGEMENT NEWS",
    description:
      "“The promise is made, the rings are on.” An elegant four-column family paper on ivory: the families’ announcement and the proposal on the cover; inside, your story, an interview with the couple, a traditions column, the salted-coffee recipe, the day’s programme, and the table menu. The last page holds thanks, coffee-cup fortunes, and engagement notices.",
  },
  "pazar-eki": {
    title: "Sunday Supplement",
    eyebrow: "Sunday Supplement newspaper template",
    headline: "SUNDAY SUPPLEMENT",
    description:
      "In the careful style of a Sunday supplement: a Didone masthead, a wide cover photograph and cover lines, a long read with a drop cap, a chronology, the couple’s bookshelf, a photo series, a Sunday menu, a style column, letters, and a recipe for a happy marriage. Four full pages on old rose paper.",
  },
  "roportaj-ozel": {
    title: "Interview Special",
    eyebrow: "Interview Special newspaper template",
    headline: "INTERVIEW SPECIAL",
    description:
      "In the couple’s own words, like a real newspaper interview: a cover with a huge quotation mark, standfirsts and “who’s who” credits, a three-column Q&A, a rapid-fire table, sentence completions, questions from readers, and a last word. Ivory paper and black-and-white photographs. Every question and answer is yours to edit.",
  },
  "sayilarla-biz": {
    title: "Us, in Numbers",
    eyebrow: "Us, in Numbers newspaper template",
    headline: "US, IN NUMBERS",
    description:
      "The statistics of your love, like an old almanac: days together, coffees drunk, cities visited. Ledger-style balance sheets, column and line charts, a “who is late more often?” bar, an hour chart, a cup pictogram, and a prediction table. Four full pages of typewriter figures on sepia paper.",
  },
  "son-dakika": {
    title: "Breaking News",
    eyebrow: "Breaking News newspaper template",
    headline: "BREAKING NEWS",
    description:
      "“Flash! Flash! They are getting married!” A spilling red masthead, black breaking-news strips, a huge headline, numbered scene photographs, witness statements, an incident report, the big day minute by minute, horoscopes, and classifieds. Four full pages of tabloid energy on newsprint.",
  },
  "omurluk-hikaye": {
    title: "A Lifetime Story",
    eyebrow: "A Lifetime Story newspaper template",
    headline: "A LIFETIME STORY",
    description:
      "A classic paper that announces “a lifetime story,” with strong black headlines, red accents, and photo-heavy pages. A story page, a gallery of wedding week, Polaroid memories, and a thank-you page give the invitation the excitement of news. A keepsake guests will keep, as a digital reader or an A3/A2 print.",
  },
  "tarihi-kaydet": {
    title: "Save the Date",
    eyebrow: "Save the Date newspaper template",
    headline: "SAVE THE DATE",
    description:
      "The invitation at a glance: a huge date on the cover, a formal notice, and a calendar coupon to cut out and put on the fridge. Inside, an hour-by-hour programme, the venue, frequently asked questions, a hand-drawn plan, and a travel guide. The back cover is a postcard with a stamp. Burgundy ink on old rose paper, four pages, ready for A3 and A2.",
  },
  "yalin-haber": {
    title: "Plain News",
    eyebrow: "Plain News newspaper template",
    headline: "PLAIN NEWS",
    description:
      "Little ornament, plenty of information: a huge “Yes.” headline, a strict six-column grid, numbered sections, and a single red accent. Short reports, a chronology, an interview, an hour-by-hour programme table, a venue diagram, and a masthead, dense and orderly like a modern European paper. Ivory stock, four pages, ready for A3 and A2.",
  },
  "yildonumu-ozel": {
    title: "Anniversary Special",
    eyebrow: "Anniversary Special newspaper template",
    headline: "ANNIVERSARY SPECIAL",
    description:
      "A special issue that looks pulled from the archive for a 5th, 10th, or 25th anniversary: sepia paper, a huge year numeral, a reprint of the wedding-day story, a year-by-year chronology, “then / now” photographs and a comparison table, renewed vows, an anniversary gift guide, and archive notices. An unforgettable gift for a spouse or for parents.",
  },
  "dogum-gunu-gecesi": {
    title: "Birthday Night",
    eyebrow: "Birthday Night newspaper template",
    headline: "BIRTHDAY NIGHT",
    description:
      "A party paper in black and gold that puts “Birthday Night” on the front page, with the glitter of an evening out. The night’s programme, the venue, a photo gallery, and a thank-you page turn the celebration into a keepsake. Share it digitally, or make the A3/A2 print the detail everyone notices on the party table.",
  },
  "buyuk-lansman": {
    title: "The Big Launch",
    eyebrow: "The Big Launch newspaper template",
    headline: "THE BIG LAUNCH",
    description:
      "Put a product launch, a gala, or a company event on the front page, in a navy-and-gold corporate layout. The agenda, speakers, venue notes, photo gallery, and thank-you page document the event with care. Share it in the digital reader, or offer an A3/A2 print as a keepsake.",
  },
  "muzigin-kalbi": {
    title: "The Heart of the Music",
    eyebrow: "The Heart of the Music newspaper template",
    headline: "THE HEART OF THE MUSIC",
    description:
      "An energetic festival paper that says “The heart of the music beat here,” with yellow and pink neon, brush headlines, and stage photographs. The stage programme, a map of the grounds, day-by-day events, and guest comments carry the excitement onto the page. Share it digitally, or print at A3/A2 as the festival’s keepsake.",
  },
  "mezuniyet-gunu": {
    title: "Graduation Day",
    eyebrow: "Graduation Day newspaper template",
    headline: "GRADUATION DAY",
    description:
      "A paper that puts “Graduation Day” on the front page, with a gothic masthead, gold accents, and photographs of graduates tossing their caps. A timeline of school years, lines from the graduation speech, the ceremony programme, and a memory page keep the day. Share it digitally, or print at A3/A2 for families and friends.",
  },
  "yeni-yila-merhaba": {
    title: "Hello, New Year",
    eyebrow: "Hello, New Year newspaper template",
    headline: "HELLO, NEW YEAR",
    description:
      "A black-and-gold New Year paper that says “Hello, New Year,” with gold sparkle, fireworks, and champagne glasses. The flow of the night, the venue, the menu and surprises, a photo collage, and a thank-you page make the celebration hard to forget. Share it digitally, or let the A3/A2 print star on the New Year table.",
  },
  "yaz-gecesi": {
    title: "Summer Night",
    eyebrow: "Summer Night newspaper template",
    headline: "SUMMER NIGHT",
    description:
      "A party paper that puts “Summer Night” on the front page, in the orange and pink of sunset, terrace lights, and handwritten notes. The programme, the venue, a drinks menu, a photo collage, and a thank-you page hold the feeling of a summer evening. Share it digitally, or print at A3/A2 as the best memory of the season.",
  },
  "sezonun-lansmani": {
    title: "The Season Launch",
    eyebrow: "The Season Launch newspaper template",
    headline: "THE SEASON LAUNCH",
    description:
      "A paper that puts your brand forward, with black-and-white fashion photographs, burgundy accents, and a magazine-cover “Season Launch” headline. The programme, special guests, standout moments, and a thank-you page turn the launch into a polished issue. Share it digitally, or present an A3/A2 print to guests.",
  },
  "acilis-haberi": {
    title: "Opening News",
    eyebrow: "Opening News newspaper template",
    headline: "OPENING NEWS",
    description:
      "An old-style trade and notices paper for a restaurant, café, shop, or office opening: a market ticker, a “We are opening our doors!” headline, an interview with the founder, signature products and a price list, the opening-day programme, a cut-out discount coupon, and a classifieds page. Hand it to customers, or hang it in the window.",
  },
  "bekarliga-veda": {
    title: "Farewell to Single Life",
    eyebrow: "Farewell to Single Life newspaper template",
    headline: "FAREWELL TO SINGLE LIFE",
    description:
      "“Last night!” A tabloid on aged pink paper for the bride-to-be’s farewell: paparazzi photographs, ten shocking facts about the bride, a gossip column, five minutes with the bride, the night’s programme and rules, a cocktail menu, horoscopes, a scored task card, and small ads. Laughter is included.",
  },
  "disko-gecesi": {
    title: "Disco Night",
    eyebrow: "Disco Night newspaper template",
    headline: "DISCO NIGHT",
    description:
      "A nightlife paper on a dark ground for a 1970s and 1980s party: a record sleeve and a record that spills off the cover, an entry ticket, the floor’s top ten, a record review and a gossip column, a step-by-step dance guide, a fashion page, the night’s programme, disco horoscopes, and night ads. For a birthday, New Year, or theme party.",
  },
  "dogdugun-gun": {
    title: "The Day You Were Born",
    eyebrow: "The Day You Were Born newspaper template",
    headline: "THE DAY YOU WERE BORN",
    description:
      "A nostalgic birthday surprise, like a reprint of the paper that came out on the day they were born. A sepia cover headlined “They have arrived,” a birth report and congratulatory notices, an archive file of what was happening in the world that year, a year-by-year life chronology, the party invitation, wishes, and horoscopes. A gift paper for 30, 40, 50, 60, and every age after.",
  },
  "mezunlar-yilligi": {
    title: "Alumni Yearbook",
    eyebrow: "Alumni Yearbook newspaper template",
    headline: "ALUMNI YEARBOOK",
    description:
      "A graduation paper where the school newspaper meets the yearbook: a navy masthead, a photo wall, “class superlatives” announced like election results, a graduation report card, an hour-by-hour ceremony and a cap-toss guide, a signature corner, and a letter to the future. For high school, university, and postgraduate ceremonies.",
  },
  "odul-gecesi": {
    title: "Awards Night",
    eyebrow: "Awards Night newspaper template",
    headline: "AWARDS NIGHT",
    description:
      "A prestigious gala issue for your company’s awards night: gold rules and an art-deco masthead on dark, textured paper. The cover carries the curtain story and an invitation stub; inside are categories and nominees, a prediction slip, the jury, voting figures, the flow of the night, a room plan, and the gala menu. The last page holds congratulations, the winners, backstage notes, and a thank-you credit.",
  },
};

export function themeTitle(theme: Theme, locale: Locale): string {
  if (locale !== "en") return theme.title;
  return THEME_TITLES[theme.slug] ?? theme.title;
}

export function localizeTheme(theme: Theme, locale: Locale): Theme {
  if (locale !== "en") return theme;
  const special = THEME_SPECIAL[theme.slug];
  const title = themeTitle(theme, locale);
  return {
    ...theme,
    title,
    eyebrow: special?.eyebrow ?? OPENING_EYEBROW[theme.opening],
    description:
      special?.description ??
      `A digital invitation in the ${title} theme. It opens with ${OPENING_WITH[theme.opening]}, works on any phone, and is shared with a single link.`,
    tags: theme.tags.map((tag) => TAGS[tag] ?? tag),
  };
}

export function tagLabel(tag: string, locale: Locale): string {
  if (locale !== "en") return tag;
  return TAGS[tag] ?? tag;
}

export function localizeNewspaper(paper: Newspaper, locale: Locale): Newspaper {
  if (locale !== "en") return paper;
  const en = PAPER_EN[paper.slug];
  const cover = COVER_EN[paper.slug] || paper.cover;
  if (!en) return { ...paper, cover };
  return {
    ...paper,
    title: en.title,
    eyebrow: en.eyebrow,
    description: en.description,
    headline: en.headline,
    tagline: "Your story, on the front page",
    cover,
  };
}

export function studioName(id: string, fallback: string, locale: Locale): string {
  if (locale !== "en") return fallback;
  return STUDIO_NAME_EN[id] ?? fallback;
}

export function studioCategory(key: string, fallback: string, locale: Locale): string {
  if (locale !== "en") return fallback;
  return STUDIO_CATEGORY_EN[key] ?? fallback;
}
