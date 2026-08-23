// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { settingsApi } from '../api/settings';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/constants';
import { useUiStore } from '../store/uiStore';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'notifications'>('preferences');
  const addToast = useUiStore((state) => state.addToast);

  const { data: userPref } = useQuery({
    queryKey: [QUERY_KEYS.USER_PREFERENCES],
    queryFn: () => settingsApi.getUserPreferences(),
  });

  const [theme, setTheme] = useState(userPref?.theme || 'light');
  const [locale, setLocale] = useState(userPref?.locale || 'en-US');
  const [timeZone, setTimeZone] = useState(userPref?.timeZone || 'Africa/Cairo');
  const [decimalPrecision, setDecimalPrecision] = useState(userPref?.decimalPrecision || 2);

  const [notifMatrix, setNotifMatrix] = useState([
    { channel: 'IN_APP', severity: 'CRITICAL', enabled: true, digest: true },
    { channel: 'IN_APP', severity: 'WARNING', enabled: true, digest: false },
    { channel: 'IN_APP', severity: 'INFO', enabled: false, digest: false },
    { channel: 'EMAIL', severity: 'CRITICAL', enabled: true, digest: true },
    { channel: 'EMAIL', severity: 'WARNING', enabled: false, digest: true },
    { channel: 'EMAIL', severity: 'INFO', enabled: false, digest: false },
  ]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsApi.updateUserPreferences({
      theme: theme as any,
      locale,
      timeZone,
      decimalPrecision: Number(decimalPrecision),
    });
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Your user profile and display settings have been updated.',
    });
  };

  const toggleNotif = (index: number, field: 'enabled' | 'digest') => {
    const updated = [...notifMatrix];
    updated[index][field] = !updated[index][field];
    setNotifMatrix(updated);
  };

  const handleSaveNotifications = () => {
    addToast({
      type: 'success',
      title: 'Notification Matrix Saved',
      message: 'Alert delivery channels and daily digests updated.',
    });
  };

  return (
    <section className="dashboard">
      <div className="panel" style={{ padding: 0, overflow: 'hidden', maxWidth: 900 }}>
        {/* Subtabs Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-chip ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Display & Localization
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notification Channel Matrix
            </button>
          </div>
        </div>

        <div style={{ padding: 22 }}>
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: '#334155' }}>
                    Visual Theme
                  </label>
                  <select
                    value="light"
                    disabled
                    className="select"
                    style={{ width: '100%', padding: '8px 10px', background: '#f8fafc', color: '#64748b' }}
                  >
                    <option value="light">Standard Light Mode (Default)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: '#334155' }}>
                    Default Locale
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="select"
                    style={{ width: '100%', padding: '8px 10px', background: '#fff' }}
                  >
                    <option value="en-US">English (United States) — en-US</option>
                    <option value="ar-EG">Arabic (Egypt) — ar-EG</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: '#334155' }}>
                    Operational Timezone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="select"
                    style={{ width: '100%', padding: '8px 10px', background: '#fff' }}
                  >
                    <option value="Africa/Cairo">Africa/Cairo (UTC+2 / UTC+3)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: '#334155' }}>
                    Decimal Precision
                  </label>
                  <select
                    value={decimalPrecision}
                    onChange={(e) => setDecimalPrecision(Number(e.target.value))}
                    className="select"
                    style={{ width: '100%', padding: '8px 10px', background: '#fff' }}
                  >
                    <option value={1}>1 Decimal Place (e.g. 2.4 m)</option>
                    <option value={2}>2 Decimal Places (e.g. 2.45 m)</option>
                    <option value={3}>3 Decimal Places (e.g. 2.455 m)</option>
                  </select>
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    background: '#1677f0',
                    color: '#fff',
                    border: 0,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Display Preferences
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Delivery Channel</th>
                      <th>Alarm Severity</th>
                      <th style={{ textAlign: 'center' }}>Instant Notification</th>
                      <th style={{ textAlign: 'center' }}>Daily Digest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifMatrix.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.channel}</td>
                        <td>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: row.severity === 'CRITICAL' ? '#fee2e2' : row.severity === 'WARNING' ? '#fef3c7' : '#e0f2fe', color: row.severity === 'CRITICAL' ? '#eb4747' : row.severity === 'WARNING' ? '#e6a00a' : '#1677f0' }}>
                            {row.severity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={() => toggleNotif(idx, 'enabled')}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={row.digest}
                            onChange={() => toggleNotif(idx, 'digest')}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  style={{
                    padding: '8px 18px',
                    background: '#1677f0',
                    color: '#fff',
                    border: 0,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
