# Santé+ Bénin

Application de localisation d'hôpital, de prise de rendez-vous et de paiement de soins de santé à Abomey-Calavi, Bénin.

## Développement local

Prérequis : Node.js

1. Installer les dépendances : `npm install`
2. Copier le fichier d’environnement : `cp .env.example .env.local`
3. Définir éventuellement `GEMINI_API_KEY` si vous voulez activer les réponses IA Gemini
4. Lancer l’application : `npm run dev`

## Hébergement le plus simple

Option recommandée : Render

1. Pousser ce dépôt sur GitHub
2. Créer un nouveau Web Service sur Render
3. Connecter le dépôt
4. Utiliser ces valeurs :
   - Build Command : `npm install && npm run build`
   - Start Command : `npm start`
5. Aucun changement frontend n’est nécessaire
6. Si vous souhaitez activer l’IA Gemini, ajoutez `GEMINI_API_KEY` en variable d’environnement ; sinon, le chatbot de secours fonctionne déjà
