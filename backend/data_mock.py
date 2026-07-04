from models import Hospital, MedicalDocument, Patient, Appointment, Invoice, AccessRequest
from typing import List, Dict

# Satoshis exchange rate factor: 1 XOF = 1.666 Sats
XOF_TO_SATS = 1.666

# Seed data mirroring src/data.ts
HOSPITALS_DB: List[Dict] = [
    {
        "id": "hz-calavi",
        "name": "Hôpital de Zone d'Abomey-Calavi & Sô-Ava",
        "type": "public",
        "image": "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&q=80&w=600",
        "rating": 4.3,
        "reviewsCount": 142,
        "distance": "1.2 km",
        "address": "Rue de l'Hôpital de Zone, Quartier Sèmè-Podji, Abomey-Calavi",
        "phone": "+229 21 36 01 22",
        "hours": "Ouvert 24h/24",
        "isVerified": True,
        "services": ["Urgences", "Pédiatrie", "Maternité", "Chirurgie", "Médecine Générale"],
        "priceList": [
            {"name": "Consultation Médecine Générale", "priceXOF": 2000, "priceSats": 3330},
            {"name": "Bilan NFS / Sanguin Complet", "priceXOF": 4500, "priceSats": 7500},
            {"name": "Test Rapide Paludisme (GE)", "priceXOF": 1500, "priceSats": 2500},
            {"name": "Échographie Obstétricale", "priceXOF": 8000, "priceSats": 13320},
            {"name": "Ordonnance Traitement Paludisme type", "priceXOF": 3500, "priceSats": 5830}
        ],
        "reviews": [
            {"id": "r1", "author": "Pascal Houessou", "rating": 5, "date": "25 Juin 2026", "comment": "Le service de pédiatrie est exceptionnel. Prise en charge très rapide pour mon fils."},
            {"id": "r2", "author": "Marielle Tossou", "rating": 4, "date": "12 Juin 2026", "comment": "L'hôpital public de référence à Calavi. Parfois un peu d'attente aux urgences, mais les médecins sont très compétents."},
            {"id": "r3", "author": "Gaston Houndéton", "rating": 4, "date": "03 Juin 2026", "comment": "Propre et bien organisé depuis la mise en place du paiement numérique. Pas de files d'attente interminables."}
        ],
        "coords": {"x": 48.0, "y": 52.0},
        "lat": 6.4385,
        "lng": 2.3412
    },
    {
        "id": "chd-atlantique",
        "name": "CHD Atlantique (Hôpital Universitaire)",
        "type": "public",
        "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
        "rating": 4.5,
        "reviewsCount": 238,
        "distance": "2.4 km",
        "address": "Route Inter-États, Près du Campus Universitaire d'Abomey-Calavi (UAC)",
        "phone": "+229 21 36 12 44",
        "hours": "Ouvert 24h/24",
        "isVerified": True,
        "services": ["Urgences", "Cardiologie", "Radiologie", "Gynécologie", "Laboratoire d'analyses"],
        "priceList": [
            {"name": "Consultation Spécialiste", "priceXOF": 5000, "priceSats": 8330},
            {"name": "Radiographie Thoracique", "priceXOF": 10000, "priceSats": 16660},
            {"name": "Bilan Lipidique & Glycémie", "priceXOF": 6000, "priceSats": 10000},
            {"name": "Scanner Cérébral", "priceXOF": 45000, "priceSats": 75000}
        ],
        "reviews": [
            {"id": "r4", "author": "Chantal Agon", "rating": 5, "date": "18 Juin 2026", "comment": "Équipements de pointe et professeurs très à l'écoute. Très bon suivi gynécologique."},
            {"id": "r5", "author": "Christian Soglo", "rating": 4, "date": "10 Juin 2026", "comment": "Situé juste à côté de l'UAC. Pratique pour les étudiants et les habitants de Calavi."}
        ],
        "coords": {"x": 32.0, "y": 38.0},
        "lat": 6.4182,
        "lng": 2.3395
    },
    {
        "id": "clinique-sainte-famille",
        "name": "Clinique Privée Sainte-Famille",
        "type": "private",
        "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600",
        "rating": 4.7,
        "reviewsCount": 85,
        "distance": "3.8 km",
        "address": "Quartier Zogbadjè, Face 2ème entrée du Campus, Abomey-Calavi",
        "phone": "+229 97 45 11 89",
        "hours": "07:00 - 22:00",
        "isVerified": True,
        "services": ["Médecine Générale", "Maternité", "Pédiatrie", "Dentisterie", "Échographie"],
        "priceList": [
            {"name": "Consultation Générale", "priceXOF": 3000, "priceSats": 5000},
            {"name": "Consultation Dentaire", "priceXOF": 5000, "priceSats": 8330},
            {"name": "Détartrage & Soins", "priceXOF": 15000, "priceSats": 25000},
            {"name": "Échographie Pelvienne", "priceXOF": 10000, "priceSats": 16660}
        ],
        "reviews": [
            {"id": "r6", "author": "Bienvenue Segnon", "rating": 5, "date": "29 Juin 2026", "comment": "Le cadre est magnifique et d'une propreté impeccable. Service client très réactif."},
            {"id": "r7", "author": "Félicité Kpodékon", "rating": 4, "date": "21 Juin 2026", "comment": "Clinique privée excellente. Les tarifs sont un peu plus élevés mais le confort et l'accueil le justifient largement."}
        ],
        "coords": {"x": 58.0, "y": 28.0},
        "lat": 6.4255,
        "lng": 2.3298
    },
    {
        "id": "cs-calavi-centre",
        "name": "Centre de Santé de Calavi-Centre",
        "type": "clinic",
        "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
        "rating": 3.9,
        "reviewsCount": 56,
        "distance": "0.8 km",
        "address": "Avenue de la Mairie, En face de l'Hôtel de Ville, Abomey-Calavi",
        "phone": "+229 21 36 04 11",
        "hours": "08:00 - 18:00",
        "isVerified": False,
        "services": ["Vaccination", "Planification Familiale", "Consultation Prénatale", "Soins Infirmiers"],
        "priceList": [
            {"name": "Consultation Infirmière", "priceXOF": 1000, "priceSats": 1660},
            {"name": "Pansement & Injection", "priceXOF": 800, "priceSats": 1330},
            {"name": "Carnet de Santé & Pesée", "priceXOF": 500, "priceSats": 830}
        ],
        "reviews": [
            {"id": "r8", "author": "Ablavi Hounkpè", "rating": 4, "date": "14 Juin 2026", "comment": "Centre public idéal pour les vaccins et suivis de bébé. Très abordable."}
        ],
        "coords": {"x": 44.0, "y": 68.0},
        "lat": 6.4452,
        "lng": 2.3478
    },
    {
        "id": "clinique-solidarite",
        "name": "Clinique de la Solidarité (Bidossessi)",
        "type": "private",
        "image": "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600",
        "rating": 4.2,
        "reviewsCount": 42,
        "distance": "1.9 km",
        "address": "Bidossessi, à 200m du Carrefour Kpota, Abomey-Calavi",
        "phone": "+229 95 33 22 11",
        "hours": "08:00 - 20:00",
        "isVerified": True,
        "services": ["Médecine Générale", "Petite Chirurgie", "Analyses Médicales", "Pharmacie de garde"],
        "priceList": [
            {"name": "Consultation de Jour", "priceXOF": 2500, "priceSats": 4160},
            {"name": "Consultation d'Urgence / Nuit", "priceXOF": 5000, "priceSats": 8330},
            {"name": "Analyse d'Urine (ECBU)", "priceXOF": 4000, "priceSats": 6660},
            {"name": "Suture de Plaie Simple", "priceXOF": 6000, "priceSats": 10000}
        ],
        "reviews": [
            {"id": "r9", "author": "Marc Djivo", "rating": 4, "date": "26 Mai 2026", "comment": "Clinique de quartier sérieuse. Prise en charge immédiate pour les petites urgences."}
        ],
        "coords": {"x": 74.0, "y": 48.0},
        "lat": 6.4520,
        "lng": 2.3595
    }
]

DOCUMENTS_DB: List[Dict] = [
    {
        "id": "doc-1",
        "title": "Analyses de Laboratoire - Laboratoire de Zone",
        "type": "analyses",
        "priceXOF": 4500,
        "priceSats": 7500,
        "items": [
            {"name": "Bilan NFS (Numération Formule Sanguine)", "priceXOF": 3000},
            {"name": "Goutte Épaisse (Test de détection Paludisme)", "priceXOF": 1500}
        ]
    },
    {
        "id": "doc-2",
        "title": "Ordonnance Médicale - Dr. Kpadéou",
        "type": "prescription",
        "priceXOF": 3500,
        "priceSats": 5830,
        "items": [
            {"name": "Artéméther + Luméfantrine (Anti-paludéen) 20/120mg", "quantity": 1, "priceXOF": 2000},
            {"name": "Paracétamol 1g (Boîte de 16 comprimés)", "quantity": 2, "priceXOF": 1500}
        ]
    },
    {
        "id": "doc-3",
        "title": "Frais de Consultation & Soins Ambulatoires",
        "type": "devis",
        "priceXOF": 2000,
        "priceSats": 3330,
        "items": [
            {"name": "Ticket modérateur - Consultation Générale", "priceXOF": 2000}
        ]
    }
]

PATIENTS_DB: Dict[str, Dict] = {
    "bienvenuesegnon@gmail.com": {
        "name": "Bienvenue Segnon",
        "email": "bienvenuesegnon@gmail.com",
        "phone": "+229 97 88 55 44",
        "walletBalance": 15000,
        "npi": "1097885544901",
        "avatar": "BS"
    },
    "aurellehoundeton@gmail.com": {
        "name": "Aurelle Houndeton",
        "email": "aurellehoundeton@gmail.com",
        "phone": "+229 95 12 34 56",
        "walletBalance": 42000,
        "npi": "1095123456782",
        "avatar": "AH"
    },
    "koffimensah@gmail.com": {
        "name": "Koffi Mensah",
        "email": "koffimensah@gmail.com",
        "phone": "+229 97 45 67 89",
        "walletBalance": 8000,
        "npi": "1097456789123",
        "avatar": "KM"
    }
}

APPOINTMENTS_DB: List[Dict] = []
ACCESS_REQUESTS_DB: List[Dict] = []
INVOICES_DB: List[Dict] = []
