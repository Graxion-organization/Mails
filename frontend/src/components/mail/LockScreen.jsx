import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LockScreen({ isLocked, onUnlock }) {
  const { logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setIsBiometricSupported(available);
        })
        .catch(console.error);
    }
  }, []);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('graxion_mail_pin');
    if (pin === savedPin) {
      setError('');
      setPin('');
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      // In a real WebAuthn flow, we would fetch challenge from server.
      // Since this is a local app lock, we can use a dummy challenge 
      // or just check if they can verify presence.
      // But standard WebAuthn requires a registered credential.
      // Let's assume they already registered a credential ID stored in localStorage.
      const credentialIdStr = localStorage.getItem('graxion_biometric_id');
      
      if (!credentialIdStr) {
        setError('Biometrics not set up for this device. Use PIN.');
        return;
      }
      
      const credentialId = new Uint8Array(JSON.parse(credentialIdStr));
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
        }
      });

      if (assertion) {
        onUnlock();
      }
    } catch (err) {
      console.error('Biometric unlock failed', err);
      setError('Biometric authentication failed or was cancelled.');
    }
  };

  const handleForgotPin = () => {
    // Reset local state and logout
    localStorage.removeItem('graxion_mail_pin');
    localStorage.removeItem('graxion_mail_lock_enabled');
    localStorage.removeItem('graxion_biometric_id');
    logout();
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#18181b] border border-white/10 rounded-2xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[64px] pointer-events-none" />
        
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 relative z-10">
          <Lock size={32} />
        </div>
        
        <h2 className="text-2xl font-semibold text-white mb-2 relative z-10">App Locked</h2>
        <p className="text-secondary text-center mb-8 relative z-10">
          Enter your PIN or use biometrics to unlock Graxion Mail.
        </p>

        <form onSubmit={handlePinSubmit} className="w-full relative z-10">
          <div className="flex flex-col gap-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="••••"
              maxLength={6}
              autoFocus
            />
            
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={!pin}
              className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound size={18} />
              Unlock with PIN
            </button>
          </div>
        </form>

        {isBiometricSupported && localStorage.getItem('graxion_biometric_id') && (
          <>
            <div className="w-full flex items-center gap-4 my-6 opacity-30 relative z-10">
              <div className="h-px bg-white flex-1" />
              <span className="text-xs uppercase tracking-wider text-white">OR</span>
              <div className="h-px bg-white flex-1" />
            </div>

            <button 
              onClick={handleBiometricUnlock}
              className="w-full bg-primary/10 text-primary border border-primary/20 font-semibold rounded-xl py-3 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 relative z-10"
            >
              <Fingerprint size={18} />
              Unlock with Fingerprint
            </button>
          </>
        )}

        <button 
          onClick={handleForgotPin}
          className="mt-8 text-secondary text-sm hover:text-white transition-colors relative z-10 underline underline-offset-4"
        >
          Forgot PIN? Log out
        </button>
      </div>
    </div>
  );
}
