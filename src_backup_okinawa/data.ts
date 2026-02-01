import { LocationPoint, TravelFile } from './types';

export const okinawaData: LocationPoint[] = [
  {
    id: 'airport',
    name: '나하 공항',
    category: 'logistics',
    day: 1,
    coordinates: { lat: 26.2064, lng: 127.6465 },
    tips: ['나하 공항 도착 (19:15)', '렌터카 셔틀 정류장으로 이동'],
    weather: { temp: '22°', condition: '맑음', wind: '3 m/s', humidity: '60%' }
  },
  {
    id: 'rental',
    name: '오션스타 렌터카',
    category: 'logistics',
    day: 1,
    phone: '098-851-4500',
    coordinates: { lat: 26.1752, lng: 127.6542 },
    tips: ['다이하츠 록키 (SMB251231406450)', '차량 상태 확인 및 ETC 카드 체크']
  },
  {
    id: 'nest-naha',
    name: '네스트 호텔 나하 니시',
    originalName: 'NEST HOTEL NAHA NISHI',
    category: 'stay',
    day: 1,
    phone: '098-963-8252',
    coordinates: { lat: 26.2125, lng: 127.6711 },
    tips: ['1/16, 1/18 숙박', '호텔 근처 유료 주차장 이용']
  },
  {
    id: 'sakura',
    name: '야에다케 벚꽃 축제',
    category: 'sightseeing',
    day: 2,
    mapcode: '206 859 050*15',
    coordinates: { lat: 26.6450, lng: 127.9150 },
    tips: ['벚꽃 터널 드라이브 코스', '산 정상 주차장까지 이동 가능'],
    weather: { temp: '18°', condition: '구름 많음', wind: '5 m/s', humidity: '70%' }
  },
  {
    id: 'churaumi',
    name: '츄라우미 수족관',
    category: 'sightseeing',
    day: 2,
    mapcode: '553 075 797*77',
    phone: '0980-48-3748',
    coordinates: { lat: 26.6946, lng: 127.8779 },
    tips: ['오키짱 극장(돌고래쇼) 시간 확인', '해양박 공원 산책'],
    weather: { temp: '20°', condition: '바람 강함', wind: '7 m/s', humidity: '65%' }
  },
  {
    id: 'kishimoto',
    name: '키시모토 식당',
    category: 'food',
    day: 2,
    phone: '0980-47-2887',
    coordinates: { lat: 26.6617, lng: 127.8856 },
    tips: ['오키나와 소바 명가', '대기 줄이 길 수 있음']
  },
  {
    id: 'kouri',
    name: '코우리 대교',
    category: 'sightseeing',
    day: 2,
    mapcode: '485 722 248*70',
    coordinates: { lat: 26.7001, lng: 128.0163 },
    tips: ['에메랄드빛 바다 횡단', '쉬림프 웨건 푸드트럭 추천'],
    weather: { temp: '21°', condition: '대체로 맑음', wind: '6 m/s', humidity: '60%' }
  },
  {
    id: 'grand-mer',
    name: '오키나와 그랑 메르 리조트',
    category: 'stay',
    day: 2,
    phone: '098-931-1500',
    coordinates: { lat: 26.3312, lng: 127.8165 },
    tips: ['1/17 숙박', '실내 수영장 이용 가능']
  },
  {
    id: 'manzamo',
    name: '만좌모',
    category: 'sightseeing',
    day: 3,
    mapcode: '206 312 097*55',
    coordinates: { lat: 26.5048, lng: 127.8503 },
    tips: ['코끼리 코 모양 절벽', '산책로가 잘 정비되어 있음'],
    weather: { temp: '21°', condition: '맑음', wind: '4 m/s', humidity: '55%' }
  },
  {
    id: 'american',
    name: '아메리칸 빌리지',
    category: 'sightseeing',
    day: 3,
    mapcode: '33 526 360',
    coordinates: { lat: 26.3168, lng: 127.7570 },
    tips: ['선셋 비치 노을 감상', '다양한 소품샵 쇼핑'],
    weather: { temp: '23°', condition: '쾌적함', wind: '3 m/s', humidity: '50%' }
  },
  {
    id: 'umikaji',
    name: '우미카지 테라스',
    category: 'sightseeing',
    day: 3,
    mapcode: '33 002 602*06',
    coordinates: { lat: 26.1751, lng: 127.6461 },
    tips: ['이태리 남부 느낌의 하얀 건물들', '시아와세노 팬케이크 유명']
  }
];

export const travelFiles: TravelFile[] = [
  { name: '최원봉 탑승권', path: 'https://images.unsplash.com/photo-1544013508-222839a973db?auto=format&fit=crop&q=80&w=400' },
  { name: '장주미 탑승권', path: 'https://images.unsplash.com/photo-1544013508-222839a973db?auto=format&fit=crop&q=80&w=400' },
  { name: '렌터카 예약확인서', path: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400' }
];

import { SpeechItem } from './types';

export const okinawaSpeechData: SpeechItem[] = [
  { id: 'hello_day', kor: '안녕하세요 (낮)', jp: 'こんにちは', pron: '곤니찌와', category: 'basic' },
  { id: 'thank_you', kor: '감사합니다', jp: 'ありがとうございます', pron: '아리가또- 고자이마스', category: 'basic' },
  { id: 'sorry', kor: '죄송합니다 / 실례합니다', jp: 'すみません', pron: '스미마센', category: 'basic' },
  { id: 'yes_no', kor: '네 / 아니요', jp: 'はい / いいえ', pron: '하이 / 이이에', category: 'basic' },
  { id: 'toilet', kor: '화장실은 어디인가요?', jp: 'トイレはどこですか', pron: '토이레와 도코데스까', category: 'basic' },
  { id: 'help', kor: '도와주세요', jp: '助けてください', pron: '타스케떼 쿠다사이', category: 'basic' },
  { id: 'pic', kor: '사진 좀 찍어주시겠어요?', jp: '写真を撮っても라えますか', pron: '샤신오 톳떼 모라에마스까', category: 'basic' },

  // 식당용 (food)
  { id: 'order', kor: '주문할게요', jp: '注文お願いします', pron: '츄-몬 오네가이시마스', category: 'food' },
  { id: 'water', kor: '물 좀 주세요', jp: 'お水ください', pron: '오미즈 쿠다사이', category: 'food' },
  { id: 'delicious', kor: '맛있어요', jp: 'おいしいです', pron: '오이시-데스', category: 'food' },
  { id: 'bill', kor: '계산해 주세요', jp: 'お会計お願いします', pron: '오카이케이 오네가이시마스', category: 'food' },
  { id: 'no_wasabi', kor: '와사비 빼주세요', jp: 'わさび抜きでお願いします', pron: '와사비누키데 오네가이시마스', category: 'food' },

  // 쇼핑용 (shopping)
  { id: 'how_much', kor: '얼마인가요?', jp: 'いくらですか', pron: '이쿠라데스까', category: 'shopping' },
  { id: 'bag', kor: '봉투 주세요', jp: '袋ください', pron: '후쿠로 쿠다사이', category: 'shopping' },
  { id: 'card', kor: '카드 되나요?', jp: 'カード使えますか', pron: '카-도 츠카에마스까', category: 'shopping' },
  { id: 'tax_free', kor: '면세 되나요?', jp: '免税できますか', pron: '멘제- 데키마스까', category: 'shopping' },

  // 숙소용 (stay)
  { id: 'checkin', kor: '체크인 부탁합니다', jp: 'チェックインお願いします', pron: '첵쿠인 오네가이시마스', category: 'stay' },
  { id: 'towel', kor: '수건 더 주세요', jp: 'タオル追加でください', pron: '타오루 츠이카데 쿠다사이', category: 'stay' },
  { id: 'luggage', kor: '짐 좀 맡아주실 수 있나요?', jp: '荷物を預かってもらえますか', pron: '니모츠오 아즈캇떼 모라에마스까', category: 'stay' },
];
