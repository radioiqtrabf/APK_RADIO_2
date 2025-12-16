# RADIO IQRA BF

Application web de radio simple et robuste pour écouter Radio IQRA BF en ligne.

## Fonctionnalités

- **Lecteur Audio Unique** : Interface simple et accessible.
- **Support Multi-Stream** : Bascule automatiquement entre plusieurs liens de streaming (M3U, PLS, Direct) en cas de panne.
- **Design Responsive** : Adapté aux mobiles et aux ordinateurs.
- **Indicateur de Statut** : Affiche clairement si la radio est en direct ou hors ligne.

## Installation Locale

1.  Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé.
2.  Clonez ce projet ou téléchargez les fichiers.
3.  Ouvrez un terminal dans le dossier du projet `radio-iqra-bf`.
4.  Installez les dépendances :
    ```bash
    cd server
    npm install
    ```
5.  Lancez le serveur :
    ```bash
    npm start
    ```
6.  Ouvrez votre navigateur sur `http://localhost:3000`.

## Déploiement sur Netlify (Recommandé)

Ce projet est optimisé pour un déploiement statique ultra-rapide sur Netlify.

1.  Connectez votre dépôt GitHub à Netlify.
2.  Netlify détectera automatiquement le fichier `netlify.toml`.
3.  **Publish directory** : `public` (Détecté automatiquement).
4.  Cliquez sur **Deploy**.

C'est tout ! Votre radio sera en ligne en quelques secondes.

## Installation Locale (Développement)

1.  Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé.
2.  Clonez ce projet.
3.  Allez dans le dossier `server` : `cd server`.
4.  Installez les dépendances : `npm install`.
5.  Lancez le serveur : `npm start`.
6.  Ouvrez `http://localhost:3000`.

## Structure du Projet

```
radio-iqra-bf/
├── server/
│   ├── server.js       # Serveur de développement local
│   └── package.json    # Dépendances Node.js
│
├── public/
│   ├── index.html      # Page principale
│   ├── style.css       # Styles
│   ├── script.js       # Logique (Lit streams.json)
│   └── streams.json    # Liste des flux (Configuration statique)
│
├── netlify.toml        # Configuration de déploiement Netlify
└── README.md
```

## Technologies

- HTML5 / CSS3 / JavaScript Vanilla
- Node.js / Express
