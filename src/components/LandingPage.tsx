import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, ShieldCheck, QrCode, Calendar, MessageSquare, 
  ChevronDown, ChevronUp, MapPin, Send, HelpCircle, 
  ArrowRight, BookOpen, AlertCircle, HeartPulse, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnterApp: (initialView: 'map' | 'wallet' | 'appointments') => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export default function LandingPage({ onEnterApp, isLoggedIn, onOpenAuth }: LandingPageProps) {
  // FAQs list
  const faqs = [
    {
      question: "Comment fonctionne le paiement par Réseau Lightning (Bitcoin) sur Santé+ ?",
      answer: "Santé+ Bénin intègre nativement le protocole de paiement de seconde couche Bitcoin (Lightning Network). Lors de l'édition d'une facture de soins ou de consultation, l'application génère une facture Lightning standard (lnbc...). Le paiement est instantané, sans frais bancaires prohibitifs, et immédiatement converti ou comptabilisé pour l'hôpital partenaire."
    },
    {
      question: "Pourquoi mes factures acquittées portent-elles un tampon officiel ?",
      answer: "Toute facture payée via le portefeuille ou par transaction Lightning reçoit instantanément un tampon officiel rouge '★ PAYÉ & CERTIFIÉ ★' émis sous l'égide du Ministère de la Santé du Bénin. Ce tampon certifie la régularité du paiement et l'authenticité de l'acte de soins enregistré."
    },
    {
      question: "Comment fonctionne la vérification par scan hors-ligne (offline) ?",
      answer: "Pour protéger votre vie privée, Santé+ Bénin privilégie la souveraineté des données. Aucune de vos informations personnelles sensibles ou médicales n'est hébergée en ligne sur le site web public. À la place, le QR Code généré contient vos informations décentralisées en clair. Le médecin ou l'autorité de santé scanne directement ce QR Code depuis votre écran pour charger les données de mobile à mobile, de façon 100% hors-ligne."
    },
    {
      question: "Puis-je prendre un rendez-vous sans choisir de médecin spécifique ?",
      answer: "Absolument. Lors de la prise de rendez-vous sur notre réseau, la sélection du Service médical (ex. Pédiatrie, Gynécologie, Médecine Générale) et de la Cause de la consultation est obligatoire. En revanche, le choix d'un médecin/docteur est facultatif. Si vous n'en sélectionnez aucun, l'hôpital affectera le médecin disponible lors de votre accueil."
    },
    {
      question: "Qu'est-ce que l'autorisation par signature Lightning Network ?",
      answer: "Pour qu'un établissement de santé accède à votre dossier de soins, Santé+ remplace les données biométriques (comme la reconnaissance faciale ou d'empreinte digitale) par une signature cryptographique. En cliquant sur le bouton de signature, votre clé privée liée au réseau Lightning valide instantanément l'autorisation d'accès. Ce processus est totalement transparent, visible et sécurisé."
    }
  ];

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: "Bonjour ! Je suis l'assistant de Sante Plus Bénin. Posez-moi vos questions sur les factures avec tampon PAYÉ, les signatures Lightning, les rendez-vous ou le scan offline des papiers." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Quick prompt questions
  const quickPrompts = [
    "Comment payer ma facture ?",
    "Docteur obligatoire pour un rdv ?",
    "Où sont stockés mes papiers ?",
    "Comment signer sans empreinte ?"
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSendChat = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Build history
      const history = chatMessages.slice(1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history })
      });

      if (!res.ok) throw new Error("Erreur de communication");
      const data = await res.json();

      setChatMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Désolé, j'ai rencontré un problème pour me connecter au serveur Santé+. Cependant, sachez que toutes vos factures payées affichent un tampon rouge officiel et que vous pouvez signer vos accès de dossier avec votre clé cryptographique Lightning Network." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-x-hidden font-sans selection:bg-[#00D26A] selection:text-white">
      {/* Decorative colored spots */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-yellow-100/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 md:pt-16 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center z-10">
        <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/60 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sante Plus • Souveraineté & Fluidité</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display text-slate-900 tracking-tight leading-tight lg:leading-none">
            La santé numérique béninoise, <span className="text-[#00D26A] relative">100% sécurisée</span> et décentralisée.
          </h1>

          <p className="text-sm sm:text-md md:text-lg text-slate-600 font-sans leading-relaxed max-w-xl mx-auto lg:mx-0">
            Simplifiez votre parcours de soins avec Sante Plus. Réglez vos factures de soins instantanément, signez vos consentements cryptographiques via le Réseau Lightning, et gérez vos documents médicaux de manière entièrement hors-ligne.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button
              onClick={() => onEnterApp('map')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-[#00D26A] hover:bg-[#00D26A]/90 text-white font-extrabold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-md cursor-pointer"
            >
              <span>Accéder à la carte & Prendre RDV</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => onEnterApp('wallet')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-100 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm sm:text-md cursor-pointer"
            >
              <span>Consulter mes Factures</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/60">
            <div>
              <span className="block text-2xl font-black text-gray-900">0%</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Données stockées en ligne</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">⚡ Lightning</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Paiements Instantanés</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-emerald-600">Certifié</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Par le Ministère de la Santé</span>
            </div>
          </div>
        </div>

        {/* Feature Grid Banner Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl"></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-md text-gray-900">Signature Lightning (LN Sign)</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Autorisez l'accès à votre dossier médical sans scan de visage ou empreinte. Une simple confirmation cryptographique sécurisée et parfaitement claire.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-md text-gray-900">Vérification Exclusive par Scan</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Aucune donnée personnelle n'est envoyée ou exposée en ligne. Le transfert d'informations se fait uniquement de mobile à mobile par scan direct du QR code sécurisé.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl"></div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-md text-gray-900">Rendez-vous Simplifié</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Indiquez obligatoirement le service médical recherché et le motif de votre venue. Le choix du médecin reste optionnel pour plus de flexibilité.
            </p>
          </div>
        </div>
      </header>

      {/* FAQ Accordion Section */}
      <section className="w-full bg-white border-y border-slate-100 py-16 md:py-20 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 md:space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#00D26A] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide & FAQ Officielle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-slate-900 tracking-tight">
              Tout savoir sur le système Sante Plus
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-sans">
              Des réponses claires pour comprendre le fonctionnement des paiements Lightning, de la protection de vos données médicales et de la signature cryptographique.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/50 hover:bg-slate-50"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4 px-5 sm:py-5 sm:px-6 flex items-center justify-between text-left font-sans font-extrabold text-slate-900 text-xs sm:text-sm gap-4 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#00D26A] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed border-t border-slate-100/50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-800 space-y-1">
              <span className="font-extrabold block">Sécurité des Patients :</span>
              <p>Conformément aux exigences réglementaires béninoises, les actes médicaux sont signés cryptographiquement et certifiés par un tampon officiel. Pour toute urgence critique, veuillez vous rendre directement à l'Hôpital de Zone d'Abomey-Calavi ou au CHD de référence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12 text-center text-[11px] text-gray-400 font-sans mt-auto border-t border-slate-100">
        <p>© 2026 Sante Plus. Ministère de la Santé du Bénin — Tous droits réservés.</p>
        <p className="mt-1">Réseau décentralisé de paiement Lightning Network & Identité Cryptographique NPI Bénin.</p>
      </footer>

      {/* CHATBOT BUTTON AND PANEL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        {/* Chatbot Window */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-[340px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4"
            >
              {/* Chat Header */}
              <div className="p-4 bg-[#1C1C1E] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00D26A] flex items-center justify-center text-white">
                    <MessageSquare className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans">Assistant Virtuel Sante Plus</h4>
                    <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      En ligne • Réponses instantanées
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-all text-xs font-bold px-2 py-1"
                >
                  Fermer
                </button>
              </div>

              {/* Chat messages thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-sans ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-tr-xs' 
                        : 'bg-white text-gray-800 border border-gray-100 shadow-3xs rounded-tl-xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-400 border border-gray-100 shadow-3xs rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-1.5 font-sans">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts Container */}
              <div className="px-4 py-2 bg-white border-t border-gray-50 flex flex-wrap gap-1.5">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(p)}
                    className="text-[10px] font-sans font-medium text-gray-600 bg-slate-50 border border-gray-200/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-lg px-2 py-1 transition-all cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat(chatInput);
                }}
                className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Posez une question..."
                  className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Chat Trigger Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-12 h-12 bg-[#1C1C1E] hover:bg-black text-white rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center relative"
          title="Chat Assistant"
        >
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D26A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D26A]"></span>
          </span>
          <MessageSquare className="w-5 h-5 fill-white" />
        </button>
      </div>
    </div>
  );
}
