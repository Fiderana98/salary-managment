# Salary Management

Application de gestion des salaires permettant de gérer les employés, calculer les paies et générer des bulletins en PDF.

## 🚀 Fonctionnalités

- Gestion des employés (ajout, modification, suppression)
- Calcul automatique des salaires
- Génération de bulletins de paie au format PDF
- [Ajoute ici d'autres fonctionnalités : authentification, gestion des départements, historique, etc.]

## 🛠️ Stack technique

**Frontend**
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

**Backend**
- [Node.js]

**Génération PDF**
- [Bibliothèque utilisée : pdfkit]

## ⚙️ Prérequis

- Node.js >= [version, ex: 18]
- npm ou yarn

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/Fiderana98/salary-managment.git
cd salary-managment

# Installer les dépendances
npm install
```

🔧 Configuration

Crée un fichier .env à la racine avec les variables suivantes :

```env
PORT=[port du backend]
DATABASE_URL=[url de la base de données]
JWT_SECRET=[clé secrète]
# ... autres variables
```

▶️ Lancement

```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Lancer le serveur backend
cd backend && npm install && npm start
```
