import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, orderBy, serverTimestamp, limit
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  getDatabase, ref as dbRef, get as rtdbGet, set as rtdbSet, remove as rtdbRemove
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js?v=3.9.1';

const VERSION = '3.10.0';
const ADMIN_UID = 'keFUW39oQDeo4u4i2OQEusxCKqX2';
const MAX_AUDIO_BYTES = 6.5 * 1024 * 1024;
const appEl = document.querySelector('#app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const coreConfigured = ['apiKey','authDomain','projectId','appId'].every(k => firebaseConfig[k] && !String(firebaseConfig[k]).startsWith('PASTE_'));
const rtdbConfigured = Boolean(firebaseConfig.databaseURL && !String(firebaseConfig.databaseURL).startsWith('PASTE_'));

window.addEventListener('unhandledrejection',e=>{
  console.error('Unhandled rejection:',e.reason);
});

let app = null, auth = null, db = null, rtdb = null;
if (coreConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (rtdbConfigured) rtdb = getDatabase(app);
}

const defaultBrand = {
  appName: 'Thanksgiving', brandName: 'Tianlala', tagline: 'Good Drinks, Better Vibes',
  primary: '#ffd400', secondary: '#0b0b0b', accent: '#ff6ea9',
  logo: 'assets/tianlala-logo.jpg', caption: 'Good Drinks, Better Vibes 🎵', vibe: 'playful',
  menuFeatureEnabled: true,
  heroExperienceEnabled: true,
  heroType: 'drink',
  heroModel: 'drink-order',
  heroRotationMode: 'fixed',
  enabledHeroModels: ['drink-order','drink-vinyl','food-cafe','food-dessert','combo-pairing','combo-editorial'],
  heroHeadline: '',
  heroBubble: '',
  heroShowPhone: true,
  heroShowTicket: true,
  heroShowMeong: true,
  userOccasionPickerEnabled: true,
  enabledUserOccasions: ['regular','birthday','wedding','graduation','puasa','lebaran','adha','christmas','newyear','valentine','imlek','halloween'],
  photoBrandingEnabled: true,
  photoBrandingStyle: 'frame',
  photoBrandingStrength: 'bold',
  photoBrandingShowName: true,
  photoBrandingShowTagline: true,
  photoBrandingLabel: 'THANKSGIVING',
  lobbySoundEnabled: true,
  sfxEnabled: true,
  lobbyVolume: 0.72,
  sfxVolume: 0.18,
  lobbyMusicUrl: '',
  lobbyAudioRef: '',
  lobbyAudioFilename: '',
  lobbyAudioSize: 0,
  meongPlayingLines: [
    'Yakin lagu ini nggak bikin kamu keinget seseorang? 👀',
    'Kalau tiba-tiba senyum sendiri, Meong pura-pura nggak lihat 😼',
    'Katanya cuma mau minum… kok malah jadi soundtrack hidup?',
    'Jangan buru-buru gacha lagi, lagu ini belum selesai mainin perasaanmu 🎧',
    '{song} cocok banget sama mood {genre} kamu. Agak mencurigakan sih.',
    'Kalau jadi overthinking gara-gara lagu ini, protesnya ke DJ Meong ya 🐾'
  ],
  meongReturnLine: 'Jangan lupa beli lagi di {brand} ya 😼🧋',
  meongPausedLine: 'Kasetnya dijeda dulu. Meong nunggu kamu lanjut 👀',
  birthdayMeongLines: [
    'Hari ini {name} boleh senyum lebih lama. Ini soundtrack ulang tahunmu 🎂',
    'Umur nambah, tapi lagu yang bikin keinget seseorang masih aja ada ya? 👀',
    '{song} jadi soundtrack resmi birthday moment {name} sekarang ✨',
    'Birthday rule: minum yang enak, dengerin lagu, jangan mikirin umur dulu 😼',
    'Kalau wish-nya rahasia, Meong pura-pura nggak denger kok 🕯️',
    'Foto yang bagus ya. Tahun depan belum tentu pose-nya masih sama 😹'
  ],
  enabledGenres: ['Pop','Chill','R&B','Indie','Jazz','Lo-fi','Rock','Electronic'],
  enabledTemplates: ['signature','vinyl','sweet','scrap','retro','editorial','kawaii','film','birthday','night','magazine','receipt','korean4cut','chrome','newspaper','digicam','photodump','mono','softflash','coquette','dualcam','stickerbomb','streetposter','mirror','chatstory','visionboard','beigediary','cleanflash','dreamyfilm','socialnote','songcard','photobooth2','citynight','bdaycake','bdayballoon','bdaydisco','bdaypastel','bdayy2k','bdaywish','bdaycandle','bdaygift']
};


const extraCelebrationTemplateIds = [
  'wedclassic','wedfloral','wedgold','wedstory','wedvow',
  'gradcap','gradconfetti','gradpaper','gradflash','gradyearbook',
  'puasalantern','puasiftar','puasanight',
  'lebaranmoon','lebaranketupat','lebaransalam',
  'adhamoon','adhasafari','adhagold',
  'xmassnow','xmasgift','xmascozy',
  'nyefirework','nyecountdown','nyeglitter',
  'valheart','valloveletter','valrosy',
  'imleklantern','imlekgold','imlekfortune',
  'halloweenspooky','pumpkinparty','ghostneon'
];
defaultBrand.enabledTemplates = [...new Set([...(defaultBrand.enabledTemplates||[]), ...extraCelebrationTemplateIds])];

const genreIcons = { Pop:'🎵', Chill:'☁️', 'R&B':'💜', Indie:'🌿', Jazz:'☕', 'Lo-fi':'🌙', Rock:'⚡', Electronic:'🎛️' };

const defaultGenreMeongLines = {
  Pop: [
    'Genre {genre} begini tuh rawan bikin kamu senyum-senyum sendiri 😼',
    '{song} kayaknya cocok buat nemenin kamu sok cool padahal hati rame 🎧',
    'Kalau beat-nya bikin pengen repeat, berarti Pop-nya lagi pas banget buat kamu ✦'
  ],
  Chill: [
    'Mode {genre} aktif. Santai dulu, jangan buru-buru kabur ke lagu lain ☁️',
    '{song} tuh enaknya dinikmatin pelan-pelan, biar perasaanmu ikut adem 😼',
    'Vibe {genre} ini cocok buat nyeruput minum sambil pura-pura nggak kepikiran siapa-siapa 🎶'
  ],
  'R&B': [
    '{genre} tuh selalu punya bakat bikin hati mendadak lembek 💜',
    '{song} kedengerannya kayak lagu buat tatapan yang kelamaan 👀',
    'Kalau sekarang kamu jadi mellow, salahin groove {genre}-nya aja ya 😼'
  ],
  Indie: [
    'Genre {genre} ini berasa paling ngerti isi kepala kamu diam-diam 🌿',
    '{song} tuh cocok buat vibes yang kelihatan santai padahal banyak cerita',
    'Kalau mendadak pengen jadi tokoh utama, mungkin efek {genre} lagi jalan ✦'
  ],
  Jazz: [
    'Masuk ke {genre} tuh kayak minum pelan di tempat yang lampunya hangat ☕',
    '{song} punya aura yang bikin kamu pengen duduk lebih lama dari niat awal 🎷',
    'Kalau tiba-tiba semuanya terasa classy, itu kerjaan vibe {genre} 😼'
  ],
  'Lo-fi': [
    '{genre} mode: malam, pikiran pelan, dan suasana mendadak aesthetic 🌙',
    '{song} tuh pas buat nemenin overthinking versi estetik kamu ✦',
    'Jangan buru-buru gacha lagi, vibe {genre} ini baru mulai nyentuh 🎧'
  ],
  Rock: [
    'Wah, {genre} nih. Energinya cocok buat yang hatinya lagi pengen teriak dikit ⚡',
    '{song} kayaknya bakal lebih seru kalau kamu denger sambil angguk-angguk dramatis 😼',
    'Kalau mood kamu mendadak naik, berarti distorsi {genre}-nya kena banget ♪'
  ],
  Electronic: [
    '{genre} tuh punya bakat bikin suasana langsung kerasa futuristik 🎛️',
    '{song} cocok buat kamu yang pengen vibe-nya nyala terus dari awal sampai akhir ✦',
    'Kalau beat-nya bikin kepala otomatis gerak, berarti drop-nya berhasil 😼'
  ],
  default: [
    'Lagu ini jangan cuma lewat, biarin dulu dia kerja di perasaanmu 🎧',
    'Meong DJ bilang soundtrack ini masih layak dikasih waktu lebih lama 😼',
    'Kalau cocok di hati, repeat dulu baru gacha lagi ✦'
  ]
};

const templateMeta = [
  ['signature','Signature Polaroid','Clean instant-photo look'],
  ['vinyl','Vinyl Drop','Music-card + piringan hitam'],
  ['sweet','Sweet Doodle','Heart, star, doodle lucu'],
  ['scrap','Scrapbook Tape','Paper, tape, handwritten vibe'],
  ['retro','Retro Disc','Y2K holographic music card'],
  ['editorial','Minimal Editorial','Clean magazine aesthetic'],
  ['kawaii','Kawaii Pop','Sticker-heavy playful frame'],
  ['film','Film Roll','Analog film strip'],
  ['birthday','Birthday Confetti','Special event / birthday'],
  ['night','Night Drive','Dark neon cinematic'],
  ['magazine','Magazine Cover','Cover editorial bold'],
  ['receipt','Receipt Story','Cute thermal-receipt look'],
  ['korean4cut','🔥 Korean 4-Cut','Korean booth strip + playful Y2K'],
  ['chrome','🔥 Cyber Chrome','Metallic chrome + cyber Y2K'],
  ['newspaper','🔥 Newspaper Flash','Editorial newspaper / paparazzi vibe'],
  ['digicam','🔥 Digicam 2000','Flash cam + timestamp nostalgia'],
  ['photodump','🔥 Photo Dump','Messy-cute collage for Story'],
  ['mono','🔥 Mono Studio','Black & white clean fashion look'],
  ['softflash','🔥 Soft Flash Diary','Dreamy flash + pastel diary aesthetic'],
  ['coquette','🔥 Coquette Ribbon','Bow, lace, ribbon, soft cute trend'],
  ['dualcam','🔥 Dual Cam Moment','Front-back vibe ala social dump'],
  ['stickerbomb','🔥 Sticker Bomb','Hyperpop stickers + fun chaos'],
  ['streetposter','🔥 Street Poster','Bold poster paste / urban editorial'],
  ['mirror','🔥 Mirror Mood','Glossy mirror selfie aesthetic'],
  ['chatstory','🔥 Chat Story','Chat bubble / social story style'],
  ['visionboard','🔥 Vision Board','Soft collage / scrapbook board'],
  ['beigediary','🔥 Beige Diary','Clean beige journal / soft lifestyle'],
  ['cleanflash','🔥 Clean Flash','Bright flash, clean social portrait'],
  ['dreamyfilm','🔥 Dreamy Film','Soft grain, glow, nostalgic film mood'],
  ['socialnote','🔥 Social Note','Minimal note / status update aesthetic'],
  ['songcard','🔥 Song Card','Music-player card + portrait layout'],
  ['photobooth2','🔥 2-Shot Booth','Two-frame photobooth strip'],
  ['citynight','🔥 City Night','Dark urban lights + cinematic timestamp'],
  ['bdaycake','🎂 Cake Wish','Cake, candles, wish & birthday name'],
  ['bdayballoon','🎈 Balloon Pop','Floating balloons + cheerful birthday frame'],
  ['bdaydisco','🪩 Birthday Disco','Party lights + disco birthday energy'],
  ['bdaypastel','🎀 Pastel Party','Soft pastel birthday diary vibe'],
  ['bdayy2k','📸 Y2K Birthday Flash','Digicam flash + birthday 2000s look'],
  ['bdaywish','💌 Birthday Wish Card','Personal wish-card layout for birthday'],
  ['bdaycandle','🕯️ Candle Glow','Warm candlelight birthday portrait'],
  ['bdaygift','🎁 Gift Pop','Playful gift-box birthday frame']
];
const birthdayTemplateIds = ['birthday','bdaycake','bdayballoon','bdaydisco','bdaypastel','bdayy2k','bdaywish','bdaycandle','bdaygift'];
const birthdayIntroPacks = ['cake','balloons','gift','disco','confetti'];
const trendingTemplateIds = ['korean4cut','chrome','newspaper','digicam','photodump','mono','softflash','coquette','dualcam','stickerbomb','streetposter','mirror','chatstory','visionboard','beigediary','cleanflash','dreamyfilm','socialnote','songcard','photobooth2','citynight',...birthdayTemplateIds];

const extraTemplateMeta = [
  ['puasalantern','🌙 Ramadan Lantern','Warm Ramadan lantern frame'],
  ['puasiftar','🥤 Iftar Diary','Cozy buka puasa diary style'],
  ['puasanight','✨ Ramadan Night','Night-sky Ramadan aesthetic'],
  ['wedclassic','💍 Wedding Classic','Elegant wedding portrait frame'],
  ['wedfloral','🌸 Floral Vows','Soft floral wedding scrapbook'],
  ['wedgold','✨ Golden Forever','Luxury gold wedding card'],
  ['wedstory','📖 Wedding Story','Story-style wedding memory'],
  ['wedvow','🤍 Vow Note','Warm wedding letter layout'],
  ['gradcap','🎓 Cap Toss','Graduation frame with cap toss vibe'],
  ['gradconfetti','🎉 Graduate Party','Confetti graduation celebration'],
  ['gradpaper','📜 Diploma Diary','Paper / diploma style frame'],
  ['gradflash','📸 Grad Flash','Flash-cam graduation layout'],
  ['gradyearbook','📘 Yearbook Star','Yearbook-inspired graduation page'],
  ['lebaranmoon','🌙 Moon Blessing','Lebaran moon & lantern frame'],
  ['lebaranketupat','🧺 Ketupat Cheer','Lebaran ketupat festive frame'],
  ['lebaransalam','✨ Salam Hangat','Warm Eid greeting card style'],
  ['adhamoon','🕌 Eid Al-Adha Glow','Moonlit Adha celebration frame'],
  ['adhasafari','🐄 Qurban Moment','Warm earthy Idul Adha layout'],
  ['adhagold','⭐ Golden Blessing','Gold-accent Idul Adha card'],
  ['xmassnow','🎄 Snowy Christmas','Snowflakes + Christmas lights'],
  ['xmasgift','🎁 Christmas Gift','Gift-card holiday frame'],
  ['xmascozy','☕ Cozy Noel','Warm cozy Christmas diary'],
  ['nyefirework','🎆 Firework Night','New Year fireworks celebration'],
  ['nyecountdown','🕛 Countdown Glow','Countdown timer party style'],
  ['nyeglitter','✨ Glitter Toast','Sparkly New Year celebration'],
  ['valheart','💘 Heart Rush','Valentine heart-frame template'],
  ['valloveletter','💌 Love Letter','Romantic love-note layout'],
  ['valrosy','🌹 Rosy Date','Rose-toned Valentine aesthetic'],
  ['imleklantern','🧧 Lantern Luck','Imlek lantern celebration'],
  ['imlekgold','🐉 Golden Prosperity','Prosperity-themed Lunar New Year'],
  ['imlekfortune','✨ Fortune Red','Red envelope & blessing card'],
  ['halloweenspooky','🎃 Spooky Night','Cute spooky Halloween frame'],
  ['pumpkinparty','👻 Pumpkin Party','Playful pumpkin Halloween vibe'],
  ['ghostneon','🕸️ Ghost Neon','Neon haunted-party aesthetic']
];
templateMeta.push(...extraTemplateMeta);

const brandPersonalTemplateMeta = [
  ['brandcassette','🎧 Brand Cassette','Kaset + soundtrack + warna brand personal'],
  ['brandpulse','✦ Brand Pulse','Glow, waveform, dan identity brand'],
  ['brandmeong','🐱 Brand Meong','Meong DJ + speech card khas brand']
];
const brandPersonalTemplateIds = brandPersonalTemplateMeta.map(x=>x[0]);
templateMeta.push(...brandPersonalTemplateMeta);
defaultBrand.enabledTemplates = [...new Set([...(defaultBrand.enabledTemplates||[]), ...brandPersonalTemplateIds])];

const weddingTemplateIds = ['wedclassic','wedfloral','wedgold','wedstory','wedvow'];
const graduationTemplateIds = ['gradcap','gradconfetti','gradpaper','gradflash','gradyearbook'];
const lebaranTemplateIds = ['lebaranmoon','lebaranketupat','lebaransalam'];
const puasaTemplateIds = ['puasalantern','puasiftar','puasanight'];
const adhaTemplateIds = ['adhamoon','adhasafari','adhagold'];
const christmasTemplateIds = ['xmassnow','xmasgift','xmascozy'];
const newyearTemplateIds = ['nyefirework','nyecountdown','nyeglitter'];
const valentineTemplateIds = ['valheart','valloveletter','valrosy'];
const imlekTemplateIds = ['imleklantern','imlekgold','imlekfortune'];
const halloweenTemplateIds = ['halloweenspooky','pumpkinparty','ghostneon'];

const occasionCatalog = {
  regular: { label:'Regular', picker:'Regular', badge:'🎧 Regular', previewTitle:'Scan & temukan soundtrack minumanmu 🎧', previewText:'Pilih genre, gacha soundtrack, lalu abadikan momennya.', thermal:'♫ Coba scan<br>dan temukan keseruannya!', downloadHeadline:'Minumanmu punya soundtrack 🎧', downloadText:'Scan QR ini, pilih genre, gacha lagu, lalu abadikan momennya.', downloadBadge:'✨ Scan & temukan keseruannya!' },
  birthday: { label:'Birthday', picker:'🎂 Birthday', badge:'🎂 Birthday', previewTitle:'Ada birthday surprise buat kamu! 🎂', previewText:'Scan QR ini, buka surprise, gacha lagu birthday, lalu simpan momennya.', thermal:'🎂 Scan untuk buka<br>birthday surprise!', downloadHeadline:'Ada birthday surprise buat kamu 🎂', downloadText:'Scan, buka kejutan, gacha lagu ulang tahun, lalu simpan momennya.', downloadBadge:'🎉 Scan buat buka surprise!', notice:'Birthday Mode memakai intro animasi random setiap scan + template foto khusus ulang tahun.' },
  wedding: { label:'Happy Wedding', picker:'💍 Happy Wedding', badge:'💍 Wedding', previewTitle:'Wedding vibes + soundtrack manis 💍', previewText:'Scan QR ini, temukan soundtrack manis, lalu abadikan momen wedding-nya.', thermal:'💍 Scan untuk buka<br>wedding vibes!', downloadHeadline:'Ada wedding soundtrack buat kamu 💍', downloadText:'Scan, pilih genre, gacha lagu, lalu simpan momen happy wedding ini.', downloadBadge:'🤍 Scan buat wedding vibes!' },
  graduation: { label:'Happy Graduation', picker:'🎓 Happy Graduation', badge:'🎓 Graduation', previewTitle:'Graduation vibes + soundtrack seru 🎓', previewText:'Scan QR ini, gacha lagu, lalu abadikan momen kelulusanmu.', thermal:'🎓 Scan untuk buka<br>graduation vibes!', downloadHeadline:'Ada graduation soundtrack buat kamu 🎓', downloadText:'Scan, pilih genre, gacha lagu, lalu simpan momen kelulusanmu.', downloadBadge:'🎉 Scan buat celebration!' },
  puasa: { label:'Ramadan / Puasa', picker:'🌙 Ramadan / Puasa', badge:'🌙 Ramadan', previewTitle:'Ramadan vibes + soundtrack hangat 🌙', previewText:'Scan QR ini, pilih vibe, temukan lagu, lalu abadikan momen buka puasamu.', thermal:'🌙 Scan untuk buka<br>Ramadan vibes!', downloadHeadline:'Ada Ramadan soundtrack buat kamu 🌙', downloadText:'Scan, pilih genre, pilih lagu, lalu simpan momen Ramadanmu.', downloadBadge:'✨ Scan buat Ramadan vibes!' },
  lebaran: { label:'Lebaran / Idul Fitri', picker:'🌙 Lebaran / Idul Fitri', badge:'🌙 Lebaran', previewTitle:'Lebaran vibes + soundtrack spesial 🌙', previewText:'Scan QR ini, temukan soundtrack hangat, lalu simpan momen Lebaranmu.', thermal:'🌙 Scan untuk buka<br>Lebaran vibes!', downloadHeadline:'Ada soundtrack Lebaran buat kamu 🌙', downloadText:'Scan, pilih genre, gacha lagu, lalu abadikan momen Lebaranmu.', downloadBadge:'✨ Scan & rayakan Lebaran!' },
  adha: { label:'Idul Adha', picker:'🐄 Idul Adha', badge:'🐄 Idul Adha', previewTitle:'Idul Adha vibes + soundtrack hangat 🐄', previewText:'Scan QR ini, temukan soundtrack spesial, lalu abadikan momennya.', thermal:'🐄 Scan untuk buka<br>Idul Adha vibes!', downloadHeadline:'Ada soundtrack Idul Adha buat kamu 🐄', downloadText:'Scan, pilih genre, gacha lagu, lalu abadikan momen Idul Adhamu.', downloadBadge:'✨ Scan & rayakan bersama!' },
  christmas: { label:'Christmas', picker:'🎄 Christmas', badge:'🎄 Christmas', previewTitle:'Christmas vibes + soundtrack cozy 🎄', previewText:'Scan QR ini, temukan soundtrack Natal, lalu simpan momennya.', thermal:'🎄 Scan untuk buka<br>Christmas vibes!', downloadHeadline:'Ada Christmas soundtrack buat kamu 🎄', downloadText:'Scan, pilih genre, gacha lagu, lalu abadikan momen Natalmu.', downloadBadge:'❄️ Scan buat holiday vibes!' },
  newyear: { label:'New Year', picker:'🎆 New Year', badge:'🎆 New Year', previewTitle:'New Year vibes + soundtrack pesta 🎆', previewText:'Scan QR ini, gacha lagu, lalu rayakan pergantian tahun dengan vibes keren.', thermal:'🎆 Scan untuk buka<br>New Year vibes!', downloadHeadline:'Ada New Year soundtrack buat kamu 🎆', downloadText:'Scan, pilih genre, gacha lagu, lalu rayakan momen tahun baru.', downloadBadge:'🕛 Scan & mulai hitung mundur!' },
  valentine: { label:'Valentine', picker:'💘 Valentine', badge:'💘 Valentine', previewTitle:'Valentine vibes + soundtrack romantis 💘', previewText:'Scan QR ini, pilih vibe manis, lalu abadikan momennya.', thermal:'💘 Scan untuk buka<br>Valentine vibes!', downloadHeadline:'Ada Valentine soundtrack buat kamu 💘', downloadText:'Scan, pilih genre, gacha lagu, lalu simpan momen romantismu.', downloadBadge:'💌 Scan buat love vibes!' },
  imlek: { label:'Chinese New Year / Imlek', picker:'🧧 Chinese New Year / Imlek', badge:'🧧 Imlek', previewTitle:'Imlek vibes + soundtrack hoki 🧧', previewText:'Scan QR ini, temukan soundtrack spesial, lalu simpan momen Imlekmu.', thermal:'🧧 Scan untuk buka<br>Imlek vibes!', downloadHeadline:'Ada Imlek soundtrack buat kamu 🧧', downloadText:'Scan, pilih genre, gacha lagu, lalu rayakan momen Imlekmu.', downloadBadge:'✨ Scan & rayakan hoki!' },
  halloween: { label:'Halloween', picker:'🎃 Halloween', badge:'🎃 Halloween', previewTitle:'Halloween vibes + soundtrack seru 🎃', previewText:'Scan QR ini, gacha lagu, lalu abadikan momen spooky-mu.', thermal:'🎃 Scan untuk buka<br>Halloween vibes!', downloadHeadline:'Ada Halloween soundtrack buat kamu 🎃', downloadText:'Scan, pilih genre, gacha lagu, lalu simpan momen spooky-mu.', downloadBadge:'👻 Scan buat spooky vibes!' }
};

const occasionTemplateGroups = {
  birthday: birthdayTemplateIds,
  wedding: weddingTemplateIds,
  graduation: graduationTemplateIds,
  puasa: puasaTemplateIds,
  lebaran: lebaranTemplateIds,
  adha: adhaTemplateIds,
  christmas: christmasTemplateIds,
  newyear: newyearTemplateIds,
  valentine: valentineTemplateIds,
  imlek: imlekTemplateIds,
  halloween: halloweenTemplateIds
};
const allCelebrationTemplateIds = Object.values(occasionTemplateGroups).flat();
const regularTemplateIds = templateMeta.map(t=>t[0]).filter(id=>!allCelebrationTemplateIds.includes(id));
const occasionOrder = ['regular','birthday','wedding','graduation','puasa','lebaran','adha','christmas','newyear','valentine','imlek','halloween'];

const occasionIntroThemes = {
  wedding:{icon:'💍',kicker:'WEDDING MOMENT',title:'Happy Wedding!',subtitle:'Hari spesial ini pantas punya soundtrack yang ikut dikenang.',action:'Buka wedding soundtrack',tap:'tap cincin buat kasih sparkle ✨',bits:['🤍','✨','🌸','💍']},
  graduation:{icon:'🎓',kicker:'GRADUATION MOMENT',title:'You did it!',subtitle:'Kelulusan cuma sekali di fase ini — bikin soundtrack-nya ikut memorable.',action:'Buka graduation soundtrack',tap:'tap topinya buat lempar confetti 🎉',bits:['🎓','✨','🎉','📚']},
  puasa:{icon:'🌙',kicker:'RAMADAN MOMENT',title:'Ramadan vibes unlocked!',subtitle:'Waktunya santai, buka puasa, dan pilih soundtrack yang paling pas buat momennya.',action:'Buka Ramadan soundtrack',tap:'tap bulan buat nyalain lentera ✨',bits:['🌙','✨','🏮','⭐','🥤']},
  lebaran:{icon:'🌙',kicker:'EID MOMENT',title:'Selamat Idul Fitri!',subtitle:'Silaturahmi, minuman enak, dan soundtrack hangat buat momen Lebaran.',action:'Buka Lebaran soundtrack',tap:'tap bulan buat nyalain lampion ✨',bits:['🌙','✨','🧺','⭐']},
  adha:{icon:'🕌',kicker:'EID AL-ADHA',title:'Selamat Idul Adha!',subtitle:'Momen hangat, penuh syukur, dan soundtrack yang tenang buat menemani.',action:'Buka Idul Adha soundtrack',tap:'tap masjid buat kasih glow ✨',bits:['🕌','⭐','✨','🌙']},
  christmas:{icon:'🎄',kicker:'CHRISTMAS MOMENT',title:'Merry Christmas!',subtitle:'Lampu hangat, suasana cozy, dan soundtrack Natal buat nemenin momennya.',action:'Buka Christmas soundtrack',tap:'tap pohonnya buat turunin salju ❄️',bits:['🎄','❄️','✨','🎁']},
  newyear:{icon:'🎆',kicker:'NEW YEAR MOMENT',title:'Happy New Year!',subtitle:'Tahun baru, vibe baru. Cari soundtrack pertama yang pas buat momennya.',action:'Buka New Year soundtrack',tap:'tap kembang api buat ledakin party ✨',bits:['🎆','✨','🕛','🎉']},
  valentine:{icon:'💘',kicker:'VALENTINE MOMENT',title:'Happy Valentine!',subtitle:'Sedikit manis, sedikit dramatis, dan soundtrack yang pas buat momen ini.',action:'Buka Valentine soundtrack',tap:'tap hati buat kirim love spark 💌',bits:['💘','💌','🌹','✨']},
  imlek:{icon:'🧧',kicker:'LUNAR NEW YEAR',title:'Gong Xi Fa Cai!',subtitle:'Semoga hoki, bahagia, dan soundtrack bagus ikut datang bareng momen ini.',action:'Buka Imlek soundtrack',tap:'tap angpao buat keluarin hoki ✨',bits:['🧧','🐉','✨','🏮']},
  halloween:{icon:'🎃',kicker:'HALLOWEEN MOMENT',title:'Spooky vibes unlocked!',subtitle:'Yang serem cukup dekorasinya. Soundtrack-nya tetap harus enak.',action:'Buka Halloween soundtrack',tap:'tap labu buat panggil ghost party 👻',bits:['🎃','👻','🕸️','✨']}
};


const celebrationTemplateThemes = {
  wedclassic:{occasion:'wedding',layout:'elegant',accent:'#f1d6b1',surface:'#fff8f1',ink:'#432c1f',headline:'HAPPY WEDDING',sub:'For your sweetest forever moment',badge:'💍 FOREVER',emoji:'💍'},
  wedfloral:{occasion:'wedding',layout:'diary',accent:'#efc4cf',surface:'#fff7fb',ink:'#6d4150',headline:'Floral Vows',sub:'Soft blooms for the big day',badge:'🌸 vows',emoji:'🌸'},
  wedgold:{occasion:'wedding',layout:'glow',accent:'#f5d671',surface:'#13100e',ink:'#fff8e0',headline:'Golden Forever',sub:'A classy wedding memory frame',badge:'✨ JUST MARRIED',emoji:'✨'},
  wedstory:{occasion:'wedding',layout:'story',accent:'#f0d3b8',surface:'#201713',ink:'#fff6f2',headline:'Wedding Story',sub:'One love, one soundtrack',badge:'🤍 our day',emoji:'🤍'},
  wedvow:{occasion:'wedding',layout:'paper',accent:'#edd8c7',surface:'#f4ece3',ink:'#5d4739',headline:'Vow Note',sub:'Keep this wedding note close',badge:'📜 vows',emoji:'📜'},
  gradcap:{occasion:'graduation',layout:'elegant',accent:'#8fb7ff',surface:'#eef4ff',ink:'#21324c',headline:'HAPPY GRADUATION',sub:'You made it — cue the soundtrack',badge:'🎓 CLASS OF NOW',emoji:'🎓'},
  gradconfetti:{occasion:'graduation',layout:'glow',accent:'#ffd564',surface:'#171526',ink:'#fff9df',headline:'Graduate Party',sub:'Confetti, cheers, and new beginnings',badge:'🎉 YOU DID IT',emoji:'🎉'},
  gradpaper:{occasion:'graduation',layout:'paper',accent:'#dbc28b',surface:'#f6f0dd',ink:'#5b4a23',headline:'Diploma Diary',sub:'A page from your graduation day',badge:'📜 future unlocked',emoji:'📜'},
  gradflash:{occasion:'graduation',layout:'story',accent:'#c5d6ff',surface:'#0f1118',ink:'#fff',headline:'Grad Flash',sub:'Flash on, milestone saved',badge:'📸 SENIOR MODE',emoji:'📸'},
  gradyearbook:{occasion:'graduation',layout:'diary',accent:'#9ecbff',surface:'#f4f7ff',ink:'#243a57',headline:'Yearbook Star',sub:'Sign this page with a smile',badge:'📘 yearbook',emoji:'📘'},
  puasalantern:{occasion:'puasa',layout:'elegant',accent:'#d8bd6c',surface:'#17382f',ink:'#f8f4df',headline:'RAMADAN NIGHT',sub:'Warm lanterns, calm vibes, good soundtrack',badge:'🌙 RAMADAN',emoji:'🏮'},
  puasiftar:{occasion:'puasa',layout:'diary',accent:'#d89f73',surface:'#f4eadf',ink:'#5b4437',headline:'Iftar Diary',sub:'Buka puasa, minuman enak, momen tersimpan',badge:'🥤 IFTAR',emoji:'🥤'},
  puasanight:{occasion:'puasa',layout:'glow',accent:'#9dc8ff',surface:'#101d33',ink:'#f1f7ff',headline:'Ramadan Night',sub:'Slow night, soft light, soundtrack on',badge:'✨ NIGHT VIBES',emoji:'🌙'},
  lebaranmoon:{occasion:'lebaran',layout:'elegant',accent:'#d9c16d',surface:'#103b31',ink:'#f7f5e6',headline:'SELAMAT IDUL FITRI',sub:'Mohon maaf lahir dan batin',badge:'🌙 EID VIBES',emoji:'🌙'},
  lebaranketupat:{occasion:'lebaran',layout:'diary',accent:'#84c286',surface:'#f3f8eb',ink:'#31503a',headline:'Ketupat Cheer',sub:'Lebaran hangat, foto makin niat',badge:'🧺 ketupat',emoji:'🧺'},
  lebaransalam:{occasion:'lebaran',layout:'paper',accent:'#e1d29f',surface:'#fbf6e8',ink:'#5a4c2b',headline:'Salam Hangat',sub:'Rayakan momen silaturahmi',badge:'✨ maaf lahir batin',emoji:'✨'},
  adhamoon:{occasion:'adha',layout:'elegant',accent:'#d4bb6b',surface:'#16362b',ink:'#f7f2e2',headline:'SELAMAT IDUL ADHA',sub:'Semoga harimu penuh keberkahan',badge:'🕌 ADHA',emoji:'🕌'},
  adhasafari:{occasion:'adha',layout:'diary',accent:'#b99266',surface:'#f5ecdf',ink:'#5e472f',headline:'Qurban Moment',sub:'Hangat, sederhana, penuh syukur',badge:'🐄 qurban vibes',emoji:'🐄'},
  adhagold:{occasion:'adha',layout:'glow',accent:'#f0ca67',surface:'#13100a',ink:'#fff7df',headline:'Golden Blessing',sub:'Blessings in every moment',badge:'⭐ penuh berkah',emoji:'⭐'},
  xmassnow:{occasion:'christmas',layout:'glow',accent:'#7dd7ff',surface:'#102335',ink:'#fff',headline:'MERRY CHRISTMAS',sub:'Snowy lights and warm songs',badge:'❄️ NOEL',emoji:'❄️'},
  xmasgift:{occasion:'christmas',layout:'elegant',accent:'#df5f5f',surface:'#fff4f1',ink:'#4e2525',headline:'Christmas Gift',sub:'A cheerful frame for your holiday',badge:'🎁 HOLIDAY CHEER',emoji:'🎁'},
  xmascozy:{occasion:'christmas',layout:'paper',accent:'#c9aa73',surface:'#f5ede0',ink:'#5b4433',headline:'Cozy Noel',sub:'Warm drink, warm song, warm smile',badge:'☕ cozy night',emoji:'☕'},
  nyefirework:{occasion:'newyear',layout:'glow',accent:'#ff7ca8',surface:'#100d1e',ink:'#fff',headline:'HAPPY NEW YEAR',sub:'Fireworks, flash, and fresh starts',badge:'🎆 MIDNIGHT',emoji:'🎆'},
  nyecountdown:{occasion:'newyear',layout:'story',accent:'#9ed8ff',surface:'#101521',ink:'#fff',headline:'Countdown Glow',sub:'3…2…1… smile!',badge:'🕛 COUNTDOWN',emoji:'🕛'},
  nyeglitter:{occasion:'newyear',layout:'elegant',accent:'#ffe27a',surface:'#1b1522',ink:'#fff8dc',headline:'Glitter Toast',sub:'Celebrate the first vibe of the year',badge:'✨ cheers',emoji:'✨'},
  valheart:{occasion:'valentine',layout:'elegant',accent:'#ff8fb0',surface:'#fff1f6',ink:'#6a3144',headline:'HAPPY VALENTINE',sub:'A sweet frame for a sweet vibe',badge:'💘 love rush',emoji:'💘'},
  valloveletter:{occasion:'valentine',layout:'paper',accent:'#f2c9d4',surface:'#fff9fb',ink:'#5d3b45',headline:'Love Letter',sub:'Romantic note meets good soundtrack',badge:'💌 love note',emoji:'💌'},
  valrosy:{occasion:'valentine',layout:'diary',accent:'#d87c90',surface:'#fff3f0',ink:'#6c3744',headline:'Rosy Date',sub:'Soft, rosy, and a little dramatic',badge:'🌹 date mood',emoji:'🌹'},
  imleklantern:{occasion:'imlek',layout:'elegant',accent:'#f0c85f',surface:'#4a0d14',ink:'#fff4dc',headline:'HAPPY IMLEK',sub:'Semoga hoki selalu menyertaimu',badge:'🧧 HOKI',emoji:'🧧'},
  imlekgold:{occasion:'imlek',layout:'glow',accent:'#ffd86f',surface:'#23080c',ink:'#fff6db',headline:'Golden Prosperity',sub:'Prosperity, joy, and festive vibes',badge:'🐉 prosperity',emoji:'🐉'},
  imlekfortune:{occasion:'imlek',layout:'paper',accent:'#e86767',surface:'#fff4ed',ink:'#6a2d2d',headline:'Fortune Red',sub:'Lucky red moments worth keeping',badge:'✨ good fortune',emoji:'✨'},
  halloweenspooky:{occasion:'halloween',layout:'glow',accent:'#ff9b45',surface:'#150d1f',ink:'#fff8e8',headline:'HALLOWEEN NIGHT',sub:'Cute spooky vibes only',badge:'🎃 SPOOKY',emoji:'🎃'},
  pumpkinparty:{occasion:'halloween',layout:'story',accent:'#ffb056',surface:'#181216',ink:'#fff',headline:'Pumpkin Party',sub:'Treats, tricks, and soundtrack picks',badge:'👻 boo!',emoji:'👻'},
  ghostneon:{occasion:'halloween',layout:'diary',accent:'#9ff1ff',surface:'#141922',ink:'#ebffff',headline:'Ghost Neon',sub:'Haunted but make it aesthetic',badge:'🕸️ neon',emoji:'🕸️'}
};

function occasionId(value=state.campaign?.occasion){ return String(value||'regular').toLowerCase(); }
function occasionMeta(value=state.campaign?.occasion){ return occasionCatalog[occasionId(value)] || occasionCatalog.regular; }
function occasionOptionsHtml(selected='regular'){
  const current=occasionId(selected);
  return occasionOrder.map(id=>`<option value="${id}" ${current===id?'selected':''}>${occasionCatalog[id].picker}</option>`).join('');
}
function occasionBadge(value=state.campaign?.occasion){ return occasionMeta(value).badge; }

function campaignOccasionMode(c=state.campaign){
  return c?.occasionMode==='locked'?'locked':'choose';
}
function generalQrMeta(){
  return {
    previewTitle:'Pilih momenmu. Temukan soundtrackmu ✦',
    previewText:'Scan QR, pilih occasion yang aktif, lanjut ke musik, lalu abadikan momenmu.',
    thermal:'✦ Scan untuk pilih<br>moment & soundtrack!',
    downloadHeadline:'Satu QR untuk semua moment ✦',
    downloadText:'Scan, pilih occasion yang kamu mau, temukan soundtrack, lalu simpan foto atau videonya.',
    downloadBadge:'♫ Scan • Pilih Moment • Mainkan Soundtrack'
  };
}
function qrMetaFor(mode='choose',occasion='regular'){
  return mode==='choose'?generalQrMeta():occasionMeta(occasion);
}

function enabledUserOccasions(){
  const configured=Array.isArray(state.brand.enabledUserOccasions)?state.brand.enabledUserOccasions:occasionOrder;
  const valid=configured.filter(id=>occasionCatalog[id]);
  return valid.length?valid:['regular'];
}
function canUserPickOccasion(){ return state.brand.userOccasionPickerEnabled!==false && enabledUserOccasions().length>1; }

function closeOccasionPicker(){
  const modal=$('.user-occasion-modal');
  if(!modal)return;
  modal.classList.remove('is-open');
  setTimeout(()=>modal.remove(),180);
}
function openUserOccasionPicker(){
  closeOccasionPicker();
  const ids=enabledUserOccasions();
  const modal=document.createElement('div');
  modal.className='user-occasion-modal';
  modal.innerHTML=`<div class="user-occasion-card occasion-picker-animated">
    <button class="user-occasion-close" type="button" aria-label="Tutup">×</button>
    <div class="occasion-picker-kicker">PILIH MOMENT</div>
    <h3>Mau vibe yang mana?</h3>
    <p>Pilihan ini cuma berlaku buat sesi kamu. Musik, intro, dan template foto ikut menyesuaikan.</p>
    <div class="user-occasion-grid">
      ${ids.map((id,i)=>`<button class="user-occasion-option ${occasionId()===id?'active':''}" data-user-occasion="${id}" style="--oi:${i}" type="button">
        <span>${occasionCatalog[id].badge.split(' ')[0]}</span>
        <b>${esc(occasionCatalog[id].label)}</b>
        <small>${esc(occasionCatalog[id].previewText)}</small>
      </button>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(()=>modal.classList.add('is-open'));

  const close=()=>closeOccasionPicker();
  $('.user-occasion-close',modal).onclick=close;
  modal.onclick=e=>{if(e.target===modal)close();};
  $$('[data-user-occasion]',modal).forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.userOccasion;
    if(id==='birthday')return openBirthdayCustomerSetup();
    state.campaign={...(state.campaign||{}),occasion:id};
    state.template='';
    close();
    setTimeout(()=>renderArrivalIntro(),150);
  });
}

function brandRgba(hex,a=.5){
  try{
    const [r,g,b]=hexToRgb(String(hex||'#000000'));
    return `rgba(${r},${g},${b},${a})`;
  }catch{return `rgba(0,0,0,${a})`;}
}
function photoBrandingClass(){
  return `brand-style-${state.brand.photoBrandingStyle||'frame'} brand-strength-${state.brand.photoBrandingStrength||'bold'}`;
}
function photoBrandingMarkup(){
  if(state.brand.photoBrandingEnabled===false)return '';
  return `<div class="photo-brand-live ${photoBrandingClass()}">
    <i></i>
    <div>
      ${state.brand.photoBrandingShowName!==false?`<b>${esc(state.brand.brandName||'Brand')}</b>`:''}
      ${state.brand.photoBrandingShowTagline!==false?`<span>${esc(state.brand.tagline||'')}</span>`:''}
    </div>
    <em>${esc(state.brand.photoBrandingLabel||state.brand.appName||'THANKSGIVING')}</em>
  </div>`;
}
function drawPhotoBrandOverlay(ctx){
  if(state.brand.photoBrandingEnabled===false)return;
  const primary=state.brand.primary||'#ffd400';
  const secondary=state.brand.secondary||'#0b0b0b';
  const accent=state.brand.accent||primary;
  const style=state.brand.photoBrandingStyle||'frame';
  const strength=state.brand.photoBrandingStrength||'bold';
  const alpha=strength==='subtle'?.42:strength==='balanced'?.68:.88;
  const line=strength==='subtle'?3:strength==='balanced'?5:8;
  const name=String(state.brand.brandName||'').trim();
  const tagline=String(state.brand.tagline||'').trim();
  const label=String(state.brand.photoBrandingLabel||state.brand.appName||'THANKSGIVING').trim().toUpperCase();

  ctx.save();

  if(style==='frame'){
    ctx.strokeStyle=brandRgba(primary,alpha);
    ctx.lineWidth=line;
    ctx.strokeRect(28,28,1024,1294);
    ctx.strokeStyle=brandRgba(accent,alpha*.48);
    ctx.lineWidth=Math.max(2,line*.45);
    ctx.strokeRect(46,46,988,1258);

    const g=ctx.createLinearGradient(0,1110,1080,1350);
    g.addColorStop(0,brandRgba(secondary,0));
    g.addColorStop(.42,brandRgba(secondary,.45*alpha));
    g.addColorStop(1,brandRgba(secondary,.88*alpha));
    ctx.fillStyle=g;ctx.fillRect(0,1070,1080,280);
  }else if(style==='ribbon'){
    ctx.fillStyle=brandRgba(primary,.84*alpha);
    ctx.fillRect(0,56,1080,92);
    ctx.fillStyle=brandRgba(secondary,.78*alpha);
    ctx.fillRect(0,1165,1080,185);
    ctx.fillStyle=brandRgba(accent,.85*alpha);
    ctx.fillRect(72,165,180,8);
  }else{
    // stamp
    ctx.strokeStyle=brandRgba(primary,.72*alpha);
    ctx.lineWidth=line;
    ctx.beginPath();ctx.moveTo(38,180);ctx.lineTo(38,38);ctx.lineTo(180,38);ctx.stroke();
    ctx.beginPath();ctx.moveTo(900,1312);ctx.lineTo(1042,1312);ctx.lineTo(1042,1170);ctx.stroke();
    ctx.fillStyle=brandRgba(secondary,.72*alpha);
    rr(ctx,64,1118,610,158,28,brandRgba(secondary,.72*alpha),brandRgba(primary,.58*alpha),3);
  }

  if(label){
    ctx.font='900 22px sans-serif';
    ctx.letterSpacing='3px';
    ctx.fillStyle=style==='ribbon'?'#111':brandRgba(primary,.98);
    ctx.fillText(label.slice(0,32),72,style==='ribbon'?113:1160);
  }
  if(state.brand.photoBrandingShowName!==false && name){
    ctx.font='900 34px sans-serif';
    ctx.fillStyle=style==='ribbon'?'#111':'#fff';
    ctx.fillText(name.slice(0,34),72,style==='ribbon'?103:1210);
  }
  if(state.brand.photoBrandingShowTagline!==false && tagline){
    ctx.font='600 20px sans-serif';
    ctx.fillStyle=style==='ribbon'?brandRgba('#111111',.7):'rgba(255,255,255,.72)';
    ctx.fillText(tagline.slice(0,58),72,style==='ribbon'?132:1245);
  }

  // Small signature dots / music mark to keep it tied to the project.
  ctx.fillStyle=brandRgba(accent,.9*alpha);
  ctx.beginPath();ctx.arc(972,1168,7,0,Math.PI*2);ctx.fill();
  ctx.font='900 28px sans-serif';
  ctx.fillText('♫',1002,1180);

  ctx.restore();
}
function occasionDisplayLabel(value=state.campaign?.occasion){ return occasionMeta(value).label; }
function celebrationTemplateConfig(id){ return celebrationTemplateThemes[id] || null; }
function celebrationTargetName(){ return (state.campaign?.birthdayName || state.campaign?.customer || 'Kamu').trim() || 'Kamu'; }

function songScopeLabel(scope){
  const id=String(scope||'all').toLowerCase();
  if(id==='all') return '🌐 Semua Occasion';
  return occasionBadge(id)+' Only';
}
function songScopeOptionsHtml(selected='all'){
  const cur=String(selected||'all').toLowerCase();
  return [`<option value="all" ${cur==='all'?'selected':''}>🌐 Semua Occasion</option>`]
    .concat(occasionOrder.map(id=>`<option value="${id}" ${cur===id?'selected':''}>${occasionBadge(id)} Only</option>`)).join('');
}


const rarityWeight = { Common: 60, Uncommon: 25, Rare: 10, Epic: 4, Legendary: 1 };

const state = {
  menuItems:[], launchConfig:null, deliveryLinks:{gofood:'',grabfood:'',shopeefood:''}, menuOpening:false,
  brand: {...defaultBrand}, campaign: null, songs: [], selectedGenre: null,
  heroSessionModel:'',
  selectedSong: null, template: 'signature', photo: null, user: null,
  captions: [], audioObjectUrl: null, audioKey: '', playEventKey: '',
  cameraFacing: 'environment', cameraStream: null, birthdayPack: 'cake',
  photoLogoX: 930, photoLogoY: 52, photoLogoSize: 104,
  photoBrandNameX:76, photoBrandNameY:1090, photoBrandNameSize:34,
  photoCaptionX:76, photoCaptionY:1160, photoCaptionSize:25,
  photoShowLogo:true, photoShowBrandName:true, photoShowBrandCaption:true,
  captureMode:'photo', captureFormat:'feed',
  videoWithMusic:true, videoDuration:10, videoDesign:'clean',
  videoClipStart:0, videoClipDuration:10, videoClipAudioDuration:0,
  videoClipSamples:[], videoClipSongKey:'', videoClipPreviewing:false,
  videoAssetLayout:{
    logo:{x:.06,y:.055,size:.115},
    name:{x:.20,y:.073,size:.044},
    caption:{x:.20,y:.112,size:.025}
  },
  rawVideoUrl:'', rawVideoBlob:null, rawVideoMime:'', recordedVideoUrl:'', recordedVideoBlob:null, recordedVideoMime:'', shareVideoBlob:null, shareVideoMime:'', shareVideoPreparing:false, shareVideoError:'', playSource:'gacha', gachaHistory:[], lastGachaSongId:'', gachaGenreHistory:[], lastGachaGenre:''
};

// Persistent player: tetap hidup walau UI berpindah dari hasil gacha ke kamera/editor.
const musicPlayer = new Audio();
musicPlayer.preload = 'auto';
musicPlayer.playsInline = true;
let audioUnlocked = false;
let audioLoadToken = 0;
let gachaFlowToken = 0;
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

// ---------------------------------------------------------
// Meong Soundscape
// - Lobby ambience for intro/menu screens.
// - UI click / sparkle / gacha SFX.
// - Main soundtrack always has priority.
// ---------------------------------------------------------
const lobbyPlayer = new Audio();
lobbyPlayer.loop = true;
lobbyPlayer.preload = 'auto';
lobbyPlayer.playsInline = true;

let soundCtx = null;
let soundUnlocked = false;
let lobbyWanted = false;
let lobbySynthTimer = null;
let lobbyGeneration = 0;
let lobbyLastUrl = '';

let lobbyAutoplayBlocked = false;
let lobbyAutoplayNoticeTimer = null;

function soundSetting(name, fallback){
  const v=state.brand?.[name];
  return v===undefined || v===null ? fallback : v;
}
function clamp01(v, fallback=.1){
  const n=Number(v);
  if(!Number.isFinite(n)) return fallback;
  return Math.max(0,Math.min(1,n));
}
function effectiveLobbyVolume(v){
  // Uploaded lobby tracks are often mastered quietly.
  // Give them a gentle 1.65x boost while still respecting the 0–100% slider.
  return Math.min(1, clamp01(v,.72)*1.65);
}
function ensureSoundContext(){
  if(!soundCtx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC) soundCtx=new AC();
  }
  return soundCtx;
}
async function unlockSoundscape(){
  if(soundUnlocked) return true;
  try{
    const ctx=ensureSoundContext();
    if(ctx?.state==='suspended') await ctx.resume();
    soundUnlocked=true;
    if(lobbyWanted) startLobbyAmbient();
    syncSoundToggleUi();
    return true;
  }catch(e){
    console.warn('Soundscape unlock failed',e);
    return false;
  }
}
function stopLobbySynth(){
  if(lobbySynthTimer){ clearInterval(lobbySynthTimer); lobbySynthTimer=null; }
  lobbyGeneration++;
}

function pauseLobbyAmbient({fade=true}={}){
  stopLobbySynth();
  clearLobbyAutoplayNotice();

  if(!lobbyPlayer.paused){
    if(fade){
      const start=lobbyPlayer.volume;
      const gen=++lobbyGeneration;
      let step=0;
      const t=setInterval(()=>{
        if(gen!==lobbyGeneration){clearInterval(t);return;}
        step++;
        lobbyPlayer.volume=Math.max(0,start*(1-step/7));
        if(step>=7){
          clearInterval(t);
          lobbyPlayer.pause();
          try{lobbyPlayer.currentTime=0;}catch{}
          lobbyPlayer.volume=effectiveLobbyVolume(soundSetting('lobbyVolume',.72));
        }
      },35);
    }else{
      lobbyPlayer.pause();
      try{lobbyPlayer.currentTime=0;}catch{}
    }
  }
  syncSoundToggleUi();
}

function stopLobbyAmbient({fade=true}={}){
  lobbyWanted=false;
  clearLobbyAutoplayNotice();
  stopLobbySynth();

  if(!lobbyPlayer.paused){
    if(fade){
      const start=lobbyPlayer.volume;
      const gen=++lobbyGeneration;
      let step=0;
      const t=setInterval(()=>{
        if(gen!==lobbyGeneration){clearInterval(t);return;}
        step++;
        lobbyPlayer.volume=Math.max(0,start*(1-step/7));
        if(step>=7){
          clearInterval(t);
          lobbyPlayer.pause();
          try{lobbyPlayer.currentTime=0;}catch{}
          lobbyPlayer.volume=effectiveLobbyVolume(soundSetting('lobbyVolume',.72));
        }
      },35);
    }else{
      lobbyPlayer.pause();
      try{lobbyPlayer.currentTime=0;}catch{}
    }
  }
  syncSoundToggleUi();
}
function setLobbyWanted(wanted=true){
  lobbyWanted=Boolean(wanted);
  if(!lobbyWanted){
    stopLobbyAmbient();
    return;
  }

  // Lobby tidak boleh menabrak soundtrack customer.
  if(!musicPlayer.paused && !musicPlayer.ended) return;

  // If sound was toggled back ON in this customer session, resume immediately.
  if(soundSetting('lobbySoundEnabled',true)){
    if(soundUnlocked) startLobbyAmbient();
    else tryLobbyAutoplay();
  }
}
function scheduleLobbyPulse(){
  const ctx=ensureSoundContext();
  if(!ctx || !soundUnlocked || !lobbyWanted) return;
  if(!soundSetting('lobbySoundEnabled',true)) return;
  if(!musicPlayer.paused && !musicPlayer.ended) return;

  const volume=effectiveLobbyVolume(soundSetting('lobbyVolume',.72));
  const now=ctx.currentTime;
  const roots=[196,220,174.61,246.94];
  const root=roots[Math.floor(Math.random()*roots.length)];
  const notes=[root,root*1.25,root*1.5];

  notes.forEach((freq,i)=>{
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const filter=ctx.createBiquadFilter();

    osc.type=i===0?'sine':'triangle';
    osc.frequency.setValueAtTime(freq,now+i*.055);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(920,now);

    gain.gain.setValueAtTime(0.0001,now+i*.055);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0003,volume*.055),now+.16+i*.055);
    gain.gain.exponentialRampToValueAtTime(.0001,now+1.25+i*.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now+i*.055);
    osc.stop(now+1.32+i*.055);
  });
}
async function startLobbyAmbient(){
  if(!lobbyWanted || !soundUnlocked) return;
  if(!soundSetting('lobbySoundEnabled',true)) return;
  if(!musicPlayer.paused && !musicPlayer.ended) return;

  const ref=String(soundSetting('lobbyAudioRef','')||'').trim();
  const url=String(soundSetting('lobbyMusicUrl','')||'').trim();
  const volume=effectiveLobbyVolume(soundSetting('lobbyVolume',.72));

  // Dedicated uploaded lobby audio. This is isolated from Music Library.
  if(ref && rtdbConfigured && rtdb){
    stopLobbySynth();
    const cacheKey=`rtdb:${ref}`;
    if(lobbyLastUrl!==cacheKey){
      try{
        const snap=await rtdbGet(dbRef(rtdb,`audio/${ref}`));
        if(snap.exists()){
          const a=snap.val()||{};
          if(a.data){
            lobbyLastUrl=cacheKey;
            lobbyPlayer.src=`data:${a.mime||'audio/mpeg'};base64,${a.data}`;
            lobbyPlayer.load();
          }
        }
      }catch(e){
        console.warn('Lobby upload load failed',e);
      }
    }
    if(lobbyLastUrl===cacheKey){
      lobbyPlayer.volume=volume;
      try{
        await lobbyPlayer.play();
        lobbyAutoplayBlocked=false;
        clearLobbyAutoplayNotice();
      }catch(e){
        lobbyAutoplayBlocked=true;
        console.info('Lobby autoplay waiting for interaction',e?.name||e);
        showLobbyAutoplayNotice();
      }
      syncSoundToggleUi();
      return;
    }
  }

  if(url){
    stopLobbySynth();
    if(lobbyLastUrl!==url){
      lobbyLastUrl=url;
      lobbyPlayer.src=url;
      lobbyPlayer.load();
    }
    lobbyPlayer.volume=volume;
    try{
      await lobbyPlayer.play();
      lobbyAutoplayBlocked=false;
      clearLobbyAutoplayNotice();
    }catch(e){
      lobbyAutoplayBlocked=true;
      console.info('Lobby URL autoplay waiting for interaction',e?.name||e);
      showLobbyAutoplayNotice();
    }
    syncSoundToggleUi();
    return;
  }

  // Built-in soft Meong lobby if admin leaves upload/URL empty.
  if(!lobbyPlayer.paused){
    lobbyPlayer.pause();
    try{lobbyPlayer.currentTime=0;}catch{}
  }
  if(!lobbySynthTimer){
    scheduleLobbyPulse();
    lobbySynthTimer=setInterval(scheduleLobbyPulse,2200);
  }
  syncSoundToggleUi();
}
function playTone(freq=500,dur=.08,volume=.06,type='sine',delay=0){
  if(!soundSetting('sfxEnabled',true) || !soundUnlocked) return;
  const ctx=ensureSoundContext();
  if(!ctx) return;
  const master=clamp01(soundSetting('sfxVolume',.18),.18);
  const now=ctx.currentTime+delay;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,now);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,master*volume),now+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,now+dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now+dur+.015);
}
function playUiSfx(kind='click'){
  if(!soundSetting('sfxEnabled',true) || !soundUnlocked) return;
  if(kind==='click'){
    playTone(620,.055,.48,'sine');
    playTone(830,.045,.25,'sine',.018);
  }else if(kind==='spark'){
    playTone(760,.09,.38,'triangle');
    playTone(1030,.12,.28,'sine',.055);
  }else if(kind==='select'){
    playTone(420,.075,.38,'sine');
    playTone(610,.08,.35,'triangle',.05);
  }else if(kind==='gacha'){
    [330,440,587,784].forEach((f,i)=>playTone(f,.11,.38,'triangle',i*.07));
    playTone(1046,.17,.32,'sine',.31);
  }else if(kind==='reveal'){
    [523,659,784].forEach((f,i)=>playTone(f,.15,.3,'sine',i*.045));
  }
}

function clearLobbyAutoplayNotice(){
  if(lobbyAutoplayNoticeTimer){
    clearTimeout(lobbyAutoplayNoticeTimer);
    lobbyAutoplayNoticeTimer=null;
  }
  const n=document.querySelector('.lobby-autoplay-notice');
  if(n) n.remove();
}
function showLobbyAutoplayNotice(){
  if(!lobbyWanted || !soundSetting('lobbySoundEnabled',true)) return;
  clearLobbyAutoplayNotice();

  const host=document.querySelector('.customer-page');
  if(!host) return;

  const n=document.createElement('button');
  n.type='button';
  n.className='lobby-autoplay-notice';
  n.innerHTML='<span>♪</span><b>Tap sekali untuk nyalain musik lobby</b>';
  n.onclick=async()=>{
    await unlockSoundscape();
    lobbyAutoplayBlocked=false;
    clearLobbyAutoplayNotice();
    startLobbyAmbient();
  };
  host.appendChild(n);

  lobbyAutoplayNoticeTimer=setTimeout(()=>{
    const el=document.querySelector('.lobby-autoplay-notice');
    if(el) el.classList.add('soft');
  },3500);
}
async function tryLobbyAutoplay(){
  if(!lobbyWanted || !soundSetting('lobbySoundEnabled',true)) return false;
  if(!musicPlayer.paused && !musicPlayer.ended) return false;

  // First try normal autoplay immediately on first screen.
  // Browsers may allow this depending on media engagement / prior permission.
  try{
    soundUnlocked=true;
    await startLobbyAmbient();
    if(!lobbyPlayer.paused || lobbySynthTimer){
      lobbyAutoplayBlocked=false;
      clearLobbyAutoplayNotice();
      syncSoundToggleUi();
      return true;
    }
  }catch(e){}

  // If the browser blocks audible autoplay, keep the exact same lobby queued
  // and start it on the very first touch/click anywhere.
  lobbyAutoplayBlocked=true;
  showLobbyAutoplayNotice();
  return false;
}

function syncSoundToggleUi(){
  $$('.music-pulse').forEach(btn=>{
    const on=soundSetting('lobbySoundEnabled',true)||soundSetting('sfxEnabled',true);
    btn.classList.toggle('sound-off',!on);
    btn.classList.toggle('sound-on',on && soundUnlocked);
    btn.setAttribute('aria-label',on?'Sound aktif':'Sound nonaktif');
    btn.title=on?'Sound aktif':'Sound nonaktif';
  });
}
async function toggleSoundscape(){
  await unlockSoundscape();
  clearLobbyAutoplayNotice();

  const currentlyOn=Boolean(
    soundSetting('lobbySoundEnabled',true) ||
    soundSetting('sfxEnabled',true)
  );

  // Customer-side toggle is session-only.
  // OFF: stop lobby and disable SFX for this session.
  // ON: re-enable and explicitly request lobby again.
  state.brand.lobbySoundEnabled=!currentlyOn;
  state.brand.sfxEnabled=!currentlyOn;

  if(currentlyOn){
    pauseLobbyAmbient({fade:true});
  }else{
    lobbyWanted=true;
    lobbyAutoplayBlocked=false;
    lobbyLastUrl='';

    try{
      await startLobbyAmbient();
    }catch(e){
      console.warn('Lobby restart failed',e);
      showLobbyAutoplayNotice();
    }
  }

  syncSoundToggleUi();
}

function installSoundscapeDelegation(){
  if(window.__thanksgivingSoundscapeInstalled) return;
  window.__thanksgivingSoundscapeInstalled=true;

  // Browser butuh user gesture sebelum audio boleh berbunyi.
  document.addEventListener('pointerdown',async()=>{
    await unlockSoundscape();
    if(lobbyWanted){
      lobbyAutoplayBlocked=false;
      clearLobbyAutoplayNotice();
      startLobbyAmbient();
    }
  },{once:true,capture:true});

  document.addEventListener('click',e=>{
    const target=e.target.closest('button,.btn,.genre-card,.template-chip,.song-pick-card,.music-pulse,.np-toggle,.play-main');
    if(!target) return;

    if(target.classList.contains('music-pulse')){
      e.preventDefault();
      toggleSoundscape();
      return;
    }

    if(target.matches('.surprise-btn,#again,#endedGacha,[data-ended-gacha],#songBrowserSurprise')){
      playUiSfx('gacha');
    }else if(target.matches('.regular-action,.occasion-detail-chip,#introCassette,#occasionMagic')){
      playUiSfx('spark');
    }else if(target.matches('.genre-card,.song-pick-card,.template-chip')){
      playUiSfx('select');
    }else{
      playUiSfx('click');
    }
  },true);
}
// Kalau lagu selesai saat user sudah pindah ke kamera/editor, Meong DJ tetap muncul.
musicPlayer.addEventListener('play',()=>stopLobbyAmbient({fade:true}));
musicPlayer.addEventListener('ended',()=>{
  if(adminMode() || $('#trackEndedPrompt')) return;
  const host=$('.customer-page'); if(!host) return;
  $('.global-ended-toast')?.remove();
  const el=document.createElement('div');
  el.className='global-ended-toast';
  el.innerHTML=`<div class="global-ended-cat">🐱</div><div><b>Lagunya udah selesai 😼</b><span>Mau puter lagi atau gacha baru?</span></div><div class="global-ended-actions"><button type="button" data-ended-replay>↻ Putar lagi</button><button type="button" data-ended-gacha>🎲 Gacha</button></div>`;
  host.appendChild(el);
  $('[data-ended-replay]',el).onclick=async()=>{try{musicPlayer.currentTime=0;}catch{} await playSelectedSong({countEvent:false});el.remove();};
  $('[data-ended-gacha]',el).onclick=()=>{el.remove();stopCameraStream();stopMusic(true);renderGacha();};
});
const audioSrcCache = new Map();
let rtdbWarmPromise = null;
function cacheAudioSrc(key, src){
  if(!key || !src) return src;
  if(audioSrcCache.has(key)) audioSrcCache.delete(key);
  audioSrcCache.set(key, src);
  while(audioSrcCache.size > 3){ const first=audioSrcCache.keys().next().value; audioSrcCache.delete(first); }
  return src;
}
function warmAudioBackend(){
  if(!rtdbConfigured || !rtdb) return Promise.resolve(false);
  if(!rtdbWarmPromise) rtdbWarmPromise=rtdbGet(dbRef(rtdb,'.info/connected')).catch(()=>null);
  return rtdbWarmPromise;
}

function esc(v='') { return String(v).replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function baseUrl(){ return location.origin + location.pathname; }

function publicDataRef(id){ return doc(db,'public',id); }

const pendingMenuFiles=new Map();
const pendingMenuDeletes=[];
const menuImageCache=new Map();

async function compressMenuImage(file,max=720,q=.76){
  const data=await compressImage(file,max,q);
  return {data,mime:(data.match(/^data:([^;]+);/)||[])[1]||'image/webp'};
}
function menuMediaDocId(item){
  return `menu_media_${String(item?.id||'menu').replace(/[^a-zA-Z0-9_-]/g,'_')}`;
}
async function saveMenuImage(item,file){
  const packed=await compressMenuImage(file);
  const mediaId=menuMediaDocId(item);
  await setDoc(publicDataRef(mediaId),{
    kind:'menu-image',
    itemId:item.id,
    data:packed.data,
    mime:packed.mime,
    filename:file.name,
    originalSize:file.size,
    updatedAt:serverTimestamp()
  });
  item.imageSource='firestore';
  item.imageRef=mediaId;
  item.imageFilename=file.name;
  item.imageSize=file.size;
  item.image='';
  menuImageCache.set(mediaId,packed.data);
}
async function deleteMenuImageRef(refId){
  if(!refId)return;
  await deleteDoc(publicDataRef(refId));
  menuImageCache.delete(refId);
}
async function resolveMenuImage(item){
  if(!item)return '';
  if(item.imageSource==='firestore'&&item.imageRef){
    if(menuImageCache.has(item.imageRef))return menuImageCache.get(item.imageRef);
    try{
      const s=await getDoc(publicDataRef(item.imageRef));
      if(!s.exists())return '';
      const v=s.data()||{};
      if(!v.data)return '';
      menuImageCache.set(item.imageRef,v.data);
      return v.data;
    }catch(e){
      console.warn('Menu image load failed',e);
      return '';
    }
  }
  return item.image||'';
}
function hydrateMenuImages(root=document){
  $$('img[data-menu-image]',root).forEach(async img=>{
    if(img.dataset.hydrated==='1')return;
    img.dataset.hydrated='1';
    const id=img.dataset.menuImage;
    const item=(state.menuItems||[]).find(x=>x.id===id);
    const src=await resolveMenuImage(item);
    if(src)img.src=src;
    else img.closest('.menu-image-shell')?.classList.add('no-image');
  });
}
function moneyId(v){
  const n=Number(String(v||'').replace(/[^\d]/g,''));
  return n?`Rp${n.toLocaleString('id-ID')}`:String(v||'');
}
async function loadMenuData(){
  const [m,l,d]=await Promise.all([
    getDoc(publicDataRef('menu')).catch(()=>null),
    getDoc(publicDataRef('launch')).catch(()=>null),
    getDoc(publicDataRef('deliveryLinks')).catch(()=>null)
  ]);
  state.menuItems=m?.exists()&&Array.isArray(m.data().items)?m.data().items:[];
  state.launchConfig=l?.exists()?l.data():{active:false};
  state.deliveryLinks={
    gofood:d?.exists()?String(d.data().gofood||''):'',
    grabfood:d?.exists()?String(d.data().grabfood||''):'',
    shopeefood:d?.exists()?String(d.data().shopeefood||''):''
  };
}
function adminMode(){ return new URLSearchParams(location.search).get('admin') === '1'; }
function campaignId(){ return new URLSearchParams(location.search).get('c'); }
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function withTimeout(promise, ms=6000, label='request'){
  let timer;
  const timeout=new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error(`${label} timeout setelah ${Math.round(ms/1000)} detik`)),ms);
  });
  return Promise.race([Promise.resolve(promise),timeout]).finally(()=>clearTimeout(timer));
}
function toast(msg){ alert(msg); }
function fmtBytes(n=0){ if(n<1024) return `${n} B`; if(n<1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(2)} MB`; }
function logo(){ return state.brand.logo || defaultBrand.logo; }
function isBirthday(){ return occasionId()==='birthday'; }
function birthdayName(){ return (state.campaign?.birthdayName||state.campaign?.customer||'kamu').trim() || 'kamu'; }
function birthdayAge(){ const a=String(state.campaign?.birthdayAge||'').trim(); return a ? `${a} tahun` : ''; }

function captureFormatMeta(id=state.captureFormat){
  const key=String(id||'feed');
  return {
    feed:{id:'feed',w:1080,h:1350,ratio:'4 / 5',label:'IG Post 4:5',short:'Post',icon:'▥'},
    square:{id:'square',w:1080,h:1080,ratio:'1 / 1',label:'IG Post 1:1',short:'Square',icon:'□'},
    story:{id:'story',w:1080,h:1920,ratio:'9 / 16',label:'IG Story 9:16',short:'Story',icon:'▯'},
    reels:{id:'reels',w:1080,h:1920,ratio:'9 / 16',label:'IG Reels 9:16',short:'Reels',icon:'▶'}
  }[key] || {id:'feed',w:1080,h:1350,ratio:'4 / 5',label:'IG Post 4:5',short:'Post',icon:'▥'};
}
function captureFormatPickerMarkup(mode=state.captureMode){
  const ids=mode==='video'?['reels','story','feed']:['feed','story','square','reels'];
  return `<div class="capture-format-box">
    <div class="capture-format-head"><div><small>FORMAT</small><b>${esc(captureFormatMeta().label)}</b></div><span>${mode==='video'?'Video mengikuti frame ini saat direkam.':'Kamera dan hasil share mengikuti format ini.'}</span></div>
    <div class="capture-format-row">${ids.map(id=>{const x=captureFormatMeta(id);return `<button class="capture-format-chip ${state.captureFormat===id?'active':''}" data-capture-format="${id}" type="button"><i>${x.icon}</i><b>${esc(x.short)}</b><span>${esc(x.label)}</span></button>`;}).join('')}</div>
  </div>`;
}
function syncCameraFormat(){
  const cam=$('.camera');
  if(!cam)return;
  ['feed','story','square','reels'].forEach(id=>cam.classList.remove(`capture-format-${id}`));
  cam.classList.add(`capture-format-${captureFormatMeta().id}`);
}
function homeOccasionMarkup(){
  if(!canUserPickOccasion()) return '';
  const ids=enabledUserOccasions();
  return `<section class="home-occasion-picker">
    <div class="home-occasion-title"><div><small>PICK YOUR MOMENT</small><b>Pilih occasion</b></div><button id="pickOccasion" type="button">Semua</button></div>
    <div class="home-occasion-rail">${ids.map((id,i)=>`<button class="home-occasion-item ${occasionId()===id?'active':''}" data-home-occasion="${id}" style="--oi:${i}" type="button"><span>${occasionCatalog[id].badge.split(' ')[0]}</span><b>${esc(occasionCatalog[id].label)}</b><small>${esc(occasionCatalog[id].previewText)}</small></button>`).join('')}</div>
  </section>`;
}
function openBirthdayCustomerSetup(){
  closeOccasionPicker();
  const modal=document.createElement('div');
  modal.className='user-occasion-modal birthday-user-modal';
  modal.innerHTML=`<div class="user-occasion-card birthday-user-card">
    <button class="user-occasion-close" type="button" aria-label="Tutup">×</button><button class="birthday-setup-back" id="birthdaySetupBack" type="button">← Ganti occasion</button>
    <div class="occasion-picker-kicker">BIRTHDAY MODE</div>
    <h3>Birthday siapa hari ini? 🎂</h3>
    <p>Nama dan umur akan ikut masuk ke intro, Meong DJ, dan template foto.</p>
    <div class="grid two compact">
      <div class="field"><label>Nama</label><input id="birthdayUserName" value="${esc(state.campaign?.birthdayName||state.campaign?.customer||'')}" placeholder="Contoh: Nabila"></div>
      <div class="field"><label>Umur</label><input id="birthdayUserAge" value="${esc(state.campaign?.birthdayAge||'')}" inputmode="numeric" placeholder="21"></div>
    </div>
    <div class="field"><label>Pesan (opsional)</label><textarea id="birthdayUserMessage" rows="3" placeholder="Semoga harimu seru dan penuh good vibes 🎉">${esc(state.campaign?.birthdayMessage||'')}</textarea></div>
    <div class="birthday-user-live" id="birthdayUserLive"></div>
    <button class="btn primary block" id="birthdayUserApply" type="button">Pakai Birthday Mode →</button>
  </div>`;
  document.body.appendChild(modal);
  const refresh=()=>{
    const n=($('#birthdayUserName',modal)?.value||'Kamu').trim()||'Kamu';
    const a=($('#birthdayUserAge',modal)?.value||'').trim();
    $('#birthdayUserLive',modal).textContent=`🎂 Happy Birthday • ${n}${a?` • ${a} tahun`:''}`;
  };
  $('#birthdayUserName',modal).oninput=refresh;
  $('#birthdayUserAge',modal).oninput=refresh;
  refresh();
  requestAnimationFrame(()=>modal.classList.add('is-open'));
  const close=()=>closeOccasionPicker();
  $('.user-occasion-close',modal).onclick=close;
  const back=$('#birthdaySetupBack',modal);if(back)back.onclick=()=>{close();setTimeout(()=>renderOccasionSelection(),160);};
  modal.onclick=e=>{if(e.target===modal)close();};
  $('#birthdayUserApply',modal).onclick=()=>{
    state.campaign={
      ...(state.campaign||{}),
      occasion:'birthday',
      birthdayName:($('#birthdayUserName',modal)?.value||'').trim()||state.campaign?.customer||'Kamu',
      birthdayAge:($('#birthdayUserAge',modal)?.value||'').trim(),
      birthdayMessage:($('#birthdayUserMessage',modal)?.value||'').trim()
    };
    state.template='';
    close();
    setTimeout(()=>renderArrivalIntro(),140);
  };
}
function selectUserOccasion(id){
  if(id==='birthday') return openBirthdayCustomerSetup();
  state.campaign={...(state.campaign||{}),occasion:id};
  state.template='';
  renderArrivalIntro();
}

function introOccasionDockMarkup(){
  if(!canUserPickOccasion())return '';
  const ids=enabledUserOccasions();
  return `<div class="intro-occasion-dock intro-enter enter-6b">
    <div class="intro-occasion-dock-head"><span><i>✦</i> PILIH OCCASION</span><button id="introOccasionAll" type="button">Semua</button></div>
    <div class="intro-occasion-dock-rail">
      ${ids.map((id,i)=>`<button class="intro-occasion-pill ${occasionId()===id?'active':''}" data-intro-occasion="${id}" style="--oi:${i}" type="button"><span>${occasionCatalog[id].badge.split(' ')[0]}</span><b>${esc(occasionCatalog[id].label)}</b></button>`).join('')}
    </div>
  </div>`;
}
function captureCountdownLines(mode='photo'){
  const photo=[
    ['Bentar… Meong cek angle dulu 😼','Jangan miring, nanti estetiknya kabur.'],
    ['Rapihin rambut dulu ✨','Meong nggak bisa Photoshop rambut yang kaget.'],
    ['Jangan inget mantan dulu 👀','Fokus ke kamera. Drama belakangan.'],
    ['Senyum yang niat ya 😼','Minumannya udah photogenic, masa kamu kalah.']
  ];
  const video=[
    ['Motion mode siap 🎬','Geraknya santai, jangan kayak dikejar deadline.'],
    ['Meong jadi sutradara dulu 😼','Tatap kamera, bukan masa lalu.'],
    ['Reels incoming ✦','Tahan pose sebentar, habis ini boleh malu.'],
    ['Soundtrack jalan…','Sekarang pura-pura jadi pemeran utama.']
  ];
  return mode==='video'?video:photo;
}
async function runCaptureCountdown(mode='photo'){
  const camera=$('.camera');if(!camera)return;
  $('.capture-countdown-layer')?.remove();
  const lines=captureCountdownLines(mode),pick=rand(lines)||lines[0];
  const layer=document.createElement('div');layer.className='capture-countdown-layer';
  layer.innerHTML=`<div class="capture-countdown-copy"><small>${mode==='video'?'MOTION CHECK':'POSE CHECK'}</small><b id="countdownNumber">3</b><h4>${esc(pick[0])}</h4><p>${esc(pick[1])}</p></div>`;
  camera.appendChild(layer);requestAnimationFrame(()=>layer.classList.add('show'));
  const num=$('#countdownNumber',layer);
  for(const n of [3,2,1]){
    if(num){num.textContent=String(n);num.classList.remove('pop');void num.offsetWidth;num.classList.add('pop');}
    await sleep(720);
  }
  if(num){num.textContent=mode==='video'?'REC':'✦';num.classList.remove('pop');void num.offsetWidth;num.classList.add('pop');}
  await sleep(260);layer.classList.remove('show');setTimeout(()=>layer.remove(),180);
}
function photoAssetControlsMarkup(){
  return `<div class="asset-customizer">
    <div class="asset-customizer-head"><div><small>CUSTOM ASSET</small><b>Geser elemen branding langsung di foto</b></div><span>Semua dikunci di dalam frame.</span></div>
    <div class="asset-toggle-row">
      <label><input id="photoShowLogo" type="checkbox" ${state.photoShowLogo!==false?'checked':''}><span>Logo</span></label>
      <label><input id="photoShowBrandName" type="checkbox" ${state.photoShowBrandName!==false?'checked':''}><span>Nama brand</span></label>
      <label><input id="photoShowBrandCaption" type="checkbox" ${state.photoShowBrandCaption!==false?'checked':''}><span>Caption brand</span></label>
    </div>
  </div>`;
}
const videoDesignMeta=[
  ['clean','Noir Minimal','Frame tipis, clean, dan premium'],
  ['cassette','Analog Tape','Kaset besar + label soundtrack retro'],
  ['meong','Meong Signature','Mascot + speech card khas Thanksgiving'],
  ['pulse','Audio Halo','Ring audio + visualizer yang lebih immersive'],
  ['editorial','Editorial Cut','Layout majalah, tipografi bold, asymmetrical']
];
function videoDesignPickerMarkup(){
  return `<div class="video-design-box">
    <div class="video-design-head"><div><small>MOTION DESIGN</small><b>Pilih gaya video</b></div><span>Asset brand tetap bisa digeser.</span></div>
    <div class="video-design-rail">${videoDesignMeta.map(([id,name,desc])=>`<button class="video-design-card ${state.videoDesign===id?'active':''}" data-video-design="${id}" type="button"><div class="video-design-preview vd-${id}"><i></i><b>${id==='meong'?'🐱':id==='cassette'?'▭':id==='pulse'?'◉':'✦'}</b></div><strong>${name}</strong><small>${desc}</small></button>`).join('')}</div>
  </div>`;
}
function videoAssetControlsMarkup(){
  return `<div class="video-asset-note"><span>☝️</span><div><b>Atur layout brand langsung di preview</b><small>Geser logo, nama brand, dan caption. Posisi ini ikut ke hasil video.</small></div></div>`;
}
function clamp01n(v,min=0,max=1){return Math.max(min,Math.min(max,Number(v)||0));}
function videoAssetPos(key){
  state.videoAssetLayout=state.videoAssetLayout||{};
  const defaults={logo:{x:.06,y:.055,size:.115},name:{x:.20,y:.073,size:.044},caption:{x:.20,y:.112,size:.025}};
  return state.videoAssetLayout[key]||defaults[key];
}

function videoAssetGeometry(key,w,h){
  const p=videoAssetPos(key);
  const defaults={
    logo:{w:p.size*w,h:p.size*w},
    name:{w:.62*w,h:Math.max(24,p.size*w*1.28)},
    caption:{w:.72*w,h:Math.max(18,p.size*w*1.35)}
  };
  const box=defaults[key];
  return {x:p.x*w,y:p.y*h,w:box.w,h:box.h,fontPx:key==='logo'?0:p.size*w};
}
function syncVideoAssetGeometry(){
  const cam=$('.video-camera');if(!cam)return;
  const w=cam.clientWidth,h=cam.clientHeight;
  $$('.video-drag-asset',cam).forEach(el=>{
    const key=el.dataset.videoAsset;
    const g=videoAssetGeometry(key,w,h);
    el.style.left=`${g.x}px`;
    el.style.top=`${g.y}px`;
    if(key==='logo'){
      el.style.width=`${g.w}px`;
      el.style.height=`${g.h}px`;
    }else{
      el.style.fontSize=`${g.fontPx}px`;
      el.style.lineHeight='1.15';
      el.style.maxWidth=`${g.w}px`;
    }
  });
}
function bindVideoAssetDrag(){
  const cam=$('.video-camera');if(!cam)return;
  syncVideoAssetGeometry();

  $$('.video-drag-asset',cam).forEach(el=>{
    const key=el.dataset.videoAsset;
    let dragging=false,ox=0,oy=0;

    el.onpointerdown=e=>{
      dragging=true;
      const r=cam.getBoundingClientRect();
      const p=videoAssetPos(key);
      ox=e.clientX-(r.left+p.x*r.width);
      oy=e.clientY-(r.top+p.y*r.height);
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('dragging');
      e.preventDefault();e.stopPropagation();
    };

    el.onpointermove=e=>{
      if(!dragging)return;
      const r=cam.getBoundingClientRect();
      const geom=videoAssetGeometry(key,r.width,r.height);
      const maxX=Math.max(0,r.width-geom.w);
      const maxY=Math.max(0,r.height-geom.h);
      const px=Math.max(0,Math.min(maxX,e.clientX-r.left-ox));
      const py=Math.max(0,Math.min(maxY,e.clientY-r.top-oy));
      const p=videoAssetPos(key);
      p.x=px/r.width;
      p.y=py/r.height;
      state.videoAssetLayout[key]=p;
      syncVideoAssetGeometry();
      e.preventDefault();
    };

    const stop=e=>{
      if(!dragging)return;
      dragging=false;
      el.classList.remove('dragging');
      try{el.releasePointerCapture?.(e.pointerId);}catch{}
    };
    el.onpointerup=stop;el.onpointercancel=stop;
  });

  if(!cam._videoAssetResizeObserver && 'ResizeObserver' in window){
    cam._videoAssetResizeObserver=new ResizeObserver(()=>syncVideoAssetGeometry());
    cam._videoAssetResizeObserver.observe(cam);
  }
}
function syncVideoDesignPreview(){
  const cam=$('.video-camera');if(!cam)return;
  videoDesignMeta.forEach(([id])=>cam.classList.remove(`video-design-${id}`));
  cam.classList.add(`video-design-${state.videoDesign||'clean'}`);
}
function videoBrandDragMarkup(){
  return `<div class="video-drag-asset video-drag-logo" data-video-asset="logo"><img src="${esc(logo())}" alt="logo"></div>
    <div class="video-drag-asset video-drag-name" data-video-asset="name">${esc(state.brand.brandName)}</div>
    <div class="video-drag-asset video-drag-caption" data-video-asset="caption">${esc(state.brand.tagline||state.brand.caption||'')}</div>`;
}
function currentOccasionIcon(){ return occasionCatalog[occasionId()]?.badge?.split(' ')?.[0] || '✦'; }
function fitCanvasContained(out,source,meta){
  const ctx=out.getContext('2d');
  const g=ctx.createLinearGradient(0,0,out.width,out.height);
  g.addColorStop(0,state.brand.secondary||'#0b0b0b');
  g.addColorStop(.72,state.brand.secondary||'#0b0b0b');
  g.addColorStop(1,state.brand.primary||'#ffd400');
  ctx.fillStyle=g;ctx.fillRect(0,0,out.width,out.height);

  if(meta.id==='story'||meta.id==='reels'){
    ctx.save();
    ctx.globalAlpha=.14;
    ctx.fillStyle=state.brand.primary||'#ffd400';
    ctx.beginPath();ctx.arc(out.width*.83,out.height*.15,out.width*.26,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(out.width*.14,out.height*.83,out.width*.18,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  const pad=meta.id==='feed'?0:meta.id==='square'?18:34;
  const scale=Math.min((out.width-pad*2)/source.width,(out.height-pad*2)/source.height);
  const dw=source.width*scale,dh=source.height*scale;
  const x=(out.width-dw)/2,y=(out.height-dh)/2;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.30)';ctx.shadowBlur=30;
  ctx.drawImage(source,x,y,dw,dh);
  ctx.restore();

  if(meta.id!=='feed'){
    ctx.fillStyle='#fff';ctx.font='900 30px sans-serif';ctx.fillText((state.brand.brandName||'Brand').slice(0,30),52,58);
    ctx.font='700 20px sans-serif';ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText((state.brand.tagline||'').slice(0,54),52,90);
    const song=state.selectedSong||{};
    const track=`${song.title||''}${song.artist?' • '+song.artist:''}`.slice(0,58);
    if(track){ctx.fillStyle=state.brand.primary||'#ffd400';ctx.font='800 22px sans-serif';ctx.fillText('♫ '+track,52,out.height-54);}
  }
  return out;
}
async function photoExportCanvas(){
  const source=$('#final');
  if(!source)return null;
  const meta=captureFormatMeta();
  if(meta.id==='feed') return source;
  const out=document.createElement('canvas');out.width=meta.w;out.height=meta.h;
  return fitCanvasContained(out,source,meta);
}
function preferredVideoMime(){
  if(typeof MediaRecorder==='undefined')return '';
  const types=[
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  return types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
}
function drawVideoCover(ctx,video,w,h,mirror=false){
  const vw=video.videoWidth||w,vh=video.videoHeight||h;
  const scale=Math.max(w/vw,h/vh),dw=vw*scale,dh=vh*scale;
  const x=(w-dw)/2,y=(h-dh)/2;
  ctx.save();
  if(mirror){ctx.translate(w,0);ctx.scale(-1,1);ctx.drawImage(video,w-x-dw,y,dw,dh);}
  else ctx.drawImage(video,x,y,dw,dh);
  ctx.restore();
}
function drawVideoBrandFrame(ctx,w,h,elapsed=0,logoImg=null){
  const primary=state.brand.primary||'#ffd400',secondary=state.brand.secondary||'#0b0b0b',accent=state.brand.accent||primary,song=state.selectedSong||{},design=state.videoDesign||'clean',pulse=.5+.5*Math.sin(elapsed*3.2);
  const grad=ctx.createLinearGradient(0,h*.50,0,h);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=grad;ctx.fillRect(0,h*.45,w,h*.55);
  if(design==='cassette'){
    ctx.save();ctx.translate(w*.78,h*.24);ctx.rotate(Math.sin(elapsed*1.8)*.045);rr(ctx,-w*.16,-w*.10,w*.32,w*.20,w*.035,brandRgba(primary,.84),'rgba(255,255,255,.30)',2);ctx.fillStyle=secondary;ctx.beginPath();ctx.arc(-w*.06,0,w*.028,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(w*.06,0,w*.028,0,Math.PI*2);ctx.fill();ctx.restore();ctx.strokeStyle=brandRgba(primary,.48+.2*pulse);ctx.lineWidth=3;ctx.strokeRect(w*.035,h*.025,w*.93,h*.95);
  }else if(design==='meong'){
    ctx.font=`${Math.round(w*.11)}px sans-serif`;ctx.fillText('🐱',w*.73,h*.28+Math.sin(elapsed*2.2)*6);rr(ctx,w*.48,h*.31,w*.45,h*.07,w*.03,brandRgba(secondary,.68),'rgba(255,255,255,.16)',2);ctx.fillStyle='#fff';ctx.font=`800 ${Math.round(w*.025)}px sans-serif`;ctx.fillText('Meong: angle kamu aman 😼',w*.51,h*.352);
  }else if(design==='pulse'){
    for(let r=1;r<=4;r++){ctx.strokeStyle=brandRgba(r%2?accent:primary,.17+.13*pulse);ctx.lineWidth=2;ctx.beginPath();ctx.arc(w*.78,h*.22,w*(.045+r*.03)+pulse*6,0,Math.PI*2);ctx.stroke();}const bars=18,bw=w*.018,gap=w*.010;for(let i=0;i<bars;i++){const bh=h*(.012+.028*(.5+.5*Math.sin(elapsed*5+i*.7)));ctx.fillStyle=i%3===0?accent:primary;rr(ctx,w*.08+i*(bw+gap),h*.90-bh,bw,bh,w*.007,ctx.fillStyle);}
  }else if(design==='editorial'){
    ctx.fillStyle=brandRgba(primary,.92);ctx.fillRect(w*.04,h*.04,w*.24,h*.012);ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=2;ctx.strokeRect(w*.035,h*.025,w*.93,h*.95);ctx.save();ctx.translate(w*.93,h*.43);ctx.rotate(Math.PI/2);ctx.fillStyle='rgba(255,255,255,.68)';ctx.font=`900 ${Math.round(w*.022)}px sans-serif`;ctx.fillText('PLAY • FEEL • CAPTURE',0,0);ctx.restore();
  }else{ctx.strokeStyle=brandRgba(primary,.50+.18*pulse);ctx.lineWidth=Math.max(2,w*.004);ctx.strokeRect(w*.035,h*.025,w*.93,h*.95);}
  const lg=videoAssetGeometry('logo',w,h),ng=videoAssetGeometry('name',w,h),cg=videoAssetGeometry('caption',w,h);
  if(logoImg){ctx.save();ctx.shadowColor='rgba(0,0,0,.30)';ctx.shadowBlur=12;ctx.drawImage(logoImg,lg.x,lg.y,lg.w,lg.h);ctx.restore();}
  ctx.save();
  ctx.textBaseline='top';
  ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(ng.fontPx)}px sans-serif`;ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=8;ctx.fillText((state.brand.brandName||'Brand').slice(0,26),ng.x,ng.y,ng.w);
  ctx.font=`700 ${Math.round(cg.fontPx)}px sans-serif`;ctx.fillStyle='rgba(255,255,255,.76)';ctx.fillText((state.brand.tagline||state.brand.caption||'').slice(0,42),cg.x,cg.y,cg.w);
  ctx.restore();
  ctx.fillStyle=primary;ctx.font=`900 ${Math.round(w*.024)}px sans-serif`;ctx.fillText('NOW PLAYING',w*.06,h*.80);ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(w*.054)}px sans-serif`;ctx.fillText((song.title||'Your Soundtrack').slice(0,28),w*.06,h*.85);ctx.font=`700 ${Math.round(w*.031)}px sans-serif`;ctx.fillStyle='rgba(255,255,255,.82)';ctx.fillText((song.artist||song.genre||occasionDisplayLabel()).slice(0,32),w*.06,h*.895);
}
function birthdayMessage(){ return (state.campaign?.birthdayMessage||state.campaign?.note||'Semoga hari ini penuh hal kecil yang bikin senyum ✨').trim(); }
function pickBirthdayPack(){ state.birthdayPack=rand(birthdayIntroPacks)||'cake'; return state.birthdayPack; }
function applyBrand(){
  document.documentElement.style.setProperty('--primary', state.brand.primary || defaultBrand.primary);
  document.documentElement.style.setProperty('--secondary', state.brand.secondary || defaultBrand.secondary);
  document.documentElement.style.setProperty('--accent', state.brand.accent || defaultBrand.accent);
  document.title = `${state.brand.appName || 'Thanksgiving'} — ${state.brand.brandName || ''}`;
}
function event(type, id){ if(!db || !id) return; addDoc(collection(db,'events'), {type,campaignId:id,createdAt:serverTimestamp()}).catch(()=>{}); }
function randomWeightedSong(pool){
  const weighted=[];
  for(const s of pool){ const n=rarityWeight[s.rarity||'Common'] || 1; for(let i=0;i<n;i++) weighted.push(s); }
  return rand(weighted.length ? weighted : pool);
}
function clearAudioUrl(){ if(state.audioObjectUrl){ URL.revokeObjectURL(state.audioObjectUrl); state.audioObjectUrl=null; } }
function songKey(song){ return song ? (song.id || `${song.audioSource||'url'}:${song.audioRef||song.audioUrl||song.audio||song.title||''}`) : ''; }
async function unlockAudio(){
  if(audioUnlocked) return true;
  try{
    musicPlayer.muted=true;
    musicPlayer.src=SILENT_WAV;
    await musicPlayer.play();
    musicPlayer.pause();
    musicPlayer.currentTime=0;
    musicPlayer.removeAttribute('src');
    musicPlayer.load();
    musicPlayer.muted=false;
    audioUnlocked=true;
    return true;
  }catch{ musicPlayer.muted=false; return false; }
}
function stopMusic(reset=true){
  // Invalidasi request audio lama. Jadi hasil fetch RTDB dari gacha sebelumnya
  // tidak boleh menimpa lagu terbaru setelah request lama selesai.
  audioLoadToken++;
  musicPlayer.pause();
  if(reset){ try{ musicPlayer.currentTime=0; }catch{} }
}
async function loadSongIntoPlayer(song){
  if(!song) return '';
  stopLobbyAmbient({fade:true});
  const key=songKey(song);
  if(state.audioKey===key && musicPlayer.src && song===state.selectedSong) return musicPlayer.src;

  stopMusic(true);
  const myToken=audioLoadToken;
  const src=await resolveSongAudio(song);

  // Request lama selesai belakangan? Buang hasilnya.
  if(myToken!==audioLoadToken || song!==state.selectedSong) return '';
  if(!src){ state.audioKey=''; return ''; }

  musicPlayer.src=src;
  musicPlayer.load();
  state.audioKey=key;
  return src;
}
async function playSelectedSong({countEvent=true}={}){
  const song=state.selectedSong;
  if(!song) return {ok:false,message:'Belum ada lagu'};
  const expectedKey=songKey(song);
  try{
    const src=await loadSongIntoPlayer(song);
    if(!src || song!==state.selectedSong || state.audioKey!==expectedKey){
      return {ok:false,message:'Request lagu lama dibatalkan'};
    }
    await musicPlayer.play();

    // Kalau user keburu gacha lagi tepat saat play() resolve, hentikan lagu lama.
    if(song!==state.selectedSong || state.audioKey!==expectedKey){
      musicPlayer.pause();
      return {ok:false,message:'Request lagu lama dibatalkan'};
    }

    if(countEvent && state.playEventKey!==expectedKey){
      event('play',state.campaign?.id);
      state.playEventKey=expectedKey;
    }
    return {ok:true,message:'Now playing'};
  }catch(e){
    return {ok:false,message:e?.name==='NotAllowedError'?'Autoplay diblok browser — tap ▶ sekali':'Audio gagal dimuat'};
  }
}
async function toggleMusic(){
  if(!state.selectedSong) return;
  if(musicPlayer.paused) return playSelectedSong();
  musicPlayer.pause();
  return {ok:true,message:'Paused'};
}
function playerUiState(buttonSelector='#play',statusSelector='#playStatus'){
  const button=$(buttonSelector), status=$(statusSelector);
  if(button){ const span=$('span',button); if(span) span.textContent=musicPlayer.paused?'▶':'❚❚'; else button.textContent=musicPlayer.paused?'▶':'❚❚'; }
  if(status) status.textContent=musicPlayer.paused?'Paused':'Now playing';
}
function compactNowPlaying(buttonId='miniMusicToggle'){
  const s=state.selectedSong; if(!s) return '';
  return `<div class="now-playing-mini"><div class="np-icon">♫</div><div class="np-copy"><b>${esc(s.title||'Now Playing')}</b><span>${esc(s.artist||'')} • ${esc(s.genre||'Music')}</span></div><button class="np-toggle" id="${buttonId}" aria-label="Play pause">${musicPlayer.paused?'▶':'❚❚'}</button></div>`;
}
function bindCompactPlayer(buttonId){
  const b=$(`#${buttonId}`); if(!b) return;
  const sync=()=>{ if(document.body.contains(b)) b.textContent=musicPlayer.paused?'▶':'❚❚'; };
  b.onclick=async()=>{ await toggleMusic(); sync(); };
  musicPlayer.addEventListener('play',sync,{once:true});
  musicPlayer.addEventListener('pause',sync,{once:true});
}
function stopCameraStream(){
  if(state.cameraStream){ state.cameraStream.getTracks().forEach(t=>t.stop()); state.cameraStream=null; }
}
function shutdownMedia(){
  // Pastikan audio & kamera tidak ikut hidup saat tab/browser ditutup atau halaman ditinggalkan.
  stopLobbyAmbient({fade:false});
  stopMusic(true);
  stopCameraStream();
  clearAudioUrl();
  state.audioKey='';
}
window.addEventListener('pagehide', shutdownMedia);
window.addEventListener('beforeunload', shutdownMedia);
window.addEventListener('unload', shutdownMedia);
async function startCameraStream(){
  stopCameraStream();
  const video=$('#video'); if(!video) return null;
  let stream;
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.cameraFacing}},audio:false});
  }catch{
    stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
  }
  state.cameraStream=stream;
  const actual=stream.getVideoTracks?.()[0]?.getSettings?.().facingMode;
  if(actual==='user'||actual==='environment') state.cameraFacing=actual;
  video.srcObject=stream;
  video.classList.toggle('mirrored',state.cameraFacing==='user');
  return stream;
}

async function loadBrand(){
  if(!db){ applyBrand(); return; }
  const s=await getDoc(doc(db,'public','brand'));
  if(s.exists()){
    const data=s.data();
    state.brand={...defaultBrand,...data};
    // Brand lama otomatis mendapat pack template trend baru satu kali.
    // Setelah admin Save Brand di v2.7+, pilihan template dihormati apa adanya.
    if(data.templatePackVersion!=='3.3.0'){
      state.brand.enabledTemplates=[...new Set([...(data.enabledTemplates||defaultBrand.enabledTemplates),...trendingTemplateIds,...allCelebrationTemplateIds])];
    }
  }
  applyBrand();
}
async function loadSongs(activeOnly=true){
  if(!db){ state.songs=[]; return; }
  let snap;
  if(activeOnly) snap=await getDocs(query(collection(db,'songs'),where('active','==',true))).catch(()=>({docs:[]}));
  else snap=await getDocs(collection(db,'songs')).catch(()=>({docs:[]}));
  state.songs=snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function loadCaptions(){
  if(!db){ state.captions=[]; return; }
  const snap=await getDocs(collection(db,'captionPresets')).catch(()=>({docs:[]}));
  state.captions=snap.docs.map(d=>({id:d.id,...d.data()}));
}

async function boot(){
  document.documentElement.dataset.thanksgivingBooted='1';
  installSoundscapeDelegation();
  document.documentElement.dataset.thanksgivingVersion=VERSION;
  // Jangan biarkan layar mentok di "Loading Thanksgiving…" kalau Firebase/network lambat.
  if(!coreConfigured) return renderSetup(adminMode());

  try{
    await withTimeout(loadBrand(),4500,'Brand');
  }catch(e){
    console.warn('Brand load dilewati:',e);
    applyBrand();
  }

  if(adminMode()) return renderAdminGate();

  const id=campaignId();
  if(!id) return renderNoCampaign();

  try{
    const c=await withTimeout(getDoc(doc(db,'campaigns',id)),8000,'QR');
    if(!c.exists() || c.data().active===false) return renderExpired();

    state.campaign={id:c.id,...c.data()};
    if(isBirthday()) pickBirthdayPack();

    if(state.campaign.expiresAt?.toDate && state.campaign.expiresAt.toDate()<new Date()){
      return renderExpired();
    }

    await withTimeout(
      Promise.all([loadSongs(true),loadCaptions()]),
      8000,
      'Music data'
    ).catch(e=>console.warn('Music/caption load timeout:',e));

    event('scan',id);
    renderWelcomeGateway();
  }catch(e){
    renderError(
      e?.message?.includes('timeout')
        ? 'Koneksi ke Firebase terlalu lama. Coba refresh atau cek internet.'
        : 'QR tidak bisa dibuka. Cek koneksi atau Firestore Rules.',
      e
    );
  }
}

function topbar(){
  return `<div class="topbar"><div class="brand"><img src="${esc(logo())}"><div class="brand-meta"><b>${esc(state.brand.brandName)}</b><div class="tiny brand-app">${esc(state.brand.appName)}</div></div></div><button class="round-icon music-pulse" type="button" aria-label="Sound">♪</button></div>`;
}
function brandIdentityStrip(kicker='SIGNATURE EXPERIENCE', sub='Campaign khas yang cuma terasa di sini'){
  return `<div class="identity-strip"><span>${esc(kicker)}</span><b>${esc(state.brand.brandName)}</b><small>${esc(sub)}</small></div>`;
}


function welcomeBurst(x=.5,y=.5){
  const host=$('.welcome-interaction-stage');
  if(!host)return;
  const chars=['✦','♪','♫','•','✧'];
  for(let i=0;i<8;i++){
    const p=document.createElement('i');
    p.className='welcome-burst-particle';
    p.textContent=chars[i%chars.length];
    p.style.left=`${x*100}%`;
    p.style.top=`${y*100}%`;
    p.style.setProperty('--bx',`${(-50+Math.random()*100).toFixed(1)}px`);
    p.style.setProperty('--by',`${(-78+Math.random()*52).toFixed(1)}px`);
    p.style.setProperty('--bd',`${(Math.random()*.12).toFixed(2)}s`);
    host.appendChild(p);
    setTimeout(()=>p.remove(),950);
  }
}

function bindWelcomeInteractions(){
  const page=$('.welcome-gateway');
  const stage=$('.welcome-interaction-stage');
  const cassette=$('#welcomeCassetteInteract');
  if(!page||!stage||!cassette)return;

  const messages=[
    'Kasetnya bangun 😼',
    'Okay, this feels expensive ✦',
    'Soundtrack kamu udah nunggu ♪',
    'Meong approved. Lanjut?'
  ];
  let messageIndex=0;

  const applyPointer=(clientX,clientY)=>{
    const r=stage.getBoundingClientRect();
    const nx=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
    const ny=Math.max(0,Math.min(1,(clientY-r.top)/r.height));
    stage.style.setProperty('--px',`${nx*100}%`);
    stage.style.setProperty('--py',`${ny*100}%`);
    stage.style.setProperty('--rx',`${((.5-ny)*7).toFixed(2)}deg`);
    stage.style.setProperty('--ry',`${((nx-.5)*9).toFixed(2)}deg`);
  };

  stage.onpointermove=e=>{
    if(e.pointerType==='mouse')applyPointer(e.clientX,e.clientY);
  };
  stage.onpointerleave=()=>{
    stage.style.setProperty('--rx','0deg');
    stage.style.setProperty('--ry','0deg');
  };

  cassette.onclick=e=>{
    const r=stage.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width;
    const y=(e.clientY-r.top)/r.height;
    cassette.classList.remove('react');
    void cassette.offsetWidth;
    cassette.classList.add('react');
    welcomeBurst(x,y);
    playUiSfx(messageIndex%2?'spark':'select');
    const copy=$('#welcomeInteractiveCopy');
    if(copy)copy.textContent=messages[messageIndex++%messages.length];
  };

  const cta=$('#enterThanksgiving');
  if(cta){
    cta.onpointermove=e=>{
      if(e.pointerType!=='mouse')return;
      const r=cta.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)*.06;
      const dy=(e.clientY-r.top-r.height/2)*.10;
      cta.style.transform=`translate(${dx}px,${dy}px)`;
    };
    cta.onpointerleave=()=>cta.style.transform='';
  }
}

function videoClipClock(sec=0){
  const s=Math.max(0,Number(sec)||0);
  const m=Math.floor(s/60);
  const rem=Math.floor(s%60);
  const tenth=Math.floor((s-Math.floor(s))*10);
  return `${m}:${String(rem).padStart(2,'0')}.${tenth}`;
}

async function ensureVideoCutAudio(){
  const song=state.selectedSong;
  if(!song)return {duration:0};
  const key=songKey(song);

  if(state.audioKey!==key || !musicPlayer.src){
    await loadSongIntoPlayer(song);
  }

  if(!Number.isFinite(musicPlayer.duration) || musicPlayer.duration<=0){
    await new Promise(resolve=>{
      const done=()=>{cleanup();resolve();};
      const cleanup=()=>{
        musicPlayer.removeEventListener('loadedmetadata',done);
        musicPlayer.removeEventListener('canplay',done);
      };
      musicPlayer.addEventListener('loadedmetadata',done,{once:true});
      musicPlayer.addEventListener('canplay',done,{once:true});
      setTimeout(done,1800);
    });
  }

  const duration=Number.isFinite(musicPlayer.duration)&&musicPlayer.duration>0
    ? musicPlayer.duration
    : Math.max(15,Number(song.duration)||30);

  if(state.videoClipSongKey!==key){
    state.videoClipSongKey=key;
    state.videoClipStart=0;
    state.videoClipSamples=[];
  }
  state.videoClipAudioDuration=duration;
  state.videoClipDuration=Math.min(Math.max(4,Number(state.videoDuration)||7),duration);
  state.videoDuration=state.videoClipDuration;
  state.videoClipStart=Math.max(0,Math.min(Math.max(0,duration-state.videoClipDuration),Number(state.videoClipStart)||0));
  return {duration};
}

function syntheticWaveform(song,count=82){
  const seed=String(songKey(song)||song?.title||'thanksgiving').split('').reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),2166136261);
  let n=seed||1;
  return Array.from({length:count},(_,i)=>{
    n=(n*1664525+1013904223)>>>0;
    const noise=(n%1000)/1000;
    const pulse=.52+.30*Math.sin(i*.42)+.16*Math.sin(i*.13+1.1);
    return Math.max(.12,Math.min(1,.18+noise*.34+pulse*.48));
  });
}

async function buildVideoClipWaveform(song,count=82){
  if(state.videoClipSamples?.length===count && state.videoClipSongKey===songKey(song))return state.videoClipSamples;
  try{
    const src=await resolveSongAudio(song);
    if(!src)throw new Error('no audio source');
    const ab=await (await fetch(src)).arrayBuffer();
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error('AudioContext unavailable');
    const ctx=new AC();
    const buffer=await ctx.decodeAudioData(ab.slice(0));
    const channel=buffer.getChannelData(0);
    const block=Math.max(1,Math.floor(channel.length/count));
    const samples=[];
    for(let i=0;i<count;i++){
      const start=i*block,end=Math.min(channel.length,start+block);
      let peak=0,sum=0,c=0;
      for(let j=start;j<end;j+=Math.max(1,Math.floor(block/90))){
        const v=Math.abs(channel[j]||0);
        peak=Math.max(peak,v);sum+=v;c++;
      }
      samples.push(Math.max(.10,Math.min(1,(peak*.68+(sum/Math.max(1,c))*.72)*2.15)));
    }
    try{await ctx.close();}catch{}
    state.videoClipSamples=samples;
    if(buffer.duration>0){
      state.videoClipAudioDuration=buffer.duration;
      state.videoClipDuration=Math.min(state.videoClipDuration,buffer.duration);
      state.videoClipStart=Math.min(state.videoClipStart,Math.max(0,buffer.duration-state.videoClipDuration));
    }
    return samples;
  }catch(e){
    console.warn('Waveform decode fallback:',e);
    const samples=syntheticWaveform(song,count);
    state.videoClipSamples=samples;
    return samples;
  }
}

function videoCutSelectionMetrics(){
  const dur=Math.max(.1,Number(state.videoClipAudioDuration)||30);
  const clip=Math.min(dur,Math.max(.1,Number(state.videoClipDuration)||7));
  const start=Math.max(0,Math.min(dur-clip,Number(state.videoClipStart)||0));
  return {
    duration:dur,clip,start,
    left:(start/dur)*100,
    width:(clip/dur)*100,
    end:start+clip
  };
}

function updateVideoCutUi(){
  const m=videoCutSelectionMetrics();
  const sel=$('#videoCutSelection');
  if(sel){
    sel.style.left=`${m.left}%`;
    sel.style.width=`${m.width}%`;
  }
  const time=$('#videoCutTime');
  if(time)time.textContent=`${videoClipClock(m.start)} — ${videoClipClock(m.end)}`;
  const startLabel=$('#videoCutStart');
  if(startLabel)startLabel.textContent=videoClipClock(m.start);
  const endLabel=$('#videoCutEnd');
  if(endLabel)endLabel.textContent=videoClipClock(m.duration);
  const summary=$('#videoCutSummary');
  if(summary)summary.textContent=`${m.clip.toFixed(0)} detik • mulai ${videoClipClock(m.start)}`;
}

function setVideoClipStartFromPointer(clientX){
  const wave=$('#videoCutWave');
  if(!wave)return;
  const r=wave.getBoundingClientRect();
  const m=videoCutSelectionMetrics();
  const ratio=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
  const target=ratio*m.duration-m.clip/2;
  state.videoClipStart=Math.max(0,Math.min(m.duration-m.clip,target));
  updateVideoCutUi();
}

function findVideoBestPart(){
  const samples=state.videoClipSamples||[];
  const dur=Math.max(.1,state.videoClipAudioDuration||30);
  if(!samples.length)return 0;
  const windowCount=Math.max(2,Math.round(samples.length*(state.videoClipDuration/dur)));
  let best=0,bestScore=-1;
  for(let i=0;i<=samples.length-windowCount;i++){
    let sum=0;
    for(let j=0;j<windowCount;j++)sum+=samples[i+j];
    const centerBias=1-Math.abs((i+windowCount/2)/samples.length-.55)*.10;
    const score=(sum/windowCount)*centerBias;
    if(score>bestScore){bestScore=score;best=i;}
  }
  state.videoClipStart=Math.max(0,Math.min(dur-state.videoClipDuration,(best/samples.length)*dur));
  updateVideoCutUi();
  playUiSfx('spark');
}

let videoClipPreviewTimer=null;
async function stopVideoClipPreview({returnToStart=true}={}){
  if(videoClipPreviewTimer){clearTimeout(videoClipPreviewTimer);videoClipPreviewTimer=null;}
  state.videoClipPreviewing=false;
  musicPlayer.pause();
  if(returnToStart){try{musicPlayer.currentTime=state.videoClipStart||0;}catch{}}
  const btn=$('#videoCutPreview');
  if(btn)btn.innerHTML='▶ Preview potongan';
}

async function previewVideoClip(){
  if(state.videoClipPreviewing){
    await stopVideoClipPreview();
    return;
  }
  try{
    await ensureVideoCutAudio();
    musicPlayer.pause();
    musicPlayer.currentTime=state.videoClipStart||0;
    await musicPlayer.play();
    state.videoClipPreviewing=true;
    const btn=$('#videoCutPreview');
    if(btn)btn.innerHTML='❚❚ Stop preview';
    const clipMs=Math.max(800,(state.videoClipDuration||7)*1000);
    videoClipPreviewTimer=setTimeout(()=>stopVideoClipPreview(),clipMs);
  }catch(e){
    console.warn(e);
    toast('Preview audio belum bisa diputar.');
  }
}

async function renderVideoCutStudio(){
  stopLobbyAmbient({fade:true});
  const song=state.selectedSong;
  if(!song)return renderVideoCamera();

  await stopVideoClipPreview({returnToStart:false});
  await ensureVideoCutAudio();
  const samples=await buildVideoClipWaveform(song);
  const m=videoCutSelectionMetrics();

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page video-cut-page">
    <div class="topbar">
      <button class="icon-btn" id="videoCutBack">←</button>
      <b>Music Cut Studio</b>
      <div class="round-icon">♫</div>
    </div>

    <div class="video-cut-song-card">
      <div class="video-cut-song-icon">♫</div>
      <div><small>SOUNDTRACK TERPILIH</small><b>${esc(song.title||'Your Soundtrack')}</b><span>${esc(song.artist||song.genre||'')}</span></div>
      <em>${esc(song.genre||'Music')}</em>
    </div>

    ${captureFormatPickerMarkup('video')}
    <div class="video-cut-hero">
      <div class="video-cut-kicker">PILIH BAGIAN FAVORIT</div>
      <h2>Ambil bagian lagu yang paling kamu suka.</h2>
      <p>Geser area merah di waveform. Potongan ini yang mulai saat video direkam.</p>

      <div class="video-cut-wave" id="videoCutWave">
        <div class="video-cut-bars">${samples.map((v,i)=>`<i style="--h:${Math.round(v*100)}%;--i:${i}"></i>`).join('')}</div>
        <div class="video-cut-selection" id="videoCutSelection"><span class="left"></span><span class="right"></span><b>♫</b></div>
      </div>
      <div class="video-cut-axis"><span id="videoCutStart">${videoClipClock(m.start)}</span><b id="videoCutTime">${videoClipClock(m.start)} — ${videoClipClock(m.end)}</b><span id="videoCutEnd">${videoClipClock(m.duration)}</span></div>
    </div>

    <div class="video-cut-duration">
      <div><small>DURASI VIDEO</small><b id="videoCutSummary">${m.clip.toFixed(0)} detik • mulai ${videoClipClock(m.start)}</b></div>
      <div class="video-cut-duration-buttons">
        ${[5,10,30].map(n=>`<button type="button" data-video-clip-duration="${n}" class="${Math.round(state.videoClipDuration)===n?'active':''}" ${m.duration<n?'disabled':''}>${n}s</button>`).join('')}
      </div>
    </div>

    <div class="video-cut-actions">
      <button class="btn ghost" id="videoCutOriginal">↺ Dari awal</button>
      <button class="btn ghost" id="videoCutBest">✦ Cari bagian seru</button>
      <button class="btn ghost" id="videoCutPreview">▶ Preview potongan</button>
    </div>

    <div class="video-cut-meong"><span>🐱</span><div><b>Meong tip</b><small>Cari bagian yang bikin kepala auto ngangguk. Biasanya itu yang paling enak buat Reels 😼</small></div></div>
    <button class="btn primary block" id="videoCutContinue">Pakai bagian ini →</button>
  </section></main>`;

  requestAnimationFrame(()=>updateVideoCutUi());

  $('#videoCutBack').onclick=async()=>{await stopVideoClipPreview();openCameraPrivacyNotice();};

  let dragging=false;
  const wave=$('#videoCutWave');
  wave.onpointerdown=e=>{
    dragging=true;wave.setPointerCapture?.(e.pointerId);
    setVideoClipStartFromPointer(e.clientX);
  };
  wave.onpointermove=e=>{if(dragging)setVideoClipStartFromPointer(e.clientX);};
  const stop=e=>{dragging=false;try{wave.releasePointerCapture?.(e.pointerId);}catch{}};
  wave.onpointerup=stop;wave.onpointercancel=stop;

  $$('[data-capture-format]').forEach(b=>b.onclick=()=>{state.captureFormat=b.dataset.captureFormat;$$('[data-capture-format]').forEach(x=>x.classList.toggle('active',x===b));playUiSfx('click');});
  $$('[data-video-clip-duration]').forEach(btn=>btn.onclick=()=>{
    const dur=Number(btn.dataset.videoClipDuration)||10;
    state.videoClipDuration=Math.min(dur,state.videoClipAudioDuration||dur);
    state.videoDuration=state.videoClipDuration;
    state.videoClipStart=Math.min(state.videoClipStart,Math.max(0,state.videoClipAudioDuration-state.videoClipDuration));
    $$('[data-video-clip-duration]').forEach(x=>x.classList.toggle('active',x===btn));
    updateVideoCutUi();
    playUiSfx('click');
  });

  $('#videoCutOriginal').onclick=()=>{state.videoClipStart=0;updateVideoCutUi();playUiSfx('click');};
  $('#videoCutBest').onclick=findVideoBestPart;
  $('#videoCutPreview').onclick=previewVideoClip;
  $('#videoCutContinue').onclick=async()=>{
    await stopVideoClipPreview();
    playUiSfx('select');
    renderVideoCamera();
  };
}
function renderWelcomeGateway(){
  setLobbyWanted(true);
  const appName=(state.brand.appName||defaultBrand.appName||'Thanksgiving').trim();
  const brandName=(state.brand.brandName||defaultBrand.brandName||'Brand').trim();
  const tagline=(state.brand.tagline||'').trim();

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page welcome-gateway">
    <div class="welcome-gateway-bg">
      <div class="welcome-gateway-orbit orbit-1"></div>
      <div class="welcome-gateway-orbit orbit-2"></div>
      <div class="welcome-gateway-orbit orbit-3"></div>
      <div class="welcome-gateway-glow glow-a"></div>
      <div class="welcome-gateway-glow glow-b"></div>
      <div class="welcome-scan-line"></div>
      <i class="welcome-spark s1">✦</i><i class="welcome-spark s2">♪</i><i class="welcome-spark s3">♫</i><i class="welcome-spark s4">✦</i><i class="welcome-spark s5">•</i>
    </div>

    <div class="welcome-brand-lockup welcome-enter w1">
      <img class="welcome-pure-logo" src="${esc(logo())}" alt="${esc(brandName)} logo">
      <div class="welcome-brand-copy"><small>POWERED BY</small><b>${esc(brandName)}</b></div>
      <div class="welcome-brand-eq" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </div>

    <div class="welcome-center">
      <div class="welcome-kicker welcome-enter w2">WELCOME TO</div>
      <h1 class="welcome-title welcome-enter w3">${esc(appName)}</h1>
      <p class="welcome-copy welcome-enter w4">${esc(tagline||'Play • Feel • Capture')}</p>

      <div class="welcome-interaction-stage welcome-enter w5">
        <div class="welcome-pointer-light"></div>
        <div class="welcome-orbit-copy oc1">PLAY</div>
        <div class="welcome-orbit-copy oc2">FEEL</div>
        <div class="welcome-orbit-copy oc3">CAPTURE</div>
        <button class="welcome-cassette-mark" id="welcomeCassetteInteract" type="button" aria-label="Mainkan kaset">
          <div class="welcome-cassette-body">
            <span class="welcome-reel left"></span><span class="welcome-reel right"></span><i></i>
            <em>${esc(appName.slice(0,18))}</em>
          </div>
        </button>
        <div class="welcome-interactive-copy" id="welcomeInteractiveCopy">tap kasetnya ✦</div>
      </div>

      <div class="welcome-live-chip welcome-enter w6"><span></span><b>brand experience is live</b></div>
      <button class="btn primary block welcome-enter w7" id="enterThanksgiving">Masuk ke experience <span>→</span></button>
      <small class="welcome-footnote welcome-enter w8">Soundtrack, occasion, dan momenmu dimulai dari sini.</small>
    </div>
  </section></main>`;

  requestAnimationFrame(()=>{
    $$('.welcome-enter').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),60+i*95));
  });

  setTimeout(()=>tryLobbyAutoplay(),80);
  syncSoundToggleUi();

  const soundBtn=document.createElement('button');
  soundBtn.type='button';
  soundBtn.className='welcome-sound-chip music-pulse';
  soundBtn.innerHTML='<span>♪</span><b>Lobby sound</b>';
  soundBtn.onclick=async e=>{e.stopPropagation();await toggleSoundscape();playUiSfx('click');};
  $('.welcome-gateway')?.appendChild(soundBtn);
  syncSoundToggleUi();

  bindWelcomeInteractions();

  $('#enterThanksgiving').onclick=async()=>{
    await unlockAudio();
    await unlockSoundscape();
    warmAudioBackend();
    playUiSfx('spark');
    setTimeout(()=>playUiSfx('select'),90);
    if(campaignOccasionMode()==='locked'){
      if(occasionId()==='birthday' && !String(state.campaign?.birthdayName||'').trim()) openBirthdayCustomerSetup();
      else renderArrivalIntro();
    }else{
      renderOccasionSelection();
    }
  };
}

function renderOccasionSelection(){
  setLobbyWanted(true);
  const ids=enabledUserOccasions();
  const active=occasionId();

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page occasion-select-page">
    <div class="occasion-topbar">
      <button class="icon-btn" id="occasionBack" aria-label="Kembali">←</button>
      <div class="occasion-brand-lockup"><img class="occasion-pure-logo" src="${esc(logo())}" alt="logo"><div class="occasion-brand-copy"><b>${esc(state.brand.brandName)}</b><span>${esc(state.brand.appName)}</span></div></div>
      <button class="round-icon music-pulse" id="occasionSoundToggle" type="button" aria-label="Sound">♪</button>
    </div>

    <div class="occasion-select-head">
      <div class="eyebrow">PICK YOUR MOMENT</div>
      <h1>Kamu lagi ngerayain apa?</h1>
      <p>Pilih occasion dulu. Intro, musik, Meong, dan template foto bakal ikut menyesuaikan.</p>
    </div>

    <div class="occasion-select-aura" aria-hidden="true"><i></i><i></i><i></i></div><div class="occasion-select-grid">
      ${ids.map((id,i)=>{
        const meta=occasionCatalog[id];
        const icon=meta.badge.split(' ')[0];
        return `<button class="occasion-select-card ${active===id?'active':''} occasion-card-${id}" data-select-occasion="${id}" style="--oi:${i}" type="button">
          <div class="occasion-select-icon"><span>${icon}</span><i>✦</i></div>
          <div class="occasion-select-copy"><b>${esc(meta.label)}</b><small>${esc(meta.previewText)}</small></div>
          <em>${active===id?'CURRENT':'PILIH'} →</em>
        </button>`;
      }).join('')}
    </div>
    <div class="occasion-select-foot">${esc(state.brand.appName)} • ${esc(state.brand.tagline||'')}</div>
  </section></main>`;

  setTimeout(()=>tryLobbyAutoplay(),60);
  $('#occasionBack').onclick=()=>{playUiSfx('click');renderWelcomeGateway();};
  const occasionSound=$('#occasionSoundToggle');if(occasionSound)occasionSound.onclick=async()=>{await toggleSoundscape();playUiSfx('click');};
  syncSoundToggleUi();
  $$('[data-select-occasion]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.selectOccasion;
    playUiSfx('select');
    if(id==='birthday') return openBirthdayCustomerSetup();
    state.campaign={...(state.campaign||{}),occasion:id};
    state.template='';
    renderArrivalIntro();
  });
}

function renderNoCampaign(){
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page">${topbar()}<div class="empty-state"><div class="empty-icon">🎵</div><h1>${esc(state.brand.appName)}</h1><p>Pengalaman musik ini dibuka melalui QR yang dibuat admin.</p><div class="mini-pill">Scan • Genre • Gacha • Foto</div></div></section></main>`;
}
function renderExpired(){
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page">${topbar()}<div class="empty-state"><div class="empty-icon">⌛</div><h1>QR sudah tidak aktif</h1><p>Minta QR baru untuk menemukan soundtrack berikutnya.</p></div></section></main>`;
}
function renderSetup(admin=false){
  appEl.innerHTML=`<div class="login-card"><div class="setup-orb"></div><h1>Setup ${esc(state.brand.appName)}</h1><p>Firebase core belum dikonfigurasi.</p>${admin?'<div class="notice">Isi firebase-config.js lalu refresh.</div>':''}</div>`;
}
function renderError(msg,e){ console.error(e); appEl.innerHTML=`<main class="shell"><section class="phone customer-page"><div class="empty-state"><div class="empty-icon">!</div><h1>Oops</h1><p>${esc(msg)}</p></div></section></main>`; }

function howToUseMarkup(){
  return `<div class="howto-strip">    <div class="howto-step"><span>1</span><b>Pilih Genre</b><small>Tentukan vibe dulu</small></div>    <div class="howto-step"><span>2</span><b>Spin Music</b><small>Tunggu kaset memutar lagu</small></div>    <div class="howto-step"><span>3</span><b>Foto & Share</b><small>Simpan momenmu</small></div>  </div>`;
}
function birthdayFlyerMarkup(count=26){
  const pool=['SURPRISE!','HAPPY!','🎉','🎈','🎂','🎊','✦','YAY!','HBD!','💫','🎁','♡'];
  return Array.from({length:count},(_,i)=>{
    const text=pool[Math.floor(Math.random()*pool.length)];
    const x=Math.round(4+Math.random()*92);
    const y=Math.round(4+Math.random()*84);
    const rot=Math.round(-34+Math.random()*68);
    const scale=(.72+Math.random()*.72).toFixed(2);
    const delay=(Math.random()*1.5).toFixed(2);
    const dur=(2.3+Math.random()*2.7).toFixed(2);
    const drift=Math.round(-30+Math.random()*60);
    return `<span class="birthday-flyer f-${i%6}" style="--x:${x}%;--y:${y}%;--r:${rot}deg;--s:${scale};--delay:${delay}s;--dur:${dur}s;--drift:${drift}px">${text}</span>`;
  }).join('');
}
function refreshBirthdayFlyers(){
  const layer=$('#birthdayFlyers');
  if(!layer) return;
  layer.innerHTML=birthdayFlyerMarkup(30);
  layer.classList.remove('reburst'); void layer.offsetWidth; layer.classList.add('reburst');
}
async function playBirthdayFanfare(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return false;
  try{
    const ctx=new AC();
    await ctx.resume();
    const master=ctx.createGain();
    master.gain.setValueAtTime(.0001,ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(.32,ctx.currentTime+.025);
    master.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.55);
    master.connect(ctx.destination);
    const filter=ctx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=1250; filter.Q.value=.75; filter.connect(master);
    const notes=[523.25,659.25,783.99,1046.5,783.99,1046.5];
    const starts=[0,.18,.36,.56,.78,.96];
    const lengths=[.18,.18,.2,.22,.17,.46];
    notes.forEach((freq,i)=>{
      const o=ctx.createOscillator();
      const g=ctx.createGain();
      o.type=i===5?'sawtooth':'square';
      o.frequency.setValueAtTime(freq,ctx.currentTime+starts[i]);
      o.detune.setValueAtTime(i%2?5:-4,ctx.currentTime+starts[i]);
      g.gain.setValueAtTime(.0001,ctx.currentTime+starts[i]);
      g.gain.exponentialRampToValueAtTime(i===5?.22:.15,ctx.currentTime+starts[i]+.015);
      g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+starts[i]+lengths[i]);
      o.connect(g); g.connect(filter); o.start(ctx.currentTime+starts[i]); o.stop(ctx.currentTime+starts[i]+lengths[i]+.03);
    });
    const noise=ctx.createBufferSource();
    const buff=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.16),ctx.sampleRate);
    const data=buff.getChannelData(0); for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    noise.buffer=buff; const ng=ctx.createGain(); ng.gain.value=.04; noise.connect(ng); ng.connect(master); noise.start(ctx.currentTime+.55);
    setTimeout(()=>ctx.close().catch(()=>{}),1900);
    return true;
  }catch(e){ return false; }
}
function birthdayVisual(pack){
  if(pack==='balloons') return `<div class="bday-balloons"><i>🎈</i><i>🎈</i><i>🎈</i><i>🎈</i><i>🎈</i></div><div class="bday-center-emoji">🎉</div>`;
  if(pack==='gift') return `<div class="bday-gift"><div class="gift-lid">🎀</div><div class="gift-box">🎁</div><div class="gift-stars"><i>✦</i><i>★</i><i>✦</i></div></div>`;
  if(pack==='disco') return `<div class="bday-disco"><div class="disco-ball">🪩</div><div class="disco-rays"><i></i><i></i><i></i><i></i></div></div>`;
  if(pack==='confetti') return `<div class="bday-confetti-core">🎊</div><div class="bday-confetti-cloud">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`;
  return `<div class="bday-cake"><div class="cake-candle"><i></i><i></i><i></i></div><div class="cake-top">🎂</div><div class="cake-spark"><i>✦</i><i>✦</i><i>★</i></div></div>`;
}
function renderBirthdayIntro(){
  setLobbyWanted(true);
  const pack=state.birthdayPack||pickBirthdayPack();
  const name=birthdayName();
  const age=birthdayAge();
  const brand=(state.brand.brandName||defaultBrand.brandName).trim();
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page birthday-intro birthday-pack-${esc(pack)}">${topbar()}
    <div class="birthday-party-wash"></div>
    <div class="birthday-stars">${Array.from({length:18},(_,i)=>`<i style="--i:${i}">✦</i>`).join('')}</div>
    <div class="birthday-flyers" id="birthdayFlyers">${birthdayFlyerMarkup(30)}</div>
    <div class="birthday-cannon cannon-left"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="birthday-cannon cannon-right"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="birthday-kicker"><span class="trumpet-icon">📯</span> BIRTHDAY SURPRISE</div>
    <button class="birthday-magic" id="birthdayMagic" type="button" aria-label="Mainkan kejutan ulang tahun">
      <div class="birthday-visual">${birthdayVisual(pack)}</div>
      <div class="birthday-surprise-badge">SURPRISE!</div>
      <div class="birthday-tap">tap lagi buat terompet + kejutan 🎺✨</div>
    </button>
    <div class="birthday-copy">
      <small>Hari ini soundtrack-nya spesial buat</small>
      <h1>${esc(name)} 🎂</h1>
      ${age?`<div class="birthday-age">${esc(age)}</div>`:''}
      <p>${esc(birthdayMessage())}</p>
      <div id="birthdayFun" class="birthday-fun">Kejutannya udah pecah — sekarang cari soundtrack birthday-mu 🎶</div>
    </div>
    <div class="birthday-mini-steps"><span>🎵 pilih vibe</span><span>🎲 gacha lagu</span><span>📷 birthday photo</span></div>
    <button class="btn primary block birthday-start" id="birthdayGo">Buka birthday soundtrack <span>→</span></button>
  </section></main>`;
  const lines=[
    `Wish dulu buat ${name}, baru cari lagunya 🕯️`,
    'Hari ini nggak boleh skip foto. Birthday cuma setahun sekali 📷',
    `Siapa tahu gacha-nya ngasih lagu Rare buat ${name} 👀`,
    `${brand} + birthday + soundtrack = lumayan susah dilupain ya ✨`,
    'Terompetnya udah bunyi, sekarang giliran kamu bikin momennya rame 🎺'
  ];
  let i=0;
  const surprise=async()=>{
    const b=$('#birthdayMagic'); if(!b)return;
    b.classList.remove('burst');void b.offsetWidth;b.classList.add('burst');
    refreshBirthdayFlyers();
    playBirthdayFanfare();
    i=(i+1)%lines.length; const fun=$('#birthdayFun'); if(fun)fun.textContent=lines[i];
  };
  $('#birthdayMagic').onclick=surprise;
    setTimeout(()=>tryLobbyAutoplay(),60);

$('#birthdayGo').onclick=async()=>{await unlockAudio();warmAudioBackend();renderLanding();};
  // Visual surprise langsung jalan saat QR birthday dibuka. Sound dicoba otomatis;
  // browser yang memblok autoplay akan memainkannya pada tap pertama.
  setTimeout(()=>{const b=$('#birthdayMagic');if(b){b.classList.add('burst');refreshBirthdayFlyers();}playBirthdayFanfare();},320);
}

function renderOccasionIntro(){
  setLobbyWanted(true);
  const id=occasionId();
  const theme=occasionIntroThemes[id];
  if(!theme) return null;

  const c=state.campaign;
  const meta=occasionMeta(id);
  const target=(c.customer||'').trim();
  const bits=theme.bits||['✨','♫','✦'];
  const variant=1+Math.floor(Math.random()*4);
  const density=24+Math.floor(Math.random()*14);

  const detailMap={
    wedding:['tap buat sparkle','geser kartu','unlock love vibe'],
    graduation:['tap buat confetti','gerakin kartu','unlock grad vibe'],
    puasa:['tap lentera','gerakin bulan','unlock iftar vibe'],
    lebaran:['tap lampion','gerakin bulan','unlock Eid vibe'],
    adha:['tap glow','gerakin kartu','unlock calm vibe'],
    christmas:['tap salju','gerakin pohon','unlock cozy vibe'],
    newyear:['tap fireworks','gerakin kartu','unlock party vibe'],
    valentine:['tap love spark','gerakin hati','unlock sweet vibe'],
    imlek:['tap hoki','gerakin angpao','unlock lucky vibe'],
    halloween:['tap ghost','gerakin labu','unlock spooky vibe']
  }[id]||['tap effect','gerakin kartu','unlock vibe'];

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page occasion-intro occasion-${esc(id)} occasion-variant-${variant}">${topbar()}
    <div class="occasion-glow"></div>
    <div class="occasion-particles">${Array.from({length:density},(_,i)=>`<i style="--i:${i};--x:${(i*37)%92}%">${esc(bits[(i+variant)%bits.length])}</i>`).join('')}</div>

    <div class="occasion-kicker">${esc(theme.kicker)}</div>
    <div class="occasion-signature">${esc(state.brand.brandName)} • ${esc(meta.label)}</div>

    <div class="occasion-stage" id="occasionStage">
      <div class="occasion-back-orbit"><span>${esc(bits[0])}</span><span>${esc(bits[1]||'✦')}</span><span>${esc(bits[2]||'♫')}</span></div>
      <button class="occasion-magic" id="occasionMagic" type="button" aria-label="Mainkan animasi ${esc(meta.label)}">
        <div class="occasion-orbit"><span>${esc(theme.icon)}</span></div>
        <div class="occasion-ring r1"></div><div class="occasion-ring r2"></div><div class="occasion-ring r3"></div>
        <div class="occasion-pulse-dot"></div>
        <div class="occasion-tap">${esc(theme.tap)}</div>
      </button>
      <div class="occasion-sticker s-left">${esc(bits[variant%bits.length])}</div>
      <div class="occasion-sticker s-right">${esc(bits[(variant+2)%bits.length])}</div>
    </div>

    <div class="occasion-copy">
      <small>${target?`Untuk ${esc(target)}`:'Special moment unlocked'}</small>
      <h1>${esc(theme.title)}</h1>
      <p>${esc(c.note||theme.subtitle)}</p>
      <div id="occasionFun" class="occasion-fun">${esc(meta.previewText)}</div>
    </div>

    <div class="occasion-interact-row">
      ${detailMap.map((x,i)=>`<button class="occasion-detail-chip" data-effect="${i}"><span>${['✦','↗','♫'][i]}</span>${esc(x)}</button>`).join('')}
    </div>

    <div class="occasion-vibe-meter">
      <div><span>VIBE METER</span><b id="occasionVibeText">warming up…</b></div>
      <div class="occasion-meter-track"><i id="occasionMeter"></i></div>
    </div>

    <div class="occasion-mini-steps"><span>🎵 pilih genre</span><span>▶ pilih lagu</span><span>📷 ambil foto</span></div>
    <button class="btn primary block occasion-start" id="occasionGo">${esc(theme.action)} <span>→</span></button>
  </section></main>`;

  const funLines=[
    meta.previewText,
    `Template foto ${meta.label} juga udah disiapin khusus ✨`,
    'Pilih genre dulu, lalu kamu bebas pilih lagunya sendiri 🎵',
    `Kalau pengen random, Surprise Me masih tersedia 🎲`,
    `Meong bilang vibe ${meta.label} kamu lagi naik 👀`
  ];

  let index=0;
  let vibe=28+Math.floor(Math.random()*18);
  const meter=$('#occasionMeter');
  const vibeText=$('#occasionVibeText');

  const setVibe=(add=12)=>{
    vibe=Math.min(100,vibe+add);
    if(meter) meter.style.width=`${vibe}%`;
    if(vibeText) vibeText.textContent=vibe<50?'warming up…':vibe<80?'looking good ✨':'vibe unlocked ✦';
  };
  setTimeout(()=>setVibe(8),180);

  const burst=(strength=1)=>{
    const b=$('#occasionMagic');
    const stage=$('#occasionStage');
    if(b){b.classList.remove('burst');void b.offsetWidth;b.classList.add('burst');}
    if(stage){stage.classList.remove('stage-hit');void stage.offsetWidth;stage.classList.add('stage-hit');}
    index=(index+1)%funLines.length;
    const f=$('#occasionFun'); if(f) f.textContent=funLines[index];
    setVibe(8+strength*5);

    $$('.occasion-particles i').forEach((p,i)=>{
      if(i%(4-strength)===0){
        p.classList.remove('pop');
        void p.offsetWidth;
        p.classList.add('pop');
      }
    });
  };

  $('#occasionMagic').onclick=()=>burst(2);

  $$('.occasion-detail-chip').forEach(chip=>{
    chip.onclick=()=>{
      const effect=Number(chip.dataset.effect||0);
      burst(effect+1);
      chip.classList.remove('active');
      void chip.offsetWidth;
      chip.classList.add('active');
      setTimeout(()=>chip.classList.remove('active'),520);
    };
  });

  const stage=$('#occasionStage');
  if(stage){
    stage.onpointermove=e=>{
      const r=stage.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      stage.style.setProperty('--rx',`${(-y*7).toFixed(2)}deg`);
      stage.style.setProperty('--ry',`${(x*9).toFixed(2)}deg`);
    };
    stage.onpointerleave=()=>{
      stage.style.setProperty('--rx','0deg');
      stage.style.setProperty('--ry','0deg');
    };
  }

    setTimeout(()=>tryLobbyAutoplay(),60);

$('#occasionGo').onclick=async()=>{
    await unlockAudio();
    warmAudioBackend();
    renderLanding();
  };

  setTimeout(()=>burst(1),320);
  return true;
}

function renderArrivalIntro(){
  setLobbyWanted(true);
  if(isBirthday()) return renderBirthdayIntro();
  if(occasionId()!=='regular' && renderOccasionIntro()) return;

  const c=state.campaign;
  const brandLine=(state.brand.brandName||defaultBrand.brandName).trim();
  const expLine=(state.brand.appName||defaultBrand.appName).trim();
  const variant=1+Math.floor(Math.random()*3);
  const particleCount=10+Math.floor(Math.random()*6);

  warmAudioBackend();

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page intro-page regular-intro regular-intro-${variant}">${topbar()}
    <div class="regular-aura a1"></div>
    <div class="regular-aura a2"></div>

    <div class="regular-intro-wrap">
      <div class="regular-scan-pill intro-enter enter-1"><span>✓</span> Scan complete</div>

      <div class="regular-hero intro-enter enter-2" id="regularStage">
        <div class="regular-orbit-line"></div>

        ${Array.from({length:particleCount},(_,i)=>`
          <i class="regular-note note-${i%4}" style="--i:${i};--x:${12+(i*17)%76}%;--y:${10+(i*23)%70}%">
            ${['♪','♫','✦','♬'][i%4]}
          </i>`).join('')}

        <button class="regular-cassette-btn" id="introCassette" type="button" aria-label="Mainkan animasi kaset">
          <div class="regular-cassette-shadow"></div>
          <div class="regular-cassette">
            <div class="regular-cassette-top">Chill</div>
            <div class="regular-cassette-window">
              <span class="reel reel-l"></span>
              <span class="reel reel-r"></span>
              <span class="tape-line"></span>
            </div>
            <div class="regular-cassette-smile">⌣</div>
          </div>
        </button>

        <div class="regular-tap-hint">tap kasetnya <span>↗</span></div>
        <div class="regular-mini-label label-left">YOUR VIBE</div>
        <div class="regular-mini-label label-right">PLAY • FEEL • CAPTURE</div>
      </div>

      <div class="regular-copy intro-enter enter-3">
        <small>${esc(expLine)} experience</small>
        <h1>Minumanmu punya<br>soundtrack.</h1>
        <p>${esc(c.note || 'Pilih mood, pilih lagu, lalu simpan momennya.')}</p>
        ${c.product ? `<div class="regular-product">🧋 ${esc(c.product)}</div>` : ''}
      </div>

      <div class="regular-meong-card intro-enter enter-4" id="introFunText">
        <div class="regular-meong-face">😼</div>
        <div>
          <small>MEONG DJ</small>
          <b>Kasetnya siap. Tinggal pilih vibe kamu.</b>
        </div>
      </div>

      <div class="regular-quick-actions intro-enter enter-5">
        <button class="regular-action" data-action="spin"><span>↻</span><b>Putar kaset</b></button>
        <button class="regular-action" data-action="note"><span>♫</span><b>Drop a note</b></button>
      </div>

      <div class="regular-vibe-line intro-enter enter-6">
        <div class="regular-vibe-meta"><span>VIBE</span><b id="regularVibeText">warming up</b></div>
        <div class="regular-vibe-track"><i id="regularVibeBar"></i></div>
      </div>

      <button class="btn primary block regular-start-btn intro-enter enter-7" id="introGo">Mulai pilih genre <span>→</span></button>

      <div class="regular-mini-steps intro-enter enter-8">
        <span><i>1</i>Pilih genre</span>
        <span><i>2</i>Pilih lagu</span>
        <span><i>3</i>Foto & share</span>
      </div>

      <div class="regular-brand-foot">${esc(brandLine)} • ${esc(state.brand.tagline||'')}</div>
    </div>
  </section></main>`;

  requestAnimationFrame(()=>{
    const page=document.querySelector('.regular-intro');
    if(page) page.classList.add('is-entered');
    $$('.intro-enter').forEach((el,i)=>{
      setTimeout(()=>el.classList.add('show'),90+i*95);
    });
  });

  // Opening sequence: kaset masuk, ring menyala, notes keluar sedikit,
  // lalu UI berhenti di state tenang supaya tetap aesthetic.
  setTimeout(()=>{
    const hero=$('#regularStage');
    const cassette=$('#introCassette');
    if(hero) hero.classList.add('hero-awake');
    if(cassette) cassette.classList.add('opening-bounce');
  },260);

  setTimeout(()=>{
    $$('.regular-note').forEach((n,i)=>{
      if(i%2===0){
        n.classList.add('opening-pop');
        setTimeout(()=>n.classList.remove('opening-pop'),800);
      }
    });
  },520);

  const fun=[
    'Kasetnya siap. Tinggal pilih vibe kamu.',
    'Sekarang pilih genre = bebas pilih lagunya sendiri.',
    `${brandLine} lagi nyiapin soundtrack yang pas buat mood kamu.`,
    'Kalau masih bingung, Surprise Me tetap ada.',
    'Meong DJ approve. Vibenya mulai kebaca.'
  ];

  let funIndex=0;
  let vibe=34+Math.floor(Math.random()*12);

  const setVibe=(add=7)=>{
    vibe=Math.min(100,vibe+add);
    const bar=$('#regularVibeBar');
    const label=$('#regularVibeText');
    if(bar) bar.style.width=`${vibe}%`;
    if(label) label.textContent=vibe<52?'warming up':vibe<78?'nice vibe':'unlocked ✦';
  };

  const updateMeong=()=>{
    funIndex=(funIndex+1)%fun.length;
    const card=$('#introFunText');
    if(card){
      card.classList.remove('swap');
      void card.offsetWidth;
      card.classList.add('swap');
      const b=card.querySelector('b');
      if(b) b.textContent=fun[funIndex];
    }
  };

  const animateCassette=(big=false)=>{
    const cassette=$('#introCassette');
    cassette.classList.remove('hit','hit-big');
    void cassette.offsetWidth;
    cassette.classList.add(big?'hit-big':'hit');
    updateMeong();
    setVibe(big?13:8);

    $$('.regular-note').forEach((n,i)=>{
      if(i%(big?2:3)===0){
        n.classList.remove('burst');
        void n.offsetWidth;
        n.classList.add('burst');
      }
    });
  };

  $('#introCassette').onclick=()=>animateCassette(false);

  $$('.regular-action').forEach(btn=>{
    btn.onclick=()=>{
      btn.classList.remove('active');
      void btn.offsetWidth;
      btn.classList.add('active');
      setTimeout(()=>btn.classList.remove('active'),450);

      if(btn.dataset.action==='spin'){
        animateCassette(true);
      }else{
        const stage=$('#regularStage');
        const note=document.createElement('span');
        note.className='regular-floating-note';
        note.textContent=['♪','♫','♬'][Math.floor(Math.random()*3)];
        stage.appendChild(note);
        setTimeout(()=>note.remove(),850);
        updateMeong();
        setVibe(10);
      }
    };
  });

  const stage=$('#regularStage');
  if(stage){
    stage.onpointermove=e=>{
      const r=stage.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      stage.style.setProperty('--rx',`${(-y*4.5).toFixed(2)}deg`);
      stage.style.setProperty('--ry',`${(x*6).toFixed(2)}deg`);
    };
    stage.onpointerleave=()=>{
      stage.style.setProperty('--rx','0deg');
      stage.style.setProperty('--ry','0deg');
    };
  }

  setTimeout(()=>setVibe(6),420);
  setTimeout(()=>{
    const cassette=$('#introCassette');
    if(cassette) cassette.classList.remove('opening-bounce');
    updateMeong();
  },880);

    setTimeout(()=>tryLobbyAutoplay(),60);

$('#introGo').onclick=async()=>{
    await unlockAudio();
    warmAudioBackend();
    renderLanding();
  };
}


const heroModelCatalog = [
  {id:'drink-order',type:'drink',name:'Order Counter',desc:'Cup, order ticket, phone player, dan Meong. Paling dekat dengan hero original.'},
  {id:'drink-vinyl',type:'drink',name:'Vinyl Bar',desc:'Minuman premium + vinyl besar + mini player. Lebih clean dan nightlife.'},
  {id:'food-cafe',type:'food',name:'Cafe Plate',desc:'Main dish / snack bowl + receipt + soundtrack player. Cocok untuk makanan.'},
  {id:'food-dessert',type:'food',name:'Dessert Session',desc:'Cake/dessert plate + floating notes + player editorial.'},
  {id:'combo-pairing',type:'combo',name:'Perfect Pairing',desc:'Makanan + minuman tampil bareng dengan player di sisi kanan.'},
  {id:'combo-editorial',type:'combo',name:'Editorial Duo',desc:'Food & drink dalam layout editorial premium dengan typography besar.'}
];

function heroModelMeta(id){
  return heroModelCatalog.find(x=>x.id===id)||heroModelCatalog[0];
}

function heroTypeLabel(type=state.brand.heroType){
  return type==='food'?'Food':type==='combo'?'Food + Drink':'Drink';
}

function activeHeroModel(){
  const enabled=(state.brand.enabledHeroModels||defaultBrand.enabledHeroModels||[]).filter(id=>heroModelCatalog.some(x=>x.id===id));
  const fallback=enabled[0]||state.brand.heroModel||defaultBrand.heroModel||'drink-order';
  if((state.brand.heroRotationMode||'fixed')!=='random'){
    state.heroSessionModel=enabled.includes(state.brand.heroModel)?state.brand.heroModel:fallback;
    return state.heroSessionModel;
  }
  if(!state.heroSessionModel||!enabled.includes(state.heroSessionModel)){
    state.heroSessionModel=rand(enabled)||fallback;
  }
  return state.heroSessionModel;
}

function heroExperienceCopy(c=state.campaign){
  const type=state.brand.heroType||'drink';
  const defaults={
    drink:{
      headline:'Minumanmu punya soundtrack.',
      bubble:`Siap nyari soundtrack yang cocok buat ${c?.product||'minumanmu'}?`,
      product:c?.product||'Your Drink',
      icon:'🧋',
      mini:'Drink • Music • Capture'
    },
    food:{
      headline:'Makananmu punya soundtrack.',
      bubble:`Mau cari soundtrack yang pas nemenin ${c?.product||'makanmu'}?`,
      product:c?.product||'Your Food',
      icon:'🍽️',
      mini:'Food • Music • Capture'
    },
    combo:{
      headline:'Food & drink-mu punya soundtrack.',
      bubble:`Siap cari soundtrack buat ${c?.product||'food & drink moment-mu'}?`,
      product:c?.product||'Your Pairing',
      icon:'🍽️🧋',
      mini:'Food • Drink • Music'
    }
  };
  const base=defaults[type]||defaults.drink;
  return {
    ...base,
    headline:String(state.brand.heroHeadline||'').trim()||base.headline,
    bubble:String(state.brand.heroBubble||'').trim()||base.bubble
  };
}

function heroPhoneMarkup(copy,variant='default'){
  if(state.brand.heroShowPhone===false)return '';
  return `<div class="hx-phone hx-phone-${variant}">
    <div class="hx-phone-notch"></div>
    <div class="hx-phone-screen">
      <div class="hx-now">NOW<br>PLAYING</div>
      <div class="hx-disc"><i></i></div>
      <div class="hx-track"><b>${esc(copy.product)}</b><span>${esc(copy.mini)}</span></div>
      <div class="hx-progress"><i></i></div>
      <div class="hx-controls"><span>↶</span><b>▶</b><span>↷</span></div>
    </div>
  </div>`;
}

function heroTicketMarkup(copy){
  if(state.brand.heroShowTicket===false)return '';
  return `<div class="hx-ticket">
    <small>ONLINE ORDER</small>
    <b>Scan & Find<br>Your Soundtrack</b>
    <div class="hx-ticket-code"></div>
    <span>${esc(heroTypeLabel())} experience ✦</span>
  </div>`;
}

function heroMeongMarkup(copy){
  if(state.brand.heroShowMeong===false)return '';
  return `<div class="hx-meong">
    <div class="hx-meong-face">🐱</div>
    <div class="hx-meong-bubble">${esc(copy.bubble)}</div>
  </div>`;
}

function heroDrinkCupMarkup(cls=''){
  return `<div class="hx-cup ${cls}">
    <div class="hx-cup-straw"></div>
    <div class="hx-cup-lid"></div>
    <div class="hx-cup-body">
      <div class="hx-cup-foam"></div>
      <div class="hx-cup-liquid"></div>
      <div class="hx-cup-boba"></div>
      <img src="${esc(logo())}" alt="logo">
    </div>
  </div>`;
}

function heroFoodBowlMarkup(cls=''){
  return `<div class="hx-bowl ${cls}">
    <div class="hx-bowl-food"><i></i><i></i><i></i><i></i><i></i><span>✦</span></div>
    <div class="hx-bowl-rim"></div>
    <div class="hx-bowl-body"><b>${esc(state.brand.brandName)}</b></div>
  </div>`;
}

function heroDessertMarkup(){
  return `<div class="hx-dessert">
    <div class="hx-dessert-plate"></div>
    <div class="hx-cake"><i></i><span></span><em></em></div>
    <div class="hx-dessert-fork">⌁</div>
  </div>`;
}

function heroSceneMarkup(){
  const model=activeHeroModel();
  const meta=heroModelMeta(model);
  const copy=heroExperienceCopy();
  const common=`<div class="hx-backdrop"></div><div class="hx-glow hx-g1"></div><div class="hx-glow hx-g2"></div><div class="hx-notes"><i>♪</i><i>♫</i><i>✦</i><i>♬</i></div><div class="hx-table"></div>`;

  let scene='';
  if(model==='drink-order'){
    scene=`${heroTicketMarkup(copy)}${heroDrinkCupMarkup('hx-cup-main')}${heroPhoneMarkup(copy,'drink')}${heroMeongMarkup(copy)}`;
  }else if(model==='drink-vinyl'){
    scene=`<div class="hx-vinyl-wall"><i></i></div>${heroDrinkCupMarkup('hx-cup-vinyl')}<div class="hx-neon-copy">SIP • PLAY • FEEL</div>${heroPhoneMarkup(copy,'vinyl')}${heroMeongMarkup(copy)}`;
  }else if(model==='food-cafe'){
    scene=`${heroTicketMarkup(copy)}${heroFoodBowlMarkup('hx-bowl-main')}<div class="hx-food-card"><small>GOOD FOOD</small><b>BETTER<br>MOOD</b></div>${heroPhoneMarkup(copy,'food')}${heroMeongMarkup(copy)}`;
  }else if(model==='food-dessert'){
    scene=`<div class="hx-dessert-copy"><small>SWEET MOMENTS</small><b>Food tastes<br>better with<br>a soundtrack.</b></div>${heroDessertMarkup()}${heroPhoneMarkup(copy,'dessert')}${heroMeongMarkup(copy)}`;
  }else if(model==='combo-pairing'){
    scene=`<div class="hx-pairing-label"><small>A PERFECT PAIRING</small><b>FOOD + DRINK + MUSIC</b></div>${heroFoodBowlMarkup('hx-bowl-combo')}${heroDrinkCupMarkup('hx-cup-combo')}${heroPhoneMarkup(copy,'combo')}${heroMeongMarkup(copy)}`;
  }else{
    scene=`<div class="hx-editorial-copy"><small>GOOD TASTE</small><b>Different<br>flavors.<br>Same vibe.</b><span>${esc(state.brand.tagline||'')}</span></div>${heroFoodBowlMarkup('hx-bowl-editorial')}${heroDrinkCupMarkup('hx-cup-editorial')}${heroPhoneMarkup(copy,'editorial')}${heroMeongMarkup(copy)}`;
  }

  return `<div class="hero-art hero-art--real hero-experience-scene hero-model-${esc(model)} hero-type-${esc(meta.type)}">
    ${common}
    <div class="hx-model-badge"><span>${meta.type==='food'?'🍽️':meta.type==='combo'?'🍽️ + 🧋':'🧋'}</span><b>${esc(meta.name)}</b></div>
    ${scene}
  </div>`;
}

function heroAdminModelCards(){
  const enabled=state.brand.enabledHeroModels||defaultBrand.enabledHeroModels;
  return heroModelCatalog.map(m=>`<label class="hero-admin-model ${state.brand.heroModel===m.id?'selected':''}" data-hero-admin-card="${m.id}" data-hero-type="${m.type}">
    <input type="checkbox" data-hero-model-enabled="${m.id}" ${enabled.includes(m.id)?'checked':''}>
    <button type="button" class="hero-admin-model-preview hero-mini-${m.id}" data-hero-set-model="${m.id}" aria-label="Pakai ${esc(m.name)}">
      <i></i><span>${m.type==='food'?'🍽️':m.type==='combo'?'🍽️🧋':'🧋'}</span><em>♪</em>
    </button>
    <b>${esc(m.name)}</b><small>${esc(m.desc)}</small>
  </label>`).join('');
}

function renderLanding(){
  state.menuOpening=false;
  document.querySelectorAll('.delivery-confirm-backdrop').forEach(x=>x.remove());
  setLobbyWanted(true);
  const c=state.campaign;
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page landing-page ${isBirthday()?'birthday-landing':''}">${topbar()}
    <div class="hero-card hero-card--real">
      ${state.brand.heroExperienceEnabled===false?'':heroSceneMarkup()}
      <div class="hero-content hero-content--real">
        <div class="eyebrow">${isBirthday()?'🎂 BIRTHDAY MUSIC EXPERIENCE':occasionId()!=='regular'?`${esc(occasionBadge())} MUSIC EXPERIENCE`:'🎧 MUSIC EXPERIENCE'}</div>
        <h1>${isBirthday()?`Hari ini soundtrack-nya buat ${esc(birthdayName())} 🎉`:occasionId()!=='regular'?`${esc(occasionDisplayLabel())} punya soundtrack sendiri ✨`:(c.customer?`Hai, ${esc(c.customer)}!`:heroExperienceCopy(c).headline)}</h1>
        <p>${esc(isBirthday()?birthdayMessage():(c.note || (occasionId()!=='regular'?occasionMeta().previewText:'Pilih genre yang kamu suka, putar gachanya, lalu abadikan momennya.')))}</p>
        ${c.product ? `<div class="product-pill">${heroExperienceCopy(c).icon} ${esc(c.product)}</div>` : ''}
        
        <button class="btn primary block" id="start">Mulai sekarang <span>→</span></button>
        ${state.brand.menuFeatureEnabled!==false?'<button class="btn ghost block premium-menu-cta" id="openMenu">Lihat menu & harga</button>':''}
      </div>
    </div>
    ${howToUseMarkup()}
    <div class="tagline">${esc(state.brand.tagline)}</div>
  </section></main>`;
  setTimeout(()=>tryLobbyAutoplay(),60);

  $('#start').onclick=async()=>{ await unlockAudio(); warmAudioBackend(); renderGenres(); };
  const menuBtn=$('#openMenu');if(menuBtn)menuBtn.onclick=openMenuExperience;
}
function genreSlug(g){ return String(g).toLowerCase().replace(/&/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function eligibleSongs(){
  return songsForCurrentOccasion();
}
function availableGenres(){
  const enabled=(state.brand.enabledGenres||defaultBrand.enabledGenres||[]).filter(Boolean);
  const active=eligibleSongs();
  const has=new Set(active.map(s=>String(s.genre||'').trim()).filter(Boolean));
  const enabledAvailable=enabled.filter(g=>has.has(g));
  if(enabledAvailable.length) return enabledAvailable;
  // Fallback kalau lagu aktif memakai genre yang belum ada di Brand > Genre aktif.
  return [...has];
}
function ensurePlayableGenre(preferred=state.selectedGenre){
  const available=availableGenres();
  if(!available.length) return '';
  if(preferred && available.includes(preferred)){
    state.selectedGenre=preferred;
    return preferred;
  }
  const next=rand(available);
  state.selectedGenre=next;
  return next;
}


function renderGenres(){
  setLobbyWanted(true);
  const genres=state.brand.enabledGenres || defaultBrand.enabledGenres;
  const playable=availableGenres();
  const playableSet=new Set(playable);
  const moods=['bright','slow & cozy','smooth','fresh','warm','late night','bold','electric'];

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page genre-page ${isBirthday()?'birthday-genre-page':''}">${topbar()}
    <div class="page-head"><div class="eyebrow">${isBirthday()?'🎂 BIRTHDAY • STEP 1':'STEP 1'}</div><h1>${isBirthday()?`Pilih birthday vibe ${esc(birthdayName())}`:'Pilih genre kamu'}</h1><p>${isBirthday()?'Cari vibe yang paling cocok buat birthday soundtrack hari ini.':'Pilih genre lalu lihat semua lagu yang tersedia. Gacha cuma dipakai kalau kamu pilih Surprise Me.'}</p><div class="genre-head-floats"><span>♪</span><span>♫</span><span>✦</span></div></div>
    <div class="genre-grid">${genres.map((g,i)=>{const slug=genreSlug(g);const ok=playableSet.has(g);return `<button class="genre-card genre-${slug} ${ok?'':'genre-unavailable'}" data-g="${esc(g)}"><div class="genre-motion"><div class="genre-icon">${genreIcons[g]||'🎧'}</div><div class="genre-fx"><i></i><i></i><i></i></div></div><div class="genre-copy"><b>${esc(g)}</b><span>${ok?moods[i%moods.length]:'belum ada lagu • akan dialihkan'}</span></div></button>`;}).join('')}</div>
    <button class="btn ghost block surprise-btn" id="surprise" ${playable.length?'':'disabled'}><span class="surprise-dice">🎲</span><span>Surprise Me</span><span class="surprise-spark">✦</span></button>
    ${playable.length?'':`<div class="notice warning"><b>Playlist untuk ${esc(occasionDisplayLabel())} belum terbaca.</b><br>Cek Admin → Musik: pastikan lagu aktif dan scope-nya cocok. Untuk event selain Birthday, sistem juga otomatis mencoba playlist Regular sebagai fallback.</div>`}
  </section></main>`;

  setTimeout(()=>tryLobbyAutoplay(),60);

  $$('.genre-card').forEach(b=>{
    b.onpointerenter=()=>b.classList.add('peek');
    b.onpointerleave=()=>b.classList.remove('peek');
    b.onclick=async()=>{
      const requested=b.dataset.g;
      const actual=ensurePlayableGenre(requested);
      if(!actual) return;
      await unlockAudio();
      warmAudioBackend();
      state.playSource='browse';
      renderGenreSongs(actual,{redirectedFrom:actual!==requested?requested:null});
    };
  });

  $('#surprise').onclick=async()=>{
    if(!playable.length) return;
    await unlockAudio();
    warmAudioBackend();
    state.playSource='gacha';
    renderSurprisePick(playable);
  };
}


function genreSongPool(genre){
  const all=eligibleSongs().filter(s=>String(s.genre||'').trim()===genre);
  const exact=all.filter(s=>songScope(s)===occasionId());
  return exact.length?exact:all;
}

function renderGenreSongs(genre,{redirectedFrom=null}={}){
  setLobbyWanted(true);
  state.selectedGenre=genre;
  state.playSource='browse';
  const songs=genreSongPool(genre);
  const slug=genreSlug(genre);
  const vibe={
    Pop:'bright, catchy, gampang nempel',
    Chill:'slow, cozy, buat santai',
    'R&B':'smooth, warm, sedikit dramatis',
    Indie:'fresh, personal, artsy',
    Jazz:'classy, warm, café-night',
    'Lo-fi':'calm, dreamy, tenggelam sebentar',
    Rock:'bold, energetic, berani',
    Electronic:'neon, pulse, futuristic'
  }[genre]||'soundtrack pilihan buat vibe kamu';

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page song-browser song-browser-${esc(slug)}">${topbar()}
    <div class="song-browser-ambient"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="song-browser-head">
      <button class="icon-btn" id="songBrowserBack">←</button>
      <div class="song-browser-icon">${genreIcons[genre]||'🎧'}</div>
      <div>
        <small>${esc(occasionBadge())}</small>
        <h1>${esc(genre)}</h1>
        <p>${esc(vibe)}</p>
      </div>
    </div>

    ${redirectedFrom?`<div class="notice song-browser-redirect">${esc(redirectedFrom)} belum punya lagu aktif, jadi Meong pindahin kamu ke ${esc(genre)} ✨</div>`:''}

    <div class="song-browser-count"><span>${songs.length} lagu tersedia</span><span>tap lagu buat langsung play</span></div>

    <div class="song-list-aesthetic">
      ${songs.map((s,i)=>{
        const info=rarityInfo(s.rarity||'Common');
        return `<button class="song-pick-card rarity-card-${String(s.rarity||'Common').toLowerCase()}" data-song="${esc(s.id||'')}">
          <div class="song-pick-index">${String(i+1).padStart(2,'0')}</div>
          <div class="song-pick-disc"><span>♫</span></div>
          <div class="song-pick-copy">
            <small>${esc(info.label)} • ${esc(genre)}</small>
            <b>${esc(s.title||'Untitled')}</b>
            <span>${esc(s.artist||'Unknown Artist')}</span>
          </div>
          <div class="song-pick-action">▶</div>
          <div class="song-pick-glow"></div>
        </button>`;
      }).join('')||'<div class="empty-list">Belum ada lagu di genre ini.</div>'}
    </div>

    <button class="btn ghost block song-browser-surprise" id="songBrowserSurprise">🎲 Masih bingung? Surprise Me</button>
  </section></main>`;

  setTimeout(()=>tryLobbyAutoplay(),60);

  $('#songBrowserBack').onclick=renderGenres;
  $('#songBrowserSurprise').onclick=async()=>{
    await unlockAudio();
    warmAudioBackend();
    state.playSource='gacha';
    renderSurprisePick(availableGenres());
  };

  $$('.song-pick-card').forEach(card=>{
    card.onclick=async()=>{
      const song=songs.find(s=>String(s.id||'')===card.dataset.song);
      if(!song) return;
      state.playSource='browse';
      state.selectedSong=song;
      state.selectedGenre=song.genre||genre;
      stopCameraStream();
      stopMusic(true);
      state.audioKey='';
      state.playEventKey='';
      const flowToken=++gachaFlowToken;

      card.classList.add('is-selecting');
      const prepared=loadSongIntoPlayer(song);

      await showDirectSongTransition(song);
      if(flowToken!==gachaFlowToken || state.selectedSong!==song) return;

      const playPromise=playPreparedSong(prepared,song,flowToken);
      renderPlayer(false,{playPromise,isLoading:true});
    };
  });
}

async function showDirectSongTransition(song){
  stopLobbyAmbient({fade:true});
  playUiSfx('select');
  const genre=song.genre||state.selectedGenre||'Music';
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page direct-song-transition">${topbar()}
    <div class="direct-transition-orbit"><i>♪</i><i>♫</i><i>✦</i><i>♪</i></div>
    <div class="direct-transition-disc"><span>▶</span></div>
    <small>PILIHAN KAMU</small>
    <h1>${esc(song.title||'Soundtrack')}</h1>
    <p>${esc(song.artist||'Unknown Artist')}</p>
    <div class="direct-transition-chip">${esc(genre)} • ${esc(song.rarity||'Common')}</div>
    <div class="direct-transition-line"><i></i></div>
  </section></main>`;
  await sleep(620);
}

async function renderSurprisePick(genres){
  stopLobbyAmbient({fade:true});
  playUiSfx('gacha');
  const playable=(genres||[]).filter(g=>availableGenres().includes(g));
  const pool=playable.length?playable:availableGenres();
  if(!pool.length) return renderGenres();

  const finalGenre=chooseGachaGenre(pool);
  state.selectedGenre=finalGenre;
  stopCameraStream();
  stopMusic(true);
  state.audioKey=''; state.playEventKey='';
  state.selectedSong=chooseSong();
  event('gacha',state.campaign.id);
  // Mulai download sejak roulette Surprise Me berjalan.
  const preparedAudio=loadSongIntoPlayer(state.selectedSong);

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page center surprise-page ${isBirthday()?'birthday-surprise-page':''}">${topbar()}
    <div class="page-head"><div class="eyebrow">${isBirthday()?'🎂 BIRTHDAY SURPRISE':'SURPRISE MODE'}</div><h1>${isBirthday()?`Acak birthday vibe ${esc(birthdayName())}…`:'Acak mood kamu…'}</h1><p>${isBirthday()?'Meong lagi nyari soundtrack kejutan buat birthday ini.':'Genre lagi di-shuffle. Roulette cuma memakai genre yang punya lagu aktif.'}</p></div>
    <div class="surprise-machine"><div class="surprise-orbit"><span>♪</span><span>✦</span><span>♫</span><span>★</span></div><div class="surprise-fireflies"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="surprise-slot"><span id="surpriseGenre">${esc(rand(pool))}</span></div><div class="surprise-confetti"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="shuffle-buddy"><div class="shuffle-buddy-notes"><span style="--x:0px;--y:-26px;--d:0s">♪</span><span style="--x:22px;--y:-60px;--d:.3s">♫</span><span style="--x:148px;--y:-54px;--d:.7s">✦</span><span style="--x:172px;--y:-12px;--d:1.1s">♬</span><span style="--x:84px;--y:-82px;--d:1.4s">♪</span><span style="--x:112px;--y:-34px;--d:1.8s">♫</span></div><div class="shuffle-cat">🐱</div><div class="shuffle-bubble" id="shuffleBubble">DJ Meong lagi milihin vibe yang punya lagu…</div></div>
    <div class="surprise-status" id="surpriseStatus">shuffling playable genres…</div>
    <button class="btn ghost surprise-rescue" id="surpriseRescue" type="button" hidden>Lanjutkan →</button>
  </section></main>`;

  const slot=$('#surpriseGenre');
  const bubble=$('#shuffleBubble');
  const bubbleText=['DJ Meong lagi milihin vibe yang punya lagu…','Genre kosong otomatis dilewatin 🎶','Tenang, genre yang berhenti pasti punya soundtrack ✨','Genre terakhir juga dihindari biar nggak muter di vibe yang sama 😼'];
  let bubbleIdx=0;
  const visualPool=pool.length>1 && state.lastGachaGenre
    ? [...pool.filter(g=>g!==finalGenre),finalGenre]
    : pool;
  const timer=setInterval(()=>{ if(slot) slot.textContent=rand(visualPool)||finalGenre; }, 220);
  const bubbleTimer=setInterval(()=>{ bubbleIdx=(bubbleIdx+1)%bubbleText.length; if(bubble) bubble.textContent=bubbleText[bubbleIdx]; }, 1200);
  await sleep(1500);
  clearInterval(timer); clearInterval(bubbleTimer);
  if(slot) slot.textContent=finalGenre;
  if(bubble) bubble.textContent=`Sip, ${finalGenre} punya lagu dan kepilih 😼`;
  const st=$('#surpriseStatus');
  if(st) st.textContent=`✦ ${finalGenre} dipilih • next gacha akan cari vibe lain`;

  const rescue=$('#surpriseRescue');
  if(rescue){
    rescue.hidden=false;
    rescue.onclick=async()=>{
      rescue.disabled=true;
      rescue.textContent='Melanjutkan…';
      try{
        await renderGacha({preparedAudio,showRoll:false});
      }catch(e){
        renderGenres();
      }
    };
  }

  await sleep(620);
  try{
    await renderGacha({preparedAudio,showRoll:false});
  }catch(e){
    console.error('Surprise handoff failed',e);
    toast('Transisi gacha gagal. Balik ke genre.');
    setTimeout(()=>renderGenres(),250);
  }
}

function songScope(song){
  // Kompatibilitas library lama / variasi value yang pernah dipakai versi sebelumnya.
  const raw=String(song?.scope||'all').trim().toLowerCase();
  const aliases={
    'public':'regular',
    'regular only':'regular',
    'regular_only':'regular',
    'birthday only':'birthday',
    'birthday_only':'birthday',
    'all occasion':'all',
    'all occasions':'all',
    'semua':'all'
  };
  return aliases[raw]||raw||'all';
}
function songsForCurrentOccasion(){
  const all=state.songs.filter(s=>s.active!==false);
  const occ=occasionId();

  // Regular dan Birthday tetap dipisah ketat supaya lagu birthday tidak bocor
  // ke customer biasa dan sebaliknya.
  if(occ==='regular'){
    return all.filter(s=>['regular','all'].includes(songScope(s)));
  }
  if(occ==='birthday'){
    return all.filter(s=>['birthday','all'].includes(songScope(s)));
  }

  // Wedding/Graduation/hari raya: prioritaskan pool khusus occasion + All.
  const exact=all.filter(s=>songScope(s)===occ || songScope(s)==='all');
  if(exact.length) return exact;

  // Kalau admin belum membuat lagu khusus event itu, fallback ke playlist Regular.
  // Ini mencegah semua genre mendadak kosong seperti bug versi sebelumnya.
  return all.filter(s=>['regular','all'].includes(songScope(s)));
}
function songAllowedForOccasion(song){
  return songsForCurrentOccasion().some(s=>s.id===song.id);
}



function rememberGachaGenre(genre){
  const g=String(genre||'').trim();
  if(!g) return;
  state.lastGachaGenre=g;
  state.gachaGenreHistory=Array.isArray(state.gachaGenreHistory)?state.gachaGenreHistory:[];
  state.gachaGenreHistory=state.gachaGenreHistory.filter(x=>x!==g);
  state.gachaGenreHistory.push(g);
  if(state.gachaGenreHistory.length>4){
    state.gachaGenreHistory=state.gachaGenreHistory.slice(-4);
  }
}

function genreHasFreshSong(genre){
  const songs=eligibleSongs().filter(s=>String(s.genre||'').trim()===genre);
  if(!songs.length) return false;

  const exact=songs.filter(s=>songScope(s)===occasionId());
  const pool=exact.length?exact:songs;
  const recent=new Set(Array.isArray(state.gachaHistory)?state.gachaHistory:[]);

  return pool.some(s=>!recent.has(gachaSongKey(s)));
}

function chooseGachaGenre(inputGenres=availableGenres()){
  const base=[...new Set((inputGenres||[]).filter(Boolean))];
  if(!base.length) return '';
  if(base.length===1){
    rememberGachaGenre(base[0]);
    return base[0];
  }

  // Rule #1: never repeat the immediately previous genre if another genre exists.
  let pool=state.lastGachaGenre
    ? base.filter(g=>g!==state.lastGachaGenre)
    : [...base];

  if(!pool.length) pool=[...base];

  // Rule #2: prefer a genre that still has a song not seen in recent gacha history.
  const fresh=pool.filter(genreHasFreshSong);
  if(fresh.length) pool=fresh;

  // Rule #3: with enough genres, also avoid the short recent genre history.
  if(base.length>=3){
    const recentGenres=new Set(Array.isArray(state.gachaGenreHistory)?state.gachaGenreHistory:[]);
    const lessRecent=pool.filter(g=>!recentGenres.has(g));
    if(lessRecent.length) pool=lessRecent;
  }

  const picked=rand(pool)||pool[0]||base[0];
  rememberGachaGenre(picked);
  return picked;
}

function gachaSongKey(song){
  return String(song?.id || `${song?.title||''}::${song?.artist||''}`);
}
function rememberGachaSong(song){
  if(!song || !song.id) return;
  const key=gachaSongKey(song);
  state.lastGachaSongId=key;
  state.gachaHistory=Array.isArray(state.gachaHistory)?state.gachaHistory:[];
  state.gachaHistory=state.gachaHistory.filter(x=>x!==key);
  state.gachaHistory.push(key);

  // Keep recent results only. This prevents repeat spam without
  // permanently exhausting small genre/occasion pools.
  if(state.gachaHistory.length>8){
    state.gachaHistory=state.gachaHistory.slice(-8);
  }
}
function antiRepeatGachaPool(pool){
  const list=[...(pool||[])];
  if(list.length<=1) return list;

  const recent=new Set(Array.isArray(state.gachaHistory)?state.gachaHistory:[]);
  let filtered=list.filter(s=>!recent.has(gachaSongKey(s)));

  // If history removes the whole pool, reset gracefully but still
  // block the immediately previous result whenever another song exists.
  if(!filtered.length && state.lastGachaSongId){
    filtered=list.filter(s=>gachaSongKey(s)!==state.lastGachaSongId);
  }

  return filtered.length?filtered:list;
}

function chooseSong(){
  const c=state.campaign;

  // Custom song is explicitly forced by Admin, so anti-repeat doesn't override it.
  if(c.mode==='custom' && c.forcedSongId){
    const found=state.songs.find(s=>s.id===c.forcedSongId);
    if(found){
      if(found.genre) state.selectedGenre=found.genre;
      return found;
    }
  }

  const genre=ensurePlayableGenre(state.selectedGenre);
  const active=eligibleSongs();
  let pool=genre ? active.filter(s=>s.genre===genre) : [];

  // Prioritize exact occasion songs when available.
  if(pool.length){
    const exactOccasion=pool.filter(s=>songScope(s)===occasionId());
    if(exactOccasion.length) pool=exactOccasion;
  }

  // Never immediately give the same song again if another choice exists.
  // Also avoids recent gacha results for a short session history.
  pool=antiRepeatGachaPool(pool);

  const picked=randomWeightedSong(pool);
  if(picked){
    state.selectedGenre=picked.genre||genre;
    rememberGachaSong(picked);
    return picked;
  }

  return {
    title:'Belum ada lagu',
    artist:`Belum ada musik ${occasionDisplayLabel()}/All yang aktif`,
    genre:genre||state.selectedGenre,
    rarity:'Common'
  };
}


async function showGachaRoll({redirectedFrom=null}={}){
  stopLobbyAmbient({fade:true});
  playUiSfx('gacha');

  const playable=availableGenres();
  if(!playable.length) return false;

  const finalGenre=ensurePlayableGenre(state.selectedGenre);
  const bag=playable.length>1
    ? playable.filter(g=>g!==finalGenre).concat(finalGenre)
    : playable;
  const bubbleText=[
    redirectedFrom ? `${redirectedFrom} belum punya lagu, Meong alihin ke genre yang tersedia 😼` : 'DJ Meong lagi ngocok kaset buat nyari soundtrack baru…',
    'Genre kosong nggak bakal jadi hasil akhir 🎶',
    'Hasil akhirnya cuma genre yang punya lagu aktif ✦',
    'Genre dan lagu terakhir sama-sama dihindari kalau ada pilihan lain 👀'
  ];

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page center surprise-page regacha-roll-page ${isBirthday()?'birthday-surprise-page':''}">${topbar()}
    <div class="page-head">
      <div class="eyebrow">${isBirthday()?'🎂 BIRTHDAY RE-GACHA':'GACHA LAGI'}</div>
      <h1>${redirectedFrom?'Cari genre yang tersedia…':(isBirthday()?'Ngacak ulang soundtrack birthday…':'Ngacak ulang soundtrack…')}</h1>
      <p>${redirectedFrom?`${esc(redirectedFrom)} belum punya lagu aktif. Roulette bakal berhenti di genre yang punya musik.`:(isBirthday()?'Meong lagi nyari lagu ulang tahun lain yang lebih ngena.':'Gacha ulang bakal pindah vibe dulu kalau masih ada genre lain.')}</p>
    </div>
    <div class="surprise-machine">
      <div class="surprise-orbit"><span>♪</span><span>✦</span><span>♫</span><span>★</span></div>
      <div class="surprise-fireflies"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="surprise-slot"><span id="regachaGenre">${esc(rand(bag)||finalGenre||'Music')}</span></div>
      <div class="surprise-confetti"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="shuffle-buddy">
      <div class="shuffle-buddy-notes">
        <span style="--x:0px;--y:-26px;--d:0s">♪</span>
        <span style="--x:22px;--y:-60px;--d:.3s">♫</span>
        <span style="--x:148px;--y:-54px;--d:.7s">✦</span>
        <span style="--x:172px;--y:-12px;--d:1.1s">♬</span>
        <span style="--x:84px;--y:-82px;--d:1.4s">♪</span>
        <span style="--x:112px;--y:-34px;--d:1.8s">♫</span>
      </div>
      <div class="shuffle-cat">🐱</div>
      <div class="shuffle-bubble" id="regachaBubble">${bubbleText[0]}</div>
    </div>
    <div class="surprise-status" id="regachaStatus">checking available music…</div>
  </section></main>`;

  const slot=$('#regachaGenre');
  const bubble=$('#regachaBubble');
  let bubbleIdx=0;

  const timer=setInterval(()=>{
    if(slot) slot.textContent=rand(bag)||finalGenre||'Music';
  },160);

  const bubbleTimer=setInterval(()=>{
    bubbleIdx=(bubbleIdx+1)%bubbleText.length;
    if(bubble) bubble.textContent=bubbleText[bubbleIdx];
  },950);

  await sleep(1180);
  clearInterval(timer);
  clearInterval(bubbleTimer);

  if(slot) slot.textContent=finalGenre || rand(bag) || 'Music';
  if(bubble) bubble.textContent=`Sip, berhenti di ${finalGenre} — ada musiknya 😼`;
  const st=$('#regachaStatus');
  if(st) st.textContent=`✦ ${finalGenre} siap digacha…`;

  await sleep(420);
  return true;
}

async function renderGacha({preparedAudio=null,showRoll=true,redirectedFrom=null}={}){
  const flowToken=++gachaFlowToken;
  const preparedSong=preparedAudio ? state.selectedSong : null;

  try{
    if(!preparedAudio){
      stopCameraStream();
      stopMusic(true);
      stopLobbyAmbient({fade:true});
      state.audioKey='';
      state.playEventKey='';

      const before=state.selectedGenre;
      const playable=availableGenres();

      if(!playable.length){
        toast('Belum ada genre dengan lagu aktif.');
        return renderGenres();
      }

      // Re-gacha means re-roll the genre too, not just the song.
      // If another genre exists, the immediately previous genre is excluded.
      const actual=showRoll ? chooseGachaGenre(playable) : ensurePlayableGenre(before);
      state.selectedGenre=actual;

      if(!redirectedFrom && before && before!==actual) redirectedFrom=before;

      if(showRoll){
        const ok=await showGachaRoll({redirectedFrom:null});
        if(!ok || flowToken!==gachaFlowToken) return;
      }

      state.selectedSong=chooseSong();

      if(!state.selectedSong || state.selectedSong.title==='Belum ada lagu'){
        toast('Lagu aktif tidak ditemukan. Balik ke genre.');
        return renderGenres();
      }

      if(state.selectedSong?.genre) state.selectedGenre=state.selectedSong.genre;

      event('gacha',state.campaign.id);
      preparedAudio=loadSongIntoPlayer(state.selectedSong);
    }

    const expectedSong=preparedSong || state.selectedSong;
    if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong) return;

    let advanced=false;
    const watchdog=setTimeout(()=>{
      if(advanced || flowToken!==gachaFlowToken || expectedSong!==state.selectedSong) return;
      advanced=true;
      const playPromise=playPreparedSong(preparedAudio,expectedSong,flowToken);
      renderPlayer(false,{playPromise,isLoading:true});
    },6500);

    await showRarityReveal();

    if(advanced) return;
    if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong) return;

    advanced=true;
    clearTimeout(watchdog);

    const playPromise=playPreparedSong(preparedAudio,expectedSong,flowToken);
    renderPlayer(false,{playPromise,isLoading:true});
  }catch(e){
    console.error('Gacha flow failed',e);
    if(flowToken!==gachaFlowToken) return;
    toast('Gacha error. Balik ke genre biar nggak mentok.');
    setTimeout(()=>renderGenres(),250);
  }
}

async function resolveSongAudio(song){
  if(!song) return '';
  const key=songKey(song);
  if(audioSrcCache.has(key)) return audioSrcCache.get(key);

  if(song.audioSource==='rtdb' && song.audioRef){
    if(!rtdbConfigured || !rtdb) throw new Error('Realtime Database belum dikonfigurasi.');
    await warmAudioBackend();
    const snap=await rtdbGet(dbRef(rtdb,`audio/${song.audioRef}`));
    if(!snap.exists()) throw new Error('File audio tidak ditemukan.');

    const a=snap.val();
    const src=`data:${a.mime||'audio/mpeg'};base64,${a.data}`;
    return cacheAudioSrc(key,src);
  }

  return cacheAudioSrc(key,song.audioUrl || song.audio || '');
}

function rarityClass(r='Common'){
  return `rarity-${String(r).toLowerCase()}`;
}


function rarityInfo(r='Common'){
  const map={
    Common:{label:'COMMON',headline:'Soundtrack ditemukan!',rank:0,icon:'♪',wait:720},
    Uncommon:{label:'UNCOMMON',headline:'Nice pull!',rank:1,icon:'✦',wait:1050},
    Rare:{label:'RARE',headline:'SELAMAT! Kamu dapet lagu Rare!',rank:2,icon:'★',wait:1800},
    Epic:{label:'SUPER RARE',headline:'WOAH! SUPER RARE DROP!',rank:3,icon:'✹',wait:2200},
    Legendary:{label:'LEGENDARY',headline:'LEGENDARY SOUNDTRACK!',rank:4,icon:'♛',wait:2600}
  };
  return map[r]||map.Common;
}
async function playPreparedSong(preparePromise, expectedSong=state.selectedSong, flowToken=gachaFlowToken){
  const expectedKey=songKey(expectedSong);
  try{
    const src=await preparePromise;
    if(!src) return {ok:false,message:'Request lagu lama dibatalkan'};

    if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong || state.audioKey!==expectedKey){
      return {ok:false,message:'Gacha lama dibatalkan'};
    }

    await musicPlayer.play();

    if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong || state.audioKey!==expectedKey){
      musicPlayer.pause();
      return {ok:false,message:'Gacha lama dibatalkan'};
    }

    if(state.playEventKey!==expectedKey){
      event('play',state.campaign?.id);
      state.playEventKey=expectedKey;
    }
    return {ok:true,message:'Now playing'};
  }catch(e){
    return {ok:false,message:e?.name==='NotAllowedError'?'Tap ▶ sekali untuk mulai':'Audio gagal dimuat'};
  }
}
async function showRarityReveal(){
  stopLobbyAmbient({fade:true});
  playUiSfx('reveal');
  const s=state.selectedSong||{};
  const info=rarityInfo(s.rarity||'Common');
  const confetti=Array.from({length:info.rank>=2?24:8},(_,i)=>`<i style="--i:${i}"></i>`).join('');
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page center rarity-reveal-page">${topbar()}
    <div class="rarity-reveal rarity-reveal-${String(s.rarity||'Common').toLowerCase()} rank-${info.rank}">
      <div class="rarity-rays"></div>
      <div class="rarity-confetti">${confetti}</div>
      <div class="rarity-orb"><span>${info.icon}</span></div>
      <div class="rarity-kicker">${info.label}</div>
      <h1>${esc(info.headline)}</h1>
      <div class="rarity-song-card">
        <div class="rarity-song-disc"></div>
        <div><b>${esc(s.title||'Mystery Track')}</b><span>${esc(s.artist||'Unknown Artist')}</span><small>${esc(s.genre||state.selectedGenre||'Music')}</small></div>
      </div>
      ${info.rank>=2?`<div class="rarity-congrats">✦ hoki kamu lagi bagus nih ✦</div>`:`<div class="rarity-congrats">soundtrack kamu siap dibuka</div>`}
      ${isBirthday()?`<div class="birthday-rarity-note">🎂 Birthday pull buat ${esc(birthdayName())}</div>`:''}
    </div>
  </section></main>`;
  await sleep(info.wait);
}
async function revealThenOpenPlayer(preparePromise, flowToken=gachaFlowToken, expectedSong=state.selectedSong){
  await showRarityReveal();
  if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong) return;
  const playPromise=playPreparedSong(preparePromise, expectedSong, flowToken);
  if(flowToken!==gachaFlowToken || expectedSong!==state.selectedSong) return;
  renderPlayer(false,{playPromise,isLoading:true});
}
function meongFormat(text=''){
  const s=state.selectedSong||{};
  const brand=(state.brand.brandName||defaultBrand.brandName||'brand ini').trim();
  const song=s.title||'lagu ini';
  const genre=s.genre||state.selectedGenre||'musik';
  const name=birthdayName();
  const age=birthdayAge()||'umur baru';
  return String(text)
    .replaceAll('{brand}',brand)
    .replaceAll('{song}',song)
    .replaceAll('{genre}',genre)
    .replaceAll('{name}',name)
    .replaceAll('{age}',age);
}
function companionLoadingMessages(){
  const s=state.selectedSong||{};
  const genre=s.genre||state.selectedGenre||'musik';
  return [
    `Soundtrack ${genre} kamu lagi disiapin…`,
    'Meong DJ lagi muterin kasetnya, bentar lagi bunyi 🎵',
    'Sambil nunggu, siapin pose buat Tangkap Momenmu 📷',
    'Musiknya bakal tetap nemenin sampai studio foto ✨',
    s.title ? `Pilihan kali ini: ${s.title}` : 'Setiap minuman punya soundtrack-nya sendiri.',
    'Kalau loading lama, main sama Meong DJ dulu 😼'
  ];
}
function companionPlayingMessages(){
  if(isBirthday()){
    const source=state.brand.birthdayMeongLines||defaultBrand.birthdayMeongLines;
    const configured=Array.isArray(source) ? source.filter(x=>String(x||'').trim()) : [];
    const base=configured.length ? configured : defaultBrand.birthdayMeongLines;
    const reminder=String(state.brand.meongReturnLine||defaultBrand.meongReturnLine||'').trim();
    return [...base.map(meongFormat), ...(reminder?[meongFormat(reminder)]:[])];
  }

  const genreKey=(state.selectedSong?.genre||state.selectedGenre||'').trim();
  const genreBase=(defaultGenreMeongLines[genreKey]||defaultGenreMeongLines.default||[]).filter(x=>String(x||'').trim()).map(meongFormat);

  const source=state.brand.meongPlayingLines||defaultBrand.meongPlayingLines;
  const configured=Array.isArray(source) ? source.filter(x=>String(x||'').trim()).map(meongFormat) : [];
  const generic=configured.length ? configured : (defaultBrand.meongPlayingLines||[]).map(meongFormat);

  const reminder=String(state.brand.meongReturnLine||defaultBrand.meongReturnLine||'').trim();
  return [...new Set([...genreBase, ...generic, ...(reminder?[meongFormat(reminder)]:[])])];
}
function bindPlayerCompanion(){
  const text=$('#companionText');
  if(!text) return ()=>{};
  let timer=null, i=0, mode='loading';
  const messages=()=> mode==='playing' ? companionPlayingMessages() : mode==='paused' ? [meongFormat(state.brand.meongPausedLine||defaultBrand.meongPausedLine)] : companionLoadingMessages();
  const paint=(reset=false)=>{
    const msgs=messages(); if(!msgs.length) return;
    if(reset)i=0; else i=(i+1)%msgs.length;
    text.classList.remove('companion-pop'); void text.offsetWidth;
    text.textContent=msgs[i]; text.classList.add('companion-pop');
  };
  const schedule=()=>{ if(timer)clearInterval(timer); timer=setInterval(()=>{ if(!document.body.contains(text)){clearInterval(timer);return;} paint(false); },6200); };
  const setMode=(next)=>{ mode=next; paint(true); schedule(); };
  const onPlay=()=>setMode('playing');
  const onPause=()=>{ if(!musicPlayer.ended)setMode('paused'); };
  const onWaiting=()=>setMode('loading');
  const onEnded=()=>{ if(timer)clearInterval(timer); };
  musicPlayer.addEventListener('play',onPlay);
  musicPlayer.addEventListener('pause',onPause);
  musicPlayer.addEventListener('waiting',onWaiting);
  musicPlayer.addEventListener('ended',onEnded);
  setMode(!musicPlayer.paused && !musicPlayer.ended ? 'playing' : (musicPlayer.readyState<3?'loading':'paused'));
  const cleanup=()=>{
    if(timer)clearInterval(timer);
    musicPlayer.removeEventListener('play',onPlay);
    musicPlayer.removeEventListener('pause',onPause);
    musicPlayer.removeEventListener('waiting',onWaiting);
    musicPlayer.removeEventListener('ended',onEnded);
  };
  cleanup.setMode=setMode;
  return cleanup;
}
function bindLoadingPlayground(){
  const panel=$('#loadingPlayground'), stage=$('#catStage'), cat=$('#djCat'), msg=$('#catMessage'), scoreEl=$('#catScore');
  if(!panel||!stage||!cat) return {show:()=>{},finish:()=>{},cleanup:()=>{}};
  let score=0;
  const lines=['Meong! dapet not 🎵','Paw combo! ฅ','DJ Meong approve 😼','Satu lagi! ✦','Bentar lagi lagunya nyala…'];
  const bump=(points=1,target=null)=>{
    score+=points; if(scoreEl)scoreEl.textContent=score;
    cat.classList.remove('cat-boop'); void cat.offsetWidth; cat.classList.add('cat-boop');
    if(target){ target.classList.remove('note-pop'); void target.offsetWidth; target.classList.add('note-pop'); }
    if(msg)msg.textContent=rand(lines);
  };
  cat.onclick=()=>bump(1,cat);
  $$('.cat-note',panel).forEach(n=>n.onclick=()=>{
    bump(Number(n.dataset.note||1),n);
    n.style.setProperty('--rx',`${Math.floor(Math.random()*75)+8}%`);
    n.style.setProperty('--ry',`${Math.floor(Math.random()*55)+10}%`);
    n.classList.add('randomized');
  });
  return {
    show(){
      panel.classList.remove('is-hidden','is-done');
      panel.classList.add('is-live');
      if(msg && !score) msg.textContent='Tap not musik atau elus si meong sambil nunggu.';
    },
    finish(){
      if(msg)msg.textContent=`Lagunya siap! Meong DJ ngumpulin ${score} not ♪`;
      panel.classList.remove('is-live');
      panel.classList.add('is-done');
      setTimeout(()=>panel.classList.add('is-hidden'),1800);
    },
    cleanup(){
      panel.classList.remove('is-live','is-done');
      panel.classList.add('is-hidden');
    }
  };
}
function syncPlayerVisuals(statusText=null){
  const shell=$('#playerExperience');
  if(shell){
    shell.classList.toggle('is-playing',!musicPlayer.paused);
    shell.classList.toggle('is-paused',musicPlayer.paused);
    shell.classList.toggle('is-buffering',musicPlayer.readyState<3 && musicPlayer.paused);
  }
  playerUiState();
  const stage=$('#playerStage');
  if(stage && statusText) stage.textContent=statusText;
}
function renderPlayer(autoStart=false,{playPromise=null,isLoading=false}={}){
  const s=state.selectedSong;
  const loading=isLoading || (musicPlayer.paused && musicPlayer.readyState<3);
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page player-page">${topbar()}
    <div id="playerExperience" class="music-card music-card-v25 ${musicPlayer.paused?'is-paused':'is-playing'} ${loading?'is-buffering':''}">
      <div class="player-visual">
        <div class="player-glow"></div>
        <div class="player-vinyl ${musicPlayer.paused?'':'spin-slow'}"><div class="vinyl-label">${esc(state.brand.brandName)}</div></div>
        <div class="player-cassette">
          <div class="pc-window"></div>
          <div class="pc-reel left"></div><div class="pc-reel right"></div>
          <div class="pc-tape"></div>
          <div class="pc-label">${esc(s.genre||state.selectedGenre||'MUSIC')}</div>
          <div class="pc-face">˙ᴗ˙</div>
        </div>
        <div class="player-eq" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
        <div class="player-now"><span>${loading?'PREPARING':'NOW PLAYING'}</span><b>${esc(state.brand.caption)}</b></div>
      </div>
      <div class="song-copy song-copy-v25">
        <div class="rarity ${rarityClass(s.rarity)}">✦ ${esc(s.rarity||'Common')}</div>
        <h1>${esc(s.title)}</h1><p>${esc(s.artist||'Unknown Artist')}</p>
        <div class="chips"><span>${esc(s.genre||state.selectedGenre||'Music')}</span><span id="playerStage">${loading?'Menyiapkan audio…':'Soundtrack siap'}</span></div>
        <div class="companion-card"><div class="companion-avatar">🐱</div><div><small>Teman soundtrack</small><b id="companionText">Meong DJ lagi nyari vibe kamu…</b></div></div>
        <div id="loadingPlayground" class="loading-playground is-hidden">
          <div class="loading-play-head"><div><small>MASIH LOADING?</small><b>Main sama Meong DJ dulu 😼</b></div><div class="cat-score"><span id="catScore">0</span> ♪</div></div>
          <div class="cat-stage" id="catStage">
            <button class="dj-cat" id="djCat" type="button" aria-label="Tap Meong DJ"><span class="cat-ear left"></span><span class="cat-ear right"></span><span class="cat-face">•ᴗ•</span><span class="cat-paw">ฅ</span></button>
            <button class="cat-note n1" data-note="1" type="button">♪</button>
            <button class="cat-note n2" data-note="1" type="button">♫</button>
            <button class="cat-note n3" data-note="2" type="button">✦</button>
            <div class="cat-floor"></div>
          </div>
          <div id="catMessage" class="cat-message">Tap not musik atau elus si meong sambil nunggu.</div>
        </div>
        <button class="play-main" id="play" aria-label="Play pause"><span>${musicPlayer.paused?'▶':'❚❚'}</span></button>
        <div id="playStatus" class="tiny">${loading?'Musik loading… player tetap bisa dipakai':'Now playing'}</div>
        <div id="trackEndedPrompt" class="track-ended-card is-hidden">
          <div class="track-ended-cat">🐱</div>
          <div class="track-ended-copy"><small>MEONG DJ</small><b>Lagunya udah beres nih 😼</b><span>${state.playSource==='browse'?'Mau puter lagi atau pilih lagu lain di genre ini?':'Mau puter sekali lagi atau gacha lagu baru?'}</span></div>
          <div class="track-ended-actions"><button class="btn primary" id="endedReplay">↻ Putar lagi</button><button class="btn ghost" id="endedGacha">${state.playSource==='browse'?'🎵 Pilih lagu lain':'🎲 Gacha lagi'}</button><button class="btn ghost ended-camera" id="endedCamera">📷 Tangkap Momenmu</button></div>
        </div>
        <div class="player-actions" id="normalPlayerActions"><button class="btn primary block" id="camera">📷 Tangkap Momenmu</button><button class="btn ghost block" id="again">${state.playSource==='browse'?'🎵 Pilih lagu lain':'🎲 Gacha lagi'}</button></div>
      </div>
    </div>
  </section></main>`;

  const stopCompanion=bindPlayerCompanion();
  const catGame=bindLoadingPlayground();
  let catDelay=null;

  // Important for re-gacha:
  // musicPlayer.readyState can still reflect the PREVIOUS song while the new RTDB
  // audio is resolving. That made the Meong loading game disappear on 2nd gacha.
  // If this player was explicitly rendered as loading, trust that flow state.
  if(loading){
    catDelay=setTimeout(()=>{
      if(musicPlayer.paused || isLoading) catGame.show();
    },1200);
  }
  const sync=()=>syncPlayerVisuals();
  const endedPrompt=$('#trackEndedPrompt');
  const onEnded=()=>{
    if(catDelay) clearTimeout(catDelay);
    catGame.cleanup();
    const shell=$('#playerExperience');
    if(shell){ shell.classList.remove('is-playing','is-buffering'); shell.classList.add('is-paused','is-ended'); }
    if(endedPrompt) endedPrompt.classList.remove('is-hidden');
    $('#normalPlayerActions')?.classList.add('is-hidden');
    $('.companion-card')?.classList.add('is-hidden');
    $('#play')?.classList.add('ended-main-hidden');
    $('#playStatus')?.classList.add('is-hidden');
    const friend=$('#companionText'); if(friend) friend.textContent='Selesai ✨ Mau nostalgia sekali lagi atau cari lagu baru?';
    const stage=$('#playerStage'); if(stage) stage.textContent='Lagu selesai';
    const now=$('.player-now span'); if(now) now.textContent='FINISHED';
    const status=$('#playStatus'); if(status) status.textContent='Lagu selesai — Meong DJ nunggu pilihanmu 😼';
    playerUiState();
  };
  musicPlayer.addEventListener('ended',onEnded);
  const cleanup=()=>{
    stopCompanion();
    if(catDelay)clearTimeout(catDelay);
    catGame.cleanup();
    musicPlayer.removeEventListener('ended',onEnded);
  };
  musicPlayer.addEventListener('play',()=>{sync();if(catDelay)clearTimeout(catDelay);catGame.finish();const shell=$('#playerExperience');if(shell)shell.classList.remove('is-ended');if(endedPrompt)endedPrompt.classList.add('is-hidden');$('#normalPlayerActions')?.classList.remove('is-hidden');$('.companion-card')?.classList.remove('is-hidden');$('#play')?.classList.remove('ended-main-hidden');$('#playStatus')?.classList.remove('is-hidden');},{once:true});
  musicPlayer.addEventListener('pause',sync,{once:true});
  musicPlayer.addEventListener('waiting',()=>{
    syncPlayerVisuals('Buffering audio…');
    catGame.show();
  },{once:true});
  musicPlayer.addEventListener('canplay',()=>syncPlayerVisuals('Audio siap…'),{once:true});

  $('#play').onclick=async()=>{
    if(musicPlayer.ended){ try{musicPlayer.currentTime=0;}catch{} }
    const result=await toggleMusic();
    syncPlayerVisuals(result?.message);
    const status=$('#playStatus'); if(status&&result)status.textContent=result.message;
  };
  $('#camera').onclick=()=>{cleanup();openCameraPrivacyNotice();};
  $('#again').onclick=()=>{
    cleanup();stopCameraStream();
    if(state.playSource==='browse'){stopMusic(true);renderGenreSongs(state.selectedGenre);}
    else renderGacha();
  };
  $('#endedReplay').onclick=async()=>{
    if(endedPrompt) endedPrompt.classList.add('is-hidden');
    const shell=$('#playerExperience'); if(shell)shell.classList.remove('is-ended');
    $('#normalPlayerActions')?.classList.remove('is-hidden');
    $('.companion-card')?.classList.remove('is-hidden');
    $('#play')?.classList.remove('ended-main-hidden');
    $('#playStatus')?.classList.remove('is-hidden');
    try{musicPlayer.currentTime=0;}catch{}
    const result=await playSelectedSong({countEvent:false});
    syncPlayerVisuals(result?.message||'Now playing');
    stopCompanion.setMode?.('playing');
    const friend=$('#companionText'); if(friend && !result?.ok) friend.textContent='Belum bunyi nih… Meong coba jagain kasetnya dulu 😼';
  };
  $('#endedGacha').onclick=()=>{cleanup();stopMusic(true);renderGacha();};
  $('#endedCamera').onclick=()=>{cleanup();openCameraPrivacyNotice();};

  if(playPromise){
    const status=$('#playStatus');
    let softTimer=setTimeout(()=>{if(status && document.body.contains(status) && musicPlayer.paused)status.textContent='Masih download musik… kamu bisa lihat-lihat dulu ✨';},2800);
    playPromise.then(result=>{
      clearTimeout(softTimer);
      syncPlayerVisuals(result?.ok?'Soundtrack siap':'Belum bisa play');
      if(result?.ok) stopCompanion.setMode?.('playing');
      const st=$('#playStatus'); if(st)st.textContent=result?.message||'Now playing';
      const now=$('.player-now span'); if(now)now.textContent=result?.ok?'NOW PLAYING':'READY';
    }).catch(()=>{
      clearTimeout(softTimer);
      const st=$('#playStatus');if(st)st.textContent='Audio gagal dimuat';
      syncPlayerVisuals('Coba tap Play');
    });
  } else if(autoStart){
    playSelectedSong().then(r=>{const status=$('#playStatus');if(status)status.textContent=r.message;syncPlayerVisuals(r.message);if(r?.ok)stopCompanion.setMode?.('playing');});
  }
}

function renderTemplateStage(){
  const box=$('#templateStage');
  if(!box) return;
  const current=templateMeta.find(t=>t[0]===state.template) || templateMeta[0];
  const song=state.selectedSong || {};
  box.innerHTML=`<div class="template-stage-card t-${esc(state.template)} ${photoBrandingClass()}">    <div class="template-stage-photo">      <div class="template-stage-placeholder">✨</div>      <img class="template-stage-logo-image" src="${esc(logo())}" alt="logo">${photoBrandingMarkup()}    </div>    <div class="template-stage-copy">      <b>${esc(current[1])}</b>      <span>${esc(current[2])}</span>      <small>${esc(state.campaign?.photoCaption || state.brand.caption)}</small>      <em>${esc(song.title || 'Preview template')} ${song.artist ? '• '+esc(song.artist) : ''}</em>    </div>  </div>`;
}

function liveTemplateAccent(id){
  const special=celebrationTemplateConfig(id);
  if(special?.accent) return special.accent;
  const map={signature:'#f6e8cf',vinyl:'#ffd400',sweet:'#ffb8dc',scrap:'#e1c9a8',retro:'#8ff7ff',editorial:'#ffffff',kawaii:'#ffc2e4',film:'#f2d9a6',birthday:'#fff0a8',night:'#65ddff',magazine:'#ffffff',receipt:'#f4efe5',korean4cut:'#f4eee5',chrome:'#b8f6ff',newspaper:'#eee7d8',digicam:'#ffcf57',photodump:'#ead8bc',mono:'#ffffff',softflash:'#ffddea',coquette:'#ffbfd8',dualcam:'#d5e1f4',stickerbomb:'#fff1a2',streetposter:'#ead8b4',mirror:'#dce5f3',chatstory:'#ffffff',visionboard:'#eadbc8',beigediary:'#d8c4a6',cleanflash:'#ffffff',dreamyfilm:'#ffd9e8',socialnote:'#e8edf6',songcard:'#ffd400',photobooth2:'#f4eee6',citynight:'#8bc8ff',bdaycake:'#fff0a8',bdayballoon:'#ffb8dc',bdaydisco:'#9ee7ff',bdaypastel:'#ffd9ea',bdayy2k:'#b8f6ff',bdaywish:'#fff2d2',bdaycandle:'#ffd796',bdaygift:'#ffc1df'};
  return map[id]||state.brand.primary||'#ffd400';
}

function liveTemplateDecor(id){
  const special=celebrationTemplateConfig(id);
  if(special){
    return `<span class="live-chat c1">${esc(special.badge||occasionBadge(special.occasion))}</span><span class="live-chat c2">${esc(special.sub||'special vibe')}</span><span class="live-sticker s3">${esc(special.emoji||'✦')}</span>`;
  }
  if(id==='film') return '<span class="live-film-holes left"></span><span class="live-film-holes right"></span>';
  if(id==='korean4cut') return '<span class="live-fourcut"><i></i><i></i><i></i><i></i></span>';
  if(id==='digicam') return '<span class="live-rec">● REC</span><span class="live-timestamp">AUTO • ISO 400</span>';
  if(id==='newspaper') return '<span class="live-news">THE DAILY MOMENT</span>';
  if(id==='coquette') return '<span class="live-bow b1">🎀</span><span class="live-bow b2">🎀</span>';
  if(id==='chatstory') return '<span class="live-chat c1">typing…</span><span class="live-chat c2">good vibe ✦</span>';
  if(id==='stickerbomb') return '<span class="live-sticker s1">★</span><span class="live-sticker s2">YAY!</span><span class="live-sticker s3">♫</span>';
  if(id==='chrome') return '<span class="live-chrome-star">✦</span><span class="live-chrome-star two">✦</span>';
  if(id==='receipt') return '<span class="live-receipt-lines">••••••••••••••••</span>';
  if(id==='visionboard'||id==='photodump') return '<span class="live-paper p1"></span><span class="live-paper p2"></span>';
  if(id==='bdaycake') return '<span class="live-bday-cake">🎂</span><span class="live-bday-spark">✦</span>';
  if(id==='bdayballoon') return '<span class="live-balloon a">🎈</span><span class="live-balloon b">🎈</span><span class="live-balloon c">🎈</span>';
  if(id==='bdaydisco') return '<span class="live-bday-disco">🪩</span><span class="live-bday-spark">✦</span>';
  if(id==='bdaypastel') return '<span class="live-bow b1">🎀</span><span class="live-bday-cake small">🎂</span>';
  if(id==='bdayy2k') return '<span class="live-rec">● BDAY REC</span><span class="live-timestamp">FLASH • 2000s</span>';
  if(id==='cleanflash') return '<span class="live-rec">FLASH ON</span><span class="live-spark">✦</span>';
  if(id==='dreamyfilm') return '<span class="live-film-date">soft memories</span><span class="live-spark">♡</span>';
  if(id==='socialnote') return '<span class="live-chat c1">currently feeling…</span><span class="live-chat c2">good music ✦</span>';
  if(id==='songcard') return '<span class="live-chat c1">NOW PLAYING</span><span class="live-sticker s3">♫</span>';
  if(id==='photobooth2') return '<span class="live-fourcut two-shot"><i></i><i></i></span>';
  if(id==='citynight') return '<span class="live-rec">● NIGHT</span><span class="live-timestamp">23:48 • CITY</span>';
  if(id==='bdaywish') return '<span class="live-chat c1">make a wish ✦</span><span class="live-chat c2">happy birthday 🎂</span>';
  if(id==='bdaycandle') return '<span class="live-bday-cake">🕯️</span><span class="live-bday-spark">✦</span>';
  if(id==='bdaygift') return '<span class="live-bday-cake">🎁</span><span class="live-balloon a">🎈</span>';
  return '<span class="live-spark">✦</span>';
}
function applyCameraTemplatePreview(){
  const cam=$('.camera'); const overlay=$('#liveTemplateOverlay');
  if(!cam||!overlay) return;
  const meta=templateMeta.find(t=>t[0]===state.template)||templateMeta[0];
  cam.dataset.template=state.template;
  cam.style.setProperty('--live-accent',liveTemplateAccent(state.template));
  overlay.innerHTML=`<div class="live-template-name"><small>LIVE PREVIEW</small><b>${esc(meta[1].replace('🔥 ',''))}</b></div>${liveTemplateDecor(state.template)}${photoBrandingMarkup()}`;
}


function enabledTemplates(){
  const ids=state.brand.enabledTemplates || defaultBrand.enabledTemplates;
  const brandExtras=brandPersonalTemplateIds.filter(id=>ids.includes(id));
  const group=occasionTemplateGroups[occasionId()];
  if(group){
    const chosen=group.filter(id=>ids.includes(id));
    const use=chosen.length?chosen:group;
    return templateMeta.filter(t=>[...use,...brandExtras].includes(t[0]));
  }
  const chosen=regularTemplateIds.filter(id=>ids.includes(id));
  const use=chosen.length?chosen:regularTemplateIds;
  return templateMeta.filter(t=>[...use,...brandExtras].includes(t[0]));
}

function openCameraPrivacyNotice(){
  $('.privacy-moment-modal')?.remove();

  const modal=document.createElement('div');
  modal.className='privacy-moment-modal capture-mode-modal';
  modal.innerHTML=`<div class="privacy-moment-card capture-mode-card">
    <button class="privacy-close" type="button" aria-label="Tutup">×</button>
    <div class="privacy-shield">✦</div>
    <div class="privacy-kicker">TANGKAP MOMENMU</div>
    <h3>Mau jadi foto atau video?</h3>
    <p>Pilih dulu hasil akhirnya. Semuanya diproses lokal di perangkat dan tidak disimpan ke server.</p>
    <div class="capture-mode-grid">
      <button class="capture-mode-option ${state.captureMode==='photo'?'active':''}" data-capture-mode="photo" type="button"><span>📸</span><b>Foto</b><small>Template, branding, Story/Post/Square.</small></button>
      <button class="capture-mode-option ${state.captureMode==='video'?'active':''}" data-capture-mode="video" type="button"><span>🎬</span><b>Video</b><small>Motion 7 detik untuk Reels / Story.</small></button>
    </div>
    <label class="video-music-choice ${state.captureMode==='video'?'':'is-hidden'}" id="videoMusicChoice"><input id="videoWithMusicChoice" type="checkbox" ${state.videoWithMusic?'checked':''}><span><b>Ikutkan soundtrack yang sedang diputar</b><small>Kalau browser mendukung audio capture, lagu pilihanmu ikut direkam ke video.</small></span></label>
    <div class="privacy-points"><span>🔒 Diproses lokal</span><span>📷 Tidak disimpan server</span><span>✨ Kamu yang pilih simpan/share</span></div>
    <button class="btn primary block privacy-continue" type="button">Lanjut →</button>
  </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(()=>modal.classList.add('is-open'));

  const close=()=>{modal.classList.remove('is-open');setTimeout(()=>modal.remove(),220);};
  $('.privacy-close',modal).onclick=close;
  modal.onclick=e=>{if(e.target===modal)close();};
  $$('[data-capture-mode]',modal).forEach(btn=>btn.onclick=()=>{
    state.captureMode=btn.dataset.captureMode;
    $$('[data-capture-mode]',modal).forEach(x=>x.classList.toggle('active',x===btn));
    $('#videoMusicChoice',modal)?.classList.toggle('is-hidden',state.captureMode!=='video');
  });
  $('.privacy-continue',modal).onclick=()=>{
    state.videoWithMusic=$('#videoWithMusicChoice',modal)?.checked!==false;
    close();
    setTimeout(()=>state.captureMode==='video'?renderVideoCutStudio():renderCamera(),180);
  };
}

async function renderCamera(){
  stopLobbyAmbient({fade:true});
  const tmpls=enabledTemplates();
  if(!tmpls.some(t=>t[0]===state.template)) state.template=tmpls[0]?.[0]||'signature';
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page photo-page"><div class="topbar"><button class="icon-btn" id="back">←</button><b>Camera Studio</b><div class="round-icon">✨</div></div>${compactNowPlaying('cameraMusicToggle')}${captureFormatPickerMarkup('photo')}<div class="camera live-template capture-format-${captureFormatMeta().id}"><video id="video" autoplay playsinline muted></video><button class="camera-switch" id="flipCamera" aria-label="Ganti kamera">↻ <span>${state.cameraFacing==='user'?'Depan':'Belakang'}</span></button><div class="camera-ui"><img src="${esc(logo())}" class="camera-logo"><div class="camera-copy">${esc(state.campaign.photoCaption || state.brand.caption)}</div><span class="corner a"></span><span class="corner b"></span><span class="corner c"></span><span class="corner d"></span><div id="liveTemplateOverlay" class="live-template-overlay"></div></div><button class="shutter" id="shot"></button></div><div class="camera-help-card"><b>Cara pakai</b><span>1. Pilih format • 2. Pilih template • 3. Foto / galeri • 4. Geser logo & icon di editor • 5. Simpan/share</span></div><div id="templateStage" class="template-stage"></div><div class="template-carousel">${tmpls.map(([id,name,desc])=>`<button class="template-chip ${id===state.template?'active':''}" data-t="${id}"><div class="template-preview p-${id}"></div><b>${esc(name)}</b><span>${esc(desc)}</span></button>`).join('')}</div><div class="upload-alt"><label class="btn ghost block">Pilih dari galeri<input id="gallery" type="file" accept="image/*" hidden></label></div></section></main>`;
  bindCompactPlayer('cameraMusicToggle');
  renderTemplateStage();
  applyCameraTemplatePreview();
  $('#back').onclick=()=>{ stopCameraStream(); renderPlayer(false); };
  $('#gallery').onchange=e=>{ stopCameraStream(); loadPhotoFile(e.target.files[0]); };
  $('#flipCamera').onclick=async()=>{ state.cameraFacing=state.cameraFacing==='user'?'environment':'user'; const b=$('#flipCamera'); if(b){b.disabled=true;b.innerHTML=`↻ <span>${state.cameraFacing==='user'?'Depan':'Belakang'}</span>`;} try{await startCameraStream();applyCameraTemplatePreview();}catch{} finally{if(b)b.disabled=false;} };
  $$('.template-chip').forEach(b=>b.onclick=()=>{state.template=b.dataset.t;$$('.template-chip').forEach(x=>x.classList.toggle('active',x===b));renderTemplateStage();applyCameraTemplatePreview();});
  $$('[data-capture-format]').forEach(b=>b.onclick=()=>{state.captureFormat=b.dataset.captureFormat;$$('[data-capture-format]').forEach(x=>x.classList.toggle('active',x===b));syncCameraFormat();renderTemplateStage();});
  try{ await startCameraStream(); applyCameraTemplatePreview(); $('#shot').onclick=async()=>{const b=$('#shot');if(b.disabled)return;b.disabled=true;await runCaptureCountdown('photo');capture(state.cameraStream);}; }catch{$('.camera').innerHTML=`<div class="camera-fallback"><div>📷</div><h3>Kamera belum diizinkan</h3><p>Gunakan tombol galeri di bawah.</p></div>`;}
}

async function renderVideoCamera(){
  stopLobbyAmbient({fade:true});
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page photo-page video-capture-page">
    <div class="topbar"><button class="icon-btn" id="back">←</button><b>Motion Studio</b><div class="round-icon">🎬</div></div>
    ${compactNowPlaying('videoMusicToggle')}
    <div class="video-cut-mini">
      <div><small>♫ MUSIC CUT</small><b>${videoClipClock(state.videoClipStart)} — ${videoClipClock((state.videoClipStart||0)+(state.videoClipDuration||state.videoDuration))}</b><span>${esc(state.selectedSong?.title||'Soundtrack')}</span></div>
      <button id="editVideoCut" type="button">Edit potongan</button>
    </div>
    ${captureFormatPickerMarkup('video')}
    ${videoDesignPickerMarkup()}
    <div class="camera live-template video-camera capture-format-${captureFormatMeta().id} video-design-${state.videoDesign||'clean'}">
      <video id="video" autoplay playsinline muted></video>
      <button class="camera-switch" id="flipCamera" aria-label="Ganti kamera">↻ <span>${state.cameraFacing==='user'?'Depan':'Belakang'}</span></button>
      ${videoBrandDragMarkup()}
      <div class="video-live-song"><small>NOW PLAYING</small><b>${esc(state.selectedSong?.title||'Your Soundtrack')}</b><span>${esc(state.selectedSong?.artist||occasionDisplayLabel())}</span></div>
      <div class="video-record-state" id="videoRecordState">READY • ${state.videoDuration}s</div>
    </div>
    ${videoAssetControlsMarkup()}
    <div class="camera-help-card"><b>Video branded</b><span>Pilih design, atur posisi logo/nama/caption, lalu rekam. Hasil diproses lokal di HP.</span></div>
    <label class="video-music-choice video-page-music"><input id="videoWithMusic" type="checkbox" ${state.videoWithMusic?'checked':''}><span><b>Dengan soundtrack</b><small>Memakai lagu yang sedang diputar kalau browser mendukung capture audio.</small></span></label>
    <button class="btn primary block video-record-btn" id="recordVideo">● Rekam ${state.videoDuration} detik</button>
  </section></main>`;
  bindCompactPlayer('videoMusicToggle');
  $('#back').onclick=()=>{stopCameraStream();renderPlayer(false);};
  $('#videoWithMusic').onchange=e=>state.videoWithMusic=e.target.checked;
  $('#editVideoCut').onclick=()=>{stopCameraStream();renderVideoCutStudio();};
  $$('[data-capture-format]').forEach(b=>b.onclick=()=>{state.captureFormat=b.dataset.captureFormat;$$('[data-capture-format]').forEach(x=>x.classList.toggle('active',x===b));syncCameraFormat();syncVideoAssetGeometry();});
  $$('[data-video-design]').forEach(b=>b.onclick=()=>{state.videoDesign=b.dataset.videoDesign;$$('[data-video-design]').forEach(x=>x.classList.toggle('active',x===b));syncVideoDesignPreview();syncVideoAssetGeometry();});
  $('#flipCamera').onclick=async()=>{state.cameraFacing=state.cameraFacing==='user'?'environment':'user';const b=$('#flipCamera');if(b){b.disabled=true;b.innerHTML=`↻ <span>${state.cameraFacing==='user'?'Depan':'Belakang'}</span>`;}try{await startCameraStream();syncCameraFormat();bindVideoAssetDrag();}catch{}finally{if(b)b.disabled=false;}};
  try{
    await startCameraStream();syncCameraFormat();syncVideoDesignPreview();bindVideoAssetDrag();
    $('#recordVideo').onclick=async()=>{const b=$('#recordVideo');if(b.disabled)return;b.disabled=true;await runCaptureCountdown('video');await recordBrandedVideo();if(document.body.contains(b))b.disabled=false;};
  }catch{
    $('.video-camera').innerHTML=`<div class="camera-fallback"><div>🎬</div><h3>Kamera belum diizinkan</h3><p>Izinkan kamera untuk membuat video.</p></div>`;$('#recordVideo').disabled=true;
  }
}

async function recordBrandedVideo(){
  const video=$('#video'),status=$('#videoRecordState');
  if(!video||!state.cameraStream)return toast('Kamera belum siap.');
  if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream)return toast('Browser ini belum mendukung rekam video langsung.');

  const mime=preferredVideoMime();
  if(!mime)return toast('Format video belum didukung browser ini.');

  const meta=captureFormatMeta();
  const renderW=540,renderH=Math.round(renderW*meta.h/meta.w);
  const canvas=document.createElement('canvas');canvas.width=renderW;canvas.height=renderH;
  const ctx=canvas.getContext('2d');
  const visualStream=canvas.captureStream(30);

  const clipStart=Math.max(0,Number(state.videoClipStart)||0);
  const clipDuration=Math.max(5,Math.min(30,Number(state.videoClipDuration)||Number(state.videoDuration)||10));
  state.videoDuration=clipDuration;
  state.videoClipDuration=clipDuration;

  if(state.videoWithMusic){
    try{
      await ensureVideoCutAudio();
      musicPlayer.pause();
      musicPlayer.currentTime=Math.min(clipStart,Math.max(0,(musicPlayer.duration||clipStart)-.05));
      await musicPlayer.play();
    }catch(e){console.warn('Selected clip preview during take failed',e);}
  }

  const chunks=[];
  let recorder;
  try{recorder=new MediaRecorder(visualStream,{mimeType:mime,videoBitsPerSecond:5_000_000});}
  catch(e){console.error(e);return toast('Recorder video gagal disiapkan.');}
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
  const done=new Promise(resolve=>recorder.onstop=resolve);
  recorder.start(250);

  const started=performance.now(),duration=clipDuration*1000;
  let raf=0;
  const frame=now=>{
    ctx.clearRect(0,0,renderW,renderH);
    drawVideoCover(ctx,video,renderW,renderH,state.cameraFacing==='user');
    const remain=Math.max(0,Math.ceil((duration-(now-started))/1000));
    if(status)status.textContent=`REC ● ${remain}s`;
    if(now-started<duration)raf=requestAnimationFrame(frame);
    else recorder.stop();
  };
  raf=requestAnimationFrame(frame);
  await done;
  cancelAnimationFrame(raf);

  if(state.videoWithMusic){
    musicPlayer.pause();
    try{musicPlayer.currentTime=clipStart;}catch{}
  }

  const blob=new Blob(chunks,{type:recorder.mimeType||mime});
  if(!blob.size)return toast('Video kosong. Coba rekam lagi.');

  if(state.rawVideoUrl)URL.revokeObjectURL(state.rawVideoUrl);
  state.rawVideoBlob=blob;
  state.rawVideoMime=recorder.mimeType||mime;
  state.rawVideoUrl=URL.createObjectURL(blob);

  event('capture',state.campaign.id);
  stopCameraStream();
  renderVideoFinalEditor();
}


function renderVideoFinalEditor(){
  if(!state.rawVideoUrl||!state.rawVideoBlob)return renderVideoCamera();
  const meta=captureFormatMeta();

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page video-final-editor">
    <div class="topbar"><button class="icon-btn" id="videoFinalBack">←</button><b>Edit Video</b><div class="round-icon">✦</div></div>

    <div class="video-final-editor-head">
      <div><small>FINAL TOUCH</small><h2>Rapihin dulu sebelum simpan.</h2><p>Pilih template, geser logo/nama/caption, lalu render video final.</p></div>
      <span>${esc(meta.label)} • ${state.videoDuration}s</span>
    </div>

    ${videoDesignPickerMarkup()}

    <div class="camera video-camera video-final-edit-stage capture-format-${meta.id} video-design-${state.videoDesign||'clean'}">
      <video id="videoFinalEditPreview" src="${esc(state.rawVideoUrl)}" autoplay loop muted playsinline></video>
      ${videoBrandDragMarkup()}
      <div class="video-live-song"><small>NOW PLAYING</small><b>${esc(state.selectedSong?.title||'Your Soundtrack')}</b><span>${esc(state.selectedSong?.artist||occasionDisplayLabel())}</span></div>
    </div>

    ${videoAssetControlsMarkup()}
    <div class="video-final-note"><span>✦</span><div><b>Yang kamu atur di sini = hasil final.</b><small>Nggak perlu take ulang cuma buat mindahin logo atau ganti template.</small></div></div>
    <button class="btn primary block" id="renderFinalVideo">Render video final →</button>
    <button class="btn ghost block" id="retakeVideo">Rekam ulang</button>
  </section></main>`;

  $$('[data-video-design]').forEach(b=>b.onclick=()=>{
    state.videoDesign=b.dataset.videoDesign;
    $$('[data-video-design]').forEach(x=>x.classList.toggle('active',x===b));
    syncVideoDesignPreview();syncVideoAssetGeometry();playUiSfx('click');
  });
  syncVideoDesignPreview();
  bindVideoAssetDrag();

  $('#videoFinalBack').onclick=()=>renderVideoCamera();
  $('#retakeVideo').onclick=()=>renderVideoCamera();
  $('#renderFinalVideo').onclick=()=>renderFinalVideoFromRaw();
}

function showVideoRenderOverlay(){
  $('.video-render-overlay')?.remove();
  const layer=document.createElement('div');
  layer.className='video-render-overlay';
  layer.innerHTML=`<div class="video-render-card"><div class="video-render-ring"><span id="videoRenderPct">0%</span></div><b>Meong lagi ngerender videomu 😼</b><p id="videoRenderText">Jangan kabur dulu, brandingnya lagi dirapihin.</p></div>`;
  document.body.appendChild(layer);requestAnimationFrame(()=>layer.classList.add('show'));return layer;
}
function updateVideoRenderOverlay(progress=0,text=''){
  const pct=$('#videoRenderPct');if(pct)pct.textContent=`${Math.round(Math.max(0,Math.min(1,progress))*100)}%`;
  const t=$('#videoRenderText');if(t&&text)t.textContent=text;
}
function closeVideoRenderOverlay(){const layer=$('.video-render-overlay');if(!layer)return;layer.classList.remove('show');setTimeout(()=>layer.remove(),180);}

async function renderFinalVideoFromRaw(){
  const rawBlob=state.rawVideoBlob;
  if(!rawBlob)return toast('Video mentah belum tersedia.');
  if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream)return toast('Browser belum mendukung render video.');

  showVideoRenderOverlay();
  const meta=captureFormatMeta();
  const mime=preferredVideoMime();
  const renderW=540,renderH=Math.round(renderW*meta.h/meta.w);
  const canvas=document.createElement('canvas');canvas.width=renderW;canvas.height=renderH;
  const ctx=canvas.getContext('2d');
  const stream=canvas.captureStream(30);
  const clipStart=Math.max(0,Number(state.videoClipStart)||0);
  const targetDuration=Math.max(5,Math.min(30,Number(state.videoDuration)||10));

  const raw=document.createElement('video');
  raw.src=state.rawVideoUrl||URL.createObjectURL(rawBlob);
  raw.muted=true;raw.playsInline=true;raw.preload='auto';
  try{
    await new Promise((resolve,reject)=>{
      const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(new Error('Raw video tidak bisa dibuka'));};
      const cleanup=()=>{raw.removeEventListener('loadeddata',done);raw.removeEventListener('error',fail);};
      raw.addEventListener('loadeddata',done,{once:true});raw.addEventListener('error',fail,{once:true});
      if(raw.readyState>=2)done();
    });
  }catch(e){closeVideoRenderOverlay();toast('Preview mentah gagal dibuka.');return;}

  let audioAttached=false;
  if(state.videoWithMusic){
    try{
      await ensureVideoCutAudio();
      musicPlayer.pause();
      musicPlayer.currentTime=Math.min(clipStart,Math.max(0,(musicPlayer.duration||clipStart)-.05));
      const capture=musicPlayer.captureStream?.bind(musicPlayer)||musicPlayer.mozCaptureStream?.bind(musicPlayer);
      if(capture){
        const astream=capture();
        astream.getAudioTracks().forEach(track=>stream.addTrack(track));
        audioAttached=stream.getAudioTracks().length>0;
      }
    }catch(e){console.warn('Final soundtrack attach failed',e);}
  }

  const chunks=[];let recorder;
  try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5_000_000});}
  catch(e){closeVideoRenderOverlay();console.error(e);return toast('Final renderer gagal disiapkan.');}
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
  const done=new Promise(resolve=>recorder.onstop=resolve);

  let logoImg=null;try{logoImg=await image(logo());}catch{}
  raw.currentTime=0;
  await raw.play().catch(()=>{});
  if(state.videoWithMusic){try{musicPlayer.currentTime=clipStart;await musicPlayer.play();}catch{}}

  recorder.start(250);
  const started=performance.now();let raf=0;
  const frame=now=>{
    const elapsed=(now-started)/1000;
    ctx.clearRect(0,0,renderW,renderH);
    drawVideoCover(ctx,raw,renderW,renderH,false);
    drawVideoBrandFrame(ctx,renderW,renderH,elapsed,logoImg);
    updateVideoRenderOverlay(Math.min(1,elapsed/targetDuration),elapsed<targetDuration*.65?'Template lagi dipasang…':'Audio & frame lagi disinkronin…');
    if(elapsed<targetDuration)raf=requestAnimationFrame(frame);else recorder.stop();
  };
  raf=requestAnimationFrame(frame);
  await done;
  cancelAnimationFrame(raf);
  raw.pause();musicPlayer.pause();try{musicPlayer.currentTime=clipStart;}catch{}

  const blob=new Blob(chunks,{type:recorder.mimeType||mime});
  if(!blob.size){closeVideoRenderOverlay();return toast('Render final kosong. Coba lagi.');}

  if(state.recordedVideoUrl)URL.revokeObjectURL(state.recordedVideoUrl);
  state.recordedVideoBlob=blob;state.recordedVideoMime=recorder.mimeType||mime;state.recordedVideoUrl=URL.createObjectURL(blob);
  state.shareVideoBlob=null;state.shareVideoMime='';state.shareVideoPreparing=false;state.shareVideoError='';

  updateVideoRenderOverlay(1,'Selesai ✦');
  setTimeout(()=>{closeVideoRenderOverlay();renderVideoResult(blob,recorder.mimeType||mime,audioAttached);prepareShareCompatibleVideo(blob,recorder.mimeType||mime);},300);
}

function renderVideoResult(blob,mime,audioAttached=false){
  const meta=captureFormatMeta(),ext=String(mime).includes('mp4')?'mp4':'webm';
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page video-result-page">
    <div class="topbar"><button class="icon-btn" id="back">←</button><b>Video siap</b><div class="round-icon">🎬</div></div>
    <div class="video-result-card"><video id="videoResult" src="${esc(state.recordedVideoUrl)}" autoplay loop controls playsinline></video></div>
    <div class="video-result-meta"><span>${esc(meta.label)}</span><span>${state.videoDuration}s</span><span>${audioAttached?'♫ Soundtrack ikut':'Visual + brand'}</span><span>${ext.toUpperCase()}</span></div>
    <button class="btn ghost block video-edit-again" id="editFinalVideo">✦ Edit desain sebelum download</button>
    <div class="video-save-actions"><button class="btn primary" id="downloadVideo">⬇ Simpan video</button><button class="btn ghost" id="shareVideo" disabled>↗ Share video</button></div><div class="video-share-status working" id="videoShareStatus">Menyiapkan file share…</div><div class="video-share-hint">Share file langsung tergantung dukungan browser/format video. MP4 diprioritaskan; kalau perangkat hanya menghasilkan WebM, fallback otomatis ke Simpan.</div>
    <div class="notice">${audioAttached?'Soundtrack pilihanmu ikut pada file video.':'Kalau soundtrack tidak ikut karena browser, videonya tetap bisa disimpan. Tambahkan lagu yang sama saat upload ke Instagram.'}</div>
    <button class="btn ghost block" id="recordAgain">Rekam lagi</button>
  </section></main>`;
  $('#back').onclick=()=>renderPlayer(false);$('#recordAgain').onclick=()=>renderVideoCamera();$('#editFinalVideo').onclick=()=>renderVideoFinalEditor();$('#downloadVideo').onclick=()=>downloadRecordedVideo(blob,mime);$('#shareVideo').onclick=()=>shareRecordedVideo();
}

async function shareRecordedVideo(blob=state.shareVideoBlob||state.recordedVideoBlob,mime=state.shareVideoMime||state.recordedVideoMime){
  if(state.shareVideoPreparing){toast('MP4 masih disiapkan sebentar 😼');return;}
  if(!blob)return toast('Video belum tersedia.');
  const realType=mime||blob.type||'video/mp4',ext=String(realType).includes('mp4')?'mp4':'webm';
  const file=new File([blob],`${state.brand.appName}-${Date.now()}.${ext}`,{type:realType});
  const payload={files:[file],title:state.brand.appName,text:`${state.selectedSong?.title||'Soundtrack'} • ${state.brand.brandName}`};event('share',state.campaign.id);
  if(!navigator.share){toast('Browser ini tidak menyediakan native share sheet.');return;}
  try{await navigator.share(payload);}
  catch(e){
    if(e?.name==='AbortError')return;console.warn('Native share failed',e);
    try{await navigator.share({files:[file]});return;}catch(e2){if(e2?.name==='AbortError')return;console.warn('Native file-only share failed',e2);toast('Share langsung ditolak browser/perangkat. File tetap aman dan bisa disimpan.');}
  }
}

let shareFfmpegInstance=null;
let shareFfmpegLoading=null;
async function getShareFfmpeg(){
  if(shareFfmpegInstance)return shareFfmpegInstance;
  if(shareFfmpegLoading)return shareFfmpegLoading;
  shareFfmpegLoading=(async()=>{
    const [{FFmpeg},{toBlobURL}]=await Promise.all([
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js'),
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js')
    ]);
    const ffmpeg=new FFmpeg();
    const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});
    shareFfmpegInstance=ffmpeg;return ffmpeg;
  })();
  try{return await shareFfmpegLoading;}finally{shareFfmpegLoading=null;}
}
function updateVideoShareStatus(text='',progress=null,error=false){
  const el=$('#videoShareStatus');if(!el)return;
  el.classList.toggle('error',Boolean(error));el.classList.toggle('working',progress!==null&&!error);
  const pct=progress===null?'':` ${Math.max(0,Math.min(100,Math.round(progress*100)))}%`;
  el.textContent=`${text}${pct}`;
}
async function prepareShareCompatibleVideo(blob=state.recordedVideoBlob,mime=state.recordedVideoMime){
  if(!blob)return null;
  const type=String(mime||blob.type||'video/webm');
  state.shareVideoPreparing=true;state.shareVideoError='';state.shareVideoBlob=null;state.shareVideoMime='';
  if(type.includes('mp4')){
    state.shareVideoBlob=blob;state.shareVideoMime='video/mp4';state.shareVideoPreparing=false;
    updateVideoShareStatus('Siap dibagikan langsung ✓');const btn=$('#shareVideo');if(btn)btn.disabled=false;return {blob,mime:'video/mp4'};
  }
  updateVideoShareStatus('Menyiapkan MP4 biar lebih gampang di-share…',0);
  try{
    const ffmpeg=await getShareFfmpeg(),token=`share_${Date.now()}`,input=`${token}.webm`,output=`${token}.mp4`;
    const onProgress=({progress})=>updateVideoShareStatus('Menyiapkan MP4 biar lebih gampang di-share…',Number(progress)||0);
    ffmpeg.on('progress',onProgress);
    try{
      await ffmpeg.writeFile(input,new Uint8Array(await blob.arrayBuffer()));
      const expectedDuration=Math.max(1,Math.min(30,Number(state.videoDuration)||10));
      await ffmpeg.exec([
        '-y','-fflags','+genpts','-i',input,
        '-map','0:v:0','-map','0:a?',
        '-vf','setpts=N/(30*TB),fps=30',
        '-t',String(expectedDuration),
        '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',
        '-c:a','aac','-b:a','128k',
        '-movflags','+faststart',
        output
      ]);
      const data=await ffmpeg.readFile(output),mp4=new Blob([data.buffer],{type:'video/mp4'});
      state.shareVideoBlob=mp4;state.shareVideoMime='video/mp4';state.shareVideoPreparing=false;
      updateVideoShareStatus('MP4 siap • tap Share video ✓');const btn=$('#shareVideo');if(btn)btn.disabled=false;return {blob:mp4,mime:'video/mp4'};
    }finally{
      try{ffmpeg.off('progress',onProgress);}catch{};try{await ffmpeg.deleteFile(input);}catch{};try{await ffmpeg.deleteFile(output);}catch{}
    }
  }catch(e){
    console.warn('MP4 conversion failed',e);state.shareVideoError=String(e?.message||e);state.shareVideoPreparing=false;state.shareVideoBlob=blob;state.shareVideoMime=type;
    updateVideoShareStatus('MP4 compatibility gagal dimuat. Share akan mencoba file asli.',null,true);const btn=$('#shareVideo');if(btn)btn.disabled=false;return {blob,mime:type,error:e};
  }
}
function downloadRecordedVideo(blob=state.recordedVideoBlob,mime=state.recordedVideoMime){
  if(!blob)return toast('Video belum tersedia.');
  const ext=String(mime||blob.type).includes('mp4')?'mp4':'webm',url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${state.brand.appName}-${captureFormatMeta().id}-${Date.now()}.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);toast('Video disiapkan untuk disimpan.');
}



function capture(stream){
  const v=$('#video'),c=document.createElement('canvas');
  c.width=v.videoWidth||1080;c.height=v.videoHeight||1440;
  const ctx=c.getContext('2d');
  if(state.cameraFacing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1);}
  ctx.drawImage(v,0,0,c.width,c.height);
  state.photo=c.toDataURL('image/jpeg',.93);
  stopCameraStream();
  event('capture',state.campaign.id);renderPhotoEditor();
}
function loadPhotoFile(f){ if(!f)return;const r=new FileReader();r.onload=()=>{stopCameraStream();state.photo=r.result;event('capture',state.campaign.id);renderPhotoEditor();};r.readAsDataURL(f); }
async function image(src){return new Promise((res,rej)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
function rr(ctx,x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function wrap(ctx,text,x,y,maxW,lineH,maxLines=3){const words=String(text).split(/\s+/);let line='',lines=[];for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=w;if(lines.length>=maxLines-1)break;}else line=test;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}
function sticker(ctx,x,y,text,fill='#fff',color='#111',rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.font='900 28px sans-serif';const w=ctx.measureText(text).width+36;rr(ctx,-w/2,-24,w,48,24,fill);ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,0,10);ctx.restore();}
function doodles(ctx,dense=false){const pts=dense?[[95,120],[925,140],[160,1120],[915,1070],[790,250],[260,220],[820,870],[290,930]]:[[95,120],[925,140],[160,1120],[915,1070]];pts.forEach(([x,y],i)=>{ctx.save();ctx.translate(x,y);ctx.rotate((i%4-.5)*.15);ctx.fillStyle=[state.brand.primary,state.brand.accent,'#fff','#ffe99c'][i%4];ctx.font='900 52px sans-serif';ctx.fillText(i%2?'★':'♡',0,0);ctx.restore();});}
function drawImageCover(ctx,p,x,y,w,h){const scale=Math.max(w/p.width,h/p.height);const dw=p.width*scale,dh=p.height*scale;ctx.drawImage(p,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
function drawImageCoverClip(ctx,p,x,y,w,h,r=0){
  if(!p) return;
  ctx.save();
  ctx.beginPath();
  if(r) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h);
  ctx.clip();
  drawImageCover(ctx,p,x,y,w,h);
  ctx.restore();
}

function drawCelebrationTemplate(ctx,p,cap,track,song,cfg){
  const headline=cfg.headline||occasionDisplayLabel(cfg.occasion);
  const sub=cfg.sub||'';
  const accent=cfg.accent||state.brand.primary;
  const surface=cfg.surface||'#111';
  const ink=cfg.ink||'#fff';
  const badge=cfg.badge||occasionBadge(cfg.occasion);
  const emoji=cfg.emoji||'✦';
  const layout=cfg.layout||'elegant';
  const target=celebrationTargetName().toUpperCase().slice(0,22);

  if(layout==='elegant'){
    ctx.fillStyle=surface;ctx.fillRect(28,28,1024,1294);
    rr(ctx,58,58,964,1234,40,'rgba(255,255,255,.05)',accent,4);
    drawImageCoverClip(ctx,p,88,112,904,860,28);
    sticker(ctx,215,108,badge,'#fff8eb','#111',-.05);
    sticker(ctx,884,126,emoji,accent,'#111',.04);
    ctx.fillStyle=ink;ctx.font='900 56px sans-serif';wrap(ctx,headline,92,1048,820,62,2);
    ctx.font='900 28px sans-serif';ctx.fillStyle=accent;ctx.fillText(target,92,1148);
    ctx.font='700 28px sans-serif';ctx.fillStyle=ink;wrap(ctx,cap||sub,92,1200,780,36,2);
    ctx.font='700 25px sans-serif';ctx.fillStyle='rgba(255,255,255,.82)';ctx.fillText(track.slice(0,58),92,1270);
  } else if(layout==='diary'){
    ctx.fillStyle=surface;ctx.fillRect(28,28,1024,1294);
    ctx.save();ctx.translate(300,352);ctx.rotate(-.05);ctx.fillStyle='#fff';ctx.fillRect(-210,-235,420,470);drawImageCoverClip(ctx,p,-188,-213,376,426,10);ctx.restore();
    ctx.save();ctx.translate(784,320);ctx.rotate(.06);ctx.fillStyle='#fff';ctx.fillRect(-168,-162,336,324);drawImageCoverClip(ctx,p,-146,-140,292,280,10);ctx.restore();
    ctx.save();ctx.translate(548,832);ctx.rotate(-.02);ctx.fillStyle='#fff';ctx.fillRect(-315,-205,630,410);drawImageCoverClip(ctx,p,-288,-178,576,356,10);ctx.restore();
    sticker(ctx,225,106,badge,'#fff9ee','#111',-.07);
    sticker(ctx,886,914,emoji,accent,'#111',.09);
    ctx.fillStyle=ink;ctx.font='900 50px sans-serif';wrap(ctx,headline,86,1118,810,56,2);
    ctx.font='700 25px sans-serif';ctx.fillStyle=ink;wrap(ctx,(cap||sub),86,1196,800,34,2);
    ctx.font='700 22px sans-serif';ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillText(track.slice(0,58),86,1276);
  } else if(layout==='glow'){
    ctx.fillStyle=surface;ctx.fillRect(0,0,1080,1350);
    const halo1=ctx.createRadialGradient(220,180,30,220,180,520);halo1.addColorStop(0,'rgba(255,255,255,.20)');halo1.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo1;ctx.fillRect(0,0,1080,700);
    const halo2=ctx.createRadialGradient(860,210,30,860,210,560);halo2.addColorStop(0,'rgba(255,255,255,.12)');halo2.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo2;ctx.fillRect(0,0,1080,780);
    rr(ctx,46,46,988,1258,38,null,'rgba(255,255,255,.32)',3);
    drawImageCoverClip(ctx,p,92,152,896,860,26);
    ctx.fillStyle=accent;ctx.font='102px sans-serif';ctx.fillText(emoji,478,160);
    sticker(ctx,196,112,badge,'#fff','#111',-.04);
    ctx.fillStyle=ink;ctx.font='900 60px sans-serif';wrap(ctx,headline,86,1095,900,68,2);
    ctx.font='700 28px sans-serif';ctx.fillStyle='rgba(255,255,255,.88)';wrap(ctx,(cap||sub),86,1205,850,38,2);
    ctx.fillText(track.slice(0,58),86,1290);
  } else if(layout==='story'){
    drawImageCoverClip(ctx,p,36,36,1008,1278,36);
    const grad=ctx.createLinearGradient(0,760,0,1330);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.78)');ctx.fillStyle=grad;ctx.fillRect(36,740,1008,574);
    rr(ctx,70,84,320,64,32,'rgba(255,255,255,.16)','rgba(255,255,255,.26)',2);
    ctx.fillStyle='#fff';ctx.font='800 24px sans-serif';ctx.fillText(badge,102,123);
    rr(ctx,68,912,690,192,28,'rgba(255,255,255,.95)');
    ctx.fillStyle='#111';ctx.font='900 48px sans-serif';wrap(ctx,headline,96,970,630,52,2);
    ctx.font='700 25px sans-serif';ctx.fillStyle='#444';wrap(ctx,(cap||sub),96,1060,622,34,2);
    rr(ctx,720,1148,292,72,36,'rgba(255,255,255,.14)','rgba(255,255,255,.24)',2);
    ctx.fillStyle='#fff';ctx.font='800 23px sans-serif';ctx.fillText(`${emoji} ${target}`,745,1192);
    ctx.font='700 25px sans-serif';ctx.fillStyle='rgba(255,255,255,.82)';ctx.fillText(track.slice(0,58),78,1248);
  } else if(layout==='paper'){
    ctx.fillStyle=surface;ctx.fillRect(30,30,1020,1290);
    drawImageCoverClip(ctx,p,82,94,916,772,20);
    rr(ctx,86,894,908,340,28,'rgba(255,252,245,.95)','rgba(120,91,60,.2)',2);
    ctx.fillStyle=ink;ctx.font='900 48px serif';ctx.fillText(headline,120,970);
    ctx.font='800 27px sans-serif';ctx.fillStyle=accent;ctx.fillText(target,120,1014);
    ctx.font='700 28px serif';ctx.fillStyle=ink;wrap(ctx,(cap||sub),120,1074,750,40,3);
    ctx.font='600 24px serif';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(track.slice(0,58),120,1218);
    sticker(ctx,856,918,badge,'#fff0b3','#4d3a2b',-.05);
    ctx.font='94px sans-serif';ctx.fillStyle=accent;ctx.fillText(emoji,885,1048);
  }
}

async function drawFrame(){
  const c=$('#final'); if(!c) return; const ctx=c.getContext('2d'); let p=null; if(state.photo){ try{ p=await image(state.photo); }catch{} }
  ctx.clearRect(0,0,c.width,c.height);
  if(p) drawImageCover(ctx,p,0,0,c.width,c.height); else { const g=ctx.createLinearGradient(0,0,1080,1350); g.addColorStop(0,state.brand.primary); g.addColorStop(1,state.brand.secondary); ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height); ctx.fillStyle='rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(790,260,170,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='900 72px sans-serif'; ctx.fillText('Preview',94,180); } 
  const cap=$('#caption')?.value||state.campaign.photoCaption||state.brand.caption;const song=state.selectedSong||{};const track=`${song.title||''}${song.artist?' • '+song.artist:''}`;const t=state.template;
  const fade=ctx.createLinearGradient(0,950,0,1350);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,.62)');ctx.fillStyle=fade;ctx.fillRect(0,900,1080,450);

  const celebration=celebrationTemplateConfig(t);
  if(celebration){
    drawCelebrationTemplate(ctx,p,cap,track,song,celebration);
  } else if(t==='signature'){
    ctx.fillStyle='#f7f1e8';ctx.fillRect(45,45,990,1260);ctx.save();ctx.beginPath();ctx.rect(95,95,890,930);ctx.clip();drawImageCover(ctx,p,95,95,890,930);ctx.restore();ctx.fillStyle='#111';ctx.font='900 40px sans-serif';ctx.fillText(state.brand.brandName,95,1100);ctx.font='800 42px sans-serif';wrap(ctx,cap,95,1160,760,48,2);ctx.font='600 26px sans-serif';ctx.fillStyle='#555';ctx.fillText(track.slice(0,58),95,1260);sticker(ctx,880,1105,'now playing',state.brand.primary,'#111',-.05);
  } else if(t==='vinyl'){
    rr(ctx,45,45,990,1260,34,'rgba(14,14,14,.38)','rgba(255,255,255,.35)',3);rr(ctx,70,70,640,1110,28,'rgba(0,0,0,.16)');ctx.save();ctx.beginPath();ctx.roundRect(70,70,640,1110,28);ctx.clip();drawImageCover(ctx,p,70,70,640,1110);ctx.restore();ctx.fillStyle='#101010';ctx.beginPath();ctx.arc(820,350,168,0,Math.PI*2);ctx.fill();for(let r=25;r<160;r+=18){ctx.strokeStyle='rgba(255,255,255,.09)';ctx.beginPath();ctx.arc(820,350,r,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=state.brand.primary;ctx.beginPath();ctx.arc(820,350,52,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 48px sans-serif';wrap(ctx,cap,750,650,240,55,4);ctx.font='800 30px sans-serif';ctx.fillText((song.title||'').slice(0,18),750,960);ctx.font='500 24px sans-serif';ctx.fillStyle='#ddd';ctx.fillText((song.artist||'').slice(0,18),750,1000);
  } else if(t==='sweet'){
    rr(ctx,35,35,1010,1280,46,'rgba(255,255,255,.12)','#ffdced',5);doodles(ctx,true);sticker(ctx,230,100,state.brand.brandName,'#fff4a8','#111',-.06);ctx.fillStyle='#fff';ctx.font='900 54px sans-serif';wrap(ctx,cap,78,1060,820,60,3);ctx.font='700 28px sans-serif';ctx.fillStyle='#fff1b9';ctx.fillText(track.slice(0,58),78,1238);
  } else if(t==='scrap'){
    ctx.fillStyle='#eadbc8';ctx.fillRect(45,45,990,1260);ctx.save();ctx.translate(540,520);ctx.rotate(-.015);ctx.fillStyle='#fff';ctx.fillRect(-420,-430,840,880);ctx.drawImage(p,-400,-410,800,800);ctx.restore();ctx.fillStyle='rgba(255,241,181,.78)';ctx.save();ctx.translate(210,90);ctx.rotate(-.18);ctx.fillRect(-70,-18,140,36);ctx.restore();ctx.save();ctx.translate(865,90);ctx.rotate(.16);ctx.fillRect(-70,-18,140,36);ctx.restore();ctx.fillStyle='#493725';ctx.font='900 46px sans-serif';wrap(ctx,cap,95,1070,800,54,3);ctx.font='600 27px sans-serif';ctx.fillStyle='#6a5641';ctx.fillText(track.slice(0,58),95,1240);sticker(ctx,900,1180,'♪',state.brand.primary,'#111',.12);
  } else if(t==='retro'){
    const hg=ctx.createLinearGradient(0,0,1080,0);['#76f4ff','#ffc1e8','#fff6a9','#cbb6ff','#76f4ff'].forEach((v,i,a)=>hg.addColorStop(i/(a.length-1),v));ctx.globalAlpha=.28;ctx.fillStyle=hg;ctx.fillRect(40,40,1000,180);ctx.globalAlpha=1;rr(ctx,40,40,1000,1270,30,'rgba(255,255,255,.08)','rgba(255,255,255,.5)',3);sticker(ctx,220,110,'Y2K MUSIC','#111','#fff');ctx.fillStyle='#fff';ctx.font='900 56px sans-serif';wrap(ctx,cap,75,1050,840,62,3);ctx.font='700 28px sans-serif';ctx.fillStyle='#efefef';ctx.fillText(track.slice(0,58),75,1235);
  } else if(t==='editorial'){
    ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.strokeRect(54,54,972,1242);ctx.fillStyle='#fff';ctx.font='900 34px sans-serif';ctx.fillText(state.brand.brandName.toUpperCase(),85,115);ctx.font='900 62px sans-serif';wrap(ctx,cap,85,1070,860,68,2);ctx.font='500 26px sans-serif';ctx.fillStyle='#ececec';ctx.fillText(track.slice(0,58),85,1240);ctx.fillStyle=state.brand.primary;ctx.fillRect(85,150,135,10);
  } else if(t==='kawaii'){
    rr(ctx,28,28,1024,1294,54,'rgba(255,240,248,.11)','#ffd2ea',5);doodles(ctx,true);sticker(ctx,230,100,'cute moment','#fff4a8','#111',-.08);sticker(ctx,830,180,'♡','#ffd0e7','#111',.11);ctx.fillStyle='#fff';ctx.font='900 50px sans-serif';wrap(ctx,cap,80,1045,850,58,3);ctx.font='700 28px sans-serif';ctx.fillStyle='#fff2bc';ctx.fillText(track.slice(0,58),80,1228);
  } else if(t==='film'){
    ctx.fillStyle='#111';ctx.fillRect(16,16,1048,1318);ctx.save();ctx.beginPath();ctx.rect(70,55,940,1240);ctx.clip();drawImageCover(ctx,p,70,55,940,1240);ctx.restore();for(let y=85;y<1260;y+=95){rr(ctx,25,y,27,52,7,'#f8e4b3');rr(ctx,1028,y,27,52,7,'#f8e4b3');}sticker(ctx,835,105,'FILM 200',state.brand.primary,'#111');ctx.fillStyle='#fff';ctx.font='900 48px sans-serif';wrap(ctx,cap,95,1080,760,56,3);ctx.font='700 25px monospace';ctx.fillStyle='#f4e4ba';ctx.fillText(track.slice(0,58),95,1245);
  } else if(t==='birthday'){
    rr(ctx,35,35,1010,1280,42,'rgba(255,255,255,.12)','#fff0a8',5);for(let i=0;i<85;i++){ctx.fillStyle=[state.brand.primary,state.brand.accent,'#fff','#ffd4ed'][i%4];ctx.fillRect(Math.random()*980+40,Math.random()*190+40,9,28);}sticker(ctx,245,120,'HAPPY BIRTHDAY!',state.brand.primary,'#111',-.03);ctx.fillStyle='#fff';ctx.font='900 56px sans-serif';wrap(ctx,cap,80,1040,850,62,3);ctx.font='700 28px sans-serif';ctx.fillStyle='#fff6bf';ctx.fillText(track.slice(0,58),80,1232);
  } else if(t==='night'){
    const ng=ctx.createLinearGradient(0,0,1080,1350);ng.addColorStop(0,'rgba(10,20,58,.12)');ng.addColorStop(1,'rgba(255,30,120,.30)');ctx.fillStyle=ng;ctx.fillRect(0,0,1080,1350);rr(ctx,40,40,1000,1270,34,null,'rgba(101,221,255,.65)',4);ctx.shadowBlur=28;ctx.shadowColor=state.brand.accent;ctx.strokeStyle=state.brand.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(65,990);ctx.lineTo(1015,990);ctx.stroke();ctx.shadowBlur=0;sticker(ctx,215,110,'NIGHT DRIVE','#111','#fff');ctx.fillStyle='#fff';ctx.font='900 54px sans-serif';wrap(ctx,cap,78,1060,840,60,3);ctx.font='700 28px sans-serif';ctx.fillStyle='#bfefff';ctx.fillText(track.slice(0,58),78,1238);
  } else if(t==='magazine'){
    ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.strokeRect(35,35,1010,1280);ctx.fillStyle='#fff';ctx.font='900 78px sans-serif';ctx.fillText(state.brand.brandName.toUpperCase().slice(0,12),65,120);ctx.font='900 22px sans-serif';ctx.fillText('MUSIC • DRINK • MOMENT',70,165);ctx.fillStyle=state.brand.primary;ctx.fillRect(70,190,240,12);ctx.fillStyle='#fff';ctx.font='900 58px sans-serif';wrap(ctx,cap,65,1025,720,64,3);sticker(ctx,870,1050,'NEW!',state.brand.primary,'#111',.12);ctx.font='700 27px sans-serif';ctx.fillStyle='#eee';ctx.fillText(track.slice(0,58),65,1245);
  } else if(t==='korean4cut'){
    ctx.fillStyle='#f7f2ea';ctx.fillRect(42,35,996,1280);
    ctx.fillStyle='#171717';ctx.fillRect(78,62,620,1226);
    const slots=[[102,88],[102,382],[102,676],[102,970]];
    slots.forEach(([x,y],i)=>{drawImageCoverClip(ctx,p,x,y,572,256,18);ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='800 18px sans-serif';ctx.fillText(String(i+1).padStart(2,'0'),x+18,y+32);});
    ctx.fillStyle='#111';ctx.font='900 54px sans-serif';ctx.save();ctx.translate(910,1180);ctx.rotate(-Math.PI/2);ctx.fillText('4 CUT MOMENT',0,0);ctx.restore();
    ctx.font='900 31px sans-serif';wrap(ctx,cap,744,160,230,40,5);
    ctx.font='700 22px sans-serif';ctx.fillStyle='#555';wrap(ctx,track,744,445,230,31,4);
    sticker(ctx,860,920,'SEOUL VIBE',state.brand.primary,'#111',-.06);
  } else if(t==='chrome'){
    const cg=ctx.createLinearGradient(0,0,1080,1350);['#8ff7ff','#f6a8ff','#fff7aa','#a8b9ff','#8ff7ff'].forEach((v,i,a)=>cg.addColorStop(i/(a.length-1),v));
    ctx.globalAlpha=.25;ctx.fillStyle=cg;ctx.fillRect(0,0,1080,1350);ctx.globalAlpha=1;
    rr(ctx,34,34,1012,1282,54,'rgba(5,7,18,.28)','rgba(220,245,255,.82)',5);
    ctx.save();ctx.shadowBlur=24;ctx.shadowColor='#8ff7ff';ctx.strokeStyle='#f2fbff';ctx.lineWidth=4;ctx.strokeRect(66,66,948,1218);ctx.restore();
    ctx.fillStyle='#fff';ctx.font='900 72px sans-serif';ctx.fillText('CYBER',72,150);
    ctx.font='900 31px sans-serif';ctx.fillStyle='#d7fbff';ctx.fillText('Y2K / MUSIC MEMORY',74,194);
    sticker(ctx,866,122,'2000+', '#e9faff','#111',.05);
    ctx.font='900 54px sans-serif';ctx.fillStyle='#fff';wrap(ctx,cap,75,1055,820,60,3);
    ctx.font='700 27px monospace';ctx.fillStyle='#c8f5ff';ctx.fillText(track.slice(0,58),75,1240);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#fff':'#a6f3ff';ctx.font='900 40px sans-serif';ctx.fillText(i%2?'✦':'★',760+(i%3)*78,250+Math.floor(i/3)*105);}
  } else if(t==='newspaper'){
    ctx.fillStyle='#f3efe5';ctx.fillRect(35,35,1010,1280);
    ctx.fillStyle='#111';ctx.font='900 62px Georgia, serif';ctx.fillText('THE DAILY MOMENT',70,120);
    ctx.fillRect(70,145,940,5);
    ctx.font='700 20px Georgia, serif';ctx.fillText('MUSIC • DRINK • PEOPLE • TODAY',70,180);
    drawImageCoverClip(ctx,p,70,220,620,710,8);
    ctx.font='900 45px Georgia, serif';wrap(ctx,cap,720,260,260,52,5);
    ctx.font='700 21px Georgia, serif';ctx.fillStyle='#333';wrap(ctx,'A tiny headline from your drink-and-music moment. Keep this one for the story.',720,555,260,31,7);
    ctx.fillStyle='#111';ctx.fillRect(70,970,940,3);
    ctx.font='900 34px Georgia, serif';ctx.fillText((song.title||'NOW PLAYING').toUpperCase().slice(0,28),70,1025);
    ctx.font='600 24px Georgia, serif';ctx.fillText(track.slice(0,62),70,1070);
    ctx.font='700 18px monospace';ctx.fillText(new Date().toLocaleDateString('id-ID'),70,1248);
    sticker(ctx,884,1200,'EXTRA!',state.brand.primary,'#111',-.08);
  } else if(t==='digicam'){
    ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(0,0,1080,1350);
    const flash=ctx.createRadialGradient(180,170,10,180,170,620);flash.addColorStop(0,'rgba(255,255,255,.32)');flash.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=flash;ctx.fillRect(0,0,1080,900);
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=3;ctx.strokeRect(44,44,992,1262);
    ctx.fillStyle='#ff3f4d';ctx.beginPath();ctx.arc(86,92,13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='800 24px monospace';ctx.fillText('REC',112,101);
    const d=new Date();const stamp=`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(-2)}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    ctx.font='900 30px monospace';ctx.fillStyle='#ffcf57';ctx.fillText(stamp,64,1260);
    ctx.fillStyle='rgba(0,0,0,.62)';rr(ctx,62,1015,760,150,22,'rgba(0,0,0,.58)');
    ctx.fillStyle='#fff';ctx.font='900 46px sans-serif';wrap(ctx,cap,88,1070,690,51,2);
    ctx.font='700 23px monospace';ctx.fillStyle='#f6e7a7';ctx.fillText(track.slice(0,58),88,1150);
    ctx.font='800 22px monospace';ctx.fillStyle='#fff';ctx.fillText('FLASH AUTO  ISO 400  +0.3',694,100);
  } else if(t==='photodump'){
    ctx.fillStyle='#eee5d6';ctx.fillRect(28,28,1024,1294);
    ctx.fillStyle='#2f251d';ctx.font='900 54px sans-serif';ctx.fillText('PHOTO DUMP',70,110);
    ctx.font='700 22px monospace';ctx.fillText('little things worth keeping',72,145);
    ctx.save();ctx.translate(320,430);ctx.rotate(-.055);ctx.fillStyle='#fff';ctx.fillRect(-250,-270,500,570);drawImageCoverClip(ctx,p,-225,-245,450,480,8);ctx.restore();
    ctx.save();ctx.translate(760,430);ctx.rotate(.07);ctx.fillStyle='#fff';ctx.fillRect(-210,-230,420,500);drawImageCoverClip(ctx,p,-188,-208,376,402,8);ctx.restore();
    ctx.save();ctx.translate(520,900);ctx.rotate(-.025);ctx.fillStyle='#fff';ctx.fillRect(-340,-220,680,500);drawImageCoverClip(ctx,p,-312,-192,624,392,8);ctx.restore();
    sticker(ctx,204,780,'today ♡','#fff4a8','#111',-.12);sticker(ctx,875,820,'music!','#ffd5eb','#111',.09);
    ctx.fillStyle='#3c3026';ctx.font='900 40px sans-serif';wrap(ctx,cap,72,1175,820,46,2);
    ctx.font='700 23px sans-serif';ctx.fillStyle='#695646';ctx.fillText(track.slice(0,60),72,1270);
  } else if(t==='mono'){
    ctx.fillStyle='#070707';ctx.fillRect(26,26,1028,1298);
    if(p){ctx.save();ctx.filter='grayscale(1) contrast(1.08)';drawImageCoverClip(ctx,p,72,72,936,1040,20);ctx.restore();}
    const mg=ctx.createLinearGradient(0,820,0,1290);mg.addColorStop(0,'rgba(0,0,0,0)');mg.addColorStop(1,'rgba(0,0,0,.9)');ctx.fillStyle=mg;ctx.fillRect(72,780,936,510);
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(72,72,936,1218);
    ctx.fillStyle='#fff';ctx.font='500 20px monospace';ctx.fillText('MONO / STUDIO / 01',92,116);
    ctx.font='900 64px sans-serif';wrap(ctx,cap,92,1050,780,70,3);
    ctx.font='600 26px monospace';ctx.fillStyle='#d8d8d8';ctx.fillText(track.slice(0,58),92,1245);
  } else if(t==='softflash'){
    const sg=ctx.createLinearGradient(0,0,1080,1350);sg.addColorStop(0,'rgba(255,238,246,.22)');sg.addColorStop(.55,'rgba(255,255,255,.05)');sg.addColorStop(1,'rgba(255,232,206,.28)');ctx.fillStyle=sg;ctx.fillRect(0,0,1080,1350);
    ctx.save();ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(210,180,20,210,180,520);glow.addColorStop(0,'rgba(255,255,255,.55)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,900);ctx.restore();
    rr(ctx,38,38,1004,1274,48,null,'rgba(255,248,244,.82)',5);
    sticker(ctx,210,115,'soft flash','#fff1d8','#3b2b25',-.06);
    sticker(ctx,860,205,'♡','#ffd9e9','#3b2b25',.08);
    ctx.fillStyle='#fff';ctx.font='900 55px sans-serif';wrap(ctx,cap,78,1060,830,61,3);
    ctx.font='700 28px sans-serif';ctx.fillStyle='#fff8e8';ctx.fillText(track.slice(0,58),78,1240);
    ctx.font='900 38px sans-serif';ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillText('✦ diary moment',78,955);
  } else if(t==='coquette'){
    ctx.fillStyle='#fff6fb';ctx.fillRect(34,34,1012,1282);
    rr(ctx,62,62,956,1226,36,'rgba(255,244,249,.72)','rgba(246,185,215,.92)',4);
    drawImageCoverClip(ctx,p,96,118,888,934,18);
    for(const [x,y] of [[128,96],[935,96],[128,1038],[935,1038]]){ctx.fillStyle='#ffd8ea';ctx.beginPath();ctx.ellipse(x,y,34,18,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+44,y,34,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff9dc4';ctx.beginPath();ctx.arc(x+22,y,15,0,Math.PI*2);ctx.fill();}
    sticker(ctx,250,110,'coquette mood','#fff0f6','#5b3142',-.05);
    ctx.fillStyle='#6a3e51';ctx.font='900 48px serif';wrap(ctx,cap,92,1095,760,54,3);
    ctx.font='700 25px sans-serif';ctx.fillStyle='#8d6575';ctx.fillText(track.slice(0,58),92,1245);
    ctx.font='900 22px sans-serif';ctx.fillStyle='#c35b8b';ctx.fillText(state.brand.brandName.toUpperCase().slice(0,28),92,88);
  } else if(t==='dualcam'){
    const dg=ctx.createLinearGradient(0,0,1080,1350);dg.addColorStop(0,'rgba(255,250,238,.24)');dg.addColorStop(1,'rgba(206,224,255,.18)');ctx.fillStyle=dg;ctx.fillRect(0,0,1080,1350);
    rr(ctx,46,46,988,1258,42,'rgba(255,255,255,.06)','rgba(255,255,255,.24)',3);
    drawImageCoverClip(ctx,p,78,92,682,1080,28);
    ctx.save();ctx.shadowBlur=26;ctx.shadowColor='rgba(0,0,0,.24)';rr(ctx,785,165,205,270,30,'#fff');ctx.restore();drawImageCoverClip(ctx,p,800,180,175,240,22);
    rr(ctx,770,470,230,315,34,'#fff');drawImageCoverClip(ctx,p,786,486,198,283,28);
    sticker(ctx,838,115,'DUAL CAM',state.brand.primary,'#111',.04);
    sticker(ctx,855,828,'story dump','#fff0ae','#111',-.06);
    ctx.fillStyle='#fff';ctx.font='900 54px sans-serif';wrap(ctx,cap,92,1180,660,62,2);
    ctx.font='700 27px sans-serif';ctx.fillStyle='#ddd';ctx.fillText(track.slice(0,58),92,1270);
  } else if(t==='stickerbomb'){
    rr(ctx,28,28,1024,1294,54,'rgba(255,255,255,.08)','rgba(255,255,255,.22)',4);
    drawImageCoverClip(ctx,p,72,72,936,1020,32);
    const st=['WOW!','YAY!','CUTE','MEOW','PLAY','VIBE'];
    [[160,118],[875,140],[164,1030],[850,1010],[530,1020],[890,1210]].forEach(([x,y],i)=>sticker(ctx,x,y,st[i],i%2? '#ffd7e8':'#fff0ab','#111',(-0.16)+(i*0.05)));
    doodles(ctx,true);
    ctx.fillStyle='#fff';ctx.font='900 56px sans-serif';wrap(ctx,cap,88,1108,840,62,3);
    ctx.font='700 28px sans-serif';ctx.fillStyle='#fff6c7';ctx.fillText(track.slice(0,58),88,1266);
  } else if(t==='streetposter'){
    ctx.fillStyle='#e9dcc2';ctx.fillRect(24,24,1032,1302);
    for(let i=0;i<10;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.13)':'rgba(0,0,0,.04)';ctx.fillRect(48,64+i*116,984,60);}    
    ctx.save();ctx.translate(540,470);ctx.rotate(-0.03);ctx.fillStyle='#fefefe';ctx.fillRect(-350,-430,700,860);drawImageCoverClip(ctx,p,-324,-404,648,726,6);ctx.restore();
    ctx.fillStyle='rgba(255,233,160,.82)';ctx.save();ctx.translate(244,112);ctx.rotate(-.12);ctx.fillRect(-78,-18,156,36);ctx.restore();
    ctx.fillStyle='rgba(255,233,160,.82)';ctx.save();ctx.translate(842,112);ctx.rotate(.15);ctx.fillRect(-78,-18,156,36);ctx.restore();
    ctx.fillStyle='#111';ctx.font='900 68px sans-serif';wrap(ctx,cap.toUpperCase(),82,1015,920,76,2);
    ctx.font='700 28px sans-serif';ctx.fillStyle='#3d3224';ctx.fillText(track.slice(0,60),84,1205);
    sticker(ctx,850,1238,state.brand.brandName.slice(0,18),state.brand.primary,'#111',-.05);
  } else if(t==='mirror'){
    const mg=ctx.createLinearGradient(0,0,1080,1350);mg.addColorStop(0,'rgba(219,223,234,.16)');mg.addColorStop(1,'rgba(255,255,255,.03)');ctx.fillStyle=mg;ctx.fillRect(0,0,1080,1350);
    rr(ctx,46,46,988,1258,38,'rgba(255,255,255,.06)','rgba(233,238,245,.92)',4);drawImageCoverClip(ctx,p,90,110,900,960,26);
    ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=2;ctx.strokeRect(112,132,856,916);
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='900 56px sans-serif';wrap(ctx,cap,88,1128,820,62,2);ctx.font='700 27px sans-serif';ctx.fillStyle='#eef0f6';ctx.fillText(track.slice(0,58),88,1222);sticker(ctx,850,120,'mirror mood','#ffffff','#111',.03);
  } else if(t==='chatstory'){
    drawImageCoverClip(ctx,p,38,38,1004,1274,34); const grad=ctx.createLinearGradient(0,780,0,1330);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.78)');ctx.fillStyle=grad;ctx.fillRect(38,760,1004,552);
    rr(ctx,68,910,660,170,28,'rgba(255,255,255,.94)');ctx.fillStyle='#111';ctx.font='900 46px sans-serif';wrap(ctx,cap,96,970,608,52,2);rr(ctx,370,1092,300,70,35,'rgba(255,212,0,.95)');ctx.fillStyle='#111';ctx.font='800 28px sans-serif';ctx.fillText((song.title||'Now Playing').slice(0,22),400,1138);rr(ctx,704,1168,288,72,36,'rgba(255,255,255,.14)','rgba(255,255,255,.2)',2);ctx.fillStyle='#fff';ctx.font='800 24px sans-serif';ctx.fillText('reply with a story ✦',734,1214);
  } else if(t==='visionboard'){
    ctx.fillStyle='#f1e7da';ctx.fillRect(28,28,1024,1294);ctx.save();ctx.translate(275,350);ctx.rotate(-.08);ctx.fillStyle='#fff';ctx.fillRect(-180,-210,360,420);drawImageCoverClip(ctx,p,-160,-190,320,380,8);ctx.restore();ctx.save();ctx.translate(760,300);ctx.rotate(.06);ctx.fillStyle='#fff';ctx.fillRect(-170,-180,340,360);drawImageCoverClip(ctx,p,-150,-160,300,320,8);ctx.restore();ctx.save();ctx.translate(550,770);ctx.rotate(-.03);ctx.fillStyle='#fff';ctx.fillRect(-280,-210,560,420);drawImageCoverClip(ctx,p,-252,-182,504,364,8);ctx.restore();sticker(ctx,180,94,'vision board','#fff0ab','#111',-.08);sticker(ctx,884,930,'mood','#ffd9ea','#111',.06);ctx.fillStyle='#3a3029';ctx.font='900 44px sans-serif';wrap(ctx,cap,82,1165,820,52,2);ctx.font='700 24px sans-serif';ctx.fillStyle='#6a5b4e';ctx.fillText(track.slice(0,60),82,1260);
  } else if(t==='beigediary'){
    ctx.fillStyle='#efe6d8';ctx.fillRect(30,30,1020,1290);rr(ctx,72,78,936,1194,22,'rgba(255,255,255,.55)','rgba(122,93,64,.25)',2);drawImageCoverClip(ctx,p,120,162,840,760,10);ctx.fillStyle='#6c5641';ctx.font='900 26px serif';ctx.fillText(state.brand.brandName,124,126);ctx.font='900 52px serif';wrap(ctx,cap,118,1018,780,60,3);ctx.font='600 24px serif';ctx.fillStyle='#8a7460';ctx.fillText(track.slice(0,58),118,1220);ctx.strokeStyle='rgba(120,98,78,.18)';ctx.lineWidth=2;ctx.beginPath();for(let y=976;y<1244;y+=56){ctx.moveTo(118,y);ctx.lineTo(960,y);}ctx.stroke();
  } else if(t==='bdaycake'){
    const nm=birthdayName(), ag=birthdayAge();ctx.fillStyle='#fff4df';ctx.fillRect(30,30,1020,1290);drawImageCoverClip(ctx,p,82,98,916,830,30);rr(ctx,70,70,940,1200,38,null,'rgba(255,210,98,.82)',5);ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,98,965,884,270,30,'rgba(255,255,255,.9)');ctx.fillStyle='#3a281b';ctx.font='900 58px sans-serif';ctx.fillText(`HAPPY BIRTHDAY, ${nm.toUpperCase().slice(0,18)}!`,125,1045);ctx.font='800 30px sans-serif';if(ag)ctx.fillText(ag,125,1095);ctx.font='700 28px sans-serif';wrap(ctx,cap,125,1150,760,38,2);sticker(ctx,856,103,'🎂 WISH',state.brand.primary,'#111',-.04);
  } else if(t==='bdayballoon'){
    const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,'rgba(255,213,232,.32)');bg.addColorStop(1,'rgba(185,226,255,.3)');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);drawImageCoverClip(ctx,p,65,85,950,1010,34);[['🎈',100,120],['🎈',895,145],['🎈',150,1000],['🎈',910,970]].forEach(([e,x,y])=>{ctx.font='72px sans-serif';ctx.fillText(e,x,y);});rr(ctx,70,1080,940,205,30,'rgba(15,15,15,.62)');ctx.fillStyle='#fff';ctx.font='900 52px sans-serif';wrap(ctx,`Happy Birthday ${birthdayName()}!`,100,1155,800,58,2);ctx.font='700 27px sans-serif';ctx.fillStyle='#fff4bd';ctx.fillText(track.slice(0,58),100,1250);
  } else if(t==='bdaydisco'){
    ctx.fillStyle='#090913';ctx.fillRect(0,0,1080,1350);const dg=ctx.createRadialGradient(540,220,20,540,220,760);dg.addColorStop(0,'rgba(196,244,255,.35)');dg.addColorStop(.5,'rgba(255,103,205,.15)');dg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=dg;ctx.fillRect(0,0,1080,1100);drawImageCoverClip(ctx,p,92,150,896,855,26);ctx.font='105px sans-serif';ctx.fillText('🪩',470,160);ctx.fillStyle='#fff';ctx.font='900 63px sans-serif';wrap(ctx,`BIRTHDAY DISCO • ${birthdayName()}`,85,1095,900,70,2);ctx.font='700 28px sans-serif';ctx.fillStyle='#bff5ff';ctx.fillText(track.slice(0,58),85,1245);sticker(ctx,860,111,'PARTY MODE','#dffcff','#111',.06);
  } else if(t==='bdaypastel'){
    ctx.fillStyle='#fff3f8';ctx.fillRect(34,34,1012,1282);rr(ctx,62,62,956,1226,42,'rgba(255,255,255,.45)','rgba(255,188,218,.82)',4);drawImageCoverClip(ctx,p,96,125,888,850,28);sticker(ctx,210,105,'🎀 birthday diary','#fff0f6','#5b3142',-.05);sticker(ctx,880,175,'🎂','#fff7bf','#5b3142',.08);ctx.fillStyle='#6e3d54';ctx.font='900 54px serif';wrap(ctx,`happy birthday, ${birthdayName()} ♡`,92,1068,800,60,2);ctx.font='700 27px sans-serif';ctx.fillStyle='#95677b';wrap(ctx,cap,92,1190,780,37,2);
  } else if(t==='bdayy2k'){
    const yg=ctx.createLinearGradient(0,0,1080,1350);['#9df3ff','#ffb6e6','#fff0a6','#aebcff'].forEach((v,i,a)=>yg.addColorStop(i/(a.length-1),v));ctx.globalAlpha=.25;ctx.fillStyle=yg;ctx.fillRect(0,0,1080,1350);ctx.globalAlpha=1;drawImageCoverClip(ctx,p,70,80,940,1000,24);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.strokeRect(48,48,984,1254);ctx.fillStyle='#ff4664';ctx.beginPath();ctx.arc(90,92,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 24px monospace';ctx.fillText('BDAY REC',118,101);sticker(ctx,840,118,'2000s BDAY','#eafcff','#111',.04);ctx.fillStyle='#fff';ctx.font='900 58px sans-serif';wrap(ctx,`HBD ${birthdayName()} ✦`,76,1125,800,66,2);ctx.font='800 27px monospace';ctx.fillStyle='#fff5b7';ctx.fillText(track.slice(0,56),76,1252);
  } else if(t==='bdaywish'){
    ctx.fillStyle='#f4eadb';ctx.fillRect(30,30,1020,1290);drawImageCoverClip(ctx,p,80,85,920,780,20);rr(ctx,86,895,908,340,28,'rgba(255,252,245,.95)','rgba(120,91,60,.22)',2);ctx.fillStyle='#5b4635';ctx.font='900 44px serif';ctx.fillText(`FOR ${birthdayName().toUpperCase().slice(0,22)}`,120,970);ctx.font='700 29px serif';wrap(ctx,birthdayMessage(),120,1030,760,42,4);ctx.font='600 24px serif';ctx.fillStyle='#8c735d';ctx.fillText(track.slice(0,58),120,1215);sticker(ctx,855,910,'make a wish ✦','#fff0b3','#4d3a2b',-.05);
} else if(t==='cleanflash'){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(255,255,255,.20)';ctx.fillRect(0,0,1080,1350);ctx.restore();
  rr(ctx,38,38,1004,1274,34,null,'rgba(255,255,255,.72)',3);
  ctx.fillStyle='#fff';ctx.font='900 24px monospace';ctx.fillText('FLASH / AUTO',72,92);
  ctx.font='900 54px sans-serif';wrap(ctx,cap,72,1110,850,62,2);
  ctx.font='700 26px sans-serif';ctx.fillStyle='#f3f3f3';ctx.fillText(track.slice(0,58),72,1245);
} else if(t==='dreamyfilm'){
  const dg=ctx.createLinearGradient(0,0,1080,1350);dg.addColorStop(0,'rgba(255,208,228,.16)');dg.addColorStop(.5,'rgba(255,246,214,.08)');dg.addColorStop(1,'rgba(189,205,255,.16)');ctx.fillStyle=dg;ctx.fillRect(0,0,1080,1350);
  rr(ctx,46,46,988,1258,36,null,'rgba(255,244,235,.75)',4);
  sticker(ctx,190,105,'soft memories','#fff1df','#4d3d38',-.05);
  ctx.fillStyle='#fff8f3';ctx.font='900 52px serif';wrap(ctx,cap,76,1080,850,60,2);
  ctx.font='600 25px monospace';ctx.fillStyle='#ffe9df';ctx.fillText(track.slice(0,58),76,1240);
} else if(t==='socialnote'){
  const grad=ctx.createLinearGradient(0,900,0,1350);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=grad;ctx.fillRect(0,850,1080,500);
  rr(ctx,68,935,720,190,32,'rgba(248,250,255,.94)');
  ctx.fillStyle='#111';ctx.font='900 34px sans-serif';ctx.fillText('currently feeling:',98,990);
  ctx.font='900 45px sans-serif';wrap(ctx,cap,98,1045,640,52,2);
  rr(ctx,690,1160,300,72,36,'rgba(255,255,255,.16)','rgba(255,255,255,.24)',2);
  ctx.fillStyle='#fff';ctx.font='800 23px sans-serif';ctx.fillText('♫ '+(song.title||'soundtrack').slice(0,18),720,1205);
} else if(t==='songcard'){
  const sg=ctx.createLinearGradient(0,0,1080,1350);sg.addColorStop(0,'rgba(0,0,0,.05)');sg.addColorStop(1,'rgba(0,0,0,.62)');ctx.fillStyle=sg;ctx.fillRect(0,0,1080,1350);
  rr(ctx,72,930,936,315,38,'rgba(14,14,14,.88)','rgba(255,255,255,.14)',2);
  ctx.fillStyle=state.brand.primary;ctx.beginPath();ctx.arc(165,1030,58,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.font='900 42px sans-serif';ctx.textAlign='center';ctx.fillText('♫',165,1045);ctx.textAlign='left';
  ctx.fillStyle='#fff';ctx.font='900 44px sans-serif';ctx.fillText((song.title||'Now Playing').slice(0,28),255,1012);
  ctx.font='600 27px sans-serif';ctx.fillStyle='#bbb';ctx.fillText((song.artist||'Artist').slice(0,30),255,1058);
  ctx.fillStyle='#fff';ctx.font='900 38px sans-serif';wrap(ctx,cap,105,1160,820,46,2);
} else if(t==='photobooth2'){
  ctx.fillStyle='#f2ece3';ctx.fillRect(40,40,1000,1270);
  drawImageCoverClip(ctx,p,90,90,900,500,14);drawImageCoverClip(ctx,p,90,625,900,500,14);
  ctx.fillStyle='#1c1c1c';ctx.font='900 34px sans-serif';ctx.fillText('TWO SHOTS • ONE VIBE',90,1185);
  ctx.font='700 25px sans-serif';ctx.fillStyle='#5b5148';ctx.fillText(track.slice(0,60),90,1235);
} else if(t==='citynight'){
  const ng=ctx.createLinearGradient(0,0,1080,1350);ng.addColorStop(0,'rgba(10,20,55,.04)');ng.addColorStop(1,'rgba(20,0,35,.46)');ctx.fillStyle=ng;ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle='#ff4b67';ctx.beginPath();ctx.arc(78,80,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 23px monospace';ctx.fillText('CITY NIGHT • 23:48',105,88);
  ctx.font='900 56px sans-serif';wrap(ctx,cap,72,1110,850,62,2);
  ctx.font='700 27px monospace';ctx.fillStyle='#b8dcff';ctx.fillText(track.slice(0,58),72,1244);
} else if(t==='bdaycandle'){
  const cg=ctx.createRadialGradient(540,380,40,540,380,720);cg.addColorStop(0,'rgba(255,210,120,.25)');cg.addColorStop(1,'rgba(20,10,10,.35)');ctx.fillStyle=cg;ctx.fillRect(0,0,1080,1350);
  ctx.font='105px sans-serif';ctx.fillText('🕯️',470,170);
  ctx.fillStyle='#fff7df';ctx.font='900 58px serif';wrap(ctx,`happy birthday, ${birthdayName()} ✦`,78,1080,850,65,2);
  ctx.font='700 27px sans-serif';ctx.fillStyle='#ffe4aa';wrap(ctx,cap,78,1200,850,38,2);
} else if(t==='bdaygift'){
  const gg=ctx.createLinearGradient(0,0,1080,1350);gg.addColorStop(0,'rgba(255,190,220,.18)');gg.addColorStop(1,'rgba(255,235,150,.15)');ctx.fillStyle=gg;ctx.fillRect(0,0,1080,1350);
  sticker(ctx,175,105,'🎁 GIFT POP','#fff0b6','#111',-.06);
  sticker(ctx,890,160,'HBD','#ffd4e9','#111',.08);
  ctx.fillStyle='#fff';ctx.font='900 60px sans-serif';wrap(ctx,`FOR ${birthdayName().toUpperCase()}`,75,1080,860,66,2);
  ctx.font='700 28px sans-serif';ctx.fillStyle='#fff4c6';wrap(ctx,cap,75,1200,850,40,2);
  } else if(t==='brandcassette'){
    const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,state.brand.secondary);bg.addColorStop(1,brandRgba(state.brand.primary,.30));ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
    drawImageCoverClip(ctx,p,64,76,952,830,36);
    rr(ctx,62,940,956,330,38,brandRgba(state.brand.secondary,.88),brandRgba(state.brand.primary,.58),3);
    ctx.save();ctx.translate(850,1055);ctx.rotate(-.045);rr(ctx,-130,-82,260,164,34,state.brand.primary,'rgba(255,255,255,.30)',3);ctx.fillStyle=state.brand.secondary;ctx.beginPath();ctx.arc(-52,0,25,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(52,0,25,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle='#fff';ctx.font='900 42px sans-serif';ctx.fillText(state.brand.brandName.slice(0,28),92,1007);ctx.font='900 48px sans-serif';wrap(ctx,cap,92,1070,570,55,2);ctx.font='700 27px sans-serif';ctx.fillStyle=state.brand.primary;ctx.fillText(track.slice(0,46),92,1232);
  } else if(t==='brandpulse'){
    const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,state.brand.secondary);bg.addColorStop(1,'#050505');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
    drawImageCoverClip(ctx,p,58,58,964,1010,42);
    const rg=ctx.createRadialGradient(830,260,20,830,260,330);rg.addColorStop(0,brandRgba(state.brand.accent,.32));rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.fillRect(500,0,580,580);
    for(let r=64;r<=180;r+=38){ctx.strokeStyle=brandRgba(state.brand.primary,.28);ctx.lineWidth=3;ctx.beginPath();ctx.arc(830,260,r,0,Math.PI*2);ctx.stroke();}
    rr(ctx,72,1090,936,190,34,brandRgba(state.brand.secondary,.86),brandRgba(state.brand.primary,.35),2);
    ctx.fillStyle=state.brand.primary;ctx.font='900 22px sans-serif';ctx.fillText('BRAND PULSE • NOW PLAYING',100,1140);ctx.fillStyle='#fff';ctx.font='900 45px sans-serif';ctx.fillText((song.title||state.brand.brandName).slice(0,28),100,1194);ctx.font='700 25px sans-serif';ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText((song.artist||cap).slice(0,48),100,1240);
  } else if(t==='brandmeong'){
    ctx.fillStyle=state.brand.secondary;ctx.fillRect(0,0,1080,1350);drawImageCoverClip(ctx,p,54,54,972,930,42);
    rr(ctx,70,1005,940,285,38,brandRgba(state.brand.secondary,.88),brandRgba(state.brand.accent,.38),3);
    ctx.font='86px sans-serif';ctx.fillText('🐱',100,1112);
    rr(ctx,205,1035,740,105,30,brandRgba(state.brand.primary,.15),brandRgba(state.brand.primary,.35),2);
    ctx.fillStyle='#fff';ctx.font='900 33px sans-serif';ctx.fillText('MEONG DJ',240,1080);ctx.font='700 25px sans-serif';ctx.fillStyle='rgba(255,255,255,.78)';wrap(ctx,cap,240,1120,650,34,2);
    ctx.fillStyle=state.brand.primary;ctx.font='900 26px sans-serif';ctx.fillText((state.brand.brandName+' • '+track).slice(0,58),100,1248);
  } else if(t==='receipt'){
    ctx.fillStyle='rgba(248,245,236,.92)';ctx.fillRect(580,60,445,1220);ctx.fillStyle='#111';ctx.font='900 40px monospace';ctx.fillText(state.brand.brandName.toUpperCase(),620,130);ctx.font='700 22px monospace';ctx.fillText('THANKSGIVING MUSIC RECEIPT',620,175);ctx.fillText('-------------------------',620,220);ctx.font='700 25px monospace';wrap(ctx,cap,620,285,350,36,5);ctx.fillText('-------------------------',620,500);ctx.fillText(`SONG: ${(song.title||'').slice(0,17)}`,620,555);ctx.fillText(`GENRE: ${(song.genre||'').slice(0,15)}`,620,600);ctx.fillText(`RARITY: ${(song.rarity||'Common').slice(0,12)}`,620,645);ctx.fillText('-------------------------',620,700);ctx.font='900 28px monospace';ctx.fillText('ENJOY YOUR DRINK ♫',620,770);ctx.font='700 20px monospace';ctx.fillText('scan • spin • sip • share',620,825);ctx.fillStyle=state.brand.primary;ctx.fillRect(620,880,340,14);
  }
  drawPhotoBrandOverlay(ctx);

  if(state.photoShowBrandName!==false){
    state.photoBrandNameX=Math.max(0,Math.min(c.width-260,Number(state.photoBrandNameX)||76));
    state.photoBrandNameY=Math.max(42,Math.min(c.height-60,Number(state.photoBrandNameY)||1090));
    ctx.save();ctx.font=`900 ${Math.max(20,Math.min(52,Number(state.photoBrandNameSize)||34))}px sans-serif`;ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=10;ctx.fillText((state.brand.brandName||'Brand').slice(0,28),state.photoBrandNameX,state.photoBrandNameY);ctx.restore();
  }
  if(state.photoShowBrandCaption!==false){
    state.photoCaptionX=Math.max(0,Math.min(c.width-340,Number(state.photoCaptionX)||76));
    state.photoCaptionY=Math.max(48,Math.min(c.height-42,Number(state.photoCaptionY)||1160));
    ctx.save();ctx.font=`700 ${Math.max(16,Math.min(38,Number(state.photoCaptionSize)||25))}px sans-serif`;ctx.fillStyle='rgba(255,255,255,.84)';ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=8;ctx.fillText((state.brand.tagline||state.brand.caption||'').slice(0,48),state.photoCaptionX,state.photoCaptionY);ctx.restore();
  }

  if(state.photoShowLogo!==false)try{
    const l=await image(logo());
    const size=Math.max(64,Math.min(180,Number(state.photoLogoSize)||104));
    const x=Math.max(0,Math.min(c.width-size,Number(state.photoLogoX)||0));
    const y=Math.max(0,Math.min(c.height-size,Number(state.photoLogoY)||0));
    state.photoLogoX=x; state.photoLogoY=y; state.photoLogoSize=size;
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.22)';
    ctx.shadowBlur=12;
    ctx.drawImage(l,x,y,size,size);
    ctx.restore();
  }catch{}
}

function bindPhotoLogoDrag(){
  const c=$('#final');if(!c)return;
  let dragging='',offsetX=0,offsetY=0;
  const point=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)};};
  const hit=p=>{
    if(state.photoShowLogo!==false){const s=Number(state.photoLogoSize)||104;if(p.x>=state.photoLogoX&&p.x<=state.photoLogoX+s&&p.y>=state.photoLogoY&&p.y<=state.photoLogoY+s)return'logo';}
    if(state.photoShowBrandName!==false&&p.x>=state.photoBrandNameX&&p.x<=state.photoBrandNameX+390&&p.y>=state.photoBrandNameY-42&&p.y<=state.photoBrandNameY+16)return'name';
    if(state.photoShowBrandCaption!==false&&p.x>=state.photoCaptionX&&p.x<=state.photoCaptionX+500&&p.y>=state.photoCaptionY-34&&p.y<=state.photoCaptionY+14)return'caption';
    return'';
  };
  c.onpointerdown=e=>{const p=point(e),t=hit(p);if(!t)return;dragging=t;const x=t==='logo'?state.photoLogoX:t==='name'?state.photoBrandNameX:state.photoCaptionX;const y=t==='logo'?state.photoLogoY:t==='name'?state.photoBrandNameY:state.photoCaptionY;offsetX=p.x-x;offsetY=p.y-y;c.setPointerCapture?.(e.pointerId);c.classList.add('is-dragging-logo');e.preventDefault();};
  c.onpointermove=e=>{const p=point(e);if(!dragging){c.classList.toggle('logo-hover',Boolean(hit(p)));return;}if(dragging==='logo'){const s=Number(state.photoLogoSize)||104;state.photoLogoX=Math.max(0,Math.min(c.width-s,p.x-offsetX));state.photoLogoY=Math.max(0,Math.min(c.height-s,p.y-offsetY));}else if(dragging==='name'){state.photoBrandNameX=Math.max(0,Math.min(c.width-260,p.x-offsetX));state.photoBrandNameY=Math.max(42,Math.min(c.height-24,p.y-offsetY));}else{state.photoCaptionX=Math.max(0,Math.min(c.width-340,p.x-offsetX));state.photoCaptionY=Math.max(34,Math.min(c.height-18,p.y-offsetY));}drawFrame();e.preventDefault();};
  const stop=e=>{if(!dragging)return;dragging='';c.classList.remove('is-dragging-logo');try{c.releasePointerCapture?.(e.pointerId);}catch{}};
  c.onpointerup=stop;c.onpointercancel=stop;
}

function renderPhotoEditor(){
  stopLobbyAmbient({fade:true});
  const tmpls=enabledTemplates(); const start=state.campaign.photoCaption||state.brand.caption;
  appEl.innerHTML=`<main class="shell"><section class="phone customer-page photo-editor"><div class="topbar"><button class="icon-btn" id="back">←</button><b>Preview & Edit</b><div class="round-icon">✨</div></div>${compactNowPlaying('editorMusicToggle')}${captureFormatPickerMarkup('photo')}${photoAssetControlsMarkup()}<canvas id="final" width="1080" height="1350"></canvas><div class="photo-logo-hint">☝️ Logo, nama brand, dan caption branding bisa digeser langsung. Semua otomatis dikunci supaya nggak keluar dari foto.</div><div class="field"><label>Caption</label><textarea id="caption" rows="3">${esc(start)}</textarea></div><div class="template-carousel small-cards">${tmpls.map(([id,name,desc])=>`<button class="template-chip ${id===state.template?'active':''}" data-t="${id}"><div class="template-preview p-${id}"></div><b>${esc(name)}</b><span>${esc(desc)}</span></button>`).join('')}</div><button class="btn primary block" id="share">Simpan / Share</button></section></main>`;
  bindCompactPlayer('editorMusicToggle');
  bindPhotoLogoDrag();
  $('#back').onclick=renderCamera;
  $('#caption').oninput=drawFrame;
  $$('.template-chip').forEach(b=>b.onclick=()=>{state.template=b.dataset.t;$$('.template-chip').forEach(x=>x.classList.toggle('active',x===b));drawFrame();});
  $$('[data-capture-format]').forEach(b=>b.onclick=()=>{state.captureFormat=b.dataset.captureFormat;$$('[data-capture-format]').forEach(x=>x.classList.toggle('active',x===b));});
  $('#photoShowLogo').onchange=e=>{state.photoShowLogo=e.target.checked;drawFrame();};
  $('#photoShowBrandName').onchange=e=>{state.photoShowBrandName=e.target.checked;drawFrame();};
  $('#photoShowBrandCaption').onchange=e=>{state.photoShowBrandCaption=e.target.checked;drawFrame();};
  $('#share').onclick=sharePhoto;
  drawFrame();
}
async function sharePhoto(){
  const c=await photoExportCanvas();if(!c)return;
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.94)),meta=captureFormatMeta(),file=new File([blob],`${state.brand.appName}-${meta.id}-${Date.now()}.jpg`,{type:'image/jpeg'});
  event('share',state.campaign.id);
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:state.brand.appName,text:$('#caption').value});return;}catch(e){if(e?.name==='AbortError')return;}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}

function renderAdminGate(){
  if(!coreConfigured) return renderSetup(true);

  let resolved=false;
  const fallback=setTimeout(()=>{
    if(resolved) return;
    console.warn('Auth state lambat, tampilkan login fallback.');
    renderLogin();
  },4500);

  onAuthStateChanged(
    auth,
    u=>{
      resolved=true;
      clearTimeout(fallback);
      state.user=u;
      if(u) renderAdmin();
      else renderLogin();
    },
    e=>{
      resolved=true;
      clearTimeout(fallback);
      console.error('Auth state error:',e);
      renderLogin();
      const err=$('#err');
      if(err) err.textContent='Auth gagal dimuat. Refresh atau cek koneksi.';
    }
  );
}
function renderLogin(){
  appEl.innerHTML=`<div class="login-card"><div class="setup-orb"></div><div class="brand login-brand"><img src="${esc(logo())}"><div><h2>${esc(state.brand.appName)} Admin</h2><span>Private Studio</span></div></div><div class="field"><label>Email</label><input id="email" type="email" autocomplete="email"></div><div class="field"><label>Password</label><input id="pass" type="password" autocomplete="current-password"></div><button class="btn primary block" id="login">Masuk</button><div id="err" class="tiny error-text"></div></div>`;
  $('#login').onclick=async()=>{try{await signInWithEmailAndPassword(auth,$('#email').value,$('#pass').value);}catch(e){$('#err').textContent='Login gagal: '+e.code;}};
}
function renderAdmin(){
  appEl.innerHTML=`<div class="admin-layout"><aside class="sidebar"><div class="brand side-brand"><img src="${esc(logo())}"><div><b>${esc(state.brand.appName)}</b><span>Admin Studio</span></div></div><nav class="nav"><button class="active" data-tab="home">⌂<span>Home</span></button><button data-tab="brand">✦<span>Brand</span></button><button data-tab="songs">♫<span>Musik</span></button><button data-tab="commerce">◆<span>Menu & Launch</span></button><button data-tab="storage">◉<span>Storage</span></button><button data-tab="qr">▦<span>QR</span></button><button data-tab="captions">✎<span>Caption</span></button><button data-tab="campaigns">◫<span>List QR</span></button><button data-tab="stats">↗<span>Stat</span></button></nav><button class="btn ghost block logout" id="logout">Keluar</button></aside><main class="admin-main"><header class="admin-header"><div class="admin-heading"><div class="eyebrow">THANKSGIVING ${VERSION}</div><h1 id="adminTitle">Dashboard</h1></div><div class="admin-header-actions"><a class="btn ghost customer-view-link" href="${baseUrl()}"><span class="desktop-label">Customer View</span><span class="mobile-label">View</span></a><button class="btn ghost mobile-logout" id="mobileLogout" type="button">Keluar</button></div></header><div id="adminContent"></div></main></div>`;
  $$('.nav button').forEach(b=>b.onclick=()=>{$$('.nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');adminTab(b.dataset.tab);});
  $('#logout').onclick=()=>signOut(auth);
  const mobileLogout=$('#mobileLogout'); if(mobileLogout) mobileLogout.onclick=()=>signOut(auth);
  adminTab('home');
}
function setAdminTitle(t){const el=$('#adminTitle');if(el)el.textContent=t;}
function adminTab(t){if(t==='home')homeTab();if(t==='brand')brandTab();if(t==='songs')songsTab();if(t==='commerce')commerceTab();if(t==='storage')storageTab();if(t==='qr')qrTab();if(t==='captions')captionsTab();if(t==='campaigns')campaignsTab();if(t==='stats')statsTab();}

async function homeTab(){setAdminTitle('Dashboard');const [songs,camps,events]=await Promise.all([getDocs(collection(db,'songs')).catch(()=>({docs:[]})),getDocs(collection(db,'campaigns')).catch(()=>({docs:[]})),getDocs(query(collection(db,'events'),orderBy('createdAt','desc'),limit(200))).catch(()=>({docs:[]}))]);const ev=events.docs.map(d=>d.data());const count=t=>ev.filter(e=>e.type===t).length;$('#adminContent').innerHTML=`<div class="dash-grid"><div class="metric"><span>Lagu</span><b>${songs.docs.length}</b><em>library</em></div><div class="metric"><span>QR</span><b>${camps.docs.length}</b><em>created</em></div><div class="metric"><span>Scan</span><b>${count('scan')}</b><em>latest 200 events</em></div><div class="metric"><span>Share</span><b>${count('share')}</b><em>latest 200 events</em></div></div><div class="grid two"><section class="card"><h3>System Status</h3><div class="status-row"><span>Firebase Auth</span><b class="ok">Connected</b></div><div class="status-row"><span>Firestore</span><b class="ok">Connected</b></div><div class="status-row"><span>Realtime Audio</span><b class="${rtdbConfigured?'ok':'warn'}">${rtdbConfigured?'Connected':'Setup needed'}</b></div><div class="notice">Full music upload memakai Realtime Database supaya tetap Spark / 0 billing. Customer baru mengunduh audio ketika tombol Play ditekan.</div></section><section class="card"><h3>Quick Start</h3><div class="quick-list"><button data-go="songs">1. Tambah musik</button><button data-go="brand">2. Atur vibe & template</button><button data-go="qr">3. Generate QR</button><button data-go="campaigns">4. Test customer link</button></div></section></div>`;$$('[data-go]').forEach(b=>b.onclick=()=>{const tab=b.dataset.go;const n=$(`.nav button[data-tab="${tab}"]`);if(n)n.click();});}

function hexToRgb(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');const n=parseInt(hex,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbToHex([r,g,b]){return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
async function autoPalette(dataUrl){const i=await image(dataUrl);const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.drawImage(i,0,0,64,64);const data=x.getImageData(0,0,64,64).data;let total=[0,0,0],n=0;for(let k=0;k<data.length;k+=16){const a=data[k+3];if(a<100)continue;const rgb=[data[k],data[k+1],data[k+2]];const lum=(rgb[0]+rgb[1]+rgb[2])/3;if(lum<25||lum>245)continue;total=total.map((v,j)=>v+rgb[j]);n++;}if(!n)return null;const avg=total.map(v=>v/n);const primary=rgbToHex(avg);const accent=rgbToHex(avg.map((v,i)=>i===0?Math.min(255,v+55):i===2?Math.min(255,v+35):Math.max(0,v-15)));return[primary,'#0b0b0b',accent];}
async function compressImage(file,max=440,q=.80){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/webp',q));};i.onerror=rej;i.src=r.result;};r.onerror=rej;r.readAsDataURL(file);});}
async function brandTab(){setAdminTitle('Brand & Vibe');const templates=templateMeta;$('#adminContent').innerHTML=`<div class="grid two"><section class="card"><h3>Brand Kit</h3><div class="brand-upload"><img id="logoPreview" src="${esc(logo())}"><div><label class="btn ghost">Upload logo<input id="logoFile" type="file" accept="image/*" hidden></label><button class="btn ghost" id="autoColors">Auto warna dari logo</button></div></div><div class="field"><label>Logo URL / data</label><input id="logoUrl" value="${esc(logo())}"></div><div class="grid two compact"><div class="field"><label>Nama brand</label><input id="brandName" value="${esc(state.brand.brandName)}"></div><div class="field"><label>Nama experience</label><input id="appName" value="${esc(state.brand.appName)}"></div></div><div class="field"><label>Tagline</label><input id="tagline" value="${esc(state.brand.tagline)}"></div><div class="field"><label>Caption default</label><input id="caption" value="${esc(state.brand.caption)}"></div><div class="color-grid"><div class="field"><label>Primary</label><input id="primary" type="color" value="${esc(state.brand.primary)}"></div><div class="field"><label>Background</label><input id="secondary" type="color" value="${esc(state.brand.secondary)}"></div><div class="field"><label>Accent</label><input id="accent" type="color" value="${esc(state.brand.accent)}"></div></div><div class="field"><label>Genre aktif (pisahkan koma)</label><input id="genres" value="${esc((state.brand.enabledGenres||defaultBrand.enabledGenres).join(', '))}"></div>
<div class="experience-admin-box">
  <div class="section-head compact-head"><div><h4>✨ Experience Controls</h4><p class="tiny">Atur fitur yang benar-benar muncul ke customer.</p></div></div>
  <div class="experience-switch-grid">
    <label class="experience-switch"><input id="menuFeatureEnabled" type="checkbox" ${state.brand.menuFeatureEnabled!==false?'checked':''}><span><b>Menu & Harga</b><small>Tampilkan tombol Menu & Harga di customer.</small></span></label>
    <label class="experience-switch"><input id="userOccasionPickerEnabled" type="checkbox" ${state.brand.userOccasionPickerEnabled!==false?'checked':''}><span><b>User pilih Occasion</b><small>Customer boleh mengganti vibe occasion sendiri.</small></span></label>
  </div>
  <div class="occasion-admin-list">
    <small>OCCASION YANG BOLEH DIPILIH USER</small>
    <div class="occasion-admin-grid">${occasionOrder.map(id=>`<label><input type="checkbox" data-user-occasion-admin="${id}" ${(state.brand.enabledUserOccasions||occasionOrder).includes(id)?'checked':''}><span>${esc(occasionCatalog[id].picker)}</span></label>`).join('')}</div>
  </div>
</div>
<div class="sound-admin-box"><div class="section-head compact-head"><div><h4>🔊 Meong Soundscape</h4><p class="tiny">Lobby ambience khusus halaman awal/menu. File ini tidak masuk Music Library dan tidak akan pernah ikut genre/gacha.</p></div></div><div class="grid two compact"><div class="field"><label><input id="lobbySoundEnabled" type="checkbox" ${state.brand.lobbySoundEnabled!==false?'checked':''}> Lobby ambience</label></div><div class="field"><label><input id="sfxEnabled" type="checkbox" ${state.brand.sfxEnabled!==false?'checked':''}> Click & gacha SFX</label></div></div><div class="lobby-upload-card">
  <div class="lobby-upload-icon">♪</div>
  <div class="lobby-upload-copy">
    <div class="lobby-title-row">
      <small>LOBBY AUDIO</small>
      <span id="lobbySaveStatus" class="lobby-save-status ${state.brand.lobbyAudioRef?'saved':'empty'}">${state.brand.lobbyAudioRef?'✓ Tersimpan':'Belum ada file'}</span>
    </div>
    <b id="lobbyFileName">${esc(state.brand.lobbyAudioFilename||'Belum ada file lobby')}</b>
    <span id="lobbyFileInfo">${state.brand.lobbyAudioSize?fmtBytes(state.brand.lobbyAudioSize):'Upload MP3/audio khusus lobby • maks '+fmtBytes(MAX_AUDIO_BYTES)}</span>
  </div>
  <label class="btn ghost lobby-upload-btn">Pilih file<input id="lobbyAudioFile" type="file" accept="audio/*" hidden></label>
</div>
<div class="row wrap lobby-upload-actions">
  <button class="btn primary" id="saveLobbyUpload" type="button" disabled>💾 Simpan musik lobby</button>
  <button class="btn ghost" id="testLobbySound" type="button">▶ Test lobby</button>
  <button class="btn ghost" id="removeLobbyUpload" type="button" ${state.brand.lobbyAudioRef?'':'disabled'}>Hapus</button>
  <button class="btn ghost" id="testGachaSfx" type="button">🎲 Test SFX</button>
</div>
<div class="lobby-save-help" id="lobbySaveHelp">${state.brand.lobbyAudioRef?'File lobby aktif. Kalau pilih file baru, tekan “Simpan musik lobby”.':'Pilih file dulu, lalu tekan “Simpan musik lobby”.'}</div><details class="lobby-advanced"><summary>Advanced: URL/path fallback</summary><div class="field"><label>Lobby music URL/path</label><input id="lobbyMusicUrl" value="${esc(state.brand.lobbyMusicUrl||'')}" placeholder="assets/audio/lobby.mp3"><span class="tiny">Hanya dipakai kalau tidak ada file lobby yang di-upload.</span></div></details><div class="grid two compact"><div class="field"><label>Lobby volume <b id="lobbyVolumeValue">${Math.round(clamp01(state.brand.lobbyVolume??.72,.72)*100)}%</b></label><input id="lobbyVolume" type="range" min="0" max="1" step="0.01" value="${clamp01(state.brand.lobbyVolume??.72,.72)}"></div><div class="field"><label>SFX volume <b id="sfxVolumeValue">${Math.round(clamp01(state.brand.sfxVolume??.18,.18)*100)}%</b></label><input id="sfxVolume" type="range" min="0" max="1" step="0.01" value="${clamp01(state.brand.sfxVolume??.18,.18)}"></div></div><div class="tiny lobby-admin-hint">Lobby output sekarang diboost otomatis supaya file yang mastering-nya pelan tetap kedengeran jelas.</div></div><div class="meong-admin-box"><div class="section-head compact-head"><div><h4>🐱 Meong DJ — saat musik berputar</h4><p class="tiny">Satu kalimat per baris. Bisa pakai <code>{brand}</code>, <code>{song}</code>, dan <code>{genre}</code>.</p></div></div><div class="field"><label>Kalimat ragebait / teman soundtrack</label><textarea id="meongPlayingLines" rows="7">${esc((state.brand.meongPlayingLines||defaultBrand.meongPlayingLines).join('\n'))}</textarea></div><div class="field"><label>Reminder balik beli</label><input id="meongReturnLine" value="${esc(state.brand.meongReturnLine||defaultBrand.meongReturnLine)}" placeholder="Jangan lupa beli lagi di {brand} ya 😼🧋"></div><div class="field"><label>Kalimat saat lagu di-pause</label><input id="meongPausedLine" value="${esc(state.brand.meongPausedLine||defaultBrand.meongPausedLine)}"></div><div class="field"><label>Kalimat Meong khusus Birthday</label><textarea id="birthdayMeongLines" rows="6">${esc((state.brand.birthdayMeongLines||defaultBrand.birthdayMeongLines).join('\n'))}</textarea><span class="tiny">Bisa pakai {name}, {age}, {brand}, {song}, {genre}.</span></div></div><button class="btn primary block" id="saveBrand">Simpan Brand</button></section><section class="card"><h3>Vibe Presets</h3><div class="preset-grid"><button data-p="playful" style="--p:#ffd400;--s:#0b0b0b;--a:#ff6ea9">Playful</button><button data-p="cute" style="--p:#ff8fb5;--s:#211521;--a:#c6a0ff">Cute</button><button data-p="natural" style="--p:#76b76a;--s:#102317;--a:#d2efb4">Natural</button><button data-p="retro" style="--p:#d3a06c;--s:#24170e;--a:#f2cf91">Retro</button><button data-p="future" style="--p:#ff315f;--s:#090d2c;--a:#3bdcff">Future</button><button data-p="elegant" style="--p:#c5a880;--s:#181510;--a:#eee4d2">Elegant</button></div>
<h3 class="mt">Hero Experience Studio</h3>
<p class="tiny">Atur visual besar di halaman user: minuman, makanan, atau kombinasi. Semua warna otomatis mengikuti Brand Kit.</p>
<div class="hero-admin-studio">
  <label class="experience-switch"><input id="heroExperienceEnabled" type="checkbox" ${state.brand.heroExperienceEnabled!==false?'checked':''}><span><b>Aktifkan Hero Experience</b><small>Kalau OFF, hero visual disembunyikan tapi flow customer tetap jalan.</small></span></label>

  <div class="grid two compact">
    <div class="field"><label>Tipe bisnis / konten</label><select id="heroType">
      <option value="drink" ${(state.brand.heroType||'drink')==='drink'?'selected':''}>🧋 Drink</option>
      <option value="food" ${state.brand.heroType==='food'?'selected':''}>🍽️ Food</option>
      <option value="combo" ${state.brand.heroType==='combo'?'selected':''}>🍽️ + 🧋 Food & Drink</option>
    </select></div>
    <div class="field"><label>Cara pilih model</label><select id="heroRotationMode">
      <option value="fixed" ${(state.brand.heroRotationMode||'fixed')==='fixed'?'selected':''}>Fixed model</option>
      <option value="random" ${state.brand.heroRotationMode==='random'?'selected':''}>Random dari model aktif</option>
    </select></div>
  </div>

  <div class="field"><label>Model utama</label><select id="heroModel">${heroModelCatalog.map(m=>`<option value="${m.id}" ${state.brand.heroModel===m.id?'selected':''}>${m.type==='food'?'🍽️':m.type==='combo'?'🍽️🧋':'🧋'} ${esc(m.name)}</option>`).join('')}</select></div>

  <div class="hero-admin-library">
    <div class="section-head compact-head"><div><h4>Model Library</h4><p class="tiny">Centang model yang boleh dipakai. Tap preview untuk menjadikannya model utama.</p></div></div>
    <div class="hero-admin-model-grid">${heroAdminModelCards()}</div>
  </div>

  <div class="grid two compact">
    <div class="field"><label>Headline custom <span class="tiny">(opsional)</span></label><input id="heroHeadline" value="${esc(state.brand.heroHeadline||'')}" placeholder="Kosong = otomatis sesuai Drink/Food/Combo"></div>
    <div class="field"><label>Kalimat Meong <span class="tiny">(opsional)</span></label><input id="heroBubble" value="${esc(state.brand.heroBubble||'')}" placeholder="Kosong = otomatis sesuai tipe hero"></div>
  </div>

  <div class="grid three compact hero-element-switches">
    <label class="experience-switch mini"><input id="heroShowPhone" type="checkbox" ${state.brand.heroShowPhone!==false?'checked':''}><span><b>Phone Player</b></span></label>
    <label class="experience-switch mini"><input id="heroShowTicket" type="checkbox" ${state.brand.heroShowTicket!==false?'checked':''}><span><b>Order Card</b></span></label>
    <label class="experience-switch mini"><input id="heroShowMeong" type="checkbox" ${state.brand.heroShowMeong!==false?'checked':''}><span><b>Meong Bubble</b></span></label>
  </div>
</div>
<h3 class="mt">Photo Branding</h3>
<div class="photo-branding-admin">
  <div class="photo-branding-preview ${photoBrandingClass()}" id="photoBrandingPreview">
    <div class="photo-branding-preview-art"><img src="${esc(logo())}"><span>${esc(state.brand.photoBrandingLabel||state.brand.appName||'THANKSGIVING')}</span></div>
    <div><b>${esc(state.brand.brandName)}</b><small>${esc(state.brand.tagline||'')}</small></div>
  </div>
  <label class="experience-switch"><input id="photoBrandingEnabled" type="checkbox" ${state.brand.photoBrandingEnabled!==false?'checked':''}><span><b>Branding di semua template</b><small>Warna, nama brand, dan tagline otomatis mengikuti Brand Kit.</small></span></label>
  <div class="grid two compact">
    <div class="field"><label>Gaya branding</label><select id="photoBrandingStyle"><option value="frame" ${state.brand.photoBrandingStyle==='frame'?'selected':''}>Frame</option><option value="ribbon" ${state.brand.photoBrandingStyle==='ribbon'?'selected':''}>Ribbon</option><option value="stamp" ${state.brand.photoBrandingStyle==='stamp'?'selected':''}>Stamp</option></select></div>
    <div class="field"><label>Ketegasan</label><select id="photoBrandingStrength"><option value="subtle" ${state.brand.photoBrandingStrength==='subtle'?'selected':''}>Subtle</option><option value="balanced" ${state.brand.photoBrandingStrength==='balanced'?'selected':''}>Balanced</option><option value="bold" ${(state.brand.photoBrandingStrength||'bold')==='bold'?'selected':''}>Bold</option></select></div>
  </div>
  <div class="field"><label>Brand stamp / label</label><input id="photoBrandingLabel" value="${esc(state.brand.photoBrandingLabel||state.brand.appName||'THANKSGIVING')}" placeholder="THANKSGIVING"></div>
  <div class="grid two compact">
    <label class="experience-switch mini"><input id="photoBrandingShowName" type="checkbox" ${state.brand.photoBrandingShowName!==false?'checked':''}><span><b>Nama brand</b></span></label>
    <label class="experience-switch mini"><input id="photoBrandingShowTagline" type="checkbox" ${state.brand.photoBrandingShowTagline!==false?'checked':''}><span><b>Tagline</b></span></label>
  </div>
</div>
<h3 class="mt">Photo Templates</h3><p class="tiny">Aktifkan yang ingin muncul di customer.</p><div class="template-toggle-grid">${templates.map(([id,name,desc])=>`<label class="template-toggle"><input type="checkbox" data-template="${id}" ${(state.brand.enabledTemplates||defaultBrand.enabledTemplates).includes(id)?'checked':''}><div class="template-preview p-${id}"></div><b>${esc(name)}</b><span>${esc(desc)}</span></label>`).join('')}</div></section></div>`;
  const presets={playful:['#ffd400','#0b0b0b','#ff6ea9'],cute:['#ff8fb5','#211521','#c6a0ff'],natural:['#76b76a','#102317','#d2efb4'],retro:['#d3a06c','#24170e','#f2cf91'],future:['#ff315f','#090d2c','#3bdcff'],elegant:['#c5a880','#181510','#eee4d2']};
  let uploadedData='';
  $('#logoFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;uploadedData=await compressImage(f);$('#logoPreview').src=uploadedData;$('#logoUrl').value=uploadedData;};
  $('#autoColors').onclick=async()=>{try{const p=await autoPalette($('#logoPreview').src);if(!p)return toast('Warna logo tidak terbaca.');$('#primary').value=p[0];$('#secondary').value=p[1];$('#accent').value=p[2];}catch{toast('Gagal membaca warna logo.');}};
  $$('.preset-grid button').forEach(b=>b.onclick=()=>{const p=presets[b.dataset.p];$('#primary').value=p[0];$('#secondary').value=p[1];$('#accent').value=p[2];});
  const syncHeroAdminSelection=(id)=>{
    if(!id)return;
    $('#heroModel').value=id;
    const meta=heroModelMeta(id);
    $('#heroType').value=meta.type;
    $$('[data-hero-admin-card]').forEach(card=>card.classList.toggle('selected',card.dataset.heroAdminCard===id));
  };
  $$('[data-hero-set-model]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();syncHeroAdminSelection(btn.dataset.heroSetModel);playUiSfx('click');});
  $('#heroModel').onchange=e=>syncHeroAdminSelection(e.target.value);
  const lobbyRange=$('#lobbyVolume'),sfxRange=$('#sfxVolume'),lobbyFile=$('#lobbyAudioFile');
  if(lobbyRange) lobbyRange.oninput=()=>$('#lobbyVolumeValue').textContent=`${Math.round(Number(lobbyRange.value)*100)}%`;
  if(sfxRange) sfxRange.oninput=()=>$('#sfxVolumeValue').textContent=`${Math.round(Number(sfxRange.value)*100)}%`;

  if(lobbyFile) lobbyFile.onchange=()=>{
    const f=lobbyFile.files?.[0];
    if(!f) return;
    if(f.size>MAX_AUDIO_BYTES){
      lobbyFile.value='';
      return toast(`File lobby terlalu besar. Maks ${fmtBytes(MAX_AUDIO_BYTES)}.`);
    }
    $('#lobbyFileName').textContent=f.name;
    $('#lobbyFileInfo').textContent=`${fmtBytes(f.size)} • siap disimpan • khusus lobby`;
    const st=$('#lobbySaveStatus');
    st.textContent='Belum disimpan';
    st.className='lobby-save-status pending';
    $('#saveLobbyUpload').disabled=false;
    $('#lobbySaveHelp').textContent='File baru dipilih. Tekan “Simpan musik lobby” supaya mengganti lobby yang aktif.';
  };

  $('#saveLobbyUpload').onclick=async()=>{
    const f=lobbyFile?.files?.[0];
    if(!f) return toast('Pilih file lobby dulu.');
    if(!rtdbConfigured||!rtdb) return toast('Realtime Database belum disetup.');
    if(f.size>MAX_AUDIO_BYTES) return toast(`File lobby terlalu besar. Maks ${fmtBytes(MAX_AUDIO_BYTES)}.`);

    const btn=$('#saveLobbyUpload');
    btn.disabled=true;
    const old=btn.textContent;
    btn.textContent='Menyimpan…';

    try{
      const fixedLobbyRef='__meong_lobby__';
      stopLobbyAmbient({fade:false});
      await saveAudioToRtdb(fixedLobbyRef,f);

      const patch={
        lobbyAudioRef:fixedLobbyRef,
        lobbyAudioFilename:f.name,
        lobbyAudioSize:f.size,
        lobbySoundEnabled:$('#lobbySoundEnabled').checked,
        lobbyVolume:Number($('#lobbyVolume').value),
        updatedAt:serverTimestamp()
      };
      await setDoc(doc(db,'public','brand'),patch,{merge:true});
      state.brand={...state.brand,...patch};
      lobbyLastUrl='';
      lobbyFile.value='';

      $('#lobbySaveStatus').textContent='✓ Tersimpan';
      $('#lobbySaveStatus').className='lobby-save-status saved';
      $('#lobbyFileInfo').textContent=`${fmtBytes(f.size)} • aktif sebagai musik lobby`;
      $('#lobbySaveHelp').textContent='File ini sekarang aktif sebagai musik lobby.';
      $('#removeLobbyUpload').disabled=false;

      toast('Musik lobby berhasil diganti dan disimpan.');
    }catch(e){
      $('#lobbySaveStatus').textContent='Gagal disimpan';
      $('#lobbySaveStatus').className='lobby-save-status error';
      toast(e.message||'Gagal menyimpan musik lobby.');
      btn.disabled=false;
    }finally{
      btn.textContent=old;
    }
  };

  $('#removeLobbyUpload').onclick=async()=>{
    if(!state.brand.lobbyAudioRef) return;
    if(!confirm('Hapus file musik lobby yang di-upload?')) return;
    try{
      stopLobbyAmbient({fade:false});
      await rtdbRemove(dbRef(rtdb,`audio/${state.brand.lobbyAudioRef}`));
      const patch={lobbyAudioRef:'',lobbyAudioFilename:'',lobbyAudioSize:0,updatedAt:serverTimestamp()};
      await setDoc(doc(db,'public','brand'),patch,{merge:true});
      state.brand={...state.brand,...patch};
      lobbyLastUrl='';
      toast('File lobby dihapus. Built-in ambience/fallback URL akan dipakai.');
      brandTab();
    }catch(e){toast(e.message||'Gagal menghapus lobby.');}
  };

  $('#testLobbySound').onclick=async()=>{
    await unlockSoundscape();
    const f=lobbyFile?.files?.[0];
    if(f){
      if(f.size>MAX_AUDIO_BYTES) return toast(`File lobby terlalu besar. Maks ${fmtBytes(MAX_AUDIO_BYTES)}.`);
      stopLobbySynth();
      const tempUrl=URL.createObjectURL(f);
      lobbyPlayer.src=tempUrl;
      lobbyLastUrl='preview-upload';
      lobbyPlayer.volume=effectiveLobbyVolume(Number($('#lobbyVolume').value));
      lobbyWanted=true;
      try{await lobbyPlayer.play();}catch{}
      setTimeout(()=>URL.revokeObjectURL(tempUrl),120000);
      return toast(`Preview lobby aktif • slider ${Math.round(Number($('#lobbyVolume').value)*100)}% • output diboost otomatis.`);
    }

    state.brand.lobbySoundEnabled=$('#lobbySoundEnabled').checked;
    state.brand.lobbyVolume=Number($('#lobbyVolume').value);
    state.brand.lobbyMusicUrl=$('#lobbyMusicUrl').value.trim();
    lobbyWanted=true;
    lobbyLastUrl='';
    await startLobbyAmbient();
    toast(`Lobby sound test aktif • slider ${Math.round(Number($('#lobbyVolume').value)*100)}% • output diboost otomatis.`);
  };

  $('#testGachaSfx').onclick=async()=>{
    await unlockSoundscape();
    state.brand.sfxEnabled=$('#sfxEnabled').checked;
    state.brand.sfxVolume=Number($('#sfxVolume').value);
    playUiSfx('gacha');
  };
  $('#saveBrand').onclick=async()=>{
    const btn=$('#saveBrand');
    btn.disabled=true;
    const oldText=btn.textContent;
    btn.textContent='Menyimpan…';
    try{
      const enabledTemplates=$$('[data-template]:checked').map(x=>x.dataset.template);
      const enabledHeroModels=$$('[data-hero-model-enabled]:checked').map(x=>x.dataset.heroModelEnabled);
      const enabledGenres=$('#genres').value.split(',').map(x=>x.trim()).filter(Boolean);
      const meongPlayingLines=$('#meongPlayingLines').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      const birthdayMeongLines=$('#birthdayMeongLines').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      const enabledUserOccasions=$$('[data-user-occasion-admin]:checked').map(x=>x.dataset.userOccasionAdmin);

      let lobbyAudioRef=state.brand.lobbyAudioRef||'';
      let lobbyAudioFilename=state.brand.lobbyAudioFilename||'';
      let lobbyAudioSize=Number(state.brand.lobbyAudioSize||0);

      const data={
        brandName:$('#brandName').value.trim(),
        appName:$('#appName').value.trim(),
        tagline:$('#tagline').value.trim(),
        caption:$('#caption').value.trim(),
        logo:$('#logoUrl').value.trim(),
        primary:$('#primary').value,
        secondary:$('#secondary').value,
        accent:$('#accent').value,
        menuFeatureEnabled:$('#menuFeatureEnabled').checked,
        heroExperienceEnabled:$('#heroExperienceEnabled').checked,
        heroType:$('#heroType').value,
        heroModel:$('#heroModel').value,
        heroRotationMode:$('#heroRotationMode').value,
        enabledHeroModels:enabledHeroModels.length?enabledHeroModels:[$('#heroModel').value],
        heroHeadline:$('#heroHeadline').value.trim(),
        heroBubble:$('#heroBubble').value.trim(),
        heroShowPhone:$('#heroShowPhone').checked,
        heroShowTicket:$('#heroShowTicket').checked,
        heroShowMeong:$('#heroShowMeong').checked,
        userOccasionPickerEnabled:$('#userOccasionPickerEnabled').checked,
        enabledUserOccasions:enabledUserOccasions.length?enabledUserOccasions:['regular'],
        photoBrandingEnabled:$('#photoBrandingEnabled').checked,
        photoBrandingStyle:$('#photoBrandingStyle').value,
        photoBrandingStrength:$('#photoBrandingStrength').value,
        photoBrandingShowName:$('#photoBrandingShowName').checked,
        photoBrandingShowTagline:$('#photoBrandingShowTagline').checked,
        photoBrandingLabel:$('#photoBrandingLabel').value.trim()||$('#appName').value.trim()||'THANKSGIVING',
        lobbySoundEnabled:$('#lobbySoundEnabled').checked,
        sfxEnabled:$('#sfxEnabled').checked,
        lobbyVolume:Number($('#lobbyVolume').value),
        sfxVolume:Number($('#sfxVolume').value),
        lobbyMusicUrl:$('#lobbyMusicUrl').value.trim(),
        lobbyAudioRef,lobbyAudioFilename,lobbyAudioSize,
        meongPlayingLines:meongPlayingLines.length?meongPlayingLines:defaultBrand.meongPlayingLines,
        meongReturnLine:$('#meongReturnLine').value.trim()||defaultBrand.meongReturnLine,
        meongPausedLine:$('#meongPausedLine').value.trim()||defaultBrand.meongPausedLine,
        birthdayMeongLines:birthdayMeongLines.length?birthdayMeongLines:defaultBrand.birthdayMeongLines,
        enabledGenres:enabledGenres.length?enabledGenres:defaultBrand.enabledGenres,
        enabledTemplates:enabledTemplates.length?enabledTemplates:defaultBrand.enabledTemplates,
        templatePackVersion:'3.3.0',
        updatedAt:serverTimestamp()
      };
      await setDoc(doc(db,'public','brand'),data,{merge:true});
      state.brand={...state.brand,...data};
      state.heroSessionModel='';
      applyBrand();
      toast('Brand tersimpan.');
      renderAdmin();
    }catch(e){
      toast(e.message||'Gagal menyimpan Brand.');
    }finally{
      btn.disabled=false;
      btn.textContent=oldText;
    }
  };
}

function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const s=String(r.result);resolve(s.slice(s.indexOf(',')+1));};r.onerror=reject;r.readAsDataURL(file);});}
async function saveAudioToRtdb(songId,file){if(!rtdbConfigured||!rtdb)throw new Error('Realtime Database belum disetup.');if(file.size>MAX_AUDIO_BYTES)throw new Error(`File terlalu besar. Maks ${fmtBytes(MAX_AUDIO_BYTES)}.`);const base64=await fileToBase64(file);await rtdbSet(dbRef(rtdb,`audio/${songId}`),{data:base64,mime:file.type||'audio/mpeg',filename:file.name,size:file.size,updatedAt:Date.now()});return songId;}
async function songsTab(){
  setAdminTitle('Music Library');
  await loadSongs(false);
  const songs=state.songs;

  $('#adminContent').innerHTML=`<section class="card">
    <div class="section-head">
      <div><h3>Kelola Musik</h3><p class="tiny">File yang sudah tersimpan tidak akan lagi tampil seolah belum dipilih. Nama file tersimpan akan ditampilkan sebagai status. File dengan nama yang sama akan diperingatkan agar tidak upload ulang.</p></div>
      <button class="btn primary" id="newSong">+ Lagu</button>
    </div>
    ${!rtdbConfigured?`<div class="notice warning">Realtime Database belum aktif. Upload file penuh belum bisa.</div>`:''}
    <div id="songList" class="music-list"></div>
  </section>`;

  const storedFileLabel=s=>{
    if(s.audioSource==='rtdb'){
      return s.audioFilename ? `✓ Tersimpan: ${esc(s.audioFilename)}` : '✓ File audio sudah tersimpan di database';
    }
    if(s.audioUrl) return `✓ Audio URL/path tersimpan`;
    return 'Belum ada file audio';
  };

  const draw=()=>{
    $('#songList').innerHTML=songs.length?songs.map((s,i)=>`<article class="song-admin" data-i="${i}">
      <div class="song-admin-top">
        <div class="song-badge">♫</div>
        <div class="song-title-admin"><b>${esc(s.title||'Lagu Baru')}</b><span>${esc(s.artist||'Artist')} • ${esc(s.genre||'Chill')} • ${esc(songScopeLabel(songScope(s)))}</span></div>
        <label class="toggle"><input class="active" type="checkbox" ${s.active!==false?'checked':''}><span></span></label>
      </div>
      <div class="song-form">
        <div class="field"><label>Judul</label><input data-k="title" value="${esc(s.title||'')}"></div>
        <div class="field"><label>Artist</label><input data-k="artist" value="${esc(s.artist||'')}"></div>
        <div class="field"><label>Genre</label><select data-k="genre">${(state.brand.enabledGenres||defaultBrand.enabledGenres).map(g=>`<option ${g===s.genre?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
        <div class="field"><label>Rarity</label><select data-k="rarity">${Object.keys(rarityWeight).map(r=>`<option ${r===(s.rarity||'Common')?'selected':''}>${r}</option>`).join('')}</select></div>
        <div class="field"><label>Dipakai di</label><select data-k="scope">${songScopeOptionsHtml(songScope(s))}</select><span class="tiny">Genre pool customer otomatis mengikuti lagu aktif di occasion ini.</span></div>
        <div class="field full"><label>Audio URL/path</label><input data-k="audioUrl" value="${esc(s.audioUrl||s.audio||'')}" placeholder="assets/music/song.mp3 atau https://..."></div>
        <div class="upload-box full">
          <label class="btn ghost audio-picker">Pilih file<input class="audioFile" type="file" accept="audio/*" hidden></label>
          <div class="audio-file-info">
            <b class="stored-file">${storedFileLabel(s)}</b>
            <span class="selected-file">${s.audioFilename?`File aktif: ${esc(s.audioFilename)}`:'Pilih file baru hanya kalau ingin mengganti audio.'}</span>
          </div>
        </div>
      </div>
      <div class="song-actions"><audio class="preview" controls preload="none" ${s.audioUrl?`src="${esc(s.audioUrl)}"`:''}></audio><div><button class="btn primary save">Simpan</button><button class="btn ghost test">Test</button><button class="btn danger del">Hapus</button></div></div>
    </article>`).join(''):'<div class="empty-list">Belum ada lagu.</div>';
  };
  draw();

  $('#newSong').onclick=()=>{
    songs.unshift({title:'Lagu Baru',artist:'Artist',genre:(state.brand.enabledGenres||defaultBrand.enabledGenres)[0],rarity:'Common',scope:'regular',active:true,audioSource:'url',audioUrl:'',audioFilename:''});
    draw();
  };

  $('#songList').addEventListener('change',e=>{
    const row=e.target.closest('.song-admin'); if(!row) return;
    const s=songs[+row.dataset.i];
    if(e.target.classList.contains('audioFile')){
      const f=e.target.files?.[0];
      const info=$('.selected-file',row);
      if(!f){ if(info)info.textContent=s.audioFilename?`File aktif: ${s.audioFilename}`:'Belum memilih file baru.'; return; }

      const duplicate=songs.find((x,idx)=>idx!==+row.dataset.i && x.audioFilename && x.audioFilename.toLowerCase()===f.name.toLowerCase());
      const sameCurrent=s.audioFilename && s.audioFilename.toLowerCase()===f.name.toLowerCase();
      if(info){
        if(sameCurrent) info.textContent=`⚠ ${f.name} adalah file yang sama dengan audio lagu ini.`;
        else if(duplicate) info.textContent=`⚠ ${f.name} sudah pernah diupload pada "${duplicate.title||'lagu lain'}".`;
        else info.textContent=`File baru: ${f.name} • ${fmtBytes(f.size)}`;
      }
    }
  });

  $('#songList').addEventListener('input',e=>{
    const row=e.target.closest('.song-admin');if(!row)return;
    const s=songs[+row.dataset.i];
    $$('[data-k]',row).forEach(el=>s[el.dataset.k]=el.value);
    s.active=$('.active',row).checked;
  });

  $('#songList').addEventListener('click',async e=>{
    const row=e.target.closest('.song-admin');if(!row)return;
    const i=+row.dataset.i,s=songs[i];
    $$('[data-k]',row).forEach(el=>s[el.dataset.k]=el.value);
    s.active=$('.active',row).checked;

    if(e.target.classList.contains('save')){
      try{
        const wasExisting=Boolean(s.id);
        let songId=s.id || doc(collection(db,'songs')).id;
        const f=$('.audioFile',row).files?.[0];
        let uploadMessage='';

        if(f){
          const sameCurrent=s.audioFilename && s.audioFilename.toLowerCase()===f.name.toLowerCase();
          const duplicate=songs.find((x,idx)=>idx!==i && x.audioFilename && x.audioFilename.toLowerCase()===f.name.toLowerCase());

          if(sameCurrent){
            uploadMessage=`File "${f.name}" sama dengan file yang sudah terupload, jadi audio tidak diupload ulang.`;
          }else if(duplicate){
            if(!confirm(`File "${f.name}" sudah pernah dipakai di "${duplicate.title||'lagu lain'}". Tetap upload file ini untuk lagu sekarang?`)) return;
            await saveAudioToRtdb(songId,f);
            s.audioSource='rtdb'; s.audioRef=songId; s.audioUrl=''; s.audioFilename=f.name; s.audioSize=f.size;
            uploadMessage='File audio baru berhasil menggantikan audio sebelumnya.';
          }else{
            await saveAudioToRtdb(songId,f);
            s.audioSource='rtdb'; s.audioRef=songId; s.audioUrl=''; s.audioFilename=f.name; s.audioSize=f.size;
            uploadMessage='File audio berhasil diupload.';
          }
        }else if(s.audioUrl){
          s.audioSource='url'; s.audioRef='';
        }

        const payload={
          title:s.title||'',artist:s.artist||'',genre:s.genre||'Chill',rarity:s.rarity||'Common',
          scope:s.scope||'all',active:s.active!==false,audioSource:s.audioSource||'url',
          audioRef:s.audioRef||'',audioUrl:s.audioUrl||'',
          audioFilename:s.audioFilename||'',audioSize:s.audioSize||0,
          updatedAt:serverTimestamp()
        };

        if(wasExisting){
          await setDoc(doc(db,'songs',s.id),payload,{merge:true});
        }else{
          payload.createdAt=serverTimestamp();
          await setDoc(doc(db,'songs',songId),payload);
          s.id=songId;
        }

        toast(`${wasExisting?'Musik berhasil diedit.':'Lagu baru berhasil disimpan.'}${uploadMessage?'\\n'+uploadMessage:''}`);
        songsTab();
      }catch(err){toast(err.message||'Gagal menyimpan lagu.');}
    }

    if(e.target.classList.contains('test')){
      try{const src=await resolveSongAudio(s);const a=$('.preview',row);a.src=src;await a.play();}
      catch(err){toast(err.message||'Audio gagal dites.');}
    }

    if(e.target.classList.contains('del')){
      if(!confirm('Hapus lagu ini?'))return;
      try{
        if(s.audioSource==='rtdb'&&s.audioRef&&rtdb)await rtdbRemove(dbRef(rtdb,`audio/${s.audioRef}`));
        if(s.id)await deleteDoc(doc(db,'songs',s.id));
        songs.splice(i,1);draw();
      }catch(err){toast(err.message||'Gagal menghapus.');}
    }
  });
}



async function commerceTab(){
  setAdminTitle('Menu & Product Launch');
  await loadMenuData();
  const items=state.menuItems,launch=state.launchConfig||{};

  $('#adminContent').innerHTML=`<div class="grid two">
    <section class="card">
      <div class="section-head">
        <div><h3>Menu Manager</h3><p class="tiny">Best Seller 1–5 tampil besar dan berjajar. Menu biasa lebih compact.</p></div>
        <button class="btn primary" id="addMenuItem">+ Produk</button>
      </div>
      <div id="menuManagerList"></div>
      <div class="menu-upload-queue" id="menuUploadQueue"><span>Upload queue</span><b>0 gambar menunggu disimpan</b></div>
      <button class="btn primary block mt" id="saveMenu">Simpan Menu</button>
    </section>

    <section class="card">
      <div class="launch-toggle-row">
        <div><small>MENU ENTRY LAUNCH</small><b>Tampilkan Product Launch</b><span>Launch hanya muncul saat customer menekan “Lihat menu & harga”.</span></div>
        <label class="toggle launch-toggle"><input id="launchActive" type="checkbox" ${launch.active?'checked':''}><span></span></label>
      </div>

      <div class="field"><label>Produk launch</label><select id="launchProduct"><option value="">— pilih produk —</option>${items.map(x=>`<option value="${esc(x.id)}" ${launch.productId===x.id?'selected':''}>${esc(x.name||'Produk')}</option>`).join('')}</select></div>
      <div class="field"><label>Headline</label><input id="launchHeadline" value="${esc(launch.headline||'NEW DROP')}"></div>
      <div class="field"><label>Subheadline</label><input id="launchSub" value="${esc(launch.subheadline||'Kenalan sama menu terbaru kami.')}"></div>

      <div class="grid two compact">
        <div class="field"><label>Badge</label><input id="launchBadge" value="${esc(launch.badge||'NEW')}"></div>
        <div class="field"><label>CTA</label><input id="launchCta" value="${esc(launch.cta||'Lihat semua menu')}"></div>
      </div>

      <div class="field"><label>Style</label><select id="launchTheme">
        <option value="glow" ${launch.theme==='glow'?'selected':''}>Glow Premium</option>
        <option value="fresh" ${launch.theme==='fresh'?'selected':''}>Fresh Pop</option>
        <option value="editorial" ${launch.theme==='editorial'?'selected':''}>Editorial</option>
      </select></div>

      <div class="row wrap">
        <button class="btn ghost" id="previewLaunch">Preview Launch</button>
        <button class="btn primary" id="saveLaunch">Simpan Launch</button>
      </div>

      <div class="delivery-link-admin">
        <div class="section-head compact-head">
          <div><h4>🛵 Link Delivery Tianlala Gunung Sabeulah</h4><p class="tiny">Isi link storefront cabang yang benar. Customer selalu diminta konfirmasi dulu sebelum dialihkan.</p></div>
        </div>
        <div class="field"><label>GoFood</label><input id="deliveryGofood" value="${esc(state.deliveryLinks.gofood||'')}" placeholder="Paste link GoFood Tianlala Gunung Sabeulah"></div>
        <div class="field"><label>GrabFood</label><input id="deliveryGrabfood" value="${esc(state.deliveryLinks.grabfood||'')}" placeholder="Paste link GrabFood Tianlala Gunung Sabeulah"></div>
        <div class="field"><label>ShopeeFood</label><input id="deliveryShopeefood" value="${esc(state.deliveryLinks.shopeefood||'')}" placeholder="Paste link ShopeeFood Tianlala Gunung Sabeulah"></div>
        <button class="btn ghost block" id="saveDeliveryLinks">Simpan Link Delivery</button>
      </div>
    </section>
  </div>`;

  const draw=()=>{
    $('#menuManagerList').innerHTML=items.length?items.map((x,i)=>`
      <article class="menu-admin-card" data-i="${i}">
        <div class="menu-admin-preview menu-image-shell">
          ${x.imageSource==='firestore'&&x.imageRef?`<img data-menu-image="${esc(x.id)}" alt="${esc(x.name||'Produk')}">`:x.image?`<img src="${esc(x.image)}" alt="${esc(x.name||'Produk')}">`:'<span>🧋</span>'}
        </div>

        <div>
          <div class="menu-image-upload-row">
            <label class="btn ghost menu-image-upload">Upload gambar<input class="menuImageFile" type="file" accept="image/*" hidden></label>
            <div class="menu-image-status">
              <b>${esc(x.imageFilename||'Belum ada gambar')}</b>
              <span>${x.imageSize?`${fmtBytes(x.imageSize)} • tersimpan`:'PNG / JPG / WebP • dikompres otomatis'}</span>
            </div>
          </div>

          <div class="grid two compact">
            <div class="field"><label>Nama menu</label><input data-k="name" value="${esc(x.name||'')}"></div>
            <div class="field"><label>Harga</label><input data-k="price" inputmode="numeric" value="${esc(x.price||'')}"></div>
          </div>

          <div class="grid two compact">
            <div class="field"><label>Kategori</label><input data-k="category" value="${esc(x.category||'Special')}"></div>
            <div class="field"><label>Tag</label><select data-k="tag">
              <option value="" ${!x.tag?'selected':''}>—</option>
              <option ${x.tag==='NEW'?'selected':''}>NEW</option>
              <option ${x.tag==='BEST SELLER'?'selected':''}>BEST SELLER</option>
              <option ${x.tag==='LIMITED'?'selected':''}>LIMITED</option>
              <option ${x.tag==='RECOMMENDED'?'selected':''}>RECOMMENDED</option>
            </select></div>
          </div>

          <div class="field"><label>Deskripsi singkat</label><input data-k="description" value="${esc(x.description||'')}"></div>

          <div class="menu-ranking-row">
            <label><input class="mActive" type="checkbox" ${x.active!==false?'checked':''}> Aktif</label>
            <label><input class="mBest" type="checkbox" ${x.bestSeller?'checked':''}> Best Seller</label>
            <select class="mRank" ${x.bestSeller?'':'disabled'}>
              <option value="">Rank</option>
              ${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(x.bestSellerRank)===n?'selected':''}>#${n}</option>`).join('')}
            </select>
            <button class="btn danger mDelete">Hapus</button>
          </div>
        </div>
      </article>`).join(''):'<div class="empty-list">Belum ada produk.</div>';

    hydrateMenuImages($('#menuManagerList'));
  };

  const refreshUploadQueue=()=>{
    const q=$('#menuUploadQueue');
    if(!q)return;
    const count=pendingMenuFiles.size;
    q.classList.toggle('has-files',count>0);
    q.innerHTML=`<span>Upload queue</span><b>${count} gambar menunggu disimpan</b>`;
  };

  draw();
  refreshUploadQueue();

  $('#addMenuItem').onclick=()=>{
    items.push({
      id:`menu_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      name:'Menu Baru',
      price:'22000',
      category:'Special',
      tag:'NEW',
      description:'',
      image:'',
      imageSource:'',
      imageRef:'',
      imageFilename:'',
      imageSize:0,
      active:true,
      bestSeller:false,
      bestSellerRank:null
    });
    draw();
  };

  $('#menuManagerList').addEventListener('input',e=>{
    const r=e.target.closest('.menu-admin-card');if(!r)return;
    const x=items[+r.dataset.i];
    $$('[data-k]',r).forEach(el=>x[el.dataset.k]=el.value);
    x.active=$('.mActive',r).checked;
    x.bestSeller=$('.mBest',r).checked;
    x.bestSellerRank=x.bestSeller?Number($('.mRank',r).value||0)||null:null;
    $('.mRank',r).disabled=!x.bestSeller;
  });

  $('#menuManagerList').addEventListener('change',e=>{
    const r=e.target.closest('.menu-admin-card');if(!r)return;
    const x=items[+r.dataset.i];

    if(e.target.classList.contains('menuImageFile')){
      const f=e.target.files?.[0];if(!f)return;
      if(!f.type.startsWith('image/'))return toast('File harus berupa gambar.');
      if(f.size>8*1024*1024)return toast('Gambar terlalu besar. Maks 8 MB.');
      const previous=pendingMenuFiles.get(x.id);
      if(previous?.previewUrl)URL.revokeObjectURL(previous.previewUrl);

      const previewUrl=URL.createObjectURL(f);
      pendingMenuFiles.set(x.id,{file:f,previewUrl});

      const preview=$('.menu-admin-preview',r);
      preview.innerHTML=`<img src="${previewUrl}" alt="${esc(x.name||'Produk')}">`;
      $('.menu-image-status',r).innerHTML=`<b>${esc(f.name)}</b><span>${fmtBytes(f.size)} • antri khusus menu ini</span>`;
      refreshUploadQueue();
      return;
    }

    $$('[data-k]',r).forEach(el=>x[el.dataset.k]=el.value);
    x.active=$('.mActive',r).checked;
    x.bestSeller=$('.mBest',r).checked;
    x.bestSellerRank=x.bestSeller?Number($('.mRank',r).value||0)||null:null;
    $('.mRank',r).disabled=!x.bestSeller;

    if(x.bestSeller&&x.bestSellerRank){
      const clash=items.find((y,j)=>j!==+r.dataset.i&&y.bestSeller&&Number(y.bestSellerRank)===Number(x.bestSellerRank));
      if(clash){
        toast(`Rank #${x.bestSellerRank} sudah dipakai ${clash.name||'menu lain'}.`);
        x.bestSellerRank=null;
        $('.mRank',r).value='';
      }
    }
  });

  $('#menuManagerList').addEventListener('click',e=>{
    if(!e.target.classList.contains('mDelete'))return;
    const r=e.target.closest('.menu-admin-card');
    const x=items[+r.dataset.i];
    if(x.imageRef)pendingMenuDeletes.push(x.imageRef);
    const pending=pendingMenuFiles.get(x.id);
    if(pending?.previewUrl)URL.revokeObjectURL(pending.previewUrl);
    pendingMenuFiles.delete(x.id);
    items.splice(+r.dataset.i,1);
    draw();
    refreshUploadQueue();
  });

  $('#saveMenu').onclick=async()=>{
    const btn=$('#saveMenu');btn.disabled=true;const old=btn.textContent;btn.textContent='Menyimpan…';
    try{
      const ranks=new Set();
      for(const x of items){
        if(x.bestSeller&&x.bestSellerRank){
          if(ranks.has(Number(x.bestSellerRank)))throw new Error(`Rank Best Seller #${x.bestSellerRank} dipakai lebih dari sekali.`);
          ranks.add(Number(x.bestSellerRank));
        }
      }
      const queued=items.filter(x=>pendingMenuFiles.has(x.id));
      let uploaded=0;
      for(const x of queued){
        const entry=pendingMenuFiles.get(x.id);
        if(!entry?.file)continue;
        btn.textContent=`Upload gambar ${uploaded+1}/${queued.length}…`;
        try{
          await saveMenuImage(x,entry.file);
          uploaded++;
        }catch(err){
          throw new Error(`Gagal upload gambar "${x.name||'Menu'}": ${err.message||err}`);
        }
      }
      for(const ref of [...new Set(pendingMenuDeletes)])await deleteMenuImageRef(ref).catch(()=>{});

      await setDoc(publicDataRef('menu'),{
        items:items.map(x=>{const c={...x};delete c.image;return c;}),
        updatedAt:serverTimestamp()
      });

      for(const entry of pendingMenuFiles.values()){
        if(entry?.previewUrl)URL.revokeObjectURL(entry.previewUrl);
      }
      pendingMenuFiles.clear();
      pendingMenuDeletes.length=0;
      state.menuItems=items;
      toast(`Menu berhasil disimpan.${uploaded?` ${uploaded} gambar ikut tersimpan.`:''}`);
      commerceTab();
    }catch(e){
      toast(e.message||'Gagal menyimpan menu.');
    }finally{
      btn.disabled=false;
      btn.textContent=old;
    }
  };

  const launchData=()=>({
    active:$('#launchActive').checked,
    productId:$('#launchProduct').value,
    headline:$('#launchHeadline').value.trim(),
    subheadline:$('#launchSub').value.trim(),
    badge:$('#launchBadge').value.trim(),
    cta:$('#launchCta').value.trim(),
    theme:$('#launchTheme').value,
    updatedAt:serverTimestamp()
  });

  $('#saveLaunch').onclick=async()=>{
    const d=launchData();
    await setDoc(publicDataRef('launch'),d);
    state.launchConfig=d;
    toast('Product Launch berhasil disimpan.');
  };

  $('#saveDeliveryLinks').onclick=async()=>{
    const data={
      gofood:$('#deliveryGofood').value.trim(),
      grabfood:$('#deliveryGrabfood').value.trim(),
      shopeefood:$('#deliveryShopeefood').value.trim(),
      updatedAt:serverTimestamp()
    };
    await setDoc(publicDataRef('deliveryLinks'),data);
    state.deliveryLinks={...data};
    toast('Link delivery berhasil disimpan.');
  };

  $('#previewLaunch').onclick=()=>{
    const d=launchData();
    const p=items.find(x=>x.id===d.productId);
    if(!p)return toast('Pilih produk launch dulu.');
    state.launchConfig=d;
    renderProductLaunchScreen(p,d,{
      preview:true,
      onBack:commerceTab,
      onContinue:commerceTab
    });
  };
}


function menuCategorySlug(v=''){
  const s=String(v||'').toLowerCase().trim();
  if(s.includes('light') && s.includes('milk')) return 'light-milktea';
  if(s.includes('milk')) return 'milktea';
  if(s.includes('sundae')) return 'sundae';
  if(s.includes('smooth')) return 'smoothies';
  if(s.includes('shaker')) return 'shaker';
  return 'other';
}

function productRankLabel(rank){
  if(Number(rank)===1)return '#1 BEST SELLER';
  if(Number(rank)===2)return '#2 FAVORITE';
  if(Number(rank)===3)return '#3 POPULAR';
  if(Number(rank)===4)return '#4 RECOMMENDED';
  return '#5 PICK';
}


function deliveryPlatformMeta(){
  return [
    {id:'gofood',label:'GoFood',icon:'🟢'},
    {id:'grabfood',label:'GrabFood',icon:'🟩'},
    {id:'shopeefood',label:'ShopeeFood',icon:'🟠'}
  ];
}
function safeDeliveryUrl(v){
  try{
    const u=new URL(String(v||'').trim());
    return ['https:','http:'].includes(u.protocol)?u.href:'';
  }catch{return '';}
}
function showDeliveryConfirm(product,{onClose=null}={}){
  const links=state.deliveryLinks||{};
  const available=deliveryPlatformMeta()
    .map(x=>({...x,url:safeDeliveryUrl(links[x.id])}))
    .filter(x=>x.url);

  const old=document.querySelector('.delivery-confirm-backdrop');
  if(old)old.remove();

  const wrap=document.createElement('div');
  wrap.className='delivery-confirm-backdrop';
  wrap.innerHTML=`<div class="delivery-confirm-card" role="dialog" aria-modal="true" aria-label="Konfirmasi buka delivery">
    <button class="delivery-modal-close" type="button" aria-label="Tutup">×</button>
    <div class="delivery-confirm-icon">🛵</div>
    <small>ORDER VIA DELIVERY</small>
    <h3>${esc(product?.name||'Menu ini')}</h3>
    <p>Kamu akan dialihkan ke storefront <b>Tianlala Gunung Sabeulah</b>. Pilih platform dulu — kami tidak akan mengalihkan tanpa persetujuanmu.</p>
    ${available.length?`<div class="delivery-platform-list">
      ${available.map(x=>`<button class="delivery-platform-btn" data-delivery="${x.id}" type="button"><span>${x.icon}</span><div><b>${x.label}</b><small>Buka Tianlala Gunung Sabeulah</small></div><i>↗</i></button>`).join('')}
    </div>`:`<div class="notice warning">Link delivery belum diisi Admin. Isi dulu di Admin → Menu & Launch.</div>`}
    <button class="btn ghost block delivery-cancel" type="button">Nggak jadi</button>
  </div>`;

  document.body.appendChild(wrap);

  const close=()=>{
    wrap.classList.remove('show');
    setTimeout(()=>wrap.remove(),180);
    if(onClose)onClose();
  };

  requestAnimationFrame(()=>wrap.classList.add('show'));
  $('.delivery-modal-close',wrap).onclick=close;
  $('.delivery-cancel',wrap).onclick=close;
  wrap.onclick=e=>{if(e.target===wrap)close();};

  $$('[data-delivery]',wrap).forEach(btn=>{
    btn.onclick=()=>{
      const platform=available.find(x=>x.id===btn.dataset.delivery);
      if(!platform)return;
      const ok=confirm(`Buka ${platform.label} untuk melihat Tianlala Gunung Sabeulah?`);
      if(!ok)return;
      window.open(platform.url,'_blank','noopener,noreferrer');
      close();
    };
  });
}

async function renderMenuShowcase(){
  setLobbyWanted(true);
  if(state.campaign?.id)event('menu_view',state.campaign.id);

  await loadMenuData();
  const all=(state.menuItems||[]).filter(x=>x.active!==false);
  const best=all
    .filter(x=>x.bestSeller&&Number(x.bestSellerRank)>=1&&Number(x.bestSellerRank)<=5)
    .sort((a,b)=>Number(a.bestSellerRank)-Number(b.bestSellerRank));

  const regular=all.filter(x=>!best.includes(x));
  const cats=[...new Set(regular.map(x=>x.category||'Menu'))];

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page premium-menu-page">${topbar()}
    <div class="menu-page-decor" aria-hidden="true">
      <span class="menu-edge-cat cat-a">😼</span>
      <span class="menu-edge-cat cat-b">🐱</span>
      <span class="menu-edge-cassette">▣</span>
      <i class="decor-note dn1">♪</i><i class="decor-note dn2">♫</i><i class="decor-note dn3">✦</i><i class="decor-note dn4">♬</i>
      <div class="decor-orbit orbit-a"></div><div class="decor-orbit orbit-b"></div>
    </div>
    <div class="premium-menu-head">
      <button class="icon-btn" id="menuBack">←</button>
      <div><small>MENU SHOWCASE</small><h1>Lagi pengen yang mana?</h1><p>Mulai dari favorit customer, lanjut explore semua menu.</p></div>
    </div>

    ${best.length?`<section class="best-seller-section">
      <div class="section-sticker best-sticker" aria-hidden="true"><span>😼</span><b>MEONG'S PICKS</b></div>
      <div class="best-section-head">
        <div><small>🔥 CUSTOMER FAVORITES</small><h2>Best Seller</h2></div>
        <span>Swipe →</span>
      </div>

      <div class="best-seller-row" aria-label="Best Seller carousel">
        ${best.map(x=>`<article class="best-seller-card rank-${Number(x.bestSellerRank)||5} cat-${menuCategorySlug(x.category)}" data-product-id="${esc(x.id)}">
          <div class="best-rank-badge">${esc(productRankLabel(x.bestSellerRank))}</div>
          <div class="best-product-stage menu-image-shell"><div class="menu-theme-motif"><i>♪</i><i>✦</i><i>♫</i></div>
            ${x.imageSource==='firestore'&&x.imageRef?`<img data-menu-image="${esc(x.id)}" alt="${esc(x.name||'Menu')}">`:'<span>🧋</span>'}
            <div class="best-glow"></div>
          </div>
          <div class="best-product-copy">
            <small>${esc(x.category||'Menu')}</small>
            <h3>${esc(x.name||'Menu')}</h3>
            <p>${esc(x.description||'')}</p>
            <strong>${esc(moneyId(x.price))}</strong>
          </div>
        </article>`).join('')}
      </div>
    </section>`:''}

    <section class="all-menu-section">
      <div class="section-sticker all-sticker" aria-hidden="true"><span>▣</span><b>PLAYLIST MENU</b></div>
      <div class="all-menu-head">
        <div><small>EXPLORE</small><h2>Semua Menu</h2></div>
        <span>${regular.length} pilihan</span>
      </div>

      <div class="menu-category-chips">
        ${['All',...cats].map((c,i)=>`<button class="menu-cat-chip ${i===0?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>

      <div id="regularMenuGrid" class="regular-menu-grid"></div>
    </section>
  </section></main>`;

  const draw=(cat='All')=>{
    const list=cat==='All'?regular:regular.filter(x=>(x.category||'Menu')===cat);
    $('#regularMenuGrid').innerHTML=list.map(x=>`<article class="regular-menu-card cat-${menuCategorySlug(x.category)}" data-product-id="${esc(x.id)}">
      <div class="regular-menu-image menu-image-shell"><div class="menu-theme-motif"><i>♪</i><i>✦</i><i>♫</i></div>
        ${x.imageSource==='firestore'&&x.imageRef?`<img data-menu-image="${esc(x.id)}" alt="${esc(x.name||'Menu')}">`:'<span>🧋</span>'}
        ${x.tag?`<b>${esc(x.tag)}</b>`:''}
      </div>
      <div class="regular-menu-copy"><span class="regular-menu-tap">Tap untuk detail ↗</span>
        <small>${esc(x.category||'Menu')}</small>
        <h3>${esc(x.name||'Menu')}</h3>
        <strong>${esc(moneyId(x.price))}</strong>
      </div>
    </article>`).join('')||'<div class="empty-list">Belum ada menu di kategori ini.</div>';

    hydrateMenuImages($('#regularMenuGrid'));
  };

  draw();
  hydrateMenuImages(document);
  requestAnimationFrame(()=>{
    $$('.best-seller-card,.regular-menu-card').forEach((card,i)=>{
      setTimeout(()=>card.classList.add('menu-card-in'),Math.min(i,8)*55);
    });
  });

  const menuPage=document.querySelector('.premium-menu-page');

  if(menuPage){
    menuPage.onclick=e=>{
      const back=e.target.closest('#menuBack');
      if(back){
        state.menuOpening=false;
        renderLanding();
        return;
      }

      const chip=e.target.closest('.menu-cat-chip');
      if(chip){
        $$('.menu-cat-chip').forEach(x=>x.classList.remove('active'));
        chip.classList.add('active');
        draw(chip.dataset.cat);
        requestAnimationFrame(()=>{
          $$('.regular-menu-card').forEach((card,i)=>setTimeout(()=>card.classList.add('menu-card-in'),i*42));
        });
        return;
      }

      const card=e.target.closest('.best-seller-card,.regular-menu-card');
      if(card){
        const id=card.dataset.productId;
        const product=all.find(x=>x.id===id);
        if(!product)return;

        card.classList.remove('menu-card-tap');
        void card.offsetWidth;
        card.classList.add('menu-card-tap');

        setTimeout(()=>{
          const activeLaunch=state.launchConfig||{};
          renderProductLaunchScreen(product,activeLaunch,{
            headline: product.tag || activeLaunch.headline || 'MENU SPOTLIGHT',
            subheadline: product.description || activeLaunch.subheadline || 'Lihat detail menunya dulu, lalu order lewat platform pilihanmu.',
            badge: product.bestSeller ? productRankLabel(product.bestSellerRank) : (product.tag || activeLaunch.badge || 'FEATURED'),
            ctaText: 'Order menu ini',
            secondaryText:'Balik ke menu',
            onBack: renderMenuShowcase,
            onContinue:()=>showDeliveryConfirm(product,{onClose:()=>{}})
          });
        },130);
      }
    };
  }

  setTimeout(()=>tryLobbyAutoplay(),60);
}

function renderProductLaunchScreen(product,launch,{preview=false,onBack=null,onContinue=null,headline='',subheadline='',badge='',ctaText='',secondaryText=''}={}){
  setLobbyWanted(true);
  if(!preview&&state.campaign?.id)event('launch_view',state.campaign.id);

  appEl.innerHTML=`<main class="shell"><section class="phone customer-page product-launch-page launch-${esc(launch.theme||'glow')}">${topbar()}
    <div class="launch-particles"><i></i><i></i><i></i><i></i><i></i><i></i></div>

    <div class="launch-sequence">
      <div class="launch-brand-kicker">${esc(state.brand.brandName)} PRESENTS</div>
      <div class="launch-badge">${esc(badge||launch.badge||'NEW')}</div>

      <div class="launch-product-visual menu-image-shell">
        ${product.imageSource==='firestore'&&product.imageRef?`<img data-menu-image="${esc(product.id)}" alt="${esc(product.name||'Produk')}">`:'<span>🧋</span>'}
        <div class="launch-orbit"></div>
        <div class="launch-halo"></div>
      </div>

      <div class="launch-copy">
        <h1>${esc(headline||launch.headline||'NEW DROP')}</h1>
        <h2>${esc(product.name||'Produk Baru')}</h2>
        <strong>${esc(moneyId(product.price))}</strong>
        <p>${esc(subheadline||launch.subheadline||product.description||'Kenalan sama menu terbaru kami.')}</p>
      </div>

      <div class="launch-actions">
        <button class="btn primary block" id="launchContinue">${esc(ctaText||launch.cta||'Lihat semua menu')}</button>
        <button class="btn ghost block" id="launchBack">${esc(preview?'Tutup preview':(secondaryText||'Kembali'))}</button>
      </div>
    </div>
  </section></main>`;

  hydrateMenuImages(document);
  requestAnimationFrame(()=>document.querySelector('.product-launch-page')?.classList.add('is-live'));
  setTimeout(()=>tryLobbyAutoplay(),60);

  $('#launchContinue').onclick=()=>onContinue?onContinue():renderMenuShowcase();
  $('#launchBack').onclick=()=>onBack?onBack():renderLanding();
}

async function openMenuExperience(){
  if(state.brand.menuFeatureEnabled===false){
    toast('Menu & harga sedang dinonaktifkan.');
    return;
  }
  if(state.menuOpening)return;
  state.menuOpening=true;

  try{
    // Defensive cleanup: old modals/overlays must never block a second menu entry.
    document.querySelectorAll('.delivery-confirm-backdrop').forEach(x=>x.remove());

    await loadMenuData();
    const launch=state.launchConfig||{};
    const product=(state.menuItems||[]).find(x=>x.id===launch.productId&&x.active!==false);

    if(launch.active&&product){
      renderProductLaunchScreen(product,launch,{
        onBack:()=>{
          state.menuOpening=false;
          renderLanding();
        },
        onContinue:()=>{
          state.menuOpening=false;
          renderMenuShowcase();
        }
      });
      return;
    }

    state.menuOpening=false;
    await renderMenuShowcase();
  }catch(e){
    console.error('Menu open failed:',e);
    state.menuOpening=false;
    toast('Menu belum bisa dibuka. Coba sekali lagi.');
  }
}


async function storageTab(){
  setAdminTitle('Storage');

  const cacheKey='thanksgiving.storageScan.v1';
  const songSnap=await getDocs(collection(db,'songs')).catch(()=>({docs:[]}));
  const songs=songSnap.docs.map(d=>({id:d.id,...d.data()}));
  const linkedSongs=songs.filter(s=>s.audioSource==='rtdb'&&s.audioRef);

  const linkedMap=new Map();
  for(const s of linkedSongs){
    if(!linkedMap.has(s.audioRef)){
      linkedMap.set(s.audioRef,{
        id:s.audioRef,
        filename:s.audioFilename||`${s.title||'audio'}.audio`,
        size:Number(s.audioSize||0),
        linkedSongs:[]
      });
    }
    const row=linkedMap.get(s.audioRef);
    row.linkedSongs.push(s);
    if(!row.size && s.audioSize) row.size=Number(s.audioSize||0);
    if((!row.filename || row.filename.endsWith('.audio')) && s.audioFilename) row.filename=s.audioFilename;
  }

  let linked=[...linkedMap.values()];
  if(state.brand.lobbyAudioRef){
    linked.push({
      id:state.brand.lobbyAudioRef,
      filename:state.brand.lobbyAudioFilename||'Meong Lobby Audio',
      size:Number(state.brand.lobbyAudioSize||0),
      linkedSongs:[{title:'Meong Lobby • system audio'}],
      systemAudio:true
    });
  }
  let scanCache=null;
  try{scanCache=JSON.parse(sessionStorage.getItem(cacheKey)||'null');}catch{}

  if(scanCache?.linked){
    const byId=new Map(scanCache.linked.map(x=>[x.id,x]));
    linked=linked.map(row=>{
      const c=byId.get(row.id);
      return c?{...row,filename:c.filename||row.filename,size:Number(c.size||row.size||0),verified:true}:{...row,verified:false};
    });
  }else{
    linked=linked.map(row=>({...row,verified:false}));
  }

  const orphan=Array.isArray(scanCache?.orphan)?scanCache.orphan:[];
  const linkedBytes=linked.reduce((n,a)=>n+Number(a.size||0),0);
  const orphanBytes=orphan.reduce((n,a)=>n+Number(a.size||0),0);
  const totalBytes=linkedBytes+orphanBytes;
  const refLimit=1024*1024*1024;
  const pct=Math.min(100,Math.round(totalBytes/refLimit*1000)/10);
  const unknown=linked.filter(a=>!Number(a.size)).length;
  const lastScan=scanCache?.scannedAt?new Date(scanCache.scannedAt).toLocaleString('id-ID'):'Belum pernah';

  $('#adminContent').innerHTML=`
    <div class="dash-grid">
      <div class="metric"><span>Audio linked</span><b>${fmtBytes(linkedBytes)}</b><em>langsung dari metadata</em></div>
      <div class="metric"><span>Reference usage</span><b>${pct}%</b><em>estimasi vs 1 GB</em></div>
      <div class="metric"><span>Linked files</span><b>${linked.length}</b><em>tanpa fetch audio saat buka</em></div>
      <div class="metric"><span>Orphan cache</span><b>${scanCache?.parentReadable?orphan.length:'—'}</b><em>${scanCache?.parentReadable?'hasil scan terakhir':'belum scan penuh'}</em></div>
    </div>

    <section class="card">
      <div class="section-head storage-head">
        <div>
          <h3>Storage Monitor</h3>
          <p class="tiny">Halaman sekarang buka cepat dari metadata Music Library. RTDB hanya diakses kalau admin menekan tombol scan.</p>
        </div>
        <div class="row wrap">
          <button class="btn ghost" id="scanLinkedStorage">Scan Linked RTDB</button>
          <button class="btn ghost" id="scanOrphanStorage">Scan Orphan</button>
          <button class="btn ghost" id="clearStorageCache">Clear Scan Cache</button>
        </div>
      </div>

      <div class="storage-progress"><span style="width:${pct}%"></span></div>

      <div class="status-row"><span>Audio linked</span><b>${fmtBytes(linkedBytes)}</b></div>
      <div class="status-row"><span>Ukuran belum diketahui</span><b>${unknown}</b></div>
      <div class="status-row"><span>Scan terakhir</span><b>${esc(lastScan)}</b></div>
      <div class="status-row"><span>Status</span><b class="${pct<70?'ok':pct<90?'warn':'error-text'}">${pct<70?'Aman':pct<90?'Mulai penuh':'Perlu dibersihkan'}</b></div>

      <div class="notice storage-fast-note">⚡ <b>Fast mode aktif.</b> Membuka Storage tidak lagi membaca seluruh file audio satu per satu.</div>
    </section>

    <section class="card mt">
      <div class="section-head">
        <div><h3>Audio Files</h3><p class="tiny">Ukuran dari metadata Firestore. Badge Verified muncul setelah Scan Linked RTDB.</p></div>
      </div>
      <div class="storage-file-list">
        ${linked.sort((a,b)=>b.size-a.size).map(a=>`
          <div class="storage-file-row">
            <div class="storage-file-copy">
              <b>${esc(a.filename)}</b>
              <span>${esc(a.linkedSongs.map(s=>s.title||'Lagu').join(', ')||a.id)}</span>
            </div>
            <div class="storage-file-size">${a.size?fmtBytes(a.size):'ukuran belum tercatat'}</div>
            <span class="storage-pill ${a.verified?'ok':''}">${a.verified?'Verified':'Metadata'}</span>
          </div>`).join('')||'<div class="empty-list">Belum ada audio RTDB yang terhubung ke lagu.</div>'}
      </div>
    </section>

    ${scanCache?.parentReadable?`
      <section class="card mt">
        <div class="section-head"><div><h3>Orphan Files</h3><p class="tiny">Hasil Scan Orphan terakhir.</p></div></div>
        <div class="storage-file-list">
          ${orphan.map(a=>`
            <div class="storage-file-row">
              <div class="storage-file-copy"><b>${esc(a.filename||'audio')}</b><span>${esc(a.id)}</span></div>
              <div class="storage-file-size">${fmtBytes(Number(a.size||0))}</div>
              <button class="btn danger storage-delete" data-id="${esc(a.id)}">Hapus orphan</button>
            </div>`).join('')||'<div class="empty-list">Tidak ada orphan. Bersih ✨</div>'}
        </div>
      </section>`:''}`;

  const setBusy=(btn,text)=>{
    btn.disabled=true;
    btn.dataset.oldText=btn.textContent;
    btn.textContent=text;
  };
  const resetBusy=btn=>{
    btn.disabled=false;
    btn.textContent=btn.dataset.oldText||btn.textContent;
  };

  $('#scanLinkedStorage').onclick=async()=>{
    const btn=$('#scanLinkedStorage');
    if(!rtdbConfigured||!rtdb) return toast('Realtime Database belum dikonfigurasi.');
    setBusy(btn,'Scanning…');

    const verified=[];
    for(let i=0;i<linked.length;i++){
      const row=linked[i];
      try{
        const snap=await rtdbGet(dbRef(rtdb,`audio/${row.id}`));
        if(snap.exists()){
          const data=snap.val()||{};
          verified.push({
            id:row.id,
            filename:data.filename||row.filename,
            size:Number(data.size||row.size||0)
          });
        }else{
          verified.push({id:row.id,filename:row.filename,size:Number(row.size||0)});
        }
      }catch(e){
        verified.push({id:row.id,filename:row.filename,size:Number(row.size||0)});
      }

      // Yield sedikit supaya UI tidak terasa freeze kalau lagu banyak.
      if(i%4===3) await sleep(20);
    }

    let old={};
    try{old=JSON.parse(sessionStorage.getItem(cacheKey)||'{}')||{};}catch{}
    sessionStorage.setItem(cacheKey,JSON.stringify({
      ...old,
      linked:verified,
      scannedAt:Date.now()
    }));

    toast(`Scan linked selesai: ${verified.length} file.`);
    resetBusy(btn);
    storageTab();
  };

  $('#scanOrphanStorage').onclick=async()=>{
    const btn=$('#scanOrphanStorage');
    if(!rtdbConfigured||!rtdb) return toast('Realtime Database belum dikonfigurasi.');
    setBusy(btn,'Scanning orphan…');

    try{
      const parent=await rtdbGet(dbRef(rtdb,'audio'));
      const parentMap=parent.exists()?parent.val()||{}:{};
      const linkedIds=new Set(linked.map(x=>x.id));
      const all=Object.entries(parentMap).map(([id,a])=>({
        id,
        filename:a?.filename||'audio',
        size:Number(a?.size||0)
      }));
      const newOrphan=all.filter(a=>!linkedIds.has(a.id));

      let old={};
      try{old=JSON.parse(sessionStorage.getItem(cacheKey)||'{}')||{};}catch{}
      sessionStorage.setItem(cacheKey,JSON.stringify({
        ...old,
        orphan:newOrphan,
        parentReadable:true,
        scannedAt:Date.now()
      }));

      toast(`Scan orphan selesai: ${newOrphan.length} file orphan.`);
      resetBusy(btn);
      storageTab();
    }catch(e){
      resetBusy(btn);
      toast('Scan orphan belum diizinkan rules RTDB. Publish database.rules.json terbaru.');
    }
  };

  $('#clearStorageCache').onclick=()=>{
    sessionStorage.removeItem(cacheKey);
    toast('Cache scan Storage dibersihkan.');
    storageTab();
  };

  $$('.storage-delete').forEach(b=>b.onclick=async()=>{
    if(!confirm('Hapus file orphan ini dari Realtime Database?')) return;
    try{
      await rtdbRemove(dbRef(rtdb,`audio/${b.dataset.id}`));
      let c={};
      try{c=JSON.parse(sessionStorage.getItem(cacheKey)||'{}')||{};}catch{}
      c.orphan=(c.orphan||[]).filter(x=>x.id!==b.dataset.id);
      c.scannedAt=Date.now();
      sessionStorage.setItem(cacheKey,JSON.stringify(c));
      toast('File orphan dihapus.');
      storageTab();
    }catch(e){toast(e.message||'Gagal menghapus file.');}
  });
}

async function qrTab(){
  setAdminTitle('Generate QR');
  const songSnap=await getDocs(collection(db,'songs')).catch(()=>({docs:[]}));
  const songs=songSnap.docs.map(d=>({id:d.id,...d.data()}));
  const capSnap=await getDocs(collection(db,'captionPresets')).catch(()=>({docs:[]}));
  const caps=capSnap.docs.map(d=>({id:d.id,...d.data()}));

  $('#adminContent').innerHTML=`<div class="grid two">
    <section class="card">
      <div class="section-head"><div><h3>Buat Experience</h3><p class="tiny">Untuk pemakaian normal, nggak perlu pilih occasion lagi. Pakai General Experience dan customer memilih occasion sendiri.</p></div></div>

      <div class="qr-type-picker">
        <label class="qr-type-card active" data-qr-type-card="choose">
          <input type="radio" name="qrExperienceType" value="choose" checked>
          <span>✦</span><div><b>General Experience</b><small>Recommended • satu QR, customer pilih occasion dari halaman user.</small></div><em>DEFAULT</em>
        </label>
        <label class="qr-type-card" data-qr-type-card="locked">
          <input type="radio" name="qrExperienceType" value="locked">
          <span>◇</span><div><b>Dedicated Occasion</b><small>Kunci QR ke Birthday, Wedding, Graduation, dll. Cocok buat event khusus.</small></div><em>OPTIONAL</em>
        </label>
      </div>

      <div class="grid two compact"><div class="field"><label>Customer / Order</label><input id="customer" placeholder="Nama / order #"></div><div class="field"><label>Produk</label><input id="product" placeholder="Da Hong Pao Milk Tea"></div></div>

      <div id="lockedOccasionSettings" class="qr-locked-settings is-hidden">
        <div class="field"><label>Occasion khusus</label><select id="occasion">${occasionOptionsHtml()}</select></div>
        <div id="birthdayQrSettings" class="birthday-admin-settings is-hidden">
          <div class="grid two compact"><div class="field"><label>Nama yang ulang tahun</label><input id="birthdayName" placeholder="Contoh: Nabila"></div><div class="field"><label>Umur (opsional)</label><input id="birthdayAge" inputmode="numeric" placeholder="21"></div></div>
          <div class="field"><label>Pesan ulang tahun</label><textarea id="birthdayMessage" rows="3" placeholder="Semoga harimu seru dan penuh good vibes 🎉"></textarea></div>
          <div class="notice">${esc(occasionCatalog.birthday.notice||'Birthday mode aktif.')}</div>
        </div>
      </div>

      <div class="field"><label>Mode musik</label><select id="mode"><option value="gacha">Genre + Gacha</option><option value="custom">Custom Song</option></select></div>
      <div class="field"><label>Lagu khusus</label><select id="forced"><option value="">— pilih —</option>${songs.map(s=>`<option value="${s.id}">${esc(s.title)} — ${esc(s.artist||'')}</option>`).join('')}</select></div>
      <div class="field"><label>Note / ucapan</label><textarea id="note" rows="4" placeholder="Thanks udah order! ✨"></textarea></div>
      <div class="field"><label>Caption foto</label><div class="input-with-action"><input id="photoCaption" placeholder="Kosong = caption global"><select id="capPreset"><option value="">Preset</option>${caps.map(c=>`<option value="${esc(c.text||'')}">${esc(c.text||'')}</option>`).join('')}</select></div></div>
      <div class="field"><label>Masa aktif</label><select id="expiry"><option value="0">Tanpa batas</option><option value="1">1 hari</option><option value="7">7 hari</option><option value="30" selected>30 hari</option><option value="90">90 hari</option></select></div>
      <button class="btn primary block" id="generate">Generate QR</button>
    </section>

    <section class="card">
      <h3>Preview + Download</h3>
      <div class="qr-download-preview" id="qrDownloadPreview">
        <div class="qr-preview-brand">${esc(state.brand.brandName)}</div>
        <div class="qr-preview-copy"><b id="qrPreviewTitle">${esc(generalQrMeta().previewTitle)}</b><span id="qrPreviewText">${esc(generalQrMeta().previewText)}</span></div>
        <div class="qr-card"><div id="qrcode"></div></div>
        <div class="qr-preview-footer">${esc(state.brand.appName)} • ${esc(state.brand.tagline)}</div>
      </div>
      <div class="field"><label>Link customer</label><input id="out" readonly></div>
      <div class="row wrap">
        <button class="btn primary" id="copy">Copy Link</button>
        <button class="btn ghost" id="open">Buka</button>
        <button class="btn ghost" id="downloadQr">⬇ Download QR</button>
        <button class="btn ghost" id="print">Print Thermal</button>
      </div>
    </section>
  </div>
  <section class="thermal" id="thermal"><img class="thermal-logo" src="${esc(logo())}"><h2>${esc(state.brand.brandName)}</h2><p>${esc(state.brand.tagline)}</p><div id="thermalQR"></div><div class="thermal-cta" id="thermalCta">${generalQrMeta().thermal}</div><p>Scan • Pilih Moment • Musik • Foto / Video</p><div class="cut">✦ ${esc(state.brand.appName)} ✦</div></section>`;

  let last='';
  let lastOccasion='choose';
  const qrType=()=>document.querySelector('input[name="qrExperienceType"]:checked')?.value||'choose';

  const updateQrCopy=()=>{
    const mode=qrType(),locked=mode==='locked';
    $('#lockedOccasionSettings').classList.toggle('is-hidden',!locked);
    $$('[data-qr-type-card]').forEach(card=>card.classList.toggle('active',card.dataset.qrTypeCard===mode));
    const occasion=locked?occasionId($('#occasion').value):'regular';
    const meta=qrMetaFor(mode,occasion);
    $('#birthdayQrSettings').classList.toggle('is-hidden',!(locked&&occasion==='birthday'));
    $('#qrPreviewTitle').textContent=meta.previewTitle;
    $('#qrPreviewText').textContent=meta.previewText;
    $('#thermalCta').innerHTML=meta.thermal;
  };

  $$('input[name="qrExperienceType"]').forEach(x=>x.onchange=updateQrCopy);
  $('#occasion').onchange=updateQrCopy;
  updateQrCopy();
  $('#capPreset').onchange=e=>{if(e.target.value)$('#photoCaption').value=e.target.value;};

  $('#generate').onclick=async()=>{
    const days=+$('#expiry').value,exp=days?new Date(Date.now()+days*864e5):null;
    const occasionMode=qrType(),locked=occasionMode==='locked';
    const occasion=locked?$('#occasion').value:'regular';
    const ref=await addDoc(collection(db,'campaigns'),{
      customer:$('#customer').value.trim(),product:$('#product').value.trim(),
      occasionMode,occasion,
      birthdayName:locked&&occasion==='birthday'?$('#birthdayName').value.trim():'',
      birthdayAge:locked&&occasion==='birthday'?$('#birthdayAge').value.trim():'',
      birthdayMessage:locked&&occasion==='birthday'?$('#birthdayMessage').value.trim():'',
      mode:$('#mode').value,forcedSongId:$('#forced').value,note:$('#note').value.trim(),
      photoCaption:$('#photoCaption').value.trim(),active:true,createdAt:serverTimestamp(),expiresAt:exp
    });
    lastOccasion=locked?occasion:'choose';
    last=`${baseUrl()}?c=${ref.id}`;
    $('#out').value=last;
    renderQr(last);
    toast(locked?'QR occasion khusus berhasil dibuat.':'General QR berhasil dibuat. Customer nanti pilih occasion sendiri.');
  };

  $('#copy').onclick=()=>last&&navigator.clipboard.writeText(last).then(()=>toast('Link dicopy.'));
  $('#open').onclick=()=>last&&window.open(last,'_blank');
  $('#print').onclick=()=>last?window.print():toast('Generate QR dulu.');
  $('#downloadQr').onclick=()=>last?downloadQrCard(last,lastOccasion):toast('Generate QR dulu.');
}

function renderQr(url){
  $('#qrcode').innerHTML='';
  $('#thermalQR').innerHTML='';
  new QRCode($('#qrcode'),{text:url,width:220,height:220,correctLevel:QRCode.CorrectLevel.M});
  new QRCode($('#thermalQR'),{text:url,width:180,height:180,correctLevel:QRCode.CorrectLevel.M});
}


async function downloadQrCard(url,occasion='regular'){
  const general=occasion==='choose';
  const meta=general?generalQrMeta():occasionMeta(occasion);
  const special=!general&&occasionId(occasion)!=='regular';
  const canvas=document.createElement('canvas');
  canvas.width=1080; canvas.height=1350;
  const ctx=canvas.getContext('2d');

  ctx.fillStyle=special?'#1b1220':'#0f0f0f';ctx.fillRect(0,0,1080,1350);
  if(special){
    const g=ctx.createLinearGradient(0,0,1080,1350);
    g.addColorStop(0,'#fff0c8');
    g.addColorStop(.5,'#ffd8ea');
    g.addColorStop(1,'#d7e7ff');
    ctx.fillStyle=g;ctx.fillRect(0,0,1080,1350);
  }

  try{
    const l=await image(logo());
    ctx.drawImage(l,82,70,105,105);
  }catch{}

  ctx.fillStyle=special?'#2d2130':'#fff';ctx.font='900 39px sans-serif';ctx.fillText(state.brand.brandName,215,115);
  ctx.font='700 23px sans-serif';ctx.fillStyle=special?'#725b6d':'#aaa';ctx.fillText(state.brand.appName,215,151);

  ctx.fillStyle=special?'#2d2130':'#fff';ctx.font='900 63px sans-serif';
  wrap(ctx,meta.downloadHeadline,80,285,920,74,2);

  ctx.font='600 30px sans-serif';ctx.fillStyle=special?'#6f5369':'#c9c9c9';
  wrap(ctx,meta.downloadText,80,430,920,43,3);

  const qrHost=document.createElement('div');
  qrHost.style.position='fixed';qrHost.style.left='-9999px';document.body.appendChild(qrHost);
  new QRCode(qrHost,{text:url,width:560,height:560,correctLevel:QRCode.CorrectLevel.M});
  await sleep(120);
  const qCanvas=qrHost.querySelector('canvas');
  const qImg=qrHost.querySelector('img');
  if(qCanvas) ctx.drawImage(qCanvas,260,585,560,560);
  else if(qImg){ await new Promise(r=>{if(qImg.complete)r();else qImg.onload=r;});ctx.drawImage(qImg,260,585,560,560); }
  qrHost.remove();

  ctx.fillStyle=special?'#2d2130':'#fff';ctx.font='900 31px sans-serif';ctx.textAlign='center';
  ctx.fillText(meta.downloadBadge,540,1210);
  ctx.font='600 23px sans-serif';ctx.fillStyle=special?'#765f70':'#aaa';ctx.fillText(state.brand.tagline,540,1260);
  ctx.textAlign='left';

  const a=document.createElement('a');
  a.href=canvas.toDataURL('image/png');
  a.download=`${state.brand.appName}-${general?'general':occasionId(occasion)}-${Date.now()}.png`;
  a.click();
}

async function captionsTab(){setAdminTitle('Caption Presets');const snap=await getDocs(collection(db,'captionPresets')).catch(()=>({docs:[]}));const caps=snap.docs.map(d=>({id:d.id,...d.data()}));$('#adminContent').innerHTML=`<section class="card"><div class="section-head"><div><h3>Caption Preset</h3><p class="tiny">Buat caption yang bisa dipilih saat generate QR.</p></div><button class="btn primary" id="addCap">+ Caption</button></div><div id="caps" class="caption-list">${caps.map(c=>`<div class="caption-item"><input data-id="${c.id}" value="${esc(c.text||'')}"><button class="btn danger" data-del="${c.id}">×</button></div>`).join('')}</div></section>`;$('#addCap').onclick=async()=>{await addDoc(collection(db,'captionPresets'),{text:'Caption baru ✨',createdAt:serverTimestamp()});captionsTab();};$('#caps').onchange=async e=>{if(e.target.dataset.id)await updateDoc(doc(db,'captionPresets',e.target.dataset.id),{text:e.target.value,updatedAt:serverTimestamp()});};$('#caps').onclick=async e=>{if(e.target.dataset.del){await deleteDoc(doc(db,'captionPresets',e.target.dataset.del));captionsTab();}};}
async function campaignsTab(){
  setAdminTitle('Daftar QR');
  const [snap,songSnap]=await Promise.all([
    getDocs(query(collection(db,'campaigns'),orderBy('createdAt','desc'),limit(80))).catch(()=>getDocs(collection(db,'campaigns'))),
    getDocs(collection(db,'songs')).catch(()=>({docs:[]}))
  ]);
  const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
  const songs=songSnap.docs.map(d=>({id:d.id,...d.data()}));
  const toLocalInput=v=>{
    if(!v) return '';
    const d=v?.toDate?v.toDate():new Date(v);
    if(!d||Number.isNaN(d.getTime())) return '';
    const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return z.toISOString().slice(0,16);
  };
  $('#adminContent').innerHTML=`
    <section class="card">
      <div class="section-head">
        <div><h3>QR Experiences</h3><p class="tiny">Create, buka/read, edit/update, generate ulang, atau hapus QR.</p></div>
        <button class="btn primary" id="newQrFromList">+ Generate QR Baru</button>
      </div>

      <div id="campaignEditPanel" class="campaign-edit-panel is-hidden">
        <div class="section-head"><div><h3>Edit QR</h3><p class="tiny" id="editQrId">—</p></div><button class="btn ghost" id="cancelCampaignEdit">Tutup</button></div>
        <div class="grid two compact">
          <div class="field"><label>Customer / Order</label><input id="editCustomer"></div>
          <div class="field"><label>Produk</label><input id="editProduct"></div>
          <div class="field"><label>QR Type</label><select id="editOccasionMode"><option value="choose">General • User pilih occasion</option><option value="locked">Dedicated • Occasion dikunci</option></select></div>
          <div class="field" id="editOccasionField"><label>Occasion khusus</label><select id="editOccasion">${occasionOptionsHtml()}</select></div>
          <div class="field"><label>Mode musik</label><select id="editMode"><option value="gacha">Genre + Gacha</option><option value="custom">Custom Song</option></select></div>
          <div class="field"><label>Lagu khusus</label><select id="editForced"><option value="">— pilih —</option>${songs.map(s=>`<option value="${s.id}">${esc(s.title)} — ${esc(s.artist||'')}</option>`).join('')}</select></div>
        </div>
        <div id="editBirthdaySettings" class="birthday-admin-settings is-hidden"><div class="grid two compact"><div class="field"><label>Nama yang ulang tahun</label><input id="editBirthdayName"></div><div class="field"><label>Umur</label><input id="editBirthdayAge"></div></div><div class="field"><label>Pesan ulang tahun</label><textarea id="editBirthdayMessage" rows="3"></textarea></div></div>
        <div class="field"><label>Note / ucapan</label><textarea id="editNote" rows="3"></textarea></div>
        <div class="field"><label>Caption foto</label><input id="editPhotoCaption"></div>
        <div class="grid two compact">
          <div class="field"><label>Masa aktif sampai</label><input id="editExpires" type="datetime-local"></div>
          <div class="field"><label>Status</label><select id="editActive"><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
        </div>
        <div class="row wrap"><button class="btn primary" id="saveCampaignEdit">Simpan Perubahan</button><button class="btn danger" id="deleteCampaignEdit">Hapus QR</button></div>
      </div>

      <div id="savedQrPreview" class="grid two" style="display:none;margin-bottom:16px">
        <section class="card" style="box-shadow:none">
          <h3 style="margin-top:0">QR Tersimpan</h3>
          <div class="qr-card"><div id="qrcode"></div></div>
        </section>
        <section class="card" style="box-shadow:none">
          <h3 style="margin-top:0">Gunakan Lagi</h3>
          <div class="field"><label>Link customer</label><input id="savedQrLink" readonly></div>
          <div class="row wrap">
            <button class="btn primary" id="savedQrCopy">Copy Link</button>
            <button class="btn ghost" id="savedQrOpen">Buka</button>
            <button class="btn ghost" id="savedQrDownload">⬇ Download QR</button>
            <button class="btn ghost" id="savedQrPrint">Print Thermal</button>
            <button class="btn ghost" id="savedQrClose">Tutup</button>
          </div>
          <div class="notice" style="margin-top:12px">QR lama dipakai ulang tanpa membuat dokumen baru.</div>
        </section>
      </div>

      <div class="campaign-list">${rows.length?rows.map(c=>`
        <article class="campaign-item">
          <div>
            <b>${esc(c.customer||c.product||'QR Experience')}</b>
            <span>${esc(c.product||'')} • ${campaignOccasionMode(c)==='choose'?'✦ General • User pilih occasion':esc(occasionBadge(c.occasion))} • ${c.active===false?'Nonaktif':'Aktif'}</span>
            <code>${c.id}</code>
          </div>
          <div>
            <button class="btn primary" data-qr="${c.id}">QR Lagi</button>
            <button class="btn ghost" data-open="${c.id}">Buka</button>
            <button class="btn ghost" data-copy="${c.id}">Copy</button>
            <button class="btn ghost" data-download="${c.id}">⬇ QR</button>
            <button class="btn ghost" data-edit="${c.id}">Edit</button>
            <button class="btn ${c.active===false?'primary':'danger'}" data-toggle="${c.id}" data-active="${c.active!==false}">${c.active===false?'Aktifkan':'Nonaktifkan'}</button>
            <button class="btn danger" data-delete="${c.id}">Hapus</button>
          </div>
        </article>`).join(''):'<div class="empty-list">Belum ada QR. Klik “Generate QR Baru” untuk membuat yang pertama.</div>'}
      </div>
    </section>

    <section class="thermal" id="thermal">
      <img class="thermal-logo" src="${esc(logo())}">
      <h2>${esc(state.brand.brandName)}</h2>
      <p>${esc(state.brand.tagline)}</p>
      <div id="thermalQR"></div>
      <div class="thermal-cta">♫ Coba scan<br>dan temukan keseruannya!</div>
      <p>Scan • Pilih Genre • Gacha • Dengar • Foto</p>
      <div class="cut">✦ ${esc(state.brand.appName)} ✦</div>
    </section>`;

  let selectedUrl='',editingId='',selectedCampaign=null;
  const rowById=id=>rows.find(r=>r.id===id);
  const openEdit=id=>{
    const c=rowById(id); if(!c) return;
    editingId=id;
    $('#editQrId').textContent=id;
    $('#editCustomer').value=c.customer||'';
    $('#editProduct').value=c.product||'';
    $('#editOccasionMode').value=campaignOccasionMode(c);
    $('#editOccasion').value=c.occasion||'regular';
    $('#editOccasionField').classList.toggle('is-hidden',campaignOccasionMode(c)!=='locked');
    $('#editBirthdayName').value=c.birthdayName||'';
    $('#editBirthdayAge').value=c.birthdayAge||'';
    $('#editBirthdayMessage').value=c.birthdayMessage||'';
    $('#editBirthdaySettings').classList.toggle('is-hidden',campaignOccasionMode(c)!=='locked'||$('#editOccasion').value!=='birthday');
    $('#editMode').value=c.mode||'gacha';
    $('#editForced').value=c.forcedSongId||'';
    $('#editNote').value=c.note||'';
    $('#editPhotoCaption').value=c.photoCaption||'';
    $('#editExpires').value=toLocalInput(c.expiresAt);
    $('#editActive').value=String(c.active!==false);
    $('#campaignEditPanel').classList.remove('is-hidden');
    $('#campaignEditPanel').scrollIntoView({behavior:'smooth',block:'start'});
  };

  const syncEditOccasion=()=>{
    const locked=$('#editOccasionMode').value==='locked';
    $('#editOccasionField').classList.toggle('is-hidden',!locked);
    $('#editBirthdaySettings').classList.toggle('is-hidden',!(locked&&$('#editOccasion').value==='birthday'));
  };
  $('#editOccasionMode').onchange=syncEditOccasion;
  $('#editOccasion').onchange=syncEditOccasion;
  $('#newQrFromList').onclick=()=>{const nav=$('.nav button[data-tab="qr"]');if(nav)nav.click();else qrTab();};
  $('#cancelCampaignEdit').onclick=()=>{editingId='';$('#campaignEditPanel').classList.add('is-hidden');};
  $('#saveCampaignEdit').onclick=async()=>{
    if(!editingId) return;
    const expires=$('#editExpires').value;
    await updateDoc(doc(db,'campaigns',editingId),{
      customer:$('#editCustomer').value.trim(),
      product:$('#editProduct').value.trim(),
      occasionMode:$('#editOccasionMode').value,
      occasion:$('#editOccasionMode').value==='locked'?$('#editOccasion').value:'regular',
      birthdayName:$('#editOccasionMode').value==='locked'&&$('#editOccasion').value==='birthday'?$('#editBirthdayName').value.trim():'',
      birthdayAge:$('#editOccasionMode').value==='locked'&&$('#editOccasion').value==='birthday'?$('#editBirthdayAge').value.trim():'',
      birthdayMessage:$('#editOccasionMode').value==='locked'&&$('#editOccasion').value==='birthday'?$('#editBirthdayMessage').value.trim():'',
      mode:$('#editMode').value,
      forcedSongId:$('#editForced').value,
      note:$('#editNote').value.trim(),
      photoCaption:$('#editPhotoCaption').value.trim(),
      active:$('#editActive').value==='true',
      expiresAt:expires?new Date(expires):null,
      updatedAt:serverTimestamp()
    });
    toast('QR berhasil diupdate.'); campaignsTab();
  };
  $('#deleteCampaignEdit').onclick=async()=>{
    if(!editingId) return;
    if(!confirm('Hapus QR ini permanen? Link customer ini tidak akan bisa dipakai lagi.')) return;
    await deleteDoc(doc(db,'campaigns',editingId));
    toast('QR dihapus.'); campaignsTab();
  };

  $$('[data-qr]').forEach(b=>b.onclick=()=>{selectedCampaign=rowById(b.dataset.qr)||null;selectedUrl=`${baseUrl()}?c=${b.dataset.qr}`;$('#savedQrLink').value=selectedUrl;$('#savedQrPreview').style.display='grid';renderQr(selectedUrl);$('#savedQrPreview').scrollIntoView({behavior:'smooth',block:'start'});});
  $$('[data-open]').forEach(b=>b.onclick=()=>window.open(`${baseUrl()}?c=${b.dataset.open}`,'_blank'));
  $$('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(`${baseUrl()}?c=${b.dataset.copy}`).then(()=>toast('Link dicopy.')));
  $$('[data-download]').forEach(b=>b.onclick=()=>{const c=rowById(b.dataset.download);const url=`${baseUrl()}?c=${b.dataset.download}`;downloadQrCard(url,c&&campaignOccasionMode(c)==='locked'?(c.occasion||'regular'):'choose');});
  $$('[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  $$('[data-toggle]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'campaigns',b.dataset.toggle),{active:b.dataset.active!=='true',updatedAt:serverTimestamp()});campaignsTab();});
  $$('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus QR ini permanen?'))return;await deleteDoc(doc(db,'campaigns',b.dataset.delete));campaignsTab();});

  $('#savedQrCopy').onclick=()=>selectedUrl&&navigator.clipboard.writeText(selectedUrl).then(()=>toast('Link dicopy.'));
  $('#savedQrOpen').onclick=()=>selectedUrl&&window.open(selectedUrl,'_blank');
  $('#savedQrDownload').onclick=()=>selectedUrl?downloadQrCard(selectedUrl,selectedCampaign&&campaignOccasionMode(selectedCampaign)==='locked'?(selectedCampaign.occasion||'regular'):'choose'):toast('Pilih QR dulu.');
  $('#savedQrPrint').onclick=()=>selectedUrl?window.print():toast('Pilih QR dulu.');
  $('#savedQrClose').onclick=()=>{$('#savedQrPreview').style.display='none';};
}


async function statsTab(){
  setAdminTitle('Statistics');

  const [eventSnap,campaignSnap]=await Promise.all([
    getDocs(query(collection(db,'events'),orderBy('createdAt','desc'),limit(500))).catch(()=>({docs:[]})),
    getDocs(collection(db,'campaigns')).catch(()=>({docs:[]}))
  ]);

  const campaignsList=campaignSnap.docs.map(d=>({id:d.id,...d.data()}));
  const campaigns=new Map(campaignsList.map(c=>[c.id,c]));

  // Statistik hanya memakai event dari QR yang masih terdaftar.
  // Event historis dari QR lama/tidak dikenal tidak ditampilkan lagi.
  const eventDocs=eventSnap.docs
    .map(d=>({id:d.id,...d.data()}))
    .filter(e=>campaigns.has(e.campaignId));

  const count=t=>eventDocs.filter(e=>e.type===t).length;

  const grouped={};
  for(const e of eventDocs){
    const id=e.campaignId;
    grouped[id] ||= {campaignId:id,scan:0,gacha:0,play:0,capture:0,share:0,total:0};
    if(grouped[id][e.type]!==undefined) grouped[id][e.type]++;
    grouped[id].total++;
  }

  const ranking=Object.values(grouped)
    .filter(r=>campaigns.has(r.campaignId))
    .sort((a,b)=>(b.scan-a.scan)||(b.total-a.total))
    .slice(0,12);

  const labelFor=id=>{
    const c=campaigns.get(id);
    const title=c?.customer||c?.product||`${occasionDisplayLabel(c?.occasion)} QR`;
    const sub=[c?.product,occasionBadge(c?.occasion),id].filter(Boolean).join(' • ');
    return {title,sub};
  };

  $('#adminContent').innerHTML=`
    <div class="dash-grid">
      <div class="metric"><span>Scan</span><b>${count('scan')}</b><em>QR terdaftar • latest 500</em></div>
      <div class="metric"><span>Gacha</span><b>${count('gacha')}</b><em>QR terdaftar • latest 500</em></div>
      <div class="metric"><span>Play</span><b>${count('play')}</b><em>QR terdaftar • latest 500</em></div>
      <div class="metric"><span>Capture</span><b>${count('capture')}</b><em>QR terdaftar • latest 500</em></div>
      <div class="metric"><span>Share</span><b>${count('share')}</b><em>QR terdaftar • latest 500</em></div>
    </div>

    <section class="card">
      <h3>Conversion</h3>
      <div class="conversion">
        <div><span>Scan → Gacha</span><b>${count('scan')?Math.round(count('gacha')/count('scan')*100):0}%</b></div>
        <div><span>Gacha → Play</span><b>${count('gacha')?Math.round(count('play')/count('gacha')*100):0}%</b></div>
        <div><span>Capture → Share</span><b>${count('capture')?Math.round(count('share')/count('capture')*100):0}%</b></div>
      </div>
    </section>

    <section class="card mt">
      <div class="section-head">
        <div>
          <h3>QR Source Performance</h3>
          <p class="tiny">Hanya QR yang masih terdaftar di List QR yang ditampilkan.</p>
        </div>
      </div>
      <div class="qr-stat-list">
        ${ranking.length?ranking.map((r,i)=>{
          const x=labelFor(r.campaignId);
          return `<div class="qr-stat-row">
            <div class="qr-stat-rank">${i+1}</div>
            <div class="qr-stat-copy"><b>${esc(x.title)}</b><span>${esc(x.sub)}</span></div>
            <div class="qr-stat-values"><strong>${r.scan}</strong><small>scan</small><span>${r.gacha} gacha • ${r.play} play • ${r.capture} foto • ${r.share} share</span></div>
          </div>`;
        }).join(''):'<div class="empty-list">Belum ada statistik dari QR yang terdaftar.</div>'}
      </div>
    </section>`;
}

boot().catch(e=>{
  console.error('Thanksgiving boot fatal:',e);
  document.documentElement.dataset.thanksgivingBootFailed='1';
  try{renderError('Thanksgiving gagal memulai. Coba reload atau cek deploy terbaru.',e);}
  catch(_){
    const host=document.getElementById('app');
    if(host)host.innerHTML='<main class="shell"><section class="phone customer-page"><div class="card"><h2>Thanksgiving gagal memulai</h2><p>Refresh halaman. Kalau masih gagal, cek deploy terbaru.</p></div></section></main>';
  }
});