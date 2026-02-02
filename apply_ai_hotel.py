import re
import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Hotel Search State near other states
if 'isSearchingHotels' not in content:
    hotel_state = """
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
"""
    content = re.sub(r'(const \[dynamicAttractions, setDynamicAttractions\] = useState<any\[\]>\(\[\]\);)', r'\1' + hotel_state, content)

# 2. Add fetchHotelsWithAI function
if 'fetchHotelsWithAI' not in content:
    hotel_func = """
    const fetchHotelsWithAI = async (destination: string) => {
        setIsSearchingHotels(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
                Search for top 5 popular hotels/accommodations in "${destination}".
                Requirements:
                1. Diversity: Luxury, Business, Guesthouse, etc.
                2. Context: For companion type "${plannerData.companion || 'all'}".
                3. Language: Korean.

                Return EXACTLY a JSON array of objects (no markdown):
                [{"name": "Hotel Name", "desc": "Brief description"}]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedText.match(/\\[[\\\\s\\\\S]*\\]/);

            if (jsonMatch) {
                setRecommendedHotels(JSON.parse(jsonMatch[0]));
            }
        } catch (e) {
            console.error("Hotel search failed:", e);
        } finally {
            setIsSearchingHotels(false);
        }
    };
"""
    content = re.sub(r'(const fetchAttractionsWithAI = async \(destination: string\) => \{.*?\n    \};)', r'\1\n' + hotel_func, content, flags=re.DOTALL)

# 3. Update Step 7.5 UI
if 'AI 숙소 추천받기' not in content:
    ai_search_ui = """
                                                <div className="glass-card" style={{ padding: '30px', border: '2px dashed rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15, cursor: 'pointer' }} onClick={() => fetchHotelsWithAI(plannerData.destination)}>
                                                    <Sparkles size={32} color="var(--primary)" />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>AI 숙소 추천받기</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{plannerData.destination}의 인기 숙소를 추천합니다</div>
                                                    </div>
                                                </div>
"""
    # Replace the "바우처 자동 인식" card
    content = re.sub(r'<div className="glass-card" style=\{\{ padding: \'30px\', border: \'2px dashed rgba\(0,212,255,0.3\)\', background: \'rgba\(0,212,255,0.02\)\'.*?\}\} onClick=\{.*?\}>.*?<\/div>', ai_search_ui, content, flags=re.DOTALL)

# 4. Show Recommended Hotels
if 'AI 추천 숙소' not in content:
    recommended_list_ui = """
                                            {recommendedHotels.length > 0 && (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>AI 추천 숙소</h4>
                                                        <button onClick={() => setRecommendedHotels([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer' }}>닫기</button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                                        {recommendedHotels.map((h, i) => (
                                                            <div 
                                                                key={i} 
                                                                onClick={() => {
                                                                    const nameInput = document.getElementById('acc-name') as HTMLInputElement;
                                                                    if (nameInput) nameInput.value = h.name;
                                                                    showToast(`${h.name}를 선택했습니다. 날짜를 입력하고 추가 버튼을 누르세요.`);
                                                                }}
                                                                className="glass-card" 
                                                                style={{ minWidth: '200px', padding: '15px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                                            >
                                                                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>{h.name}</div>
                                                                <div style={{ fontSize: '11px', opacity: 0.6 }}>{h.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
"""
    content = content.replace('{plannerData.accommodations.length > 0 && (', recommended_list_ui + '\n                                            {plannerData.accommodations.length > 0 && (')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied AI hotel search edits.")
