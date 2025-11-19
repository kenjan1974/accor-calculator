import React, { useState, useEffect } from 'react';
import { fetchRates } from '../api/currency';
import { Calculator, Coins, CreditCard, Hotel, RefreshCw } from 'lucide-react';

const AccorCalculator = () => {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('TWD');
    const [stayDays, setStayDays] = useState(1);
    const [totalAmount, setTotalAmount] = useState('');
    const [minCashPerDay, setMinCashPerDay] = useState(10); // Default 10 EUR
    const [manualPoints, setManualPoints] = useState(null);

    useEffect(() => {
        const loadRates = async () => {
            setLoading(true);
            const data = await fetchRates();
            if (data) {
                setRates(data);
            }
            setLoading(false);
        };
        loadRates();
    }, []);

    // Reset manual points when inputs change significantly to recalculate suggestion
    useEffect(() => {
        setManualPoints(null);
    }, [totalAmount, currency, stayDays, minCashPerDay]);

    if (loading) {
        return (
            <div className="loading-container">
                <RefreshCw className="spin" size={48} />
                <p>Loading Exchange Rates...</p>
            </div>
        );
    }

    if (!rates) {
        return <div className="error">Failed to load exchange rates. Please try again later.</div>;
    }

    // Logic
    const totalEUR = totalAmount ? parseFloat(totalAmount) / rates[currency] : 0;
    const totalTWD = totalEUR * rates['TWD'];
    const minCashEUR = stayDays * minCashPerDay;

    // Calculate Suggested Max Points (respecting min cash)
    let maxRedeemableEUR_MinCash = Math.max(0, totalEUR - minCashEUR);
    const suggestedPointsChunks = Math.floor(maxRedeemableEUR_MinCash / 40);
    const suggestedPoints = suggestedPointsChunks * 2000;

    // Calculate Absolute Max Points (respecting total amount only, for dropdown limit)
    // We can't pay more than the total amount.
    const maxPossibleChunks = Math.floor(totalEUR / 40);
    const maxPossiblePoints = maxPossibleChunks * 2000;

    // Generate options: 0, 2000, ..., maxPossiblePoints
    const pointOptions = [];
    for (let p = 0; p <= maxPossiblePoints; p += 2000) {
        pointOptions.push(p);
    }

    // Use manual points if set, otherwise suggested
    // Ensure manual points are still valid (e.g. if total amount dropped)
    let pointsUsed = manualPoints !== null ? manualPoints : suggestedPoints;
    if (pointsUsed > maxPossiblePoints) {
        pointsUsed = maxPossiblePoints;
    }

    const valueRedeemedEUR = (pointsUsed / 2000) * 40;
    const remainingCashEUR = totalEUR - valueRedeemedEUR;

    // Warning Logic
    const isBelowMinCash = remainingCashEUR < (minCashEUR - 0.01); // Tolerance for float

    // Conversions for display
    const remainingCashSelected = remainingCashEUR * rates[currency];
    const remainingCashTWD = remainingCashEUR * rates['TWD'];

    const formatCurrency = (val, cur) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(val);
    };

    const formatPoints = (val) => {
        return new Intl.NumberFormat('en-US').format(val);
    };

    // Currency Names
    const getCurrencyName = (code) => {
        try {
            return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
        } catch (e) {
            return code;
        }
    };

    return (
        <div className="calculator-card">
            <div className="header">
                <Hotel size={32} />
                <h1>Accor Points Calculator</h1>
            </div>

            <div className="input-group">
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {Object.keys(rates).sort().map((cur) => (
                        <option key={cur} value={cur}>{cur} - {getCurrencyName(cur)}</option>
                    ))}
                </select>
            </div>

            <div className="input-row">
                <div className="input-group">
                    <label>Stay Days</label>
                    <input
                        type="number"
                        min="1"
                        value={stayDays}
                        onChange={(e) => setStayDays(parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="input-group">
                    <label>Total Amount ({currency})</label>
                    <input
                        type="number"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Total Converted Display */}
            {totalAmount > 0 && (
                <div className="total-conversions">
                    <div className="conversion-item">
                        <span>Total (EUR):</span>
                        <strong>{formatCurrency(totalEUR, 'EUR')}</strong>
                    </div>
                    <div className="conversion-item">
                        <span>Total (TWD):</span>
                        <strong>{formatCurrency(totalTWD, 'TWD')}</strong>
                    </div>
                </div>
            )}

            <div className="input-group">
                <label>Min Cash to Keep (EUR/Day)</label>
                <input
                    type="number"
                    min="0"
                    value={minCashPerDay}
                    onChange={(e) => setMinCashPerDay(parseFloat(e.target.value) || 0)}
                />
                <small className="hint">You requested keeping at least 10 EUR/day.</small>
            </div>

            <div className="divider"></div>

            <div className="results">
                <div className={`result-item highlight ${isBelowMinCash ? 'warning' : ''}`}>
                    <div className="icon"><Coins size={24} /></div>
                    <div className="info">
                        <span>Points to Use</span>
                        <select
                            className="points-input"
                            value={pointsUsed}
                            onChange={(e) => setManualPoints(parseInt(e.target.value))}
                        >
                            {pointOptions.map(opt => (
                                <option key={opt} value={opt}>{formatPoints(opt)} pts ({formatCurrency((opt / 2000) * 40, 'EUR')})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isBelowMinCash && (
                    <div className="warning-banner">
                        ⚠️ Warning: Remaining cash is below {minCashPerDay} EUR/day!
                    </div>
                )}

                <div className="result-item">
                    <div className="icon"><CreditCard size={24} /></div>
                    <div className="info">
                        <span>Value Redeemed</span>
                        <strong>{formatCurrency(valueRedeemedEUR, 'EUR')}</strong>
                    </div>
                </div>

                <div className="result-section-title">Remaining to Pay</div>

                <div className="result-grid">
                    <div className="result-box">
                        <span>Original ({currency})</span>
                        <strong>{formatCurrency(remainingCashSelected, currency)}</strong>
                    </div>
                    <div className="result-box">
                        <span>Euro (EUR)</span>
                        <strong>{formatCurrency(remainingCashEUR, 'EUR')}</strong>
                    </div>
                    <div className="result-box">
                        <span>Taiwan Dollar (TWD)</span>
                        <strong>{formatCurrency(remainingCashTWD, 'TWD')}</strong>
                    </div>
                </div>
            </div>

            <div className="footer">
                Rates via ExchangeRate-API (EUR Base)
            </div>
        </div>
    );
};

export default AccorCalculator;
