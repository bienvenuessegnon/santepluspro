import React, { useState } from 'react';
import { Patient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Phone, ShieldCheck, HeartPulse, 
  Activity, ClipboardList, Check, AlertCircle, Loader2, Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
  isOffline?: boolean;
}

export default function UserProfileModal({ isOpen, onClose, patient, onUpdatePatient, isOffline = false }: UserProfileModalProps) {
  const [name, setName] = useState(patient.name || '');
  const [phone, setPhone] = useState(patient.phone || '');
  const [npi, setNpi] = useState(patient.npi || '');
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || '');
  const [recurringDiseases, setRecurringDiseases] = useState(patient.recurringDiseases || '');
  const [antecedents, setAntecedents] = useState(patient.antecedents || '');
  const [allergies, setAllergies] = useState(patient.allergies || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const offlineUpdatedPatient = {
      ...patient,
      name,
      phone,
      npi,
      bloodGroup,
      recurringDiseases,
      antecedents,
      allergies
    };

    if (isOffline) {
      try {
        // Direct local save to cache
        localStorage.setItem(`sante_cache_patient_profile_${patient.email.toLowerCase().trim()}`, JSON.stringify(offlineUpdatedPatient));
        
        // Also update any other cache representation of this profile if needed
        onUpdatePatient(offlineUpdatedPatient);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3500);
      } catch (err: any) {
        console.error(err);
        setError("Erreur de sauvegarde locale dans le cache.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const response = await fetch(`/api/wallet/patients/${encodeURIComponent(patient.email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          npi,
          bloodGroup,
          recurringDiseases,
          antecedents,
          allergies
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de mettre à jour le profil');
      }

      const updatedPatient = await response.json();
      onUpdatePatient(updatedPatient);
      
      // Update cache
      localStorage.setItem(`sante_cache_patient_profile_${patient.email.toLowerCase().trim()}`, JSON.stringify(updatedPatient));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
          id="user-profile-modal"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-[#059669]/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#059669]/10 rounded-2xl text-[#059669]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black font-sans text-gray-900 tracking-tight">Souveraineté Numérique & Santé</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Dossier médical décentralisé et auto-géré du Bénin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Notification banner */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-sans leading-relaxed">
                Conformément au code d'éthique de l'<strong>ASIN Bénin</strong>, ces informations médicales sont confidentielles. Elles sont rattachées de manière sécurisée à votre identifiant national unique (NPI) et ne sont partagées avec les hôpitaux agréés que sous votre consentement explicite.
              </p>
            </div>

            {/* Error or Success states */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3 text-xs font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500 border border-emerald-600 text-white rounded-2xl flex items-start gap-3 text-xs font-sans animate-bounce shadow-md">
                <Check className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-extrabold text-[13px]">Modifications enregistrées !</p>
                  <p className="opacity-90 mt-0.5">Votre carnet de santé numérique a été mis à jour avec succès sur l'infrastructure d'état.</p>
                </div>
              </div>
            )}

            {/* Section 1: Informations Personnelles d'État */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <User className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider font-sans">Identité Officielle Citoyenne</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nom Complet</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Bienvenue Segnon"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Email (Read-only as it serves as index key) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adresse Email (Identifiant National)</label>
                  <input
                    type="email"
                    disabled
                    value={patient.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-mono text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Numéro de Téléphone (Bénin)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +229 97 88 55 44"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* NPI (National Patient ID / Numéro Personnel d'Identification) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Numéro Personnel d'Identification (NPI)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={npi}
                      onChange={(e) => setNpi(e.target.value)}
                      placeholder="NPI à 13 chiffres de l'ANIP"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-mono text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all"
                    />
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Health Info (Groupe Sanguin, Maladies, Antécédents, Allergies) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider font-sans">Profil Médical & Urgences</h4>
              </div>

              {/* Blood Group Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Groupe Sanguin</label>
                <div className="relative">
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Non spécifié --</option>
                    <option value="A+">A Positif (A+)</option>
                    <option value="A-">A Négatif (A-)</option>
                    <option value="B+">B Positif (B+)</option>
                    <option value="B-">B Négatif (B-)</option>
                    <option value="AB+">AB Positif (AB+)</option>
                    <option value="AB-">AB Négatif (AB-)</option>
                    <option value="O+">O Positif (O+)</option>
                    <option value="O-">O Négatif (O-)</option>
                  </select>
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs font-bold">▼</div>
                </div>
              </div>

              {/* Recurring Diseases */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maladies Récurrentes (Pathologies courantes ou chroniques)</label>
                <div className="relative">
                  <textarea
                    value={recurringDiseases}
                    onChange={(e) => setRecurringDiseases(e.target.value)}
                    placeholder="Ex: Paludisme saisonnier récurrent, crises d'asthme légères en cas d'harmattan..."
                    rows={2}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all resize-none"
                  />
                  <Activity className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Medical History / Antecedents */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Antécédents Médicaux, Chirurgicaux & Familiaux</label>
                <div className="relative">
                  <textarea
                    value={antecedents}
                    onChange={(e) => setAntecedents(e.target.value)}
                    placeholder="Ex: Chirurgie appendicectomie en 2021, antécédents d'hypertension artérielle familiale..."
                    rows={2}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all resize-none"
                  />
                  <ClipboardList className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Allergies & Plus */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Allergies, Intolérances et Notes supplémentaires ("Et plus")</label>
                <div className="relative">
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Ex: Allergie sévère à la Pénicilline, intolérance au lactose, asthme déclenché par la poussière..."
                    rows={2}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl font-sans text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all resize-none"
                  />
                  <AlertCircle className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

          </form>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold font-sans text-xs transition-all cursor-pointer text-center"
            >
              Fermer
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-[#059669] hover:bg-[#059669]/90 disabled:bg-[#059669]/60 text-white rounded-xl font-bold font-sans text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Mettre à jour mon profil</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
