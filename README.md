# AutoÉcole Pro - Site Web

Site internet moderne pour une auto-école, inspiré des meilleures pratiques du secteur.

## 🚗 Fonctionnalités

### Pages principales
- **Accueil** : Hero moderne, présentation des services, témoignages
- **Tarifs** : Packs détaillés, services à la carte, FAQ
- **Inscription** : Formulaire multi-étapes avec sélection de pack
- **Contact** : Formulaire de contact, informations pratiques

### Caractéristiques
- ✅ Design moderne et responsive
- ✅ Navigation intuitive avec menu mobile
- ✅ Animations fluides et interactions
- ✅ Formulaires avec validation
- ✅ Système de packs modulables
- ✅ Interface utilisateur optimisée

## 🎨 Design

### Palette de couleurs
- **Primaire** : Orange (#FF6B35) - Dynamisme et énergie
- **Secondaire** : Bleu marine (#004E89) - Confiance et professionnalisme
- **Accent** : Jaune (#FFD23F) - Attention et optimisme
- **Succès** : Vert (#06D6A0) - Validation

### Typographie
- Police principale : Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- Police titres : Arial, sans-serif

## 📁 Structure du projet

```
auto-ecole-site/
├── index.html              # Page d'accueil
├── inscription.html        # Formulaire d'inscription
├── tarifs.html            # Page des tarifs
├── contact.html           # Page de contact
├── README.md              # Documentation
└── assets/
    ├── css/
    │   ├── style.css      # Styles principaux
    │   └── forms.css      # Styles des formulaires
    └── js/
        ├── main.js        # JavaScript principal
        ├── inscription.js # Logique d'inscription
        ├── tarifs.js      # Logique des tarifs
        └── contact.js     # Logique de contact
```

## 🚀 Démarrage rapide

1. Ouvrir `index.html` dans un navigateur web
2. Aucune installation requise - site 100% statique
3. Pour un serveur local :
   ```bash
   # Avec Python 3
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   ```

## 📱 Responsive

Le site est entièrement responsive et optimisé pour :
- 📱 Mobile (< 768px)
- 💻 Tablette (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🎯 Packs proposés

### Permis Zen - 599€
- Code de la route en ligne
- 20 heures de conduite
- Accès application mobile
- Suivi personnalisé

### Permis Premium - 799€ ⭐
- Tout du pack Zen
- Examen sous 30 jours
- Priorité de réservation
- Support prioritaire

### Permis Accéléré - 999€
- Tout du pack Premium
- Formation en 30 jours
- Planning intensif
- Coach personnel

## 🔧 Personnalisation

### Modifier les couleurs
Éditer les variables CSS dans `assets/css/style.css` :
```css
:root {
    --primary-color: #FF6B35;
    --secondary-color: #004E89;
    --accent-color: #FFD23F;
    /* ... */
}
```

### Modifier les tarifs
Éditer l'objet `packPrices` dans `assets/js/inscription.js` :
```javascript
const packPrices = {
    zen: 599,
    premium: 799,
    accelere: 999
};
```

## 📧 Contact

Pour toute question ou suggestion :
- Email : contact@autoecolepro.fr
- Téléphone : 01 23 45 67 89

## 📄 Licence

© 2024 AutoÉcole Pro. Tous droits réservés.

## 🎓 Crédits

- Icônes : Font Awesome 6.4.0
- Inspiration design : Stych.fr
- Développement : Cascade AI

## 🔜 Améliorations futures

- [ ] Système de réservation en ligne
- [ ] Espace élève sécurisé
- [ ] Intégration paiement en ligne
- [ ] Application mobile native
- [ ] Suivi de progression en temps réel
- [ ] Plateforme de révision du code
- [ ] Système de notation des moniteurs
- [ ] Chat en direct avec support
