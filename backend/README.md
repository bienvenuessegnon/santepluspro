# Santé+ Bénin — Backend FastAPI (Python)

Ce dossier contient un backend complet et prêt à l'emploi conçu en **Python avec FastAPI**. Il permet d'extraire la logique métier, la gestion des rendez-vous, la synchronisation du portefeuille d'identité de santé (NPI) et le suivi des demandes d'accès d'Abomey-Calavi en dehors du client pour les stocker sur un vrai serveur.

## 🚀 Fonctionnalités
- **Gestion des hôpitaux** : Liste complète, détails et ajout d'avis de citoyens sur les centres médicaux.
- **Rendez-vous Cliniques** : Réservation et validation de créneaux d'examens et consultations.
- **Portefeuille Numérique & Facturation** : Gestion du solde en FCFA (XOF), recharges et paiements chiffrés.
- **Documents Médicaux** : Stockage et génération d'analyses, ordonnances et devis cliniques.
- **Demandes d'accès sécurisées** : Processus d'approbation et de traçabilité des dossiers médicaux par NPI (Numéro Personnel d'Identification).

---

## 🛠️ Installation Locale

### 1. Prérequis
Assurez-vous d'avoir **Python 3.9+** installé sur votre machine de développement.

### 2. Cloner et configurer l'environnement
Ouvrez votre terminal dans le dossier `backend` :

```bash
# Optionnel : Créer un environnement virtuel
python -m venv venv
source venv/bin/activate # Sur macOS/Linux
# ou
venv\Scripts\activate # Sur Windows

# Installer les dépendances requises
pip install -r requirements.txt
```

### 3. Démarrer le serveur FastAPI
Pour lancer le serveur de développement avec rechargement à chaud (hot reload) :

```bash
python main.py
# ou directement avec uvicorn :
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Le serveur sera alors disponible sur : **`http://localhost:8000`**

---

## 📖 Documentation Interactive de l'API (Swagger UI)
FastAPI génère automatiquement la documentation interactive et l'espace de test de vos routes. Une fois le serveur lancé, visitez :
- **`http://localhost:8000/docs`** (Swagger UI)
- **`http://localhost:8000/redoc`** (ReDoc UI)

---

## 🌐 Connecter le Frontend React

Pour que l'application React communique avec votre nouveau backend FastAPI au lieu d'utiliser l'état local émulé, vous pouvez facilement brancher vos requêtes HTTP (via `fetch` ou `axios`) vers l'adresse `http://localhost:8000/api`.

Exemple de configuration dans un fichier `.env` ou `/src/config.ts` :
```typescript
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```
