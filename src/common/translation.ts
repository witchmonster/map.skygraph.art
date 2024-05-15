import translation_uk from "../../translation_uk.csv";
import translation_pl from "../../translation_pl.csv";
import translation_en from "../../translation_en.csv";
import { getConfig } from '../../exporter/src/common/config';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { BuiltAtlasLayout } from "../../exporter/src/common/model";

const translationMap = {
    "pl": { lang2: "pl", translation: translation_pl, name: "Polski 🇵🇱", picker: true },
    "uk": { lang2: "uk", translation: translation_uk, name: "Українська 🇺🇦", picker: true },
    "en": { lang2: "en", translation: translation_en, name: "English 🇺🇸", picker: false },
    // "en-GB": { lang2: "en", translation: translation_en, name: "English 🇬🇧", picker: true },
    "en-US": { lang2: "en", translation: translation_en, name: "English 🇺🇸", picker: true }
}

i18next.use(LanguageDetector).init();

const fallbackLanguage = "en";
const fallbackLanguageMap = {
    "uk": "en",
    "pl": "en"
}

const getFallbackLanguage = (language: string) => {
    return fallbackLanguageMap[language] ?? fallbackLanguage;
}

const languages = i18next.languages;

const autoPickLanguage = () => {
    //if contains Ukrainian, resolve Ukrainian
    return (languages && languages.filter(lang => lang === 'uk')[0])
        ?? getConfig(false).settings.languages[0] //fallback to language of legend
        ?? fallbackLanguage; //fallback to default
}

const resolvedLanguage = autoPickLanguage();

const getTranslationWithOverride = (config: {
    key: string,
    language: string,
    truncate?: {
        viewPort: {
            width: number,
            height: number
        },
        xs?: number,
        mobile?: number,
        desktop?: number
    },
    layout?: BuiltAtlasLayout
}) => {
    return getTranslation(config.key, config.language, config.truncate, config.layout);
};

const getTranslation = (key: string, language: string, truncate?: {
    viewPort: {
        width: number,
        height: number
    },
    xs?: number,
    mobile?: number,
    desktop?: number
}, layout?: BuiltAtlasLayout) => {
    const maxViewport = {
        mobile: 700,
        xs: 370
    }
    const minViewport = {
        mobile: 370,
        xs: 320
    }
    language = language ?? resolvedLanguage;
    const currentLayoutLegendName = layout && layout?.legend;
    const currentLayoutLegend = currentLayoutLegendName && getConfig(layout.isSubLayout).legend.legends.filter(legend => legend.name === currentLayoutLegendName)[0];
    const translation: { key: string, value: string }[] = (currentLayoutLegend && currentLayoutLegend.translation_overrides && currentLayoutLegend.translation_overrides[translationMap[language].lang2] &&
        currentLayoutLegend.translation_overrides[translationMap[language].lang2].filter(entry => entry.key === key).length === 1) ? currentLayoutLegend.translation_overrides[translationMap[language].lang2] : translationMap[language].translation;
    const translationEntry = translation.filter(entry => entry.key === key)[0]
        ?? translationMap[fallbackLanguage].translation.filter(entry => entry.key === key)[0];
    const translationText = translationEntry ? translationEntry.value : key;
    const viewPortType = truncate?.viewPort?.width && (
        truncate?.viewPort?.width > maxViewport.mobile ? "desktop"
            : truncate?.viewPort?.width > maxViewport.xs ? "mobile"
                : "xs");
    const truncateLength = truncate && viewPortType && truncate[viewPortType];
    const maxLength = truncateLength && (truncateLength * truncate?.viewPort?.width / minViewport[viewPortType]);
    return maxLength
        ? truncateText(translationText, maxLength)
        : translationText;
}

const truncateText = (text: string, size: number): string => {
    return text.length > size ? text?.substring(0, size).trim() + "..." : text;
}

const getPickerLanguages = () => {
    return Object.keys(translationMap)
        .filter(key => translationMap[key].name !== undefined && translationMap[key].picker)
        .map(key => {
            return { lang2: translationMap[key].lang2, lang: key, name: translationMap[key].name }
        })
}

const getLanguageName = (name: string) => {
    return translationMap[name] && translationMap[name].name;
}

const getLanguageByName = (name: string | null) => {
    return name && translationMap[name] && name;
}

const getLanguageOrDefault = (name: string | null) => {
    return getLanguageByName(name) ?? autoPickLanguage();
}

const getLang2 = (language: string | null) => {
    return language && translationMap[language].lang2;
}

const getValueByLanguage = (translation: { [key: string]: any } | undefined, language: string) => {
    return !translation ? "" : translation[language]
        ?? translation[getLang2(language)]
        ?? translation[getFallbackLanguage(language)];
}

const getValueByLanguageFromMap = (translation: Map<string, Map<string, string>>, language: string) => {
    return translation.get(language)
        ?? translation.get(getLang2(language))
        ?? translation.get(getFallbackLanguage(language));
}

const lang2ToNames = (lang2: string[] | null) => {
    return (lang2 && lang2.map(lang2 => translationMap[lang2].name ?? lang2).toString());
}

export { getTranslation, getTranslationWithOverride, truncateText, getPickerLanguages, getLanguageName, getLanguageOrDefault, getLanguageByName, getValueByLanguage, lang2ToNames, getValueByLanguageFromMap }
