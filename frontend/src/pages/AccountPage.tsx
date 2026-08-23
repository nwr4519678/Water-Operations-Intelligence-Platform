// src/pages/AccountPage.tsx
import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../store/uiStore';
import {
  User,
  ShieldCheck,
  KeyRound,
  Bell,
  Lock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Code,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { currentUser } = useAuth();
  const addToast = useUiStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions' | 'notifications' | 'api'>('profile');

  // Profile form state
  const [fullName, setFullName] = useState(currentUser?.name || 'Eng. Mohamed Atef');
  const [email, setEmail] = useState(currentUser?.email || 'viewer.ops@water.gov.eg');
  const [phone, setPhone] = useState('+20 102 458 9912');
  const [sector, setSector] = useState('Greater Cairo Operations Central Command');
  const [stationOffice, setStationOffice] = useState('MWRI Telemetry Building - Nile River SCADA Center');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // API Token state
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [apiToken, setApiToken] = useState('mwri_live_viewer_9a8f7c6e5d4b3a210987654321fedcba');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Account details and operational sector preferences saved successfully.',
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your current institutional password.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match.',
      });
      return;
    }
    if (newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Weak Password',
        message: 'New password must be at least 8 characters with numbers and special symbols.',
      });
      return;
    }

    addToast({
      type: 'success',
      title: 'Security Credentials Updated',
      message: 'Your account password has been updated securely.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCopyApiToken = () => {
    navigator.clipboard.writeText(apiToken);
    setApiKeyCopied(true);
    addToast({
      type: 'info',
      title: 'Token Copied',
      message: 'Personal API Token copied to clipboard for telemetry automation.',
    });
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleRegenerateToken = () => {
    const newToken = `mwri_live_viewer_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setApiToken(newToken);
    addToast({
      type: 'info',
      title: 'Token Regenerated',
      message: 'New token generated. Remember to update your automated scripts.',
    });
  };

  return (
    <div className="space-y-6 text-slate-900 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xl font-extrabold shadow-md shadow-blue-500/20 shrink-0">
            {String(fullName || 'MA').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Role: VIEWER</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Ministry of Water Resources & Irrigation</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{email}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Authorization Status
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Institutional Session</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Account Settings Card */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 pt-3 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Institutional Info</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Authentication</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role & SCADA Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alert Routing & Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>API Access & Tokens</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Official Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Direct Operations Contact / Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Assigned Hydrological Sector
                  </label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Operations Command Desk / Physical Office
                </label>
                <input
                  type="text"
                  value={stationOffice}
                  onChange={(e) => setStationOffice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Button type="submit" variant="primary">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          )}

          {/* 2. Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8 max-w-2xl">
              {/* Change Password Form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Change Institutional Password
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ensure password adheres to ministerial cybersecurity standards (min 8 chars, uppercase, digits, symbols)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary">
                    Update Password
                  </Button>
                </div>
              </form>

              {/* 2FA & Active Sessions */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Hardware authenticator app (Google Auth / Microsoft Auth) required for login
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enabled & Active</span>
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Active Operational Sessions
                  </h4>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Windows 11 • Chrome 124 (This Device)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cairo, Egypt • IP: 156.208.44.18 • Active now
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Current
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          iPad Pro • Field SCADA Inspector
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Aswan Reach Station • Last active 4 hours ago
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 text-xs">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Role & Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Role: VIEWER (Read-Only SCADA Telemetry)
                </h3>
                <p className="text-xs text-slate-400">
                  Your institutional account is provisioned with high-clearance read-only visibility across all Egyptian telemetry sectors
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Granted Capabilities</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc list-inside">
                    <li>Full map & satellite cluster telemetry access (410 stations)</li>
                    <li>Dual Y-axis sensor charts & AI LSTM 72h forecasts</li>
                    <li>DBSCAN hydrological spatial clustering inspections</li>
                    <li>Audit alarm log reviews & AI root-cause diagnostics</li>
                    <li>Official PDF & Excel reports generation & downloads</li>
                    <li>Live SignalR telemetry WebSocket data streams</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Restricted Actions (Commander/Admin)</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-500 text-[11px] list-disc list-inside">
                    <li>Remote actuator override & pump gate triggering</li>
                    <li>Sensor calibration parameter threshold modifications</li>
                    <li>Station RTU firmware remote flasher</li>
                    <li>System user account provisioning</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 4. Alert Routing & Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Operational Alert Notifications
                </h3>
                <p className="text-xs text-slate-400">
                  Configure high-urgency notifications for critical flood surges, pipe bursts, and water quality anomalies
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Critical Flood Surge & Dam Spillway Alarms
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Immediate SMS & Email dispatch when water levels exceed +90% safe threshold
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      AI Anomaly Detections & Predictive Failures
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Daily digest when equipment failure probability exceeds 60%
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Periodic Daily Shift Summary Report
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Automated 06:00 AM briefing sent to {email}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. API Access Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Personal Telemetry Access Token
                </h3>
                <p className="text-xs text-slate-400">
                  Use this token to query live telemetry and sensor metrics programmatically via Python, R, or cURL
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Read-Only API Bearer Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiToken}
                    className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none select-all"
                  />
                  <Button
                    variant="outline"
                    leftIcon={apiKeyCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyApiToken}
                  >
                    {apiKeyCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleRegenerateToken}
                  >
                    Rotate
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="font-bold text-slate-700">Example cURL Query</div>
                <pre className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-blue-700 overflow-x-auto">
{`curl -X GET "https://localhost:7048/api/v1/stations/STN-001/telemetry/latest" \\
  -H "Authorization: Bearer ${apiToken}"`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
