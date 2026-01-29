$filePath = 'e:\anti\okinawa\okinawa_trip_standalone.html'
$content = Get-Content $filePath -Raw

# 1. Add Styles
$styles = @"

        /* Currency Converter Styles */
        .converter-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--primary);
            color: #1a202c !important;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(79, 209, 197, 0.4);
            cursor: pointer;
            z-index: 1000;
            border: none;
            transition: transform 0.2s;
        }
        .converter-fab:active { transform: scale(0.9); }
        .converter-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            z-index: 2500;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .converter-card {
            width: 100%;
            max-width: 360px;
            background: #2d3748;
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .currency-input-group { margin-bottom: 20px; }
        .currency-input-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
        .currency-input-wrapper { position: relative; background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 12px; border: 1px solid var(--glass-border); }
        .currency-input-wrapper input { background: transparent; border: none; color: white; font-size: 24px; font-weight: 700; width: 100%; outline: none; }
        .currency-input-wrapper span { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--primary); }
"@
$content = $content -replace '</style>', "$styles`n        </style>"

# 2. Add State and Logic inside App component
$stateLogic = @"
            var sConverter = useState(false);
            var showConverter = sConverter[0];
            var setShowConverter = sConverter[1];

            var sJpy = useState('1000');
            var jpyAmount = sJpy[0];
            var setJpyAmount = sJpy[1];

            var sKrw = useState('9000');
            var krwAmount = sKrw[0];
            var setKrwAmount = sKrw[1];

            var sRate = useState(9.0);
            var rate = sRate[0];
            var setRate = sRate[1];

            useEffect(function() {
                fetch('https://open.er-api.com/v6/latest/JPY')
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                        if (data && data.rates && data.rates.KRW) {
                            setRate(data.rates.KRW);
                            setKrwAmount(Math.round(parseFloat(jpyAmount) * data.rates.KRW).toLocaleString());
                        }
                    });
            }, []);

            var handleJpyChange = function(val) {
                setJpyAmount(val);
                var parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                    setKrwAmount(Math.round(parsed * rate).toLocaleString());
                } else {
                    setKrwAmount('0');
                }
            };

            var handleKrwChange = function(val) {
                var cleanVal = val.replace(/,/g, '');
                setKrwAmount(val);
                var parsed = parseFloat(cleanVal);
                if (!isNaN(parsed)) {
                    setJpyAmount(Math.round(parsed / rate).toString());
                } else {
                    setJpyAmount('0');
                }
            };
"@
# Inject after the last useState
$content = $content -replace 'var setFullImg = s3\[1\];', "var setFullImg = s3[1];`n$stateLogic"

# 3. Add UI elements to return
$uiElements = @"
                React.createElement('button', { 
                    className: 'converter-fab',
                    onClick: function() { setShowConverter(true); }
                }, React.createElement(lucide.RefreshCw, { size: 24 })),

                showConverter && React.createElement('div', { 
                    className: 'converter-overlay',
                    onClick: function() { setShowConverter(false); }
                }, 
                    React.createElement('div', { 
                        className: 'converter-card',
                        onClick: function(e) { e.stopPropagation(); }
                    },
                        React.createElement('h2', { style: { marginBottom: '20px', fontSize: '20px' } }, '환율 계산기'),
                        React.createElement('div', { className: 'currency-input-group' },
                            React.createElement('label', null, '일본 엔 (JPY)'),
                            React.createElement('div', { className: 'currency-input-wrapper' },
                                React.createElement('input', { 
                                    type: 'number', 
                                    value: jpyAmount,
                                    onChange: function(e) { handleJpyChange(e.target.value); }
                                }),
                                React.createElement('span', null, '¥')
                            )
                        ),
                        React.createElement('div', { className: 'currency-input-group' },
                            React.createElement('label', null, '대한민국 원 (KRW)'),
                            React.createElement('div', { className: 'currency-input-wrapper' },
                                React.createElement('input', { 
                                    type: 'text', 
                                    value: krwAmount,
                                    onChange: function(e) { handleKrwChange(e.target.value); }
                                }),
                                React.createElement('span', null, '₩')
                            )
                        ),
                        React.createElement('div', { style: { textAlign: 'center', opacity: 0.6, fontSize: '12px', margin: '20px 0' } }, 
                            '100 JPY ≈ ' + Math.round(rate * 100).toLocaleString() + ' KRW'
                        ),
                        React.createElement('button', { 
                            className: 'primary-button',
                            onClick: function() { setShowConverter(false); }
                        }, '닫기')
                    )
                ),
"@

# Inject before the final closing tag of the main div
$content = $content -replace '\);\s*\}\s*,\s*\[activeTab, selectedPoint, fullImg\]\s*\)', "$uiElements`n                );`n            }, [activeTab, selectedPoint, fullImg, showConverter, jpyAmount, krwAmount])"

$content | Out-File $filePath -Encoding utf8
