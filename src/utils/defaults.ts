import { getDestinationInfo } from './destinationHelper';

export interface SpeechItem {
    id: string;
    category: 'basic';
    kor: string;     // 한국어 의미
    jp: string;      // 현지어 표기
    pron: string;    // 발음 (한국어 음역)
}

// ── 일본어 ────────────────────────────────────────────────────────────────────
const JAPANESE_SPEECH: SpeechItem[] = [
    { id: 'v1', category: 'basic', kor: '안녕하세요', jp: 'こんにちは', pron: '곤니치와' },
    { id: 'v2', category: 'basic', kor: '감사합니다', jp: 'ありがとうございます', pron: '아리가토-고자이마스' },
    { id: 'v3', category: 'basic', kor: '죄송합니다', jp: 'すみません', pron: '스미마센' },
    { id: 'v4', category: 'basic', kor: '얼마예요?', jp: 'いくらですか？', pron: '이쿠라데스카?' },
    { id: 'v5', category: 'basic', kor: '메뉴판 주세요', jp: 'メニュー를ください', pron: '메뉴-오 쿠다사이' },
    { id: 'v6', category: 'basic', kor: '맛있어요', jp: 'おいしいです', pron: '오이시-데스' },
    { id: 'v7', category: 'basic', kor: '화장실 어디예요?', jp: 'トイレはどこですか？', pron: '토이레와 도코데스카?' },
    { id: 'v8', category: 'basic', kor: '체크인 부탁합니다', jp: 'チェック인お願いします', pron: '젯쿠인 오네가이시마스' },
    { id: 'v9', category: 'basic', kor: '이거 주세요', jp: 'これをください', pron: '코레오 쿠다사이' },
    { id: 'v10', category: 'basic', kor: '안녕히 계세요', jp: 'さようなら', pron: '사요-나라' },
];

// ── 태국어 ────────────────────────────────────────────────────────────────────
const THAI_SPEECH: SpeechItem[] = [
    { id: 't1', category: 'basic', kor: '안녕하세요', jp: 'สวัสดีครับ', pron: '사왓디 크랍' },
    { id: 't2', category: 'basic', kor: '감사합니다', jp: 'ขอบคุณครับ', pron: '콥쿤 크랍' },
    { id: 't3', category: 'basic', kor: '죄송합니다', jp: 'ขอโทษครับ', pron: '코톳 크랍' },
    { id: 't4', category: 'basic', kor: '얼마예요?', jp: 'ราคาเท่าไหร่ครับ', pron: '라카 타오라이 크랍?' },
    { id: 't5', category: 'basic', kor: '메뉴판 주세요', jp: 'ขอเม뉴ด้วยครับ', pron: '코 메누 두아이 크랍' },
    { id: 't6', category: 'basic', kor: '맛있어요', jp: 'อร่อยมากครับ', pron: '아로이 막 크랍' },
    { id: 't7', category: 'basic', kor: '화장실 어디예요?', jp: 'ห้องน้ำอยู่ที่ไหนครับ', pron: '홍남 유 티나이 크랍?' },
    { id: 't8', category: 'basic', kor: '체크인 부탁합니다', jp: 'เช็ค인ด้วยครับ', pron: '첵인 두아이 크랍' },
    { id: 't9', category: 'basic', kor: '할인해 주세요', jp: 'ลดราคาได้ไหมครับ', pron: '롯 라카 다이 마이 크랍?' },
    { id: 't10', category: 'basic', kor: '안녕히 계세요', jp: 'ลาก่อนครับ', pron: '라 꼰 크랍' },
];

// ── 영어 ─────────────────────────────────────────────────────────────────────
const ENGLISH_SPEECH: SpeechItem[] = [
    { id: 'e1', category: 'basic', kor: '안녕하세요', jp: 'Hello!', pron: '헬로' },
    { id: 'e2', category: 'basic', kor: '감사합니다', jp: 'Thank you!', pron: '땡큐' },
    { id: 'e3', category: 'basic', kor: '죄송합니다', jp: 'I\'m sorry.', pron: '아임 쏘리' },
    { id: 'e4', category: 'basic', kor: '얼마예요?', jp: 'How much is it?', pron: '하우 머치 이즈 잇?' },
    { id: 'e5', category: 'basic', kor: '메뉴판 주세요', jp: 'Can I have the menu?', pron: '캔 아이 해브 더 메뉴?' },
    { id: 'e6', category: 'basic', kor: '맛있어요', jp: 'It\'s delicious!', pron: '잇츠 딜리셔스' },
    { id: 'e7', category: 'basic', kor: '화장실 어디예요?', jp: 'Where is the restroom?', pron: '웨어 이즈 더 레스트룸?' },
    { id: 'e8', category: 'basic', kor: '체크인 부탁합니다', jp: 'I\'d like to check in.', pron: '아이드 라이크 투 첵인' },
    { id: 'e9', category: 'basic', kor: '이거 주세요', jp: 'I\'ll have this, please.', pron: '아일 해브 디스 플리즈' },
    { id: 'e10', category: 'basic', kor: '안녕히 계세요', jp: 'Goodbye!', pron: '굿바이' },
];

// ── 베트남어 ──────────────────────────────────────────────────────────────────
const VIETNAMESE_SPEECH: SpeechItem[] = [
    { id: 'vn1', category: 'basic', kor: '안녕하세요', jp: 'Xin chào', pron: '신 짜오' },
    { id: 'vn2', category: 'basic', kor: '감사합니다', jp: 'Cảm ơn', pron: '깜 언' },
    { id: 'vn3', category: 'basic', kor: '죄송합니다', jp: 'Xin lỗi', pron: '신 로이' },
    { id: 'vn4', category: 'basic', kor: '얼마예요?', jp: 'Bao nhiêu tiền?', pron: '바오 니에우 띠엔?' },
    { id: 'vn5', category: 'basic', kor: '메뉴판 주세요', jp: 'Cho xem thực đơn', pron: '쪼 쎔 특 던' },
    { id: 'vn6', category: 'basic', kor: '맛있어요', jp: 'Ngon lắm', pron: '응온 람' },
    { id: 'vn7', category: 'basic', kor: '화장실 어디예요?', jp: 'Nhà vệ sinh 어 더우?', pron: '냐 베 싱 어 더우?' },
    { id: 'vn8', category: 'basic', kor: '체크인 부탁합니다', jp: 'Tôi muốn nhận phòng', pron: '또이 무온 년 풍' },
    { id: 'vn9', category: 'basic', kor: '이거 주세요', jp: 'Cho tôi cái này', pron: '쪼 또이 까이 나이' },
    { id: 'vn10', category: 'basic', kor: '안녕히 계세요', jp: 'Tạm biệt', pron: '땀 비엣' },
];

// ── 언어 코드 → 회화 데이터 매핑 ─────────────────────────────────────────────
const SPEECH_DATA_MAP: Record<string, SpeechItem[]> = {
    'ja-JP': JAPANESE_SPEECH,
    'th-TH': THAI_SPEECH,
    'en-US': ENGLISH_SPEECH,
    'en-GB': ENGLISH_SPEECH,
    'en-PH': ENGLISH_SPEECH,
    'en-SG': ENGLISH_SPEECH,
    'vi-VN': VIETNAMESE_SPEECH,
};

/** 목적지 이름으로 적절한 회화 데이터 반환 */
export function getSpeechData(destination: string): SpeechItem[] {
    const info = getDestinationInfo(destination);
    return SPEECH_DATA_MAP[info.language] || JAPANESE_SPEECH;
}

/** 기존 코드 호환용 — 일본어 데이터 */
export const DEFAULT_SPEECH_DATA = JAPANESE_SPEECH;
