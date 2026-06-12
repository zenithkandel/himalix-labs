import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WalletView = () => {
  const { user, token, refreshUser } = useAuth();
  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    referralCode: '',
    referredBy: null,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [referralInput, setReferralInput] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [refError, setRefError] = useState('');
  const [binding, setBinding] = useState(false);

  // Claims states
  const [socialSuccess, setSocialSuccess] = useState('');
  const [socialError, setSocialError] = useState('');
  const [claimingPlatform, setClaimingPlatform] = useState('');

  const fetchWalletDetails = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/store/wallet/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (err) {
      console.error('Failed to load wallet ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [token]);

  const handleBindReferral = async (e) => {
    e.preventDefault();
    if (!referralInput) return;

    setBinding(true);
    setRefSuccess('');
    setRefError('');

    try {
      const res = await fetch('/api/store/wallet/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: referralInput })
      });
      const data = await res.json();

      if (res.ok) {
        setRefSuccess(data.message || 'Referral bound successfully.');
        setReferralInput('');
        fetchWalletDetails();
        refreshUser();
      } else {
        setRefError(data.error || 'Failed to bind referral code.');
      }
    } catch (err) {
      setRefError('Failed to connect to authentication services.');
    } finally {
      setBinding(false);
    }
  };

  const handleClaimSocialBonus = async (platform) => {
    setClaimingPlatform(platform);
    setSocialSuccess('');
    setSocialError('');

    try {
      const res = await fetch('/api/store/wallet/claim-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platform })
      });
      const data = await res.json();

      if (res.ok) {
        setSocialSuccess(data.message || `Follow bonus credited for ${platform}.`);
        fetchWalletDetails();
        refreshUser();
      } else {
        setSocialError(data.error || `Failed to claim ${platform} bonus.`);
      }
    } catch (err) {
      setSocialError('Gateway connectivity error.');
    } finally {
      setClaimingPlatform('');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)'
      }}>
        <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Syncing wallet ledgers...
      </div>
    );
  }

  return (
    <div className="container store-container">
      <div className="store-header">
        <h1>Your Wallet Ledger</h1>
      </div>

      <div className="wallet-grid">
        {/* Balance & Incentives Card Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="wallet-balance-card">
            <h3>Available Credits</h3>
            <div className="wallet-amount">
              Rs. {walletData.walletBalance.toFixed(2)}
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Your Referral Code
              </div>
              <div className="wallet-ref-code">{walletData.referralCode}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Share code with others. When they bind it during signup, both of you earn credit bonuses.
              </p>
            </div>
          </div>

          {/* Claim Referral section */}
          {!walletData.referredBy && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '30px' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', marginBottom: '12px' }}>
                Referred by someone?
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Enter an inviter's referral code to instantly claim credit bonuses.
              </p>
              
              {refSuccess && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px', fontSize: '12px', marginBottom: '16px' }}>
                  {refSuccess}
                </div>
              )}
              {refError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', fontSize: '12px', marginBottom: '16px' }}>
                  {refError}
                </div>
              )}

              <form onSubmit={handleBindReferral} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  placeholder="HMX-REF-XXXXXX"
                  disabled={binding}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                />
                <button type="submit" disabled={binding} style={{ padding: '10px 16px', fontSize: '13px' }}>
                  {binding ? 'Binding...' : 'Bind'}
                </button>
              </form>
            </div>
          )}

          {/* Social Media Incentives */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '30px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', marginBottom: '12px' }}>
              Social Follow Incentives
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Claim follow bonuses for subscribing to Himalix on social platforms.
            </p>

            {socialSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px', fontSize: '12px', marginBottom: '16px' }}>
                {socialSuccess}
              </div>
            )}
            {socialError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', fontSize: '12px', marginBottom: '16px' }}>
                {socialError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleClaimSocialBonus('facebook')}
                disabled={claimingPlatform !== ''}
                style={{ width: '100%', fontSize: '13px', display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}
              >
                <span>
                  <i className="fa-light fa-sharp fa-brands fa-facebook" style={{ marginRight: '8px', color: 'var(--accent-gold)' }}></i>
                  Claim Facebook Follow Bonus
                </span>
                <span>
                  {claimingPlatform === 'facebook' ? (
                    <i className="fa-light fa-sharp fa-spinner fa-spin"></i>
                  ) : (
                    '+ Rs. 5.00'
                  )}
                </span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleClaimSocialBonus('instagram')}
                disabled={claimingPlatform !== ''}
                style={{ width: '100%', fontSize: '13px', display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}
              >
                <span>
                  <i className="fa-light fa-sharp fa-brands fa-instagram" style={{ marginRight: '8px', color: 'var(--accent-gold)' }}></i>
                  Claim Instagram Follow Bonus
                </span>
                <span>
                  {claimingPlatform === 'instagram' ? (
                    <i className="fa-light fa-sharp fa-spinner fa-spin"></i>
                  ) : (
                    '+ Rs. 5.00'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Ledger logs panel */}
        <div className="wallet-ledger-card">
          <h3>Transaction History</h3>
          
          {walletData.transactions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No transactions recorded in your wallet ledger.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference Code</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {walletData.transactions.map((tx) => {
                    const isCredit = parseFloat(tx.amount) > 0;
                    return (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>
                          {tx.type}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {tx.reference_id}
                        </td>
                        <td 
                          className={`ledger-amount ${isCredit ? 'credit' : 'debit'}`}
                          style={{ textAlign: 'right' }}
                        >
                          {isCredit ? '+' : ''}Rs. {parseFloat(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;
