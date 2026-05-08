import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      nominate: "Nominate",
      admin: "Admin",
      signOut: "Sign Out",
      electionList: "Election List",
      upcomingElections: "Upcoming Elections",
      activeElections: "Active Elections",
      closedElections: "Closed Elections",
      voteNow: "Vote Now",
      viewResults: "View Results",
      noElections: "No elections available",
      selectLanguage: "Select Language",
    }
  },
  ml: {
    translation: {
      dashboard: "ഡാഷ്‌ബോർഡ്",
      nominate: "നാമനിർദ്ദേശം ചെയ്യുക",
      admin: "അഡ്മിൻ",
      signOut: "സൈൻ ഔട്ട് ചെയ്യുക",
      electionList: "തിരഞ്ഞെടുപ്പ് പട്ടിക",
      upcomingElections: "വരാനിരിക്കുന്ന തിരഞ്ഞെടുപ്പുകൾ",
      activeElections: "സജീവമായ തിരഞ്ഞെടുപ്പുകൾ",
      closedElections: "അവസാനിച്ച തിരഞ്ഞെടുപ്പുകൾ",
      voteNow: "ഇപ്പോൾ വോട്ട് ചെയ്യുക",
      viewResults: "ഫലങ്ങൾ കാണുക",
      noElections: "തിരഞ്ഞെടുപ്പുകൾ ലഭ്യമല്ല",
      selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    }
  },
  hi: {
    translation: {
      dashboard: "डैशबोर्ड",
      nominate: "नामांकित करें",
      admin: "व्यवस्थापक",
      signOut: "साइन आउट करें",
      electionList: "चुनाव सूची",
      upcomingElections: "आगामी चुनाव",
      activeElections: "सक्रिय चुनाव",
      closedElections: "बंद चुनाव",
      voteNow: "अभी वोट करें",
      viewResults: "परिणाम देखें",
      noElections: "कोई चुनाव उपलब्ध नहीं है",
      selectLanguage: "भाषा चुनें",
    }
  },
  te: {
    translation: {
      dashboard: "డాష్‌బోర్డ్",
      nominate: "నామినేట్ చేయండి",
      admin: "అడ్మిన్",
      signOut: "సైన్ అవుట్ చేయండి",
      electionList: "ఎన్నికల జాబితా",
      upcomingElections: "రాబోయే ఎన్నికలు",
      activeElections: "క్రియాశీల ఎన్నికలు",
      closedElections: "ముగిసిన ఎన్నికలు",
      voteNow: "ఇప్పుడే ఓటు వేయండి",
      viewResults: "ఫలితాలను చూడండి",
      noElections: "ఎన్నికలు అందుబాటులో లేవు",
      selectLanguage: "భాషను ఎంచుకోండి",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
