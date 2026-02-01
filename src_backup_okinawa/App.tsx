import React, { useState, useEffect, useRef } from 'react';
import './styles/design-system.css';
import { okinawaData, travelFiles, okinawaSpeechData } from './data';
import { LocationPoint } from './types';
import {
    LayoutDashboard,
    Calendar,
    Map as MapIcon,
    FileText,
    Phone,
    RefreshCw,
    CheckCircle,
    Circle,
    CloudSun,
    Wind,
    Droplets,
    X,
    Moon,
    Sun,
    Star,
    Lock,
    ChevronDown,
    ChevronUp,
    Upload,
    Trash2,
    MessageCircle,
    Volume2
} from 'lucide-react';

interface CustomFile {
    id: string;
    name: string;
    type: 'image' | 'pdf';
    data: string; // Base64
    linkedTo?: string; // Point ID
    date: string;
}
import { motion, AnimatePresence, Reorder } from 'framer-motion';

import MapComponent from './components/MapComponent';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'var(--text-primary)' }}>
                    <h2>Something went wrong in App.tsx.</h2>
                    <pre style={{ color: 'red' }}>{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('summary');
    const [overviewMode, setOverviewMode] = useState<'map' | 'text'>('map');
    const [scheduleDay, setScheduleDay] = useState<number>(1);
    const [scheduleViewMode, setScheduleViewMode] = useState<'map' | 'list'>('list');
    const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
    const [weatherIndex, setWeatherIndex] = useState(0);
    const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<LocationPoint | null>(null);
    const [expandedSection, setExpandedSection] = useState<'review' | 'log' | 'localSpeech' | null>(null);
    // Saved Points Order State
    const [allPoints, setAllPoints] = useState<LocationPoint[]>(() => {
        const saved = localStorage.getItem('okinawa_points_order');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved order:", e);
                return okinawaData;
            }
        }
        return okinawaData;
    });

    const isDraggingRef = useRef(false);

    useEffect(() => {
        localStorage.setItem('okinawa_points_order', JSON.stringify(allPoints));
    }, [allPoints]);

    // Checklist State
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('okinawa_checklist');
        return saved ? JSON.parse(saved) : {};
    });

    // Review & Log State
    const [userReviews, setUserReviews] = useState<Record<string, { rating: number, text: string }>>(() => {
        const saved = localStorage.getItem('okinawa_reviews');
        return saved ? JSON.parse(saved) : {};
    });

    const [userLogs, setUserLogs] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('okinawa_logs');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('okinawa_reviews', JSON.stringify(userReviews));
    }, [userReviews]);

    useEffect(() => {
        localStorage.setItem('okinawa_logs', JSON.stringify(userLogs));
    }, [userLogs]);

    // Custom Files State
    const [customFiles, setCustomFiles] = useState<CustomFile[]>(() => {
        const saved = localStorage.getItem('okinawa_files');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('okinawa_files', JSON.stringify(customFiles));
    }, [customFiles]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const newFile: CustomFile = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.includes('image') ? 'image' : 'pdf',
                data: base64,
                linkedTo,
                date: new Date().toLocaleDateString()
            };
            setCustomFiles(prev => [newFile, ...prev]);
        };
        reader.readAsDataURL(file);
    };

    const deleteFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('정말 이 파일을 삭제하시겠습니까?')) {
            setCustomFiles(prev => prev.filter(f => f.id !== id));
        }
    };

    // Theme State
    const [theme, setTheme] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Currency
    const [jpyAmount, setJpyAmount] = useState('1000');
    const [krwAmount, setKrwAmount] = useState('9000');
    const [rate, setRate] = useState(9.0);

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/JPY')
            .then(r => r.json())
            .then(d => { if (d?.rates?.KRW) setRate(d.rates.KRW); })
            .catch(e => console.warn(e));
    }, []);

    useEffect(() => {
        localStorage.setItem('okinawa_checklist', JSON.stringify(completedItems));
    }, [completedItems]);

    // Close bottom sheet when switching tabs
    useEffect(() => {
        setSelectedPoint(null);
        setExpandedSection(null);
    }, [activeTab]);

    const toggleComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const updateReview = (id: string, rating: number, text: string) => {
        setUserReviews(prev => ({
            ...prev,
            [id]: { rating, text }
        }));
    };

    const updateLog = (id: string, text: string) => {
        setUserLogs(prev => ({
            ...prev,
            [id]: text
        }));
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const convert = (val: string, type: 'jpy' | 'krw') => {
        const num = parseFloat(val.replace(/,/g, ''));
        if (isNaN(num)) {
            if (type === 'jpy') { setJpyAmount(val); setKrwAmount('0'); }
            else { setKrwAmount(val); setJpyAmount('0'); }
            return;
        }
        if (type === 'jpy') {
            setJpyAmount(val);
            setKrwAmount(Math.round(num * rate).toLocaleString());
        } else {
            setKrwAmount(val);
            setJpyAmount(Math.round(num / rate).toString());
        }
    };

    const getPoints = () => {
        return allPoints.filter(p => p.day === scheduleDay);
    };

    const handleReorder = (newOrder: LocationPoint[]) => {
        // 현재 선택된 날짜가 아닌 포인트들 분리
        const otherPoints = allPoints.filter(p => p.day !== scheduleDay);
        // 새 순서와 합치기 (주의: newOrder는 현재 날짜의 포인트들만 담고 있음)
        // 원래 데이터 순서를 유지하기 위해, 날짜별로 다시 정렬하거나 하는 것이 좋겠지만
        // 여기서는 간단히 다른 날짜 데이터를 앞/뒤에 붙이는 식으로 처리하기엔 원래 순서가 섞일 수 있음.
        // 가장 안전한 방법: 전체 리스트에서 해당 포인트들의 위치만 교체.

        // 하지만 더 간단한 방법:
        // 1. 현재 날짜의 포인트들을 제외한 리스트를 만듦.
        // 2. 현재 날짜의 포인트들을 newOrder로 대체.
        // 3. 다시 날짜별로 정렬하거나, 그냥 합침 (일차별 필터링을 하므로 순서만 맞으면 됨).

        // 구현:
        // 다른 날짜의 데이터는 그대로 유지하고, 현재 날짜의 데이터만 newOrder로 교체
        // 단, allPoints 배열 내에서의 상대적 위치는 유지되지 않을 수 있음.
        // 하지만 getPoints()는 filter로 가져오므로, allPoints 내의 순서는 중요하지 않고
        // filter된 결과 내의 순서가 중요함.
        // -> 아님. filter 결과의 순서는 allPoints 내의 순서를 따름.
        // 따라서 allPoints 내에서도 순서를 맞춰줘야 함.

        // 개선된 로직:
        // 전체 리스트 재구성: [Day 1, Day 2, ...] 순서로 정렬되어 있다고 가정하면 쉬움.
        // 그냥 날짜와 상관없이 다른 포인트 + 새 순서 포인트 로 합치면 됨.
        // 다만 날짜별 그룹핑을 유지하고 싶다면, scheduleDay를 기준으로 정렬 로직이 필요.

        // 여기서는 간단하게:
        // 1. 현재 날짜가 아닌 것들 (otherPoints)
        // 2. 현재 날짜인 것들 (newOrder)
        // 3. 합쳐서 날짜순, 그리고 인덱스순 정렬? 
        // 아니면 그냥 합치면 됨. 어차피 렌더링할 때 filter(day === x) 하니까.

        setAllPoints([...otherPoints, ...newOrder]);
    };

    // Get formatted date string
    const getFormattedDate = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayName = days[now.getDay()];
        return `${month}월 ${date}일 ${dayName}`;
    };

    // Get weather for specific day index (0=today, 1=tomorrow, 2=day after)
    const getWeatherForDay = (dayIndex: number) => {
        const location = selectedWeatherLocation?.name || '오키나와 (나하)';

        // If we have selected location weather, use it as base
        if (selectedWeatherLocation?.weather) {
            const baseWeather = selectedWeatherLocation.weather;
            // Simulate different weather for different days
            const tempVariation = dayIndex === 0 ? 0 : dayIndex === 1 ? -2 : 1;
            const temp = parseInt(baseWeather.temp) + tempVariation;

            return {
                location,
                temp: `${temp}°`,
                condition: dayIndex === 0 ? baseWeather.condition :
                    dayIndex === 1 ? '구름 조금' : '대체로 맑음',
                wind: baseWeather.wind,
                humidity: baseWeather.humidity
            };
        }

        // Default 3-day forecast for Naha
        const forecasts = [
            { temp: '22°', condition: '맑음', wind: '3 m/s', humidity: '60%' },
            { temp: '20°', condition: '구름 조금', wind: '5 m/s', humidity: '70%' },
            { temp: '23°', condition: '대체로 맑음', wind: '4 m/s', humidity: '55%' }
        ];

        return {
            location,
            ...forecasts[dayIndex]
        };
    };

    const calculateProgress = () => {
        const total = okinawaData.length;
        const complete = Object.values(completedItems).filter(Boolean).length;
        return Math.round((complete / total) * 100);
    };

    const bottomSheetTop = activeTab === 'summary' ? '380px' : '280px';

    return (
        <ErrorBoundary>
            <div style={{ position: 'absolute', top: 0, right: 0, color: 'lime', zIndex: 9999, padding: 5, background: 'rgba(0,0,0,0.5)' }}>
                Debug: App Rendered
            </div>
            <div className="app">
                <nav className="nav-tabs">
                    <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                        <LayoutDashboard size={18} /> <span style={{ marginLeft: '4px' }}>개요</span>
                    </button>
                    <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                        <Calendar size={18} /> <span style={{ marginLeft: '4px' }}>일정</span>
                    </button>
                    <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                        <FileText size={18} /> <span style={{ marginLeft: '4px' }}>서류</span>
                    </button>
                    <button className={`tab ${activeTab === 'exchange' ? 'active' : ''}`} onClick={() => setActiveTab('exchange')}>
                        <RefreshCw size={18} /> <span style={{ marginLeft: '4px' }}>환율</span>
                    </button>
                    <button className={`tab ${activeTab === 'speech' ? 'active' : ''}`} onClick={() => setActiveTab('speech')}>
                        <MessageCircle size={18} /> <span style={{ marginLeft: '4px' }}>회화</span>
                    </button>
                    <button className="tab" onClick={toggleTheme} style={{ marginLeft: 'auto', padding: '6px 10px', minWidth: 'auto' }}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </nav>

                <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'summary' && (
                        <div className="overview-content">
                            {/* Toggle Switch */}
                            <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', padding: 4, borderRadius: 24, marginBottom: 20, flexShrink: 0 }}>
                                <button
                                    onClick={() => setOverviewMode('map')}
                                    style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: overviewMode === 'map' ? 'var(--primary)' : 'transparent', color: overviewMode === 'map' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    지도로 보기
                                </button>
                                <button
                                    onClick={() => setOverviewMode('text')}
                                    style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: overviewMode === 'text' ? 'var(--primary)' : 'transparent', color: overviewMode === 'text' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    내용 보기
                                </button>
                            </div>

                            {overviewMode === 'map' ? (
                                <div style={{ flex: 1, width: '100%', borderRadius: '16px', overflow: 'hidden', minHeight: '300px' }}>
                                    <MapComponent points={okinawaData} selectedPoint={selectedPoint} onPointClick={(p) => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} />
                                </div>
                            ) : (
                                <>
                                    <section style={{ marginBottom: 24 }}>
                                        <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                                            <motion.div
                                                key={weatherIndex}
                                                className="glass-card"
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={0.2}
                                                whileTap={{ cursor: 'grabbing' }}
                                                whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
                                                onDragEnd={(_, info) => {
                                                    console.log('Drag ended, offset:', info.offset.x);
                                                    const threshold = 40;
                                                    if (info.offset.x > threshold) {
                                                        console.log('Swiped right - going to previous day');
                                                        setWeatherIndex((prev) => (prev - 1 + 3) % 3);
                                                    } else if (info.offset.x < -threshold) {
                                                        console.log('Swiped left - going to next day');
                                                        setWeatherIndex((prev) => (prev + 1) % 3);
                                                    }
                                                }}
                                                animate={{ x: 0, scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                style={{
                                                    background: weatherIndex === 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                                                        weatherIndex === 1 ? 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' :
                                                            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                                                    border: 'none', position: 'absolute', top: 0, left: 0, right: 0, height: '100%', padding: '20px', cursor: 'grab', touchAction: 'pan-y'
                                                }}
                                            >
                                                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginBottom: 2 }}>
                                                            {getFormattedDate(weatherIndex)}
                                                        </div>
                                                        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>
                                                            {getWeatherForDay(weatherIndex).location}
                                                        </div>
                                                        <div style={{ fontSize: 42, fontWeight: 800 }}>
                                                            {getWeatherForDay(weatherIndex).temp}
                                                        </div>
                                                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                                                            {getWeatherForDay(weatherIndex).condition}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <CloudSun size={64} color="white" />
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 20, color: 'white' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                        <Wind size={16} /> <span>{getWeatherForDay(weatherIndex).wind}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                        <Droplets size={16} /> <span>습도 {getWeatherForDay(weatherIndex).humidity}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                        {/* Pagination Dots */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, padding: '8px 0' }}>
                                            {[0, 1, 2].map(i => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        console.log('Dot clicked:', i);
                                                        setWeatherIndex(i);
                                                    }}
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        background: weatherIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                                        transition: 'all 0.3s',
                                                        cursor: 'pointer',
                                                        border: weatherIndex === i ? '2px solid white' : 'none'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </section>

                                    <section className="overview-section">
                                        <h2><Calendar size={20} style={{ marginRight: 8 }} /> 여행 개요</h2>
                                        <div className="glass-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ fontSize: 18, color: 'var(--text-primary)' }}>2026.01.16 - 01.19</h3>
                                                    <p style={{ color: 'var(--text-secondary)' }}>오키나와 가족 여행</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
                                                        {calculateProgress()}%
                                                    </span>
                                                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>진행률</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 10, background: 'var(--glass-border)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ width: `${calculateProgress()}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Key Items List (Logistics & Stay) */}
                                    <section className="overview-section">
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 10, marginBottom: 15 }}>📋 주요 정보 (숙소/교통)</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {okinawaData.filter(p => ['logistics', 'stay'].includes(p.category)).map(p => (
                                                <div key={p.id} className="glass-card" onClick={() => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--primary)' }}>{p.category.toUpperCase()}</div>
                                                    </div>
                                                    {p.phone && <Phone size={16} style={{ color: 'var(--text-secondary)' }} />}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="list-view">
                            {/* View Mode Toggle */}
                            <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', padding: 4, borderRadius: 24, marginBottom: 16, flexShrink: 0 }}>
                                <button onClick={() => setScheduleViewMode('map')} style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: scheduleViewMode === 'map' ? 'var(--primary)' : 'transparent', color: scheduleViewMode === 'map' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    지도 보기
                                </button>
                                <button onClick={() => setScheduleViewMode('list')} style={{ flex: 1, padding: '8px', borderRadius: 20, border: 'none', background: scheduleViewMode === 'list' ? 'var(--primary)' : 'transparent', color: scheduleViewMode === 'list' ? 'var(--text-on-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    목록 보기
                                </button>
                            </div>

                            <section style={{ marginBottom: 16, display: scheduleViewMode === 'list' ? 'block' : 'none' }}>
                                <div style={{ position: 'relative', width: '100%', height: '72px' }}>
                                    <motion.div
                                        key={`schedule-weather-${weatherIndex}`}
                                        className="glass-card"
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.2}
                                        whileTap={{ cursor: 'grabbing' }}
                                        whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
                                        onDragEnd={(_, info) => {
                                            const threshold = 40;
                                            if (info.offset.x > threshold) {
                                                setWeatherIndex((prev) => (prev - 1 + 3) % 3);
                                            } else if (info.offset.x < -threshold) {
                                                setWeatherIndex((prev) => (prev + 1) % 3);
                                            }
                                        }}
                                        animate={{ x: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        style={{
                                            background: weatherIndex === 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                                                weatherIndex === 1 ? 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' :
                                                    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                                            border: 'none', position: 'absolute', top: 0, left: 0, right: 0, height: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', cursor: 'grab', touchAction: 'pan-y'
                                        }}
                                    >
                                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: 'white', gap: 12 }}>
                                            {/* 날짜 */}
                                            <div style={{ fontSize: 13, fontWeight: 600, minWidth: '60px' }}>
                                                {getFormattedDate(weatherIndex).split(' ')[1]} {getFormattedDate(weatherIndex).split(' ')[2]}
                                            </div>

                                            {/* 구분선 */}
                                            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.4)' }}></div>

                                            {/* 지역 */}
                                            <div style={{ fontSize: 13, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {getWeatherForDay(weatherIndex).location}
                                            </div>

                                            {/* 날씨 아이콘 및 온도 */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <CloudSun size={24} color="white" />
                                                <div style={{ fontSize: 20, fontWeight: 700 }}>
                                                    {getWeatherForDay(weatherIndex).temp}
                                                </div>
                                            </div>

                                            {/* 습도 */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.9, background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                                                <Droplets size={12} />
                                                <span>{getWeatherForDay(weatherIndex).humidity}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                                {/* Pagination Dots */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, padding: '8px 0' }}>
                                    {[0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                console.log('Schedule dot clicked:', i);
                                                setWeatherIndex(i);
                                            }}
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: weatherIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer',
                                                border: weatherIndex === i ? '2px solid white' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>

                            <div className="day-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {[1, 2, 3].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setScheduleDay(d)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: '1px solid var(--glass-border)',
                                            background: scheduleDay === d ? 'var(--primary)' : 'var(--tab-inactive)',
                                            color: scheduleDay === d ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {d}일차
                                    </button>
                                ))}
                            </div>

                            {/* Map - 지도 보기일 때만 렌더링 */}
                            {scheduleViewMode === 'map' && (
                                <div style={{ height: '350px', width: '100%', flexShrink: 0, borderRadius: '16px', overflow: 'hidden' }}>
                                    <MapComponent points={getPoints()} selectedPoint={selectedPoint} onPointClick={(p) => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} />
                                </div>
                            )}

                            {/* List - 목록 보기일 때만 표시 */}
                            <Reorder.Group
                                axis="y"
                                values={getPoints()}
                                onReorder={handleReorder}
                                style={{ display: scheduleViewMode === 'list' ? 'block' : 'none', padding: 0, margin: 0, listStyle: 'none' }}
                            >
                                {getPoints().map(p => {
                                    const isDone = !!completedItems[p.id];
                                    return (
                                        <Reorder.Item
                                            key={p.id}
                                            value={p}
                                            style={{ marginBottom: 12 }}
                                            onDragStart={() => { isDraggingRef.current = true; }}
                                            onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 100); }}
                                        >
                                            <div
                                                className="glass-card"
                                                onClick={() => {
                                                    if (isDraggingRef.current) return;
                                                    setSelectedPoint(p);
                                                    setSelectedWeatherLocation(p);
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', opacity: isDone ? 0.6 : 1, transition: 'opacity 0.2s', cursor: 'grab', userSelect: 'none' }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>{p.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.category.toUpperCase()}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => toggleComplete(p.id, e)}
                                                    style={{ background: 'transparent', border: 'none', color: isDone ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: 5 }}
                                                >
                                                    {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                </button>
                                            </div>
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="file-grid" style={{ paddingBottom: 80 }}>
                            {/* Upload Button */}
                            <div className="file-card" style={{ border: '2px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e)}
                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                />
                                <Upload size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>새 파일 업로드</div>
                            </div>

                            {/* Custom Files */}
                            {customFiles.map(f => (
                                <div key={f.id} className="file-card">
                                    <img src={f.data} alt={f.name} className="file-img" />
                                    <div className="file-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.name}</span>
                                        <button onClick={(e) => deleteFile(f.id, e)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    {f.linkedTo && (
                                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--primary)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'black', fontWeight: 'bold' }}>
                                            연결됨
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Default Files */}
                            {travelFiles.map(f => (
                                <div key={f.name} className="file-card">
                                    <img src={f.path} alt={f.name} className="file-img" />
                                    <div className="file-info">{f.name}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'exchange' && (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div className="converter-card" style={{ padding: 20, borderRadius: 16, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>💱 환율 계산기</h3>

                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>JPY</label>
                                    <input
                                        type="number"
                                        value={jpyAmount}
                                        onChange={e => convert(e.target.value, 'jpy')}
                                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', marginTop: 5 }}
                                    />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>KRW</label>
                                    <input
                                        type="text"
                                        value={krwAmount}
                                        onChange={e => convert(e.target.value, 'krw')}
                                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', marginTop: 5 }}
                                    />
                                </div>

                                <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginBottom: 20 }}>
                                    100 JPY ≈ {Math.round(rate * 100).toLocaleString()} KRW
                                </p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'speech' && (
                        <div className="speech-view" style={{ padding: '16px' }}>
                            <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '18px' }}>
                                <MessageCircle size={20} color="var(--primary)" />
                                일본어 필수 회화
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {okinawaSpeechData.filter(item => item.category === 'basic').map(item => (
                                    <div
                                        key={item.id}
                                        className="glass-card"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.8 }}>{item.kor}</div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.jp}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--primary)', opacity: 0.9 }}>{item.pron}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => speak(item.jp)}
                                            style={{
                                                background: 'var(--primary)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'black'
                                            }}
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                {/* Currency Logic Moved to Tab */}
                {/* Removed FAB and Overlay Modal */}

                {/* Bottom Sheet */}
                <AnimatePresence>
                    {selectedPoint && (
                        <>
                            <motion.div
                                className="bottom-sheet"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                style={{
                                    zIndex: 9999,
                                    position: 'absolute',
                                    top: bottomSheetTop,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: `calc(100% - ${bottomSheetTop})`,
                                    maxHeight: 'none',
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px',
                                    background: 'var(--sheet-bg)',
                                    overflowY: 'auto',
                                    padding: '24px'
                                }}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedPoint(null)}
                                    style={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <X size={18} color="white" />
                                </button>

                                {/* Handle with hint */}
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <div className="handle" onClick={() => setSelectedPoint(null)} style={{ cursor: 'pointer' }} />
                                    <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>아래로 밀어서 닫기</div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPoint.name}</h3>
                                    <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedPoint.category.toUpperCase()}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="primary-button"
                                        style={{ background: 'var(--primary)', color: 'black', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}
                                    >
                                        <MapIcon size={18} /> 길찾기 (구글맵)
                                    </a>
                                    {selectedPoint.phone && (
                                        <a href={`tel:${selectedPoint.phone}`} className="primary-button" style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <Phone size={18} /> 전화
                                        </a>
                                    )}
                                    {selectedPoint.mapcode && (
                                        <div className="glass-card" style={{ padding: '12px', textAlign: 'center', margin: 0 }}>
                                            <div style={{ fontSize: '10px', opacity: 0.5 }}>맵코드</div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPoint.mapcode}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="overview-section">
                                    <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>여행 팁</h4>
                                    <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                                        {selectedPoint.tips.map((tip, idx) => (<li key={idx}>{tip}</li>))}
                                    </ul>
                                </div>

                                {/* Linked Files Section */}
                                <div className="overview-section" style={{ marginTop: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>📎 관련 서류</h4>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}>
                                            <Upload size={14} /> 추가
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedPoint.id)} />
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                                        {customFiles.filter(f => f.linkedTo === selectedPoint.id).length === 0 ? (
                                            <div style={{ padding: '12px', width: '100%', textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.1)', borderRadius: 12 }}>
                                                등록된 서류가 없습니다.
                                            </div>
                                        ) : (
                                            customFiles.filter(f => f.linkedTo === selectedPoint.id).map(f => (
                                                <div key={f.id} style={{ minWidth: 100, width: 100, position: 'relative' }}>
                                                    <div
                                                        style={{ width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', marginBottom: 4, cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                                                    >
                                                        <img src={f.data} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                                                    <button
                                                        onClick={(e) => deleteFile(f.id, e)}
                                                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'white', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Local Conversation Section */}
                                {(okinawaSpeechData.some(s => s.category === selectedPoint.category) || selectedPoint.category === 'sightseeing') && (
                                    <div style={{ marginTop: 16 }}>
                                        <button
                                            onClick={() => setExpandedSection(expandedSection === 'localSpeech' ? null : 'localSpeech')}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                background: 'var(--glass-bg)',
                                                borderRadius: '16px',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 600
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <MessageCircle size={18} color="var(--primary)" />
                                                <span>현지 회화 (추천)</span>
                                            </div>
                                            {expandedSection === 'localSpeech' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>

                                        {expandedSection === 'localSpeech' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden', marginTop: 8, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {okinawaSpeechData
                                                        .filter(s => s.category === selectedPoint.category || (selectedPoint.category === 'sightseeing' && s.category === 'shopping'))
                                                        .map(item => (
                                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.kor}</div>
                                                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.jp} <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 500, marginLeft: 4 }}>{item.pron}</span></div>
                                                                </div>
                                                                <button
                                                                    onClick={() => speak(item.jp)}
                                                                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black' }}
                                                                >
                                                                    <Volume2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Rating & Review Section Toggle */}
                                <div style={{ marginTop: 16 }}>
                                    <button
                                        onClick={() => setExpandedSection(expandedSection === 'review' ? null : 'review')}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            background: 'var(--glass-bg)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-primary)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 600
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Star size={18} color={userReviews[selectedPoint.id]?.rating ? '#FFD700' : 'var(--text-secondary)'} fill={userReviews[selectedPoint.id]?.rating ? '#FFD700' : 'transparent'} />
                                            <span>평가 및 리뷰</span>
                                        </div>
                                        {expandedSection === 'review' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {expandedSection === 'review' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                        >
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={24}
                                                        fill={(userReviews[selectedPoint.id]?.rating || 0) >= star ? '#FFD700' : 'transparent'}
                                                        color={(userReviews[selectedPoint.id]?.rating || 0) >= star ? '#FFD700' : 'var(--text-secondary)'}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => updateReview(selectedPoint.id, star, userReviews[selectedPoint.id]?.text || '')}
                                                    />
                                                ))}
                                            </div>
                                            <textarea
                                                placeholder="이 장소에 대한 한줄평을 남겨주세요"
                                                value={userReviews[selectedPoint.id]?.text || ''}
                                                onChange={(e) => updateReview(selectedPoint.id, userReviews[selectedPoint.id]?.rating || 0, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--input-bg)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '14px',
                                                    resize: 'none',
                                                    height: '80px'
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Private Log Section Toggle */}
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        onClick={() => setExpandedSection(expandedSection === 'log' ? null : 'log')}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            background: 'var(--glass-bg)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-primary)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 600
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Lock size={18} color={userLogs[selectedPoint.id] ? 'var(--primary)' : 'var(--text-secondary)'} />
                                            <span>나만의 기록</span>
                                        </div>
                                        {expandedSection === 'log' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {expandedSection === 'log' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}
                                        >
                                            <textarea
                                                placeholder="개인적인 메모나 기록을 남기세요..."
                                                value={userLogs[selectedPoint.id] || ''}
                                                onChange={(e) => updateLog(selectedPoint.id, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--input-bg)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '14px',
                                                    resize: 'none',
                                                    height: '100px'
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                <button className="primary-button" style={{ width: '100%', marginTop: '20px', background: 'var(--input-bg)', color: 'var(--text-primary)' }} onClick={() => setSelectedPoint(null)}>닫기</button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </ErrorBoundary >
    );
};

export default App;
