import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

// Set worker source for pdf.js using unpkg for more reliable version matching
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Extract text from image using Tesseract OCR
 */
export const extractTextFromImage = async (imageFile: File | string): Promise<string> => {
    try {
        const result = await Tesseract.recognize(
            imageFile,
            'eng+kor',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('텍스트 추출에 실패했습니다.');
    }
};

/**
 * Extract text from HTML string
 */
export const extractTextFromHtml = (htmlContent: string): string => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const noise = doc.querySelectorAll('script, style, noscript, iframe, svg');
        noise.forEach(n => n.remove());

        let text = doc.body ? doc.body.innerText : doc.documentElement.innerText || '';
        return text.replace(/\n\s*\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
    } catch (e) {
        return htmlContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    }
};

/**
 * Extract text from PDF File (Improved for Agoda-style spaced text)
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const lineMap: Record<number, any[]> = {};
            textContent.items.forEach((item: any) => {
                const y = Math.round(item.transform[5]);
                if (!lineMap[y]) lineMap[y] = [];
                lineMap[y].push(item);
            });

            const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);

            const pageLines = sortedYs.map(y => {
                const items = lineMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
                let lineText = '';
                items.forEach((item, idx) => {
                    if (idx > 0) {
                        const prev = items[idx - 1];
                        const gap = item.transform[4] - (prev.transform[4] + prev.width);
                        if (gap > 3) lineText += ' ';
                    }
                    lineText += item.str;
                });
                return lineText;
            });

            fullText += pageLines.join('\n') + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        throw new Error('PDF 텍스트 추출 실패');
    }
};

/**
 * Flexible Date Parser (Extreme Tolerance version)
 */
const extractAllDates = (text: string): string[] => {
    const dates: string[] = [];
    const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        january: '01', february: '02', march: '03', april: '04', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };

    const years = text.match(/\b20\d{2}\b/g) || [];
    const fallbackYear = years.length > 0 ? years[0] : new Date().getFullYear().toString();

    // 1. Korean Style (1월 16일, 1 월 16 일 etc)
    const korPattern = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/g;
    let match;
    while ((match = korPattern.exec(text)) !== null) {
        dates.push(`${fallbackYear}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`);
    }

    // 2. Standard Pattern (2026-02-15)
    const stdPattern = /(20\d{2})[-.\/년\s]+(\d{1,2})[-.\/월\s]+(\d{1,2})/g;
    while ((match = stdPattern.exec(text)) !== null) {
        dates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
    }

    // 3. English Pattern (Feb 15, 15 Feb)
    const months = Object.keys(monthMap).join('|');
    const engPattern = new RegExp(`(?:(\\d{1,2})\\s*)?(${months})[a-z]*\\.?\\s*(\\d{1,2})?(?:,?\\s*(20\\d{2}))?`, 'gi');
    while ((match = engPattern.exec(text)) !== null) {
        const month = monthMap[match[2].toLowerCase()];
        const day = (match[1] || match[3] || '01').padStart(2, '0');
        const year = match[4] || fallbackYear;
        dates.push(`${year}-${month}-${day}`);
    }

    return [...new Set(dates)].sort();
};

/**
 * Robust Time Extraction (Checks for context like "Check-in")
 */
const extractTimeWithContext = (text: string, keyword: string): string => {
    // 1. Find the keyword position
    const lowerText = text.toLowerCase();
    const keywordPos = lowerText.indexOf(keyword.toLowerCase());
    if (keywordPos === -1) return '';

    // 2. Look at text snippet after the keyword (up to 100 chars)
    const snippet = text.substring(keywordPos, keywordPos + 100);

    // 3. Search for time pattern in snippet
    const timePattern = /(?:(AM|PM)\s*)?(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/gi;
    const match = timePattern.exec(snippet);

    if (match) {
        let period = (match[1] || match[4] || '').toUpperCase();
        let hours = parseInt(match[2]);
        const minutes = match[3];

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return '';
};

/**
 * Parse accommodation (Hotel/Resort) information
 */
export const parseAccommodation = (text: string) => {
    let hotelName = '숙소 미확인';
    const hotelKeywords = ['Hotel', 'Resort', 'Stay', 'Inn', 'Voucher', '호텔', '리조트', '스테이', '확약번호', '체크인'];

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    for (const line of lines) {
        const collapsedLine = line.replace(/\s+/g, '');
        if (hotelKeywords.some(k => collapsedLine.includes(k)) && line.length < 100) {
            hotelName = line.replace(/Booking ID|Agoda|Voucher|Confirm|중요편지함|체크인|체크아웃/gi, '').trim();
            break;
        }
    }

    if (hotelName === '숙소 미확인') {
        const topLines = lines.slice(0, 10).filter(l => !l.includes('www.') && l.length > 5);
        if (topLines.length > 0) hotelName = topLines.slice(0, 5).reduce((a, b) => a.length > b.length ? a : b, '');
    }

    const uniqueDates = extractAllDates(text);

    // Improved Time Extraction with Context
    let checkInTime = extractTimeWithContext(text, '체크인');
    if (!checkInTime) checkInTime = extractTimeWithContext(text, 'Check-in');
    if (!checkInTime) checkInTime = extractTimeWithContext(text, 'PM'); // Fallback to first available PM time if keyword fails

    return {
        hotelName: hotelName.substring(0, 50).replace(/\s+/g, ' '),
        checkIn: uniqueDates[0] || '미확인',
        checkInTime: checkInTime || '',
        checkOut: uniqueDates[uniqueDates.length - 1] || '미확인'
    };
};

/**
 * Universal Parser
 */
export const parseUniversalDocument = (text: string) => {
    const lowerText = text.toLowerCase().replace(/\s+/g, '');

    if (lowerText.includes('boardingpass') || lowerText.includes('flight') || lowerText.includes('airline') || (lowerText.includes('icn') && lowerText.includes('oka'))) {
        const airportCodes = ['ICN', 'GMP', 'PUS', 'CJU', 'NRT', 'HND', 'KIX', 'OKA'];
        const airportNames: Record<string, string> = { 'ICN': '인천', 'GMP': '김포', 'PUS': '김해', 'CJU': '제주', 'NRT': '나리타', 'HND': '하네다', 'KIX': '간사이', 'OKA': '오키나와' };
        const foundCodes: string[] = [];
        airportCodes.forEach(code => { if (text.includes(code)) foundCodes.push(code); });
        return { type: 'flight', departure: foundCodes[0] ? (airportNames[foundCodes[0]] || foundCodes[0]) : '인천', arrival: foundCodes[1] ? (airportNames[foundCodes[1]] || foundCodes[1]) : '나하' };
    }

    if (lowerText.includes('hotel') || lowerText.includes('resort') || lowerText.includes('checkin') || lowerText.includes('agoda') || lowerText.includes('booking.com')) {
        return { type: 'accommodation', ...parseAccommodation(text) };
    }

    const uniqueDates = extractAllDates(text);
    return { type: 'unknown', startDate: uniqueDates[0] || '미확인', endDate: uniqueDates[uniqueDates.length - 1] || '미확인' };
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(extractTextFromHtml(e.target?.result as string));
            reader.readAsText(file);
        });
    }
    if (fileName.endsWith('.pdf')) return extractTextFromPdf(file);
    return extractTextFromImage(file);
};

export const parseFlightTicket = (ocrText: string) => parseUniversalDocument(ocrText) as any;
export const parsePublicTransportTicket = (ocrText: string) => ({ departure: '미확인', arrival: '미확인' });
