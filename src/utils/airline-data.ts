/**
 * Airport and Airline Data Utilities
 * Provides mappings and formatters for airport codes and airline codes
 */

// 공항 코드 → 이름 매핑
export const airportNames: Record<string, string> = {
    // 한국
    'ICN': '인천국제공항',
    'GMP': '김포국제공항',
    'PUS': '김해국제공항',
    'CJU': '제주국제공항',
    'TAE': '대구국제공항',
    'CJJ': '청주국제공항',
    'MWX': '무안국제공항',
    'RSU': '여수공항',
    'KWJ': '광주공항',
    // 일본
    'NRT': '도쿄 나리타',
    'HND': '도쿄 하네다',
    'KIX': '오사카 간사이',
    'ITM': '오사카 이타미',
    'OKA': '오키나와 나하',
    'FUK': '후쿠오카',
    'CTS': '삿포로 신치토세',
    'NGO': '나고야 추부',
    'KOJ': '가고시마',
    'OIT': '오이타',
    'MYJ': '마쓰야마',
    'TAK': '다카마쓰',
    'HIJ': '히로시마',
    'SDJ': '센다이',
    // 동남아
    'BKK': '방콕 수완나품',
    'DMK': '방콕 돈므앙',
    'CNX': '치앙마이',
    'HKT': '푸켓',
    'SGN': '호치민',
    'HAN': '하노이',
    'DAD': '다낭',
    'CXR': '나트랑',
    'PQC': '푸꾸옥',
    'SIN': '싱가포르 창이',
    'KUL': '쿠알라룸푸르',
    'MNL': '마닐라',
    'CEB': '세부',
    'DPS': '발리 덴파사르',
    'CGK': '자카르타',
    // 중국/홍콩/대만
    'HKG': '홍콩',
    'TPE': '타이베이 타오위안',
    'TSA': '타이베이 송산',
    'PVG': '상하이 푸둥',
    'SHA': '상하이 훙차오',
    'PEK': '베이징 서우두',
    'PKX': '베이징 다싱',
    'CAN': '광저우',
    // 기타
    'LAX': '로스앤젤레스',
    'JFK': '뉴욕 JFK',
    'SFO': '샌프란시스코',
    'ORD': '시카고 오헤어',
    'SYD': '시드니',
    'MEL': '멜버른',
    'LHR': '런던 히드로',
    'CDG': '파리 샤를드골',
    'FRA': '프랑크푸르트',
};

// 항공사 코드 → 이름 매핑
export const airlineNames: Record<string, string> = {
    // 한국
    'KE': '대한항공',
    'OZ': '아시아나항공',
    '7C': '제주항공',
    'LJ': '진에어',
    'TW': '티웨이항공',
    'BX': '에어부산',
    'RS': '에어서울',
    'RF': '에어로케이',
    'YP': '에어프레미아',
    '4V': '플라이강원',
    // 일본
    'JL': '일본항공 (JAL)',
    'NH': '전일본공수 (ANA)',
    'MM': '피치항공',
    'BC': '스카이마크',
    'GK': '젯스타 재팬',
    'NU': '일본트랜스오션항공',
    '6J': '솔라시드에어',
    // LCC & 기타
    'VJ': '비엣젯항공',
    'VN': '베트남항공',
    'TG': '타이항공',
    'SQ': '싱가포르항공',
    'CX': '캐세이퍼시픽',
    'CI': '중화항공',
    'BR': '에바항공',
    'MU': '중국동방항공',
    'CA': '중국국제항공',
    'HO': '준야오항공',
    'TR': '스쿠트',
    'SL': '타이라이언에어',
    'FD': '에어아시아',
    'AK': '에어아시아 말레이시아',
    'PR': '필리핀항공',
    '5J': '세부퍼시픽',
    'Z2': '에어아시아 필리핀',
    'AA': '아메리칸항공',
    'UA': '유나이티드항공',
    'DL': '델타항공',
    'BA': '영국항공',
    'AF': '에어프랑스',
    'LH': '루프트한자',
    'EK': '에미레이트',
    'QR': '카타르항공',
};

/**
 * 공항 코드를 "이름 (코드)" 형식으로 변환
 */
export const formatAirport = (code: string): string => {
    if (!code) return '';
    const upperCode = code.toUpperCase().trim();
    // 이미 "이름 (코드)" 형식이면 그대로 반환
    if (/\([A-Z]{3}\)/.test(code)) return code;
    const name = airportNames[upperCode];
    return name ? `${name} (${upperCode})` : upperCode;
};

/**
 * 편명을 "항공사명 풀편명" 형식으로 변환 (예: "제주항공 7C1801")
 */
export const formatFlight = (airline: string, flightNumber: string): string => {
    // 만약 둘 다 비어있으면 빈 문자열 반환
    if (!airline && !flightNumber) return '';

    // flightNumber가 이미 풀 편명인 경우 (예: "7C1801", "KE123")
    // 항공사 코드는 반드시 문자를 포함해야 함 (7C, KE 등)
    // 순수 숫자(1801)는 매칭하지 않음
    const fnMatch = flightNumber?.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d+)$/i);
    if (fnMatch) {
        const code = fnMatch[1].toUpperCase();
        const name = airlineNames[code];
        return name ? `${name} ${flightNumber.toUpperCase()}` : flightNumber.toUpperCase();
    }

    // airline이 코드(7C), flightNumber가 숫자(1801)인 경우
    const airlineCode = airline?.toUpperCase().trim() || '';
    const flight = flightNumber?.trim() || '';

    // airline이 비어있고 flightNumber도 숫자만 있는 경우
    if (!airlineCode && /^\d+$/.test(flight)) {
        return flight; // 편명 숫자만 반환
    }

    // airline이 코드인 경우
    if (airlineCode && /^[A-Z0-9]{2}$/i.test(airlineCode)) {
        const airlineName = airlineNames[airlineCode];
        const fullFlightNumber = airlineCode + flight;
        const result = airlineName ? `${airlineName} ${fullFlightNumber}` : fullFlightNumber;
        return result;
    }

    // airline이 이미 이름인 경우 (예: "제주항공")
    if (airlineCode && airlineCode.length > 2) {
        return flight ? `${airlineCode} ${flight}` : airlineCode;
    }

    // 그 외: 있는 대로 조합
    return [airlineCode, flight].filter(Boolean).join(' ');
};

/**
 * Extract IATA codes from strings like "Incheon (ICN)" or just "ICN"
 */
export const extractIata = (str: string): string | null => {
    if (!str) return null;
    // Try to extract from format "Name (CODE)"
    const match = str.match(/\(([A-Z]{3})\)/i);
    if (match) return match[1].toUpperCase();
    // If it's already a 3-letter code
    if (/^[A-Z]{3}$/i.test(str.trim())) return str.trim().toUpperCase();
    return null;
};
