import React, { useState } from 'react';
import { Patient, HospitalUser, Hospital } from '../types';
import { HOSPITALS } from '../data';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, 
  HeartPulse, ArrowRight, UserPlus, Check, Sparkles, Building2, HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onPatientLogin: (patient: Patient) => void;
  onHospitalLogin: (hospitalUser: HospitalUser) => void;
  onClose: () => void;
  hospitals?: Hospital[];
}

export default function Auth({ onPatientLogin, onHospitalLogin, onClose, hospitals = HOSPITALS }: AuthProps) {
  // Tabs: 'patient' or 'hospital'
  const [activeTab, setActiveTab] = useState<'patient' | 'hospital'>('patient');
  
  // Patient Forms: 'signin' or 'signup'
  const [patientMode, setPatientMode] = useState<'signin' | 'signup'>('signin');
  
  // Hospital Forms: 'signin' or 'signup'
  const [hospitalMode, setHospitalMode] = useState<'signin' | 'signup'>('signin');
  
  // Show/Hide password
  const [showPassword, setShowPassword] = useState(false);

  // Error/Success state
  const [errorMessage, setErrorMessage] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Patient Fields
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientNpi, setPatientNpi] = useState('');

  // Hospital Login Fields
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || 'chd-atlantique');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [hospitalPassword, setHospitalPassword] = useState('');
  const [hospitalRole, setHospitalRole] = useState<'doctor' | 'admin' | 'nurse'>('doctor');

  // New Hospital Sign Up Fields
  const [signupHospitalName, setSignupHospitalName] = useState('');
  const [signupHospitalType, setSignupHospitalType] = useState<'public' | 'private' | 'clinic'>('clinic');
  const [signupHospitalAddress, setSignupHospitalAddress] = useState('');
  const [signupHospitalPhone, setSignupHospitalPhone] = useState('');
  const [signupHospitalHours, setSignupHospitalHours] = useState('Ouvert 24h/24');
  const [signupHospitalEmail, setSignupHospitalEmail] = useState('');
  const [signupHospitalPassword, setSignupHospitalPassword] = useState('');

  // Filter only verified hospitals for login select list
  const verifiedHospitals = hospitals.filter(h => h.isVerified);

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setAuthSuccess(false);
    
    if (patientMode === 'signup') {
      fetch('/api/wallet/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientEmail,
          name: patientName,
          phone: patientPhone,
          npi: patientNpi,
          walletBalance: 15000 // Initial starting balance
        })
      })
      .then(async res => {
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        if (!res.ok) {
          const errorMsg = isJson ? (await res.json()).error : await res.text();
          throw new Error(errorMsg || "Erreur d'inscription");
        }
        if (!isJson) {
          throw new Error("Réponse du serveur non valide");
        }
        return res.json();
      })
      .then(savedPatient => {
        setAuthSuccess(true);
        setSuccessMessage(`Compte citoyen créé avec succès ! Bienvenue ${savedPatient.name}.`);
        setTimeout(() => {
          onPatientLogin(savedPatient);
          setAuthSuccess(false);
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.message || "Erreur de création du profil.");
      });
    } else {
      // Sign In: Retrieve from backend to authenticate
      fetch(`/api/wallet/patients/${encodeURIComponent(patientEmail)}`)
      .then(async res => {
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        if (!res.ok) {
          const errorMsg = isJson ? (await res.json()).error : await res.text();
          throw new Error(errorMsg || "Erreur de connexion");
        }
        if (!isJson) {
          throw new Error("Réponse du serveur non valide");
        }
        return res.json();
      })
      .then(profile => {
        setAuthSuccess(true);
        setSuccessMessage(`Connexion réussie ! Ravi de vous revoir, ${profile.name}.`);
        setTimeout(() => {
          onPatientLogin(profile);
          setAuthSuccess(false);
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Identifiant de citoyen incorrect.");
      });
    }
  };

  const handleHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setAuthSuccess(false);
    
    fetch('/api/hospital-users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: hospitalEmail,
        password: hospitalPassword
      })
    })
    .then(async res => {
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      if (!res.ok) {
        const errorMsg = isJson ? (await res.json()).error : await res.text();
        throw new Error(errorMsg || "Erreur d'authentification");
      }
      if (!isJson) {
        throw new Error("Réponse du serveur non valide");
      }
      return res.json();
    })
    .then((hUser: HospitalUser) => {
      setAuthSuccess(true);
      setSuccessMessage(`Authentification validée. Accès en tant que ${hUser.role === 'admin' ? 'Administrateur' : hUser.role === 'doctor' ? 'Médecin' : 'Praticien'} - ${hUser.name}`);
      
      setTimeout(() => {
        onHospitalLogin(hUser);
        setAuthSuccess(false);
      }, 1500);
    })
    .catch(err => {
      console.error(err);
      setErrorMessage(err.message || "Identifiants incorrects ou établissement non validé.");
    });
  };

  const handleHospitalSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setAuthSuccess(false);

    fetch('/api/hospitals/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: signupHospitalName,
        type: signupHospitalType,
        address: signupHospitalAddress,
        phone: signupHospitalPhone,
        hours: signupHospitalHours,
        email: signupHospitalEmail,
        password: signupHospitalPassword
      })
    })
    .then(async res => {
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      if (!res.ok) {
        const errorMsg = isJson ? (await res.json()).error : await res.text();
        throw new Error(errorMsg || "Impossible d'inscrire l'établissement.");
      }
      if (!isJson) {
        throw new Error("Réponse du serveur non valide");
      }
      return res.json();
    })
    .then(data => {
      setAuthSuccess(true);
      setSuccessMessage(data.message || "Demande d'inscription enregistrée !");
      setTimeout(() => {
        setAuthSuccess(false);
        setHospitalMode('signin');
        setHospitalEmail(signupHospitalEmail);
        setHospitalPassword(signupHospitalPassword);
      }, 4000);
    })
    .catch(err => {
      console.error(err);
      setErrorMessage(err.message || "Une erreur est survenue lors de l'enregistrement.");
    });
  };

  return (
    <div id="auth-portal" className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
      {/* Visual Top Branding Area */}
      <div className="bg-[#059669] p-6 text-white text-center space-y-2 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl font-sans"></div>
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white font-black text-xl shadow-xs font-sans">
          S+
        </div>
        <h2 className="text-xl font-bold font-sans tracking-tight">Portail d'Accès Santé+</h2>
        <p className="text-xs text-emerald-100 font-sans">Système d'information médicale sécurisé de Calavi</p>
      </div>

      {/* Tabs Selector Patient vs Hospital */}
      <div className="p-4 border-b border-gray-100 flex gap-2 bg-gray-50/50">
        <button
          onClick={() => { setActiveTab('patient'); setErrorMessage(''); setAuthSuccess(false); }}
          className={`flex-1 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer ${
            activeTab === 'patient'
              ? 'bg-white border border-gray-100 text-[#059669] shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Patient / Citoyen
        </button>
        <button
          onClick={() => { setActiveTab('hospital'); setErrorMessage(''); setAuthSuccess(false); }}
          className={`flex-1 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer ${
            activeTab === 'hospital'
              ? 'bg-white border border-gray-100 text-[#059669] shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Hôpital / Professionnel
        </button>
      </div>

      <div className="p-6">
        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold font-sans leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Auth Success State overlay */}
        {authSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center space-y-4"
          >
            <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 text-[#059669] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1 px-4">
              <h3 className="font-bold text-sm text-[#1C1C1E] font-sans">Accès Sécurisé Confirmé</h3>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                {successMessage}
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* TAB: CITOYEN / PATIENT ACCESS */}
            {activeTab === 'patient' && (
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold font-sans">
                    {patientMode === 'signin' ? "Se connecter" : "Inscription citoyenne"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPatientMode(patientMode === 'signin' ? 'signup' : 'signin')}
                    className="text-xs font-bold text-[#059669] hover:underline cursor-pointer font-sans"
                  >
                    {patientMode === 'signin' ? "Créer un compte" : "Déjà inscrit ?"}
                  </button>
                </div>

                {/* COMPTES DE TEST - CITOYEN */}
                <div id="demo-patient-accounts" className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider font-sans flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Comptes d'essais Citoyens (remplissage automatique)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMode('signin');
                        setPatientName('Bienvenue Segnon');
                        setPatientEmail('bienvenuesegnon@gmail.com');
                        setPatientPhone('+229 97 88 55 44');
                        setPatientNpi('1097885544901');
                        setPatientPassword('123456');
                      }}
                      className="p-2.5 bg-white border border-gray-100 hover:border-[#059669] hover:bg-emerald-50/20 text-left rounded-xl transition-all cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 font-sans group-hover:text-[#059669]">Bienvenue Segnon</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Essai 1</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">NPI: 1097885544901</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMode('signin');
                        setPatientName('Alice Dovonou');
                        setPatientEmail('alice.dovonou@gmail.com');
                        setPatientPhone('+229 95 34 12 78');
                        setPatientNpi('2095341278102');
                        setPatientPassword('123456');
                      }}
                      className="p-2.5 bg-white border border-gray-100 hover:border-[#059669] hover:bg-emerald-50/20 text-left rounded-xl transition-all cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 font-sans group-hover:text-[#059669]">Alice Dovonou</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Essai 2</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">NPI: 2095341278102</div>
                    </button>
                  </div>
                </div>

                {/* SIGN UP ONLY: Name */}
                {patientMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold font-sans text-gray-600 block">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ex : Bienvenue Segnon"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold font-sans text-gray-600 block">Adresse Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="votre.email@domaine.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                    />
                  </div>
                </div>

                {/* SIGN UP ONLY: Phone */}
                {patientMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold font-sans text-gray-600 block">Numéro de Téléphone (Bénin)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex : +229 97 00 00 00"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* NPI (Numéro Personnel d'Identification) - Always shown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold font-sans text-gray-600 block flex items-center justify-between">
                    <span>NPI (13 chiffres d'identification au Bénin)</span>
                    <span className="text-[10px] text-gray-400 font-normal italic">Obligatoire</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      maxLength={13}
                      pattern="\d{13}"
                      required
                      placeholder="Ex : 1097885544901"
                      value={patientNpi}
                      onChange={(e) => setPatientNpi(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold font-sans text-gray-600 block">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={patientPassword}
                      onChange={(e) => setPatientPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#059669] hover:bg-[#059669]/95 text-white text-xs font-bold font-sans rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {patientMode === 'signin' ? (
                    <>
                      <span>Se connecter à mon Espace Citoyen</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Créer mon compte citoyen</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB: HOSPITAL STAFF ACCES LOGIN */}
            {activeTab === 'hospital' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold font-sans block">
                    {hospitalMode === 'signin' ? "Portail Médical & Clinique" : "Créer un compte Hôpital"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHospitalMode(hospitalMode === 'signin' ? 'signup' : 'signin')}
                    className="text-xs font-bold text-[#059669] hover:underline cursor-pointer font-sans"
                  >
                    {hospitalMode === 'signin' ? "Créer un compte hôpital" : "Connexion Pro"}
                  </button>
                </div>

                {/* SIGN IN FORM FOR PROFESSIONAL */}
                {hospitalMode === 'signin' ? (
                  <form onSubmit={handleHospitalSubmit} className="space-y-4">
                    
                    {/* COMPTES DE TEST - HOPITAL */}
                    <div id="demo-hospital-accounts" className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Comptes d'essais Professionnels & Admin
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setHospitalId('chd-atlantique');
                              setHospitalEmail('dr.sossou@sante.bj');
                              setHospitalRole('doctor');
                              setHospitalPassword('123456');
                            }}
                            className="p-2 bg-white border border-gray-100 hover:border-slate-800 hover:bg-slate-50/20 text-left rounded-xl transition-all cursor-pointer space-y-0.5 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-800 font-sans group-hover:text-slate-900">Dr. J. Sossou</span>
                              <span className="text-[7px] bg-emerald-50 text-[#059669] px-1 py-0.5 rounded font-black uppercase">Médecin</span>
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setHospitalId('hz-calavi');
                              setHospitalEmail('sonia.gbaguidi@sante.bj');
                              setHospitalRole('admin');
                              setHospitalPassword('123456');
                            }}
                            className="p-2 bg-white border border-gray-100 hover:border-slate-800 hover:bg-slate-50/20 text-left rounded-xl transition-all cursor-pointer space-y-0.5 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-800 font-sans group-hover:text-slate-900">Sonia Gbaguidi</span>
                              <span className="text-[7px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded font-black uppercase">Facture</span>
                            </div>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setHospitalId('system-admin');
                            setHospitalEmail('admin@sante.bj');
                            setHospitalRole('admin');
                            setHospitalPassword('123456');
                          }}
                          className="p-2 bg-slate-900 border border-slate-950 text-white hover:bg-slate-950 text-left rounded-xl transition-all cursor-pointer space-y-0.5 flex items-center justify-between"
                        >
                          <span className="text-[11px] font-bold font-sans">Administrateur National</span>
                          <span className="text-[7px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase">Super Admin</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. Select Hospital */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold font-sans text-gray-600 block">Votre Établissement de Soins</label>
                      <select
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs font-sans font-semibold px-3 py-2.5 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      >
                        {verifiedHospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.type === 'public' ? 'Public' : 'Privé'})
                          </option>
                        ))}
                        <option value="system-admin">-- MINISTÈRE DE LA SANTÉ --</option>
                      </select>
                    </div>

                    {/* 2. Professional Role */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold font-sans text-gray-600 block">Votre Fonction / Rôle</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setHospitalRole('doctor')}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-sans font-bold text-center transition-all cursor-pointer ${
                            hospitalRole === 'doctor' ? 'border-[#059669] bg-emerald-50/50 text-[#059669]' : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          Médecin / Doc
                        </button>
                        <button
                          type="button"
                          onClick={() => setHospitalRole('nurse')}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-sans font-bold text-center transition-all cursor-pointer ${
                            hospitalRole === 'nurse' ? 'border-[#059669] bg-emerald-50/50 text-[#059669]' : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          Infirmier / Soins
                        </button>
                        <button
                          type="button"
                          onClick={() => setHospitalRole('admin')}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-sans font-bold text-center transition-all cursor-pointer ${
                            hospitalRole === 'admin' ? 'border-[#059669] bg-emerald-50/50 text-[#059669]' : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          Facturation / Adm
                        </button>
                      </div>
                    </div>

                    {/* 3. Professional Email / ID */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold font-sans text-gray-600 block">Identifiant ou Email Professionnel</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="Ex : docteur.kpadonou@hopital.bj"
                          value={hospitalEmail}
                          onChange={(e) => setHospitalEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                        />
                      </div>
                    </div>

                    {/* 4. Professional Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold font-sans text-gray-600 block">Code secret ou Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={hospitalPassword}
                          onChange={(e) => setHospitalPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold font-sans rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Accéder au Portail Clinique</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </button>
                  </form>
                ) : (
                  /* HOSPITAL ACCOUNT SIGNUP FORM */
                  <form onSubmit={handleHospitalSignup} className="space-y-3.5 text-left">
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2.5 items-start">
                      <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-[10px] text-amber-800 leading-relaxed font-medium font-sans">
                        <strong>Processus officiel :</strong> L'inscription d'un nouvel établissement de santé d'Abomey-Calavi est soumise à vérification. Une fois le formulaire validé, l'Administrateur National confirmera l'existence et l'accréditation du centre de soins avant d'activer votre accès de facturation.
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Nom de l'établissement</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex : Clinique de Calavi Centre"
                        value={signupHospitalName}
                        onChange={(e) => setSignupHospitalName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Type de structure</label>
                      <select
                        value={signupHospitalType}
                        onChange={(e) => setSignupHospitalType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      >
                        <option value="clinic">Clinique Médicale Privée</option>
                        <option value="public">Hôpital Public de Zone</option>
                        <option value="private">Hôpital Privé</option>
                        <option value="lab">Laboratoire Médical / Labo d'Analyses</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Adresse physique (Abomey-Calavi / Cotonou)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex : Face Marché central, Abomey-Calavi"
                        value={signupHospitalAddress}
                        onChange={(e) => setSignupHospitalAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 font-sans block mb-1">Téléphone de contact</label>
                        <input
                          type="tel"
                          required
                          placeholder="Ex : +229 97 00 00 00"
                          value={signupHospitalPhone}
                          onChange={(e) => setSignupHospitalPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 font-sans block mb-1">Horaires d'ouverture</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex : Ouvert 24h/24"
                          value={signupHospitalHours}
                          onChange={(e) => setSignupHospitalHours(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-1 space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans block">Identifiants de l'Administrateur local</span>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-600 font-sans block mb-1">E-mail professionnel administrateur</label>
                        <input
                          type="email"
                          required
                          placeholder="Ex : contact@espoir-calavi.bj"
                          value={signupHospitalEmail}
                          onChange={(e) => setSignupHospitalEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Créer un mot de passe de sécurité</label>
                        <input
                          type="password"
                          required
                          placeholder="Définir un code secret de connexion"
                          value={signupHospitalPassword}
                          onChange={(e) => setSignupHospitalPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#059669] hover:bg-[#059669]/95 text-white text-xs font-bold font-sans rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Inscrire l'Établissement & Créer Admin</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
