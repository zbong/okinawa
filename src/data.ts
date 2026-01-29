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
