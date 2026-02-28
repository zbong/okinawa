// ── 목적지 → 국가 정보 매핑 ────────────────────────────────────────────────────

export interface DestinationInfo {
    country: string;          // 국가명 (한국어)
    language: string;         // 언어 코드
    languageName: string;     // 언어명 (한국어)
    currency: string;         // 통화 코드 (ISO 4217)
    currencySymbol: string;   // 통화 기호
    currencyName: string;     // 통화명 (한국어)
    defaultRate: number;      // KRW 기준 기본 환율 (1 외화 → KRW)
    flag: string;             // 국기 이모지
}

// 목적지 키워드 → 국가 정보
// 목적지 키워드 → 국가 정보
const DESTINATION_MAP: { keywords: string[]; info: DestinationInfo }[] = [
    {
        keywords: ["오키나와", "okinawa", "나하", "naha", "일본", "japan", "도쿄", "osaka", "후쿠오카"],
        info: {
            country: "일본", language: "ja-JP", languageName: "일본어",
            currency: "JPY", currencySymbol: "¥", currencyName: "엔", defaultRate: 9.32, flag: "🇯🇵"
        }
    },
    {
        keywords: ["다낭", "danang", "하노이", "hanoi", "호치민", "베트남", "vietnam"],
        info: {
            country: "베트남", language: "vi-VN", languageName: "베트남어",
            currency: "VND", currencySymbol: "₫", currencyName: "동", defaultRate: 0.057, flag: "🇻🇳"
        }
    },
    {
        keywords: ["방콕", "bangkok", "치앙마이", "푸켓", "태국", "thailand"],
        info: {
            country: "태국", language: "th-TH", languageName: "태국어",
            currency: "THB", currencySymbol: "฿", currencyName: "바트", defaultRate: 46.6, flag: "🇹🇭"
        }
    },
    {
        keywords: ["미국", "usa", "뉴욕", "하와이", "괌", "guam", "hawaii", "new york", "la", "america", "미합중국"],
        info: {
            country: "미국", language: "en-US", languageName: "영어",
            currency: "USD", currencySymbol: "$", currencyName: "달러", defaultRate: 1447.0, flag: "🇺🇸"
        }
    }
];

const DEFAULT_INFO: DestinationInfo = {
    country: "전 세계", language: "ko-KR", languageName: "한국어",
    currency: "USD", currencySymbol: "$", currencyName: "달러", defaultRate: 1447.0, flag: "🌐"
};

export function getDestinationInfo(destination: string): DestinationInfo {
    if (!destination) return DEFAULT_INFO;
    const lower = destination.toLowerCase();
    for (const { keywords, info } of DESTINATION_MAP) {
        if (keywords.some(k => lower.includes(k.toLowerCase()))) {
            return info;
        }
    }
    return DEFAULT_INFO;
}
