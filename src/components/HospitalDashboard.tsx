import React, { useState } from 'react';
import { HospitalUser, Hospital, Appointment, Invoice, MedicalDocument, AccessRequest } from '../types';
import { HOSPITALS, XOF_TO_SATS, SAMPLE_PATIENTS } from '../data';
import { 
  Building2, Calendar, ClipboardList, PlusCircle, Trash2, 
  FileText, CheckSquare, TrendingUp, Download, LogOut, 
  Check, ShieldAlert, Sparkles, User, ShieldCheck, Search, Lock, Unlock, RefreshCw, AlertCircle, X,
  HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

interface HospitalDashboardProps {
  user: HospitalUser;
  appointments: Appointment[];
  invoices: Invoice[];
  onEmitDocument: (doc: MedicalDocument) => void;
  onLogout: () => void;
  onConfirmAppointment: (id: string) => void;
  accessRequests: AccessRequest[];
  onAddAccessRequest: (npi: string) => void;
  hospitals?: Hospital[];
  onVerifyHospital?: (id: string) => void;
  onAddHospital?: (newHosp: any) => Promise<Hospital>;
  customDocuments?: MedicalDocument[];
  onUpdateDocument?: (id: string, updatedFields: any) => Promise<any>;
}

export default function HospitalDashboard({
  user,
  appointments,
  invoices,
  onEmitDocument,
  onLogout,
  onConfirmAppointment,
  accessRequests,
  onAddAccessRequest,
  hospitals = HOSPITALS,
  onVerifyHospital,
  onAddHospital,
  customDocuments = [],
  onUpdateDocument,
}: HospitalDashboardProps) {
  // If system super admin logged in, redirect to national admin view
  if (user.hospitalId === 'system-admin') {
    return (
      <SuperAdminDashboard
        user={user}
        hospitals={hospitals}
        onVerifyHospital={onVerifyHospital}
        onAddHospital={onAddHospital}
        onLogout={onLogout}
      />
    );
  }

  // Find hospital details
  const hospital = hospitals.find(h => h.id === user.hospitalId) || HOSPITALS[0];

  // Tab State
  const [activeTab, setActiveTab] = useState<'emit' | 'appointments' | 'finances'>('emit');

  // Form states for emitting document
  const [patientName, setPatientName] = useState('Bienvenue Segnon');
  const [docTitle, setDocTitle] = useState('Analyses complémentaires de Routine');
  const [docType, setDocType] = useState<'analyses' | 'prescription' | 'devis'>('analyses');
  
  // Custom items builder
  const [items, setItems] = useState<{ name: string; priceXOF: number }[]>([
    { name: 'Examen sanguin hématocrite', priceXOF: 3500 },
    { name: 'Analyse d\'urine créatinine', priceXOF: 2500 }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // NPI Search States
  const [searchNpi, setSearchNpi] = useState('1097885544901'); // prefilled with Bienvenue's NPI for easy demo
  const [searchedPatient, setSearchedPatient] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Success states
  const [successMsg, setSuccessMsg] = useState('');
  const [qrCodeToGenerate, setQrCodeToGenerate] = useState('https://sante.gouv.bj');

  // Edit states for Medical Record Modification
  const [editingDoc, setEditingDoc] = useState<MedicalDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'analyses' | 'prescription' | 'devis'>('analyses');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<{ name: string; priceXOF: number }[]>([]);
  const [editNewItemName, setEditNewItemName] = useState('');
  const [editNewItemPrice, setEditNewItemPrice] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');

  const patientDocs = searchedPatient ? customDocuments.filter(doc => doc.patientNpi === searchedPatient.npi) : [];

  const startEditDocument = (doc: MedicalDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditType(doc.type);
    setEditNotes(doc.notes || '');
    setEditItems(doc.items || []);
    setEditNewItemName('');
    setEditNewItemPrice('');
    setEditReason('');
    setEditSuccess(false);
    setEditError('');
  };

  const handleEditAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNewItemName.trim() || !editNewItemPrice) return;
    setEditItems([
      ...editItems,
      { name: editNewItemName, priceXOF: parseFloat(editNewItemPrice) }
    ]);
    setEditNewItemName('');
    setEditNewItemPrice('');
  };

  const handleEditRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleSaveEditDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !onUpdateDocument) return;
    if (!editTitle.trim()) {
      setEditError("Le titre est obligatoire");
      return;
    }
    if (editItems.length === 0) {
      setEditError("Le dossier doit comporter au moins une prestation ou produit.");
      return;
    }
    if (!editReason.trim()) {
      setEditError("Vous devez renseigner le motif de cette modification.");
      return;
    }

    const totalXOF = editItems.reduce((acc, curr) => acc + curr.priceXOF, 0);
    const totalSats = Math.round(totalXOF * XOF_TO_SATS);

    setEditError('');
    onUpdateDocument(editingDoc.id, {
      title: editTitle,
      type: editType,
      notes: editNotes,
      items: editItems,
      priceXOF: totalXOF,
      priceSats: totalSats,
      updateReason: editReason
    })
    .then(() => {
      setEditSuccess(true);
      setTimeout(() => {
        setEditingDoc(null);
      }, 1500);
    })
    .catch((err) => {
      setEditError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;
    setItems([
      ...items,
      { name: newItemName, priceXOF: parseFloat(newItemPrice) }
    ]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleEmitDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Veuillez ajouter au moins une prestation ou un médicament.");
      return;
    }

    // Check if patient authorization is required but not approved
    const activeRequest = accessRequests.find(r => r.npi === searchNpi && r.doctorEmail === user.email);
    const isApproved = activeRequest?.status === 'approved';
    const searchedInDb = SAMPLE_PATIENTS.find(p => p.npi === searchNpi);

    if (searchedInDb && !isApproved) {
      alert("Erreur de sécurité : L'accès à ce dossier patient n'a pas été autorisé par le citoyen via son application mobile. Veuillez d'abord initier une demande d'accès et attendre sa confirmation.");
      return;
    }

    const totalXOF = items.reduce((acc, it) => acc + it.priceXOF, 0);
    const totalSats = Math.round(totalXOF * XOF_TO_SATS);

    const newDoc: MedicalDocument = {
      id: `doc-${Math.floor(1000 + Math.random() * 9000)}`,
      title: docTitle || `${docType.toUpperCase()} - ${hospital.name}`,
      type: docType,
      items,
      priceXOF: totalXOF,
      priceSats: totalSats
    };

    onEmitDocument(newDoc);
    setSuccessMsg(`Document médical émis avec succès pour ${patientName} !`);
    
    // Reset form
    setDocTitle('Ordonnance Pédiatrique');
    setDocType('prescription');
    setItems([{ name: 'Sirop Paracétamol Enfant', priceXOF: 1200 }]);
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  // NPI Search Action
  const handleNpiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNpi.trim()) return;
    
    // Attempt to locate in cached patient profiles first
    let patient = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sante_cache_patient_profile_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          if (parsed && parsed.npi && parsed.npi.toString().trim() === searchNpi.trim()) {
            patient = parsed;
            break;
          }
        } catch (err) {
          console.warn("Could not parse cached patient profile for NPI lookup", err);
        }
      }
    }

    if (!patient) {
      patient = SAMPLE_PATIENTS.find(p => p.npi === searchNpi.trim());
    }

    setSearchedPatient(patient || null);
    setHasSearched(true);

    // If patient is found and already approved, prefill name
    const req = accessRequests.find(r => r.npi === searchNpi.trim() && r.doctorEmail === user.email);
    if (patient && req?.status === 'approved') {
      setPatientName(patient.name);
    }
  };

  // Request patient authorization
  const handleRequestAccess = () => {
    if (!searchNpi) return;
    onAddAccessRequest(searchNpi);
  };

  // Filter appointments for this specific hospital
  const hospitalAppointments = appointments.filter(a => a.hospitalId === hospital.id);

  // Filter paid invoices for this hospital
  const hospitalInvoices = invoices.filter(i => i.hospitalName === hospital.name);
  const totalInvoicedXOF = hospitalInvoices.reduce((acc, inv) => acc + inv.totalXOF, 0);

  // DOWNLOAD FUNCTION 1: Single Invoice Download
  const handleDownloadInvoice = (inv: Invoice) => {
    // Set QR code value first to let React render the canvas
    const verificationUrl = `https://sante.gouv.bj/verifier?id=${inv.id}&tx=${inv.txHash}&total=${inv.totalXOF}&patient=${encodeURIComponent(inv.patientName)}&origin=${encodeURIComponent(window.location.origin)}`;
    setQrCodeToGenerate(verificationUrl);

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
      doc.text(`${inv.doctorName || user.name || 'Dr. Jean Sossou'}`, 20, 90);
      
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
      const canvas = document.getElementById('pdf-qr-code-canvas') as HTMLCanvasElement;
      if (canvas) {
        try {
          const qrDataUrl = canvas.toDataURL('image/png');
          doc.addImage(qrDataUrl, 'PNG', 164, y + 2.5, 20, 20);
        } catch (err) {
          console.error("Erreur lors de la génération du code QR PDF", err);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(10, 132, 255);
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
      const canvas = document.getElementById('pdf-qr-code-canvas') as HTMLCanvasElement;
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

  // DOWNLOAD FUNCTION 2: Global Hospital Activity Report
  const handleDownloadActivityReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [30, 41, 59]; // slate-800
    const accentColor = [10, 132, 255]; // blue
    const textColor = [28, 28, 30];
    const lightGray = [120, 120, 128];

    // Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('RAPPORT D\'ACTIVITÉ', 20, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`${hospital.name.toUpperCase()}`, 20, 31);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 37);
    doc.text(`Auteur : ${user.email} (${user.role.toUpperCase()}) - ${user.name || 'Gestionnaire'}`, 20, 42);

    // Line separator
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(20, 47, 190, 47);

    // STATISTIQUES SECTION
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. STATISTIQUES DES FLUX FINANCIERS', 20, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre total de règlements perçus :`, 25, 66);
    doc.setFont('helvetica', 'bold');
    doc.text(`${hospitalInvoices.length}`, 105, 66);

    doc.setFont('helvetica', 'normal');
    doc.text(`Chiffre d'affaires total enregistré :`, 25, 73);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(totalInvoicedXOF ?? 0).toLocaleString('fr-FR')} XOF`, 105, 73);

    doc.setFont('helvetica', 'normal');
    doc.text(`Équivalent Satoshis cumulé :`, 25, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(`${Math.round((totalInvoicedXOF ?? 0) * XOF_TO_SATS).toLocaleString()} Sats`, 105, 80);

    // HISTORIQUE DETAILE
    doc.setFont('helvetica', 'bold');
    doc.text('2. HISTORIQUE DÉTAILLÉ DES FLUX', 20, 95);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(20, 98, 190, 98);

    doc.setFontSize(9);
    doc.text('Réf Facture', 22, 104);
    doc.text('Patient', 55, 104);
    doc.text('Mode de paiement', 105, 104);
    doc.text('Montant (XOF)', 150, 104);

    doc.line(20, 107, 190, 107);

    let y = 113;
    if (hospitalInvoices.length > 0) {
      hospitalInvoices.forEach((inv, idx) => {
        if (y > 200) { // Keep basic pagination guard simple
          doc.addPage();
          y = 25;
        }
        doc.setFont('helvetica', 'normal');
        doc.text(`${inv.id}`, 22, y);
        doc.text(`${inv.patientName}`, 55, y);
        doc.text(`${inv.paymentMethod === 'Wallet' ? 'Wallet Santé+' : 'Lightning Sats'}`, 105, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`${(inv.totalXOF ?? 0).toLocaleString('fr-FR')} XOF`, 150, y);
        y += 7;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.text("Aucun paiement enregistré pour l'établissement actuellement.", 22, y);
      y += 7;
    }

    // RENDEZ-VOUS SECTION
    y += 10;
    if (y > 230) {
      doc.addPage();
      y = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. RENDEZ-VOUS DU JOUR ET À VENIR', 20, y);
    y += 4;
    doc.line(20, y, 190, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre de rendez-vous actifs :`, 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${hospitalAppointments.length}`, 105, y);
    y += 9;

    if (hospitalAppointments.length > 0) {
      hospitalAppointments.forEach((apt) => {
        if (y > 250) {
          doc.addPage();
          y = 25;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`RDV ${apt.id} : ${apt.patientName} le ${apt.date.split('-').reverse().join('/')} à ${apt.timeSlot}`, 25, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`[${apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}]`, 150, y);
        y += 7;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.text("Aucun rendez-vous programmé.", 25, y);
    }

    // Footer certified
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CENTRAL MÉDICAL NATIONAL - CERTIFIÉ CONFORME', 20, 270);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("Rapport d'activité extrait numériquement. Propulsé par la plateforme Santé+ Bénin.", 20, 274);

    doc.save(`rapport-activite-${hospital.id}.pdf`);
  };

  // Active access check for the searched patient
  const activeRequest = accessRequests.find(r => r.npi === searchNpi && r.doctorEmail === user.email);

  return (
    <div id="hospital-dashboard" className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden QR Code Canvas generator for PDF single invoice */}
      <div style={{ display: 'none' }}>
        <QRCodeCanvas
          id="pdf-qr-code-canvas"
          value={qrCodeToGenerate}
          size={150}
        />
      </div>

      {/* Clinique top Header banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Accrédité Ministère de la Santé
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight font-sans text-white">{hospital.name}</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>{hospital.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Session Professionnelle</span>
            <strong className="text-white block font-sans truncate max-w-[150px]">{user.email}</strong>
            <span className="text-[10px] uppercase font-bold text-amber-400 block">
              {user.role === 'doctor' ? 'Médecin de Garde' : user.role === 'nurse' ? 'Infirmier de Soins' : 'Administrateur'}
            </span>
          </div>
          
          <button
            onClick={onLogout}
            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl transition-all cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-gray-200/50 rounded-2xl border border-gray-200">
        <button
          onClick={() => setActiveTab('emit')}
          className={`py-3 px-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'emit' ? 'bg-white text-[#059669] shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Émettre un Document de Soins
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'appointments' ? 'bg-white text-[#059669] shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Rendez-vous Reçus ({hospitalAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('finances')}
          className={`py-3 px-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'finances' ? 'bg-white text-[#059669] shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Rapports & Finances ({hospitalInvoices.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB: EMIT MEDICAL DOCUMENTS */}
        {activeTab === 'emit' && (
          <motion.div
            key="emit-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Builder & NPI Search Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* NPI LOOKUP & BLOCKCHAIN CONSENT MODULE */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-emerald-50 text-[#059669] rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold font-sans text-gray-900 leading-tight">Vérification NPI Bénin & Blockchain Bitcoin</h3>
                    <p className="text-[10px] text-gray-400 font-sans">Recherchez et demandez le consentement cryptographique du patient</p>
                  </div>
                </div>

                <form onSubmit={handleNpiSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchNpi}
                    onChange={(e) => setSearchNpi(e.target.value)}
                    placeholder="Saisissez le NPI (ex: 1097885544901)"
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#059669]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Rechercher"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* Search Results Display */}
                {hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl border bg-gray-50/50 space-y-3"
                  >
                    {searchedPatient ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center font-sans">
                              {searchedPatient.avatar || 'P'}
                            </div>
                            <div>
                              <strong className="text-gray-900 text-sm block font-sans">{searchedPatient.name}</strong>
                              <span className="text-gray-400 text-[10px] font-semibold font-sans">{searchedPatient.phone} • NPI {searchedPatient.npi}</span>
                            </div>
                          </div>

                          {/* Status Checker */}
                          <div className="flex items-center gap-2">
                            {!activeRequest ? (
                              <button
                                type="button"
                                onClick={handleRequestAccess}
                                className="px-3.5 py-2 bg-[#059669] hover:bg-[#059669]/90 text-white font-bold rounded-xl text-xs font-sans transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Demander l'accès Blockchain
                              </button>
                            ) : activeRequest.status === 'pending' ? (
                              <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-sans font-medium flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                <span>En attente de confirmation patient...</span>
                              </div>
                            ) : activeRequest.status === 'approved' ? (
                              <div className="flex flex-col items-end">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-sans font-bold flex items-center gap-1.5 text-xs">
                                  <Unlock className="w-3.5 h-3.5 text-[#00D26A]" />
                                  <span>Accès Cryptographique Déverrouillé !</span>
                                </span>
                                <span className="text-[9px] text-[#00D26A] font-mono mt-0.5 max-w-[200px] truncate block">TX: {activeRequest.blockchainTxHash}</span>
                              </div>
                            ) : (
                              <span className="bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl font-sans font-semibold text-xs flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                                <span>Accès Refusé par le patient</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Patient Medical Details Grid */}
                        {activeRequest?.status === 'approved' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-3"
                          >
                            <h4 className="text-xs font-extrabold text-[#059669] uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <HeartPulse className="w-4 h-4 text-emerald-600 animate-pulse" />
                              Fiche Santé du Citoyen
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 bg-white/80 border border-emerald-100/50 rounded-xl">
                                <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Groupe Sanguin</span>
                                <strong className="text-gray-900 text-sm mt-0.5 block font-sans">
                                  {searchedPatient.bloodGroup || "Non renseigné"}
                                </strong>
                              </div>
                              <div className="p-3 bg-white/80 border border-emerald-100/50 rounded-xl">
                                <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Allergies connues</span>
                                <strong className="text-gray-800 text-[11px] mt-0.5 block font-sans leading-relaxed">
                                  {searchedPatient.allergies || "Aucune allergie signalée"}
                                </strong>
                              </div>
                              <div className="p-3 bg-white/80 border border-emerald-100/50 rounded-xl col-span-1 md:col-span-2">
                                <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Maladies récurrentes</span>
                                <strong className="text-gray-800 text-[11px] mt-0.5 block font-sans leading-relaxed">
                                  {searchedPatient.recurringDiseases || "Aucune maladie récurrente signalée"}
                                </strong>
                              </div>
                              <div className="p-3 bg-white/80 border border-emerald-100/50 rounded-xl col-span-1 md:col-span-2">
                                <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Antécédents médicaux</span>
                                <strong className="text-gray-800 text-[11px] mt-0.5 block font-sans leading-relaxed">
                                  {searchedPatient.antecedents || "Aucun antécédent signalé"}
                                </strong>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-sans p-2 bg-red-50/50 border border-red-100 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>Aucun dossier patient associé au NPI <strong>{searchNpi}</strong> n'a été trouvé. Veuillez vérifier les 13 chiffres.</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* MAIN EMISSION FORM (DOCKS PATIENT RECORDS) */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6 relative overflow-hidden">
                {/* Shield alert overlay if patient is not authorized */}
                {searchedPatient && activeRequest?.status !== 'approved' && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-xs space-y-4">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="text-md font-sans font-extrabold text-gray-900 leading-tight">Dossier Patient Verrouillé</h4>
                      <p className="text-xs text-gray-500 font-sans leading-relaxed">
                        Conformément au code de déontologie numérique béninois, vous devez obtenir le consentement du patient {searchedPatient.name} via son application Santé+ avant de pouvoir lui émettre un document ou un débit.
                      </p>
                      <button
                        onClick={handleRequestAccess}
                        className="w-full py-2 bg-[#059669] hover:bg-[#059669]/90 text-white font-sans font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Initier la demande d'autorisation Blockchain
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-sans text-gray-900">Nouveau dossier de frais ou ordonnance</h3>
                  <p className="text-xs text-gray-400 font-sans">Rédigez des ordonnances ou factures instantanément réglables</p>
                </div>

                {successMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-[#00D26A] text-xs font-bold rounded-2xl flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleEmitDoc} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient target */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 block">Nom du Patient</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans text-gray-800"
                          placeholder="Ex: Bienvenue Segnon"
                        />
                      </div>
                    </div>

                    {/* Document Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 block">Catégorie d'acte</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs font-sans font-semibold px-3 py-2 rounded-xl text-gray-800"
                      >
                        <option value="analyses">Analyses Médicales / Labo</option>
                        <option value="prescription">Ordonnance Pharmacie</option>
                        <option value="devis">Devis de Soins / Consultation</option>
                      </select>
                    </div>
                  </div>

                  {/* Document descriptive title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Libellé du dossier médical</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans text-gray-800"
                      placeholder="Ex: Traitement anti-paludéen ou NFS"
                    />
                  </div>

                  {/* ITEMS LIST BUILDER */}
                  <div className="space-y-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <span className="text-xs font-bold text-gray-700 block">Actes ou Produits inclus</span>
                    
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 text-xs">
                            <div className="font-sans">
                              <span className="font-bold text-gray-800">{it.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-gray-900">{(it.priceXOF ?? 0).toLocaleString('fr-FR')} XOF</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">Aucun élément ajouté. Veuillez en ajouter ci-dessous.</p>
                    )}

                    {/* Add item sub-form */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-gray-100">
                      <div className="md:col-span-7">
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Désignation (ex: Doliprane 1g)"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-800"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="Tarif XOF"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="md:col-span-2 py-1.5 px-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Emit triggers */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#059669] hover:bg-[#059669]/95 text-white font-bold font-sans rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Mettre à disposition du Patient
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Helper column OR Patient Medical Dossiers list (if authorized) */}
            <div className="space-y-4">
              {searchedPatient && activeRequest?.status === 'approved' ? (
                <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="p-1.5 bg-[#059669]/10 text-[#059669] rounded-lg">
                      <ClipboardList className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider font-sans">Dossiers Cliniques Actifs</h4>
                      <p className="text-[10px] text-gray-400 font-sans">Sujet : {searchedPatient.name}</p>
                    </div>
                  </div>

                  {patientDocs.length > 0 ? (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {patientDocs.map((doc) => {
                        const isOwnHospital = doc.hospitalId === hospital.id;
                        return (
                          <div 
                            key={doc.id} 
                            className={`p-3.5 rounded-2xl border text-xs font-sans space-y-2.5 transition-all ${
                              isOwnHospital 
                                ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200' 
                                : 'bg-gray-50/50 border-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 shrink-0 ${
                                  doc.type === 'prescription' ? 'bg-amber-400' :
                                  doc.type === 'analyses' ? 'bg-blue-400' : 'bg-[#00D26A]'
                                }`}></span>
                                <strong className="text-gray-800 font-sans break-words">{doc.title}</strong>
                              </div>
                              <span className="text-[9px] uppercase font-mono bg-white px-1.5 py-0.5 rounded-md border border-gray-100 text-gray-400 shrink-0">
                                {doc.type === 'prescription' ? 'Ordonnance' :
                                 doc.type === 'analyses' ? 'Analyses' : 'Devis'}
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-400 space-y-0.5">
                              <p>📍 {doc.hospitalName || 'Clinique émettrice'}</p>
                              <p>📅 Émis le {doc.date || 'Non renseignée'}</p>
                            </div>

                            {/* OWNER VS CLINIC VIEWS COMPLIANCE */}
                            {isOwnHospital ? (
                              <div className="space-y-2 pt-2 border-t border-dashed border-emerald-100">
                                <div className="p-2 bg-white rounded-xl text-[10px] text-gray-600 space-y-1">
                                  <p className="font-semibold text-emerald-800">Prestations incluses :</p>
                                  <ul className="list-disc pl-3 space-y-0.5">
                                    {doc.items && doc.items.map((item, idx) => (
                                      <li key={idx} className="truncate">
                                        {item.name} ({(item.priceXOF ?? 0).toLocaleString('fr-FR')} XOF)
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {doc.notes && (
                                  <p className="text-[10px] text-gray-500 italic max-h-12 overflow-hidden text-ellipsis line-clamp-2">
                                    📝 Obs : {doc.notes}
                                  </p>
                                )}

                                {doc.history && doc.history.length > 0 && (
                                  <div className="text-[9px] bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-100/50">
                                    ⚠️ {doc.history.length} modification(s) enregistrée(s).
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadMedicalDocPDF(doc)}
                                    className="py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg text-[10px] font-sans flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3 h-3 text-emerald-400" />
                                    Télécharger PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditDocument(doc)}
                                    className="py-1.5 bg-[#059669] hover:bg-[#059669]/90 text-white font-bold rounded-lg text-[10px] font-sans flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    ✏️ Modifier le dossier
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-dashed border-gray-100 text-[10px] text-amber-700 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/30 font-sans leading-relaxed flex items-start gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Secret Médical National</strong> : Émis par un autre établissement. Seul le patient propriétaire peut en voir les observations détaillées ou l'historique complet.
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <ClipboardList className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-[10px] text-gray-400 font-sans">Aucun dossier médical émis</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Consentement NPI & Blockchain</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Saisissez l'identifiant NPI à 13 chiffres de votre patient pour établir la connexion.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Le citoyen reçoit instantanément une notification d'accès sur son mobile et confirme la transaction en signant cryptographiquement sur la blockchain Bitcoin.
                    </p>
                    <div className="p-3 bg-white border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-sans font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                      Transaction cryptographique instantanée
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl space-y-3">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Rappel d'accès de sécurité</span>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
                      Chaque recherche de patient par NPI et signature d'accès est consignée de manière immuable sur la blockchain Santé+. Tout abus est passible de sanctions.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: VIEW RECEIVED APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <motion.div
            key="appointments-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-sans text-gray-900">Demandes de Rendez-vous Patients</h3>
              <p className="text-xs text-gray-400 font-sans">Historique des réservations effectuées sur la plateforme pour votre établissement</p>
            </div>

            {hospitalAppointments.length > 0 ? (
              <div className="space-y-3">
                {hospitalAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 border border-gray-100 hover:border-gray-200 rounded-2xl bg-gray-50/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all text-xs font-sans">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">{apt.patientName}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#059669] text-[10px] rounded-md font-bold uppercase tracking-wider">
                          Réf : {apt.id}
                        </span>
                      </div>
                      <p className="text-gray-500 font-sans">
                        Créneau demandé : <strong>{apt.date.split('-').reverse().join('/')}</strong> à <strong>{apt.timeSlot}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {apt.status === 'confirmed' ? (
                        <span className="text-[#00D26A] font-bold flex items-center gap-1 text-xs font-sans">
                          <CheckSquare className="w-4 h-4" />
                          Confirmé & Validé
                        </span>
                      ) : (
                        <button
                          onClick={() => onConfirmAppointment(apt.id)}
                          className="px-3.5 py-2 bg-[#059669] hover:bg-[#059669]/95 text-white font-bold rounded-xl text-xs font-sans transition-all cursor-pointer"
                        >
                          Valider le rendez-vous
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-3xl">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600 font-sans">Aucun rendez-vous enregistré</p>
                <p className="text-xs text-gray-400 mt-1 font-sans">Les patients peuvent réserver via la carte d'Abomey-Calavi.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: STATS & FINANCIAL OVERVIEW */}
        {activeTab === 'finances' && (
          <motion.div
            key="finances-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Download controls bar as per downloads request */}
            <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider">Téléchargements d'activités cliniques</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Exportez l'état complet de vos règlements et statistiques sous format PDF officiel (.pdf).
                </p>
              </div>
              <button
                onClick={handleDownloadActivityReport}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                Télécharger le Rapport d'Activité
              </button>
            </div>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-3xs text-xs font-sans space-y-1">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-[9px]">Chiffre d'Affaires perçu</span>
                <strong className="text-xl font-bold text-gray-900 block font-sans">{(totalInvoicedXOF ?? 0).toLocaleString('fr-FR')} XOF</strong>
                <span className="text-[10px] text-[#00D26A] block font-medium">Contrevaleur réglée via Santé+</span>
              </div>
              
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-3xs text-xs font-sans space-y-1">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-[9px]">Transactions Validées</span>
                <strong className="text-xl font-bold text-gray-900 block font-sans">{hospitalInvoices.length} factures</strong>
                <span className="text-[10px] text-gray-400 block font-medium">100% sécurisé via wallet & Lightning</span>
              </div>

              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-3xs text-xs font-sans space-y-1">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-[9px]">Fonds Bitcoin collectés</span>
                <strong className="text-xl font-mono font-bold text-amber-500 block">
                  {Math.round((totalInvoicedXOF ?? 0) * XOF_TO_SATS).toLocaleString()} Sats
                </strong>
                <span className="text-[10px] text-amber-600 block font-semibold">Taux d'échange instantané actif</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h3 className="text-md font-bold font-sans text-gray-900">Grand Livre des Encaissements</h3>
              
              {hospitalInvoices.length > 0 ? (
                <div className="space-y-3">
                  {hospitalInvoices.map((inv) => (
                    <div key={inv.id} className="p-4 border border-gray-100 hover:border-gray-200 rounded-2xl bg-gray-50/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all text-xs font-sans">
                      {/* Left: Transaction metadata */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#00D26A] text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                            Réf : {inv.id}
                          </span>
                          <span className="text-gray-400 text-[11px] font-sans">({inv.date})</span>
                        </div>
                        <p className="text-gray-500 text-[11px] font-sans">
                          Moyen de règlement : <strong className="text-gray-700">{inv.paymentMethod === 'Wallet' ? 'Portefeuille Prépayé' : 'Sats ⚡'}</strong>
                        </p>
                      </div>

                      {/* Right: Patient Name and Price (aligned perfectly) */}
                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase font-bold">Patient</p>
                          <strong className="text-gray-900 text-sm block font-sans">{inv.patientName}</strong>
                        </div>
                        
                        <div className="h-8 w-px bg-gray-200"></div>

                        <div className="text-right min-w-[90px]">
                          <strong className="text-emerald-700 text-sm block font-bold font-sans">{(inv.totalXOF ?? 0).toLocaleString('fr-FR')} XOF</strong>
                          <span className="text-[10px] text-amber-600 font-mono font-bold block">{(inv.totalSats ?? 0).toLocaleString()} Sats ⚡</span>
                        </div>
                        
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 border border-gray-100 transition-all cursor-pointer"
                          title="Télécharger le reçu (PDF)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-3xl">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-600 font-sans">Aucun encaissement enregistré</p>
                  <p className="text-xs text-gray-400 mt-1 font-sans">Dès qu'un patient réglera ses actes médicaux, ils apparaîtront ici.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* EDIT CLINICAL RECORD MODAL */}
      <AnimatePresence>
        {editingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto font-sans"
            onClick={() => setEditingDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-xl border border-gray-100 shadow-2xl p-6 md:p-8 space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-md font-extrabold font-sans text-gray-900 tracking-tight">Modification du Dossier Médical</h3>
                  <p className="text-[10px] text-gray-400 font-sans">Révision Clinique Traçable • ID : {editingDoc.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning box */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-2.5 text-[11px] font-sans leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Enregistrement d'Audit Obligatoire</span>
                  Toute modification de dossier est auditée. L'identité du médecin ({user.name}), de l'établissement ({hospital.name}) ainsi que le motif obligatoire de modification seront consignés de manière immuable pour le patient.
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#059669]" />
                  <span>Dossier médical modifié et mis à jour avec succès !</span>
                </div>
              )}

              <form onSubmit={handleSaveEditDocument} className="space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Titre du document</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-sans text-gray-800"
                    placeholder="Titre de la consultation"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Catégorie de soin</label>
                  <select
                    value={editType}
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-sans text-gray-800"
                  >
                    <option value="analyses">Analyses / Examens médicaux</option>
                    <option value="prescription">Ordonnance de Pharmacie</option>
                    <option value="devis">Devis financier de Soins</option>
                  </select>
                </div>

                {/* Items manager */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Prestations ou médicaments ({editItems.length})</label>
                  
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-[140px] overflow-y-auto bg-gray-50/50">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="p-2 flex justify-between items-center text-[11px] font-sans">
                        <span className="font-semibold text-gray-700">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900">{(item.priceXOF ?? 0).toLocaleString('fr-FR')} XOF</span>
                          <button
                            type="button"
                            onClick={() => handleEditRemoveItem(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add item sub-form */}
                  <div className="grid grid-cols-12 gap-1.5 pt-1">
                    <input
                      type="text"
                      value={editNewItemName}
                      onChange={(e) => setEditNewItemName(e.target.value)}
                      placeholder="Désignation (ex: Doliprane 1g)"
                      className="col-span-7 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px]"
                    />
                    <input
                      type="number"
                      value={editNewItemPrice}
                      onChange={(e) => setEditNewItemPrice(e.target.value)}
                      placeholder="Prix XOF"
                      className="col-span-3 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleEditAddItem}
                      className="col-span-2 bg-slate-900 text-white font-bold rounded-lg text-[10px] flex items-center justify-center cursor-pointer hover:bg-slate-950"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Observations / Posologie</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-sans text-[11px]"
                    placeholder="Instructions cliniques, posologie, avis du praticien..."
                  />
                </div>

                {/* MOTIF DE MODIFICATION (CRITICAL AUDIT LOG FOR HISTORY) */}
                <div className="space-y-1 p-3 bg-amber-50/40 border border-amber-200/60 rounded-2xl">
                  <label className="block text-[10px] font-extrabold text-amber-800 uppercase">Motif de la modification (Requis)</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-sans text-[11px] text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-amber-700/50"
                    placeholder="Ex: Rectification de posologie suite à de nouvelles analyses"
                    required
                  />
                </div>

                {/* Footer buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-[#059669] hover:bg-[#059669]/90 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Confirmer et Signer la Modification
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SuperAdminDashboardProps {
  user: HospitalUser;
  hospitals: Hospital[];
  onVerifyHospital?: (id: string) => void;
  onAddHospital?: (newHosp: any) => Promise<Hospital>;
  onLogout: () => void;
}

function SuperAdminDashboard({
  user,
  hospitals,
  onVerifyHospital,
  onAddHospital,
  onLogout
}: SuperAdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'list' | 'add'>('list');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields for manually adding a hospital
  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'clinic'>('clinic');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('Ouvert 24h/24');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const pendingHospitals = hospitals.filter(h => !h.isVerified);
  const activeHospitals = hospitals.filter(h => h.isVerified);

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!onAddHospital) return;

    onAddHospital({
      name,
      type,
      address,
      phone,
      hours,
      email: adminEmail,
      password: adminPassword
    })
    .then(() => {
      setSuccessMsg(`L'établissement "${name}" a été ajouté et activé avec succès !`);
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setHours('Ouvert 24h/24');
      setAdminEmail('');
      setAdminPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        setAdminTab('list');
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      setErrorMsg("Une erreur est survenue lors de l'ajout.");
    });
  };

  const handleVerify = (id: string, hName: string) => {
    if (!onVerifyHospital) return;
    onVerifyHospital(id);
    setSuccessMsg(`L'établissement "${hName}" a été validé et activé sur le réseau national.`);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-black uppercase tracking-wider font-sans">
              <ShieldCheck className="w-3.5 h-3.5" />
              MINISTÈRE DE LA SANTÉ BÉNIN
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight">Espace d'Administration Nationale</h1>
            <p className="text-xs text-slate-400 font-sans">Gestion des accréditations d'établissements de soins - Abomey-Calavi</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Se déconnecter
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold font-sans">Total Hôpitaux</span>
            <strong className="text-xl md:text-2xl font-black font-sans text-white">{hospitals.length}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold font-sans">Établissements Agréés</span>
            <strong className="text-xl md:text-2xl font-black font-sans text-emerald-400">{activeHospitals.length}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold font-sans">Demandes en attente</span>
            <strong className={`text-xl md:text-2xl font-black font-sans ${pendingHospitals.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
              {pendingHospitals.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setAdminTab('list')}
          className={`pb-3 text-sm font-bold font-sans transition-all relative cursor-pointer ${
            adminTab === 'list' ? 'text-[#059669]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {adminTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#059669] rounded-full" />}
          Accréditations & Établissements ({hospitals.length})
        </button>
        <button
          onClick={() => setAdminTab('add')}
          className={`pb-3 text-sm font-bold font-sans transition-all relative cursor-pointer ${
            adminTab === 'add' ? 'text-[#059669]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {adminTab === 'add' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#059669] rounded-full" />}
          Ajouter manuellement un centre
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-[#059669] rounded-2xl text-xs font-bold font-sans flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold font-sans">
          {errorMsg}
        </div>
      )}

      {/* Tab Contents */}
      {adminTab === 'list' ? (
        <div className="space-y-6">
          {/* SECTION 1: PENDING SIGNUP REQUESTS */}
          <div className="space-y-3">
            <h3 className="text-sm font-black font-sans uppercase tracking-wider text-slate-700">Demandes d'inscription en attente d'agrément ({pendingHospitals.length})</h3>
            
            {pendingHospitals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {pendingHospitals.map(h => (
                  <div key={h.id} className="p-5 bg-amber-50/50 border border-amber-100 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-amber-50/80">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900 font-sans">{h.name}</h4>
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold uppercase">{h.type}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-sans"><strong>Adresse:</strong> {h.address}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 font-sans font-medium">
                        <span><strong>Tél:</strong> {h.phone}</span>
                        <span><strong>Ouverture:</strong> {h.hours}</span>
                        <span className="text-[#059669]"><strong>Admin:</strong> {h.adminEmail || 'Non spécifié'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerify(h.id, h.name)}
                      className="px-4 py-2.5 bg-[#059669] hover:bg-[#059669]/90 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 self-end md:self-auto"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      Confirmer & Activer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl space-y-2">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500 font-sans">Aucune demande d'inscription en attente</p>
                <p className="text-[11px] text-gray-400 font-sans">Toutes les demandes d'accréditations de Calavi sont déjà validées.</p>
              </div>
            )}
          </div>

          {/* SECTION 2: ACTIVE REGISTERED HOSPITALS */}
          <div className="space-y-3">
            <h3 className="text-sm font-black font-sans uppercase tracking-wider text-slate-700">Établissements Actifs et Agréés ({activeHospitals.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeHospitals.map(h => (
                <div key={h.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-start gap-3 text-left hover:border-slate-300 transition-all">
                  <div className="w-10 h-10 bg-emerald-50 text-[#059669] border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-xs text-gray-900 font-sans truncate max-w-[200px]">{h.name}</h4>
                      <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">{h.type}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans truncate">{h.address}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400 font-sans font-medium">Tél: {h.phone}</span>
                      <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Agréé
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB: ADD HOSPITAL MANUALLY */
        <form onSubmit={handleSubmitAdd} className="bg-white border border-gray-100 rounded-3xl p-6 text-left max-w-xl space-y-4 shadow-3xs">
          <div className="space-y-1">
            <h3 className="text-sm font-black font-sans text-gray-800 uppercase tracking-wide">Ajout d'un nouvel établissement</h3>
            <p className="text-xs text-gray-400 font-sans">Ce formulaire ajoute directement un établissement actif au réseau national.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Nom de l'établissement</label>
            <input
              type="text"
              required
              placeholder="Ex : Centre Hospitalier du Plateau"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Type d'établissement</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
            >
              <option value="clinic">Clinique Médicale Privée</option>
              <option value="public">Hôpital Public de Zone</option>
              <option value="private">Hôpital Privé</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Adresse de l'établissement</label>
            <input
              type="text"
              required
              placeholder="Ex : Kpota, à côté de la pharmacie, Calavi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 font-sans block mb-1">Téléphone de contact</label>
              <input
                type="tel"
                required
                placeholder="Ex : +229 97 22 11 33"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 font-sans block mb-1">Horaires d'ouverture</label>
              <input
                type="text"
                required
                placeholder="Ex : 24h/24, 7j/7"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans block">Création du compte administrateur local</span>
            
            <div>
              <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Adresse e-mail de l'administrateur</label>
              <input
                type="email"
                required
                placeholder="Ex : admin.plateau@sante.bj"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 font-sans block mb-1">Mot de passe de l'administrateur</label>
              <input
                type="password"
                required
                placeholder="Définir un mot de passe d'accès"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans text-[#1C1C1E] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#059669] hover:bg-[#059669]/95 text-white text-xs font-bold font-sans rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajouter & Activer l'Établissement</span>
          </button>
        </form>
      )}
    </div>
  );
}
