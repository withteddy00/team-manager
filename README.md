# Team Manager - Application de Gestion d'Équipe

Application complète pour la gestion d'équipe, les jours fériés marocains et l'astreinte Égypte du dimanche.

## Stack Technique

- **Backend** : FastAPI + SQLAlchemy + SQLite
- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Auth** : JWT (JSON Web Tokens)
- **Exports** : PDF (ReportLab) + Excel (OpenPyXL)

## Installation

### Backend

```bash
cd team-manager-backend
pip install poetry    # si pas installé
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Le backend sera accessible sur http://localhost:8000
Documentation API : http://localhost:8000/docs

### Frontend

```bash
cd team-manager-frontend
npm install
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

## Compte par défaut

Créez un compte via la page d'inscription. Le premier utilisateur sera administrateur.

## Fonctionnalités

- Gestion complète de l'équipe (CRUD)
- Détection automatique des jours fériés marocains
- Validation des jours fériés (travaillé / non travaillé)
- Astreinte Égypte du dimanche (sélection de 3 personnes)
- Calcul automatique des paiements (1000 DH par personne)
- Tableau de bord avec statistiques et graphiques
- Historique complet avec filtres
- Export PDF et Excel
- Système de notifications
- Rôles Admin / Lecteur
- Interface Spotify-style (dark theme)

## Configuration

- Backend : modifier `app/services/auth.py` pour changer la clé secrète JWT
- Frontend : modifier `.env` pour changer l'URL du backend (`VITE_API_URL`)
