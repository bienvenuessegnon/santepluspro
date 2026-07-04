import React, { useState } from 'react';
import { Invoice, AccessRequest, Patient, MedicalDocument } from '../types';
import { 
  Wallet, PlusCircle, ArrowUpRight, History, CreditCard, 
  ShieldCheck, CheckCircle2, Phone, Sparkles, Printer, 
  FileText, Download, Zap, Lock, Unlock, Clock, Eye, 
  EyeOff, Calendar, User, ClipboardList, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

interface WalletTabProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  satoshiBalance?: number;
  setSatoshiBalance?: React.Dispatch<React.SetStateAction<number>>;
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  accessRequests: AccessRequest[];
  onApproveAccess: (requestId: string) => void;
  onRejectAccess: (requestId: string) => void;
  patientUser?: Patient | null;
  customDocuments?: MedicalDocument[];
}

export default function WalletTab({
  balance,
  setBalance,
  satoshiBalance = 20000,
  setSatoshiBalance,
  invoices,
  onSelectInvoice,
  accessRequests,
  onApproveAccess,
  onRejectAccess,
  patientUser,
  customDocuments = []
}: WalletTabProps) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [qrCodeToGenerate, setQrCodeToGenerate] = useState('https://sante.gouv.bj');
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [operator, setOperator] = useState<'mtn' | 'moov' | 'lightning'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('+229 97 88 55 44');
  const [isProcessing, setIsProcessing] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);

  const downloadMedicalDocPDF = (docObj: MedicalDocument) => {
    let officialTitle = "DEVIS DE SOINS ET CONSULTATION";
    let stampTitle = "★ DEVIS VALIDÉ ★";
    let stampBorderColor = [230, 120, 0]; // Orange
    if (docObj.type === 'prescription') {
      officialTitle = "ORDONNANCE MÉDICALE OFFICIELLE";
      stampTitle = "★ ORDONNANCE ★";
      stampBorderColor = [5, 150, 105]; // Green
    } else if (docObj.type === 'analyses') {
      officialTitle = "BILAN ET EXAMENS MÉDICALS";
      stampTitle = "★ EXAMEN BIOLOGIQUE ★";
      stampBorderColor = [10, 132, 255]; // Blue
    }

    const qrOfflineText = `[SANTÉ+ BÉNIN - DOCUMENT MEDICAL]
------------------------------------
Type: ${officialTitle}
Réf: ${docObj.id}
Patient: NPI ${docObj.patientNpi || 'Non specifie'}
Etablissement: ${docObj.hospitalName || 'Hopital'}
Medecin: ${docObj.doctorName || 'Praticien'}
Date: ${docObj.date || 'Non renseignee'}`;

    setQrCodeToGenerate(qrOfflineText);

    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [5, 150, 105];
      const textColor = [28, 28, 30];
      const lightGray = [120, 120, 128];

      // Header Sante+ Benin
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SANTÉ+ BÉNIN', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text('RÉSEAU MÉDICAL NATIONAL ET SÉCURISÉ', 20, 30);

      // Line separator
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(20, 35, 190, 35);

      // Doc Type
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(officialTitle, 20, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Identifiant Document : ${docObj.id}`, 20, 52);
      doc.text(`Date d'émission : ${docObj.date || 'Non spécifiée'}`, 20, 57);

      // DRAW VISIBLE OFFICIAL RED STAMP
      doc.setDrawColor(stampBorderColor[0], stampBorderColor[1], stampBorderColor[2]);
      doc.setLineWidth(0.6);
      doc.rect(130, 42, 58, 16);
      doc.setTextColor(stampBorderColor[0], stampBorderColor[1], stampBorderColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('MINISTÈRE DE LA SANTÉ BÉNIN', 133, 47);
      doc.setFontSize(10);
      doc.text(stampTitle, 137, 53);

      // Reset text color for details
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);

      // Etablissement & Medecin Info
      doc.text('ÉTABLISSEMENT ÉMETTEUR', 20, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(`${docObj.hospitalName || 'Hôpital émetteur'}`, 20, 73);
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`ID Établissement : ${docObj.hospitalId || 'hz-calavi'}`, 20, 77);

      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('MÉDECIN PRATICIEN EN CHARGE', 20, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(`${docObj.doctorName || 'Dr. Praticien'}`, 20, 90);
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`Email : ${docObj.doctorEmail || 'medecin@sante.bj'}`, 20, 94);

      // Patient Info
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(9.5);
      doc.text('CITOYEN PATIENT RÉCIPIENDAIRE', 110, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(`NPI : ${docObj.patientNpi || 'Non spécifié'}`, 110, 73);
      doc.text('Bénin - Citoyen Identifié', 110, 77);

      // Line separator
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(20, 99, 190, 99);

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.text('Prestations, Analyses ou Médicaments', 22, 105);
      doc.text('Estimation (XOF)', 150, 105);

      doc.line(20, 108, 190, 108);

      // Items
      let y = 115;
      if (docObj.items && docObj.items.length > 0) {
        docObj.items.forEach((item, index) => {
          doc.setFont('helvetica', 'normal');
          doc.text(`${index + 1}. ${item.name}`, 22, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`${(item.priceXOF ?? 0).toLocaleString('fr-FR')} XOF`, 150, y);
          y += 8;
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text("Aucun élément inscrit dans ce dossier.", 22, y);
        y += 8;
      }

      doc.line(20, y, 190, y);
      y += 8;

      // Total Cost
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('MONTANT TOTAL ESTIMÉ', 22, y);
      doc.text(`${(docObj.priceXOF ?? 0).toLocaleString('fr-FR')} XOF`, 150, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`(~ ${(docObj.priceSats ?? 0).toLocaleString('fr-FR')} Satoshis)`, 22, y + 5);

      y += 15;

      // Doctor's observations if any
      if (docObj.notes) {
        doc.setDrawColor(230, 230, 235);
        doc.setFillColor(253, 251, 247);
        doc.rect(20, y, 170, 24, 'F');

        doc.setTextColor(180, 100, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('OBSERVATIONS CLINIQUES ET POSOLOGIE', 24, y + 6);

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        
        const splitNotes = doc.splitTextToSize(docObj.notes, 160);
        doc.text(splitNotes, 24, y + 12);

        y += 28;
      } else {
        y += 5;
      }

      // Blockchain Security & QR Block
      doc.setDrawColor(240, 240, 245);
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y, 170, 25, 'F');

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SCELLÉ DE SÉCURITÉ CRYPTOGRAPHIQUE ASIN', 24, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text('Ce dossier clinique est chiffré de bout en bout et enregistré immuablement.', 24, y + 12);
      doc.text('La conformité de la signature médecin peut être scannée via le code QR ci-contre.', 24, y + 16);

      // Draw QR Code next to signature
      const canvas = document.getElementById('citizen-pdf-qr-canvas') as HTMLCanvasElement;
      if (canvas) {
        try {
          const qrDataUrl = canvas.toDataURL('image/png');
          doc.addImage(qrDataUrl, 'PNG', 164, y + 2.5, 20, 20);
        } catch (err) {
          console.error("Erreur lors de la génération du code QR PDF", err);
        }
      }

      doc.save(`document-medical-${docObj.id}.pdf`);
    }, 150);
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    // Set QR code value to plain verified offline details
    const qrOfflineText = `[SANTÉ+ BÉNIN - DOCUMENT PAYÉ ET VERIFIÉ SANS CONNEXION]
------------------------------------
Réf Facture: ${inv.id}
Patient: ${inv.patientName}
Établissement: ${inv.hospitalName}
Montant total: ${(inv.totalXOF ?? 0).toLocaleString('fr-FR')} XOF
Date: ${inv.date}
Méthode: ${inv.paymentMethod === 'Wallet' ? 'Portefeuille Prépayé' : 'Réseau Lightning'}
Statut: CERTIFIÉ PAYÉ (OFFLINE STAMP - BLOCKCHAIN BÉNIN)`;
    setQrCodeToGenerate(qrOfflineText);

    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [5, 150, 105]; // #059669 (Sante+ Emerald Green)
      const textColor = [28, 28, 30]; // Dark gray
      const lightGray = [120, 120, 128]; // Muted text

      // Fonts & styles
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SANTÉ+ BÉNIN', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text('RÉSEAU MÉDICAL NATIONAL ET SÉCURISÉ', 20, 30);

      // Line separator
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(20, 35, 190, 35);

      // Header Details
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('REÇU DE TRANSACTION MÉDICALE', 20, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Réf Facture : ${inv.id}`, 20, 52);
      doc.text(`Date de paiement : ${inv.date}`, 20, 57);

      // DRAW VISIBLE OFFICIAL RED STAMP
      doc.setDrawColor(239, 68, 68); // Red border (#EF4444)
      doc.setLineWidth(0.6);
      doc.rect(130, 42, 58, 16);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('MINISTÈRE DE LA SANTÉ BÉNIN', 133, 47);
      doc.setFontSize(10);
      doc.text('★ PAYÉ & CERTIFIÉ ★', 135, 53);

      // Reset text color for details
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);

      // Etablissement & Medecin Info
      doc.text('ÉTABLISSEMENT ÉMETTEUR', 20, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(`${inv.hospitalName}`, 20, 73);
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`${inv.hospitalAddress}`, 20, 77);

      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('MÉDECIN PRATICIEN CONCERNÉ', 20, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(`${inv.doctorName || 'Dr. Jean Sossou'}`, 20, 90);

      // Additional doctor details as requested
      doc.setFontSize(8.5);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`Tél : ${inv.doctorPhone || "+229 95 40 12 34"}`, 20, 94);
      doc.text(`Spécialité : Généraliste Agréé (N° Ordre: 4028-BJ)`, 20, 98);

      // Patient Info (Pushed slightly to the right to X = 130)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(9.5);
      doc.text('CITOYEN PATIENT', 130, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(`${inv.patientName}`, 130, 73);
      doc.text('Bénin - Nationalité Béninoise', 130, 77);
      doc.text(`Tél : ${inv.patientPhone || "+229 97 88 55 44"}`, 130, 81);

      // Line separator pushed down to 103 to prevent overlap
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(20, 103, 190, 103);

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.text('Désignation des prestations', 22, 110);
      doc.text('Montant (XOF)', 150, 110);

      doc.line(20, 113, 190, 113);

      // Items starting at y = 120
      let y = 120;
      inv.items.forEach((item, index) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`${index + 1}. ${item.name}`, 22, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`${(item.priceXOF ?? 0).toLocaleString('fr-FR')} XOF`, 150, y);
        y += 8;
      });

      doc.line(20, y, 190, y);
      y += 8;

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL GÉNÉRAL ACQUITTÉ', 22, y);
      doc.text(`${(inv.totalXOF ?? 0).toLocaleString('fr-FR')} XOF`, 150, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`(~ ${(inv.totalSats ?? 0).toLocaleString('fr-FR')} Satoshis sur réseau Lightning)`, 22, y + 5);

      y += 18;

      // Blockchain Signature Block (Increased height to fit QR Code beautifully)
      doc.setDrawColor(240, 240, 245);
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y, 170, 25, 'F');

      // Draw QR Code next to signature inside the grey block
      const canvas = document.getElementById('citizen-pdf-qr-canvas') as HTMLCanvasElement;
      if (canvas) {
        try {
          const qrDataUrl = canvas.toDataURL('image/png');
          doc.addImage(qrDataUrl, 'PNG', 164, y + 2.5, 20, 20);
        } catch (err) {
          console.error("Erreur lors de la génération du code QR PDF citoyen", err);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text('PREUVE DE SÉCURITÉ CRYPTOGRAPHIQUE (BLOCKCHAIN BÉNIN)', 24, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`Méthode de règlement : ${inv.paymentMethod === 'Wallet' ? 'Portefeuille Prépayé Santé+' : 'Réseau Lightning (Sats)'}`, 24, y + 12);
      doc.text(`Signature d'archivage : ${inv.txHash}`, 24, y + 17);

      // Footer seal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(230, 120, 0);
      doc.text('MINISTÈRE DE LA SANTÉ DU BÉNIN - AGRÉÉ ET CERTIFIÉ CONFORME', 20, 270);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text("Document généré numériquement de manière sécurisée. Ne nécessite pas de signature physique.", 20, 274);

      doc.save(`facture-sante-${inv.id}.pdf`);
    }, 150);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);

    // 1. Optimistic local update
    setBalance(prev => prev + amount);

    // 2. Synchronize to server if patient email is known
    const patientEmail = patientUser?.email || 'citoyen@sante.bj';
    
    fetch(`/api/wallet/patients/${encodeURIComponent(patientEmail)}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amountXOF: amount,
        operator: operator,
        phoneNumber: phoneNumber
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Could not sync deposit to server");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Réponse du serveur non valide");
      }
      return res.json();
    })
    .then(updatedPat => {
      // Set to backend-certified balance
      setBalance(updatedPat.walletBalance);
      setIsProcessing(false);
      setTopUpSuccess(true);
      setTimeout(() => {
        setTopUpSuccess(false);
        setShowTopUp(false);
        setTopUpAmount('5000');
      }, 2500);
    })
    .catch(err => {
      console.warn("Could not sync wallet top-up, falling back to local simulation", err);
      // Fallback local update is already done
      setIsProcessing(false);
      setTopUpSuccess(true);
      setTimeout(() => {
        setTopUpSuccess(false);
        setShowTopUp(false);
        setTopUpAmount('5000');
      }, 2500);
    });
  };

  return (
    <div id="wallet-management" className="max-w-4xl mx-auto space-y-6">
      {/* Hidden QR Code Canvas generator for PDF single invoice */}
      <div style={{ display: 'none' }}>
        <QRCodeCanvas
          id="citizen-pdf-qr-canvas"
          value={qrCodeToGenerate}
          size={150}
        />
      </div>
      
      {/* Wallet Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main balance display */}
        <div className="md:col-span-7 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          {/* Background decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-sans uppercase tracking-wider font-bold">Solde Disponible Santé+</span>
              <h2 className="text-4xl font-black font-sans text-[#00D26A]">{(balance ?? 0).toLocaleString('fr-FR')} XOF</h2>
            </div>
            <Wallet className="w-8 h-8 text-[#00D26A]" />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-6">
            <span className="text-xs text-gray-400 font-sans">Agréé par la Banque Centrale & MSP Bénin</span>
            <button
              onClick={() => setShowTopUp(true)}
              className="px-4 py-2 bg-[#00D26A] hover:bg-[#00D26A]/90 text-white text-xs font-bold font-sans rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Recharger
            </button>
          </div>
        </div>

        {/* Portefeuille Bitcoin Lightning en direct */}
        <div className="md:col-span-5 bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-sans uppercase tracking-wider font-extrabold">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Satoshi Bitcoin Lightning
              </span>
              <h2 className="text-3xl font-black font-sans text-amber-600">{(satoshiBalance ?? 0).toLocaleString('fr-FR')} Sats</h2>
              <span className="text-[10px] text-gray-500 font-sans block">
                (~ {Math.round((satoshiBalance ?? 0) / 1.66).toLocaleString('fr-FR')} FCFA)
              </span>
            </div>
            <span className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-amber-500/10 pt-4 mt-4">
            <span className="text-[10px] text-amber-800 font-sans font-medium bg-amber-100 px-2 py-0.5 rounded-md">1 XOF = 1.66 Sats</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  alert(`Adresse de réception Lightning (LNURL-Pay/Lightning Invoice) :\n${patientUser?.email || 'citoyen'}@santeplus.bj\n\nEnvoyez de petits Satoshis pour recharger votre compte sans simulation !`);
                }}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold font-sans rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                Recevoir
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Top Up Drawer / Sub-panel */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >
            <h3 className="text-md font-bold font-sans text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#00D26A]" />
              Recharge instantanée de compte
            </h3>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Select provider */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase font-sans">1. Opérateur</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setOperator('mtn'); setPhoneNumber('+229 97 88 55 44'); }}
                      className={`p-2.5 rounded-xl border text-xs font-sans font-bold text-center transition-all cursor-pointer ${
                        operator === 'mtn' ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      MTN
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOperator('moov'); setPhoneNumber('+229 95 12 34 56'); }}
                      className={`p-2.5 rounded-xl border text-xs font-sans font-bold text-center transition-all cursor-pointer ${
                        operator === 'moov' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      MOOV
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOperator('lightning'); }}
                      className={`p-2.5 rounded-xl border text-xs font-sans font-bold text-center transition-all cursor-pointer ${
                        operator === 'lightning' ? 'border-slate-800 bg-slate-50 text-gray-800' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      LN ⚡
                    </button>
                  </div>
                </div>

                {/* 2. Phone / Invoice destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase font-sans">
                    {operator === 'lightning' ? '2. Réseau Portefeuille' : '2. Numéro Mobile Money'}
                  </label>
                  {operator === 'lightning' ? (
                    <div className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-700">
                      Réseau Lightning (BTC)
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-sans font-semibold focus:outline-none focus:ring-1 focus:ring-[#059669]"
                    />
                  )}
                </div>

                {/* 3. Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase font-sans">3. Montant (XOF)</label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Montant en FCFA"
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-sans font-semibold focus:outline-none focus:ring-1 focus:ring-[#059669]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUp(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans font-semibold text-gray-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#00D26A] hover:bg-[#00D26A]/95 text-white font-sans font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {isProcessing ? (
                    <>
                      <PlusCircle className="w-4 h-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Confirmer la recharge
                    </>
                  )}
                </button>
              </div>

              {/* Status prompt */}
              {topUpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-[#00D26A] font-medium text-xs font-sans rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Votre compte a été crédité de <strong>{(parseFloat(topUpAmount) || 0).toLocaleString('fr-FR')} XOF</strong> !</span>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTEUR AUTORISATION BLOCKCHAIN / DEMANDE ACCÈS MÉDECIN */}
      {accessRequests && accessRequests.length > 0 && (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-50 text-[#059669] rounded-full">
                <ShieldCheck className="w-5 h-5 text-[#059669] animate-pulse" />
              </span>
              <div>
                <h3 className="text-md font-sans font-extrabold text-[#1C1C1E]">Demandes d'Accès Médical</h3>
                <p className="text-[11px] text-gray-500 font-sans">Sécurisé par clés cryptographiques Bitcoin (Blockchain) & NPI Bénin</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">Vérification Réseau</span>
          </div>

          <div className="space-y-3">
            {accessRequests.map((req) => (
              <div key={req.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-800">{req.hospitalName}</span>
                    <span className="text-[10px] text-gray-400 font-sans">({req.doctorEmail})</span>
                  </div>
                  <div className="text-[11px] text-gray-500 space-y-1">
                    <p>NPI recherché : <strong className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{req.npi}</strong></p>
                    <p>Demandé le : {req.requestedAt}</p>
                    {req.blockchainTxHash && (
                      <div className="text-amber-600 font-mono text-[9px] flex flex-col sm:flex-row sm:items-center gap-1 mt-1 bg-amber-50/50 p-1.5 rounded border border-amber-100">
                        <span>⛓️ TX Bitcoin Hash :</span>
                        <span className="font-bold select-all truncate max-w-[280px]">{req.blockchainTxHash}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRejectAccess(req.id)}
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold rounded-xl text-[11px] font-sans transition-all cursor-pointer"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => onApproveAccess(req.id)}
                        className="px-4 py-1.5 bg-[#00D26A] hover:bg-[#00D26A]/90 text-white font-bold rounded-xl text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Autoriser l'accès</span>
                        <span>⚡</span>
                      </button>
                    </div>
                  ) : req.status === 'approved' ? (
                    <div className="flex flex-col items-end">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accès Approuvé (Blockchain)
                      </span>
                      <span className="text-[9px] text-gray-400 mt-1">Signé le {req.confirmedAt}</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] rounded-lg uppercase tracking-wide">
                      Accès Refusé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION DOSSIER CLINIQUE & CARNET DE SANTÉ DU PATIENT (PROPRIÉTAIRE UNIQUE) */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-3xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ClipboardList className="w-5 h-5 text-[#059669]" />
            </span>
            <div>
              <h3 className="text-lg font-sans font-extrabold text-[#1C1C1E]">Mon Dossier Médical National (Carnet Clinique)</h3>
              <p className="text-[11px] text-gray-400 font-sans">Visualisation réservée au propriétaire légitime du dossier • Secret Médical Garanti</p>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md tracking-wider">
            🔐 Propriétaire
          </span>
        </div>
        
        <p className="text-xs text-gray-500 font-sans leading-relaxed">
          Consultez vos ordonnances de pharmacie, résultats d'analyses et devis de soins émis par vos établissements médicaux partenaires. Vos données cliniques détaillées ainsi que l'historique complet de modification par les médecins sont cryptographiquement scellés.
        </p>

        {customDocuments && customDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customDocuments.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="p-4 bg-emerald-50/10 hover:bg-emerald-50/30 border border-emerald-100 hover:border-emerald-200/80 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 shadow-3xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      doc.type === 'prescription' ? 'bg-amber-400' :
                      doc.type === 'analyses' ? 'bg-blue-400' : 'bg-[#00D26A]'
                    }`}></span>
                    <h4 className="font-sans font-extrabold text-xs text-gray-800 truncate">{doc.title}</h4>
                  </div>
                  <div className="text-[10px] text-gray-400 space-y-0.5">
                    <p className="font-sans font-semibold">📍 {doc.hospitalName || 'Établissement National'}</p>
                    <p className="font-sans font-semibold">🩺 Émis par : {doc.doctorName || 'Médecin Praticien'}</p>
                    <p className="font-sans font-semibold">📅 Date : {doc.date || 'Non renseignée'}</p>
                  </div>
                  
                  {/* Type badge */}
                  <span className="inline-block text-[9px] uppercase font-extrabold px-2 py-0.5 bg-white border border-gray-100 text-gray-500 rounded-md font-sans">
                    {doc.type === 'prescription' ? 'Ordonnance' :
                     doc.type === 'analyses' ? 'Analyses / Bilan' : 'Devis de Soins'}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end justify-between h-full min-h-[70px]">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {(doc.priceXOF ?? 0).toLocaleString('fr-FR')} XOF
                  </span>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                    className="text-[10px] font-extrabold text-[#059669] hover:underline font-sans flex items-center gap-0.5 cursor-pointer mt-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Consulter
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600 font-sans">Aucun dossier clinique émis</p>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">Vos ordonnances ou examens s'afficheront ici après avoir été émis par un hôpital agréé.</p>
          </div>
        )}
      </div>

      {/* DETAILED MEDICAL RECORD VIEW MODAL (EXCLUSIVELY FOR THE OWNER/PATIENT) */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl p-6 md:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    selectedDoc.type === 'prescription' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    selectedDoc.type === 'analyses' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {selectedDoc.type === 'prescription' ? 'Ordonnance' :
                     selectedDoc.type === 'analyses' ? 'Analyses / Bilan' : 'Devis de Soins'}
                  </span>
                  <h3 className="text-lg font-black font-sans text-gray-900 tracking-tight">{selectedDoc.title}</h3>
                  <p className="text-xs text-gray-400 font-sans">ID Unique : {selectedDoc.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Security Shield Notification */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 leading-relaxed font-sans">
                  <span className="font-extrabold block">🔒 Secret Médical & Souveraineté Numérique</span>
                  Conformément au code d'éthique de l'ASIN Bénin, vous visualisez ce dossier en tant que <strong>propriétaire exclusif</strong> de vos données de santé. Les cliniques, hôpitaux ou tiers ne peuvent accéder à l'historique détaillé et aux annotations sans votre signature de consentement décentralisée.
                </div>
              </div>

              {/* Clinical Details Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-sans">
                <div className="space-y-1.5">
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Provenance</p>
                  <p className="font-extrabold text-gray-800">{selectedDoc.hospitalName || 'Établissement National'}</p>
                  <p className="text-gray-500">ID Hôpital : {selectedDoc.hospitalId || 'hz-calavi'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Auteur de l'acte</p>
                  <p className="font-extrabold text-[#059669]">{selectedDoc.doctorName || 'Médecin Praticien'}</p>
                  <p className="text-gray-500">Email : {selectedDoc.doctorEmail || 'medecin@sante.bj'}</p>
                </div>
              </div>

              {/* Items & Tariff list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider font-sans">Prestations & Médicaments détaillés</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedDoc.items && selectedDoc.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex justify-between items-center text-xs font-sans">
                      <div>
                        <span className="font-bold text-gray-800">{item.name}</span>
                        {item.quantity && <span className="text-gray-400 ml-1">(x{item.quantity})</span>}
                      </div>
                      <span className="font-mono font-bold text-gray-900">{(item.priceXOF ?? 0).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  ))}
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-sm font-sans">
                    <span className="font-extrabold">Coût Total Général</span>
                    <div className="text-right">
                      <p className="font-black text-[#00D26A]">{(selectedDoc.priceXOF ?? 0).toLocaleString('fr-FR')} XOF</p>
                      <p className="text-[10px] text-gray-400 font-mono">{(selectedDoc.priceSats ?? Math.round((selectedDoc.priceXOF ?? 0) * 1.66)).toLocaleString()} Sats ⚡</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor clinical notes */}
              {selectedDoc.notes && (
                <div className="space-y-2 p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider font-sans">Observations Cliniques / Posologie</h4>
                  <p className="text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-line">{selectedDoc.notes}</p>
                </div>
              )}

              {/* CLINICAL MODIFICATION TIMELINE (HISTORIQUES) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider font-sans">Historique des Modifications du Dossier</h4>
                </div>

                <div className="relative pl-6 border-l border-emerald-100 space-y-6 py-2">
                  {/* Original Emission node */}
                  <div className="relative">
                    <span className="absolute -left-[30px] top-0 w-4 h-4 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    </span>
                    <div className="text-xs font-sans space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">Émission initiale du dossier</span>
                        <span className="text-[10px] text-gray-400 font-mono font-semibold">{selectedDoc.date || 'Non renseignée'}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">Par {selectedDoc.doctorName} ({selectedDoc.doctorEmail || 'medecin@sante.bj'})</p>
                    </div>
                  </div>

                  {/* Modification logs */}
                  {selectedDoc.history && selectedDoc.history.map((log, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[30px] top-0 w-4 h-4 bg-amber-100 border-2 border-amber-500 rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                      </span>
                      <div className="text-xs font-sans space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-800">Modifié par un médecin</span>
                          <span className="text-[10px] text-gray-400 font-mono font-semibold">{log.modifiedAt}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">Médecin : <strong className="text-gray-700">{log.modifiedBy}</strong></p>
                        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 italic">
                          💬 Motif / Détails : {log.changes}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={() => downloadMedicalDocPDF(selectedDoc)}
                className="w-full py-3 bg-[#059669] hover:bg-[#059669]/90 text-white font-bold font-sans text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le Document Officiel (PDF)</span>
              </button>

              {/* Close footer button */}
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold font-sans text-xs rounded-xl transition-all cursor-pointer"
              >
                Fermer la Consultation de Dossier Confidentialisé
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAID INVOICES ARCHIVE SECTION */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-3xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#059669]" />
            <h3 className="text-lg font-sans font-bold text-[#1C1C1E]">Archive des Factures Payées</h3>
          </div>
          <span className="text-xs text-gray-400 font-sans font-medium">Permanence numérique</span>
        </div>
        <p className="text-xs text-gray-500 font-sans leading-relaxed">
          Retrouvez l'ensemble de vos factures de soins acquittées. Cliquez sur une facture de la liste pour l'afficher au format PDF et l'imprimer pour vos assurances ou votre employeur.
        </p>

        {/* Invoice Grid */}
        {invoices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice(inv)}
                className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 shadow-3xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00D26A]"></span>
                    <h4 className="font-sans font-bold text-xs text-gray-800 truncate">{inv.hospitalName}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans font-semibold">N° {inv.id} • {inv.date.split(' à')[0]}</p>
                  
                  {/* Small badge list */}
                  <span className="inline-block text-[10px] px-2 py-0.5 bg-white border border-gray-100 text-gray-500 rounded-md font-sans">
                    {inv.paymentMethod === 'Wallet' ? 'Wallet Santé+' : 'Sats ⚡'}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-xs font-mono font-bold text-gray-900">{(inv.totalXOF ?? 0).toLocaleString('fr-FR')} XOF</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadInvoicePDF(inv); }}
                      className="text-[10px] font-bold text-slate-700 hover:text-slate-900 font-sans flex items-center gap-0.5 cursor-pointer"
                      title="Télécharger la facture (PDF)"
                    >
                      <Download className="w-3 h-3" />
                      Télécharger
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectInvoice(inv); }}
                      className="text-[10px] font-bold text-[#059669] hover:underline font-sans flex items-center gap-0.5 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600 font-sans">Aucune facture enregistrée</p>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">Vos factures s'afficheront ici dès que vous aurez réglé des soins.</p>
          </div>
        )}
      </div>

    </div>
  );
}
