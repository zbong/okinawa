import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Calendar } from 'lucide-react';
import './styles/design-system.css';
import type { TripPlan } from './types';
import { SummaryTab } from './components/SummaryTab';
import { ScheduleTab } from './components/ScheduleTab';

import { supabase } from './utils/supabase';

const TripViewer: React.FC = () => {
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule'>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedTrip = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('id');

      if (!shareId) {
        setError("공유된 일정 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shared_trips')
          .select('trip_data')
          .eq('id', shareId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("데이터를 찾을 수 없습니다.");

        const decoded = data.trip_data;
        // Normalize data structure
        const normalizedTrip: TripPlan = {
          id: shareId,
          metadata: decoded.metadata,
          points: decoded.points || [],
          speechData: [],
          defaultFiles: [],
          customFiles: decoded.customFiles || []
        };
        setTrip(normalizedTrip);
      } catch (err) {
        console.error("Fetch failed:", err);
        setError("일정 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTrip();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse" style={{ color: 'var(--primary)', fontWeight: 800 }}>가이드를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{error}</div>
        <p style={{ opacity: 0.6, fontSize: 14 }}>링크가 올바른지 확인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="app" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Fixed Header */}
      <header style={{
        padding: '24px 20px',
        background: 'rgba(10,10,11,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginBottom: 4, letterSpacing: 1 }}>TRIP GUIDE</div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>{trip.metadata.title}</h1>
      </header>

      {/* Main Content */}
      <main style={{ padding: '20px 20px 100px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SummaryTab trip={trip} />
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ScheduleTab trip={trip} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        background: 'rgba(20,20,22,0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '8px',
        display: 'flex',
        gap: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        zIndex: 1000
      }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            flex: 1, padding: '12px', borderRadius: '18px', border: 'none',
            background: activeTab === 'summary' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'summary' ? 'black' : 'white',
            fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.3s'
          }}
        >
          <LayoutDashboard size={18} /> 개요
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            flex: 1, padding: '12px', borderRadius: '18px', border: 'none',
            background: activeTab === 'schedule' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'schedule' ? 'black' : 'white',
            fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.3s'
          }}
        >
          <Calendar size={18} /> 일정
        </button>
      </nav>
    </div>
  );
};

export default TripViewer;
