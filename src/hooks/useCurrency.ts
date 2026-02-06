import { useState } from 'react';

export const useCurrency = (initialRate: number = 9.0) => {
    const [jpyAmount, setJpyAmount] = useState("1000");
    const [krwAmount, setKrwAmount] = useState("9000");
    const [rate, setRate] = useState(initialRate);

    const convert = (val: string, type: "jpy" | "krw") => {
        const num = parseFloat(val.replace(/,/g, ""));
        if (isNaN(num)) {
            if (type === "jpy") {
                setJpyAmount(val);
                setKrwAmount("0");
            } else {
                setKrwAmount(val);
                setJpyAmount("0");
            }
            return;
        }
        if (type === "jpy") {
            setJpyAmount(val);
            setKrwAmount(Math.round(num * rate).toLocaleString());
        } else {
            setKrwAmount(val);
            setJpyAmount(Math.round(num / rate).toString());
        }
    };

    return {
        jpyAmount,
        setJpyAmount,
        krwAmount,
        setKrwAmount,
        rate,
        setRate,
        convert
    };
};
