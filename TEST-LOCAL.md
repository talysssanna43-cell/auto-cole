# 🧪 Guide de test en local

## Démarrer un serveur local

### Option 1 : Avec Python (Recommandé)
```bash
# Ouvre un terminal dans le dossier du projet
cd c:\Users\lenovo\CascadeProjects\auto-ecole-site

# Lance le serveur
python -m http.server 8000
```

Puis ouvre : **http://localhost:8000/espace-eleve.html**

### Option 2 : Avec Node.js
```bash
# Installe http-server (une seule fois)
npm install -g http-server

# Lance le serveur
http-server -p 8000
```

Puis ouvre : **http://localhost:8000/espace-eleve.html**

### Option 3 : Avec l'extension VS Code "Live Server"
1. Installe l'extension "Live Server" dans VS Code
2. Clic droit sur `espace-eleve.html`
3. Sélectionne "Open with Live Server"

---

## ⚠️ IMPORTANT : Le problème actuel

Le système de paiement fonctionne mais tu es bloqué car :
- Tu utilises les **clés LIVE** de Stripe (production)
- Tu essaies avec une **carte TEST** (4242 4242 4242 4242)
- Stripe refuse car on ne peut pas utiliser une carte test en production

## ✅ Solutions :

### Solution A : Sortir de la page Stripe
1. Clique sur "← Retour" en haut à gauche
2. OU ferme l'onglet
3. Retourne sur ton espace élève

### Solution B : Tester avec une vraie carte
- Utilise une vraie carte bancaire
- Le paiement sera réel (tu seras débité)
- Tu pourras rembourser depuis le Dashboard Stripe

### Solution C : Passer en mode TEST (Recommandé)
1. Va dans Netlify → Environment variables
2. Change `STRIPE_SECRET_KEY` par ta clé TEST : `sk_test_xxxxx`
3. Redéploie le site
4. Teste avec la carte 4242 4242 4242 4242

---

## 🎯 Pour l'instant

**Le système fonctionne parfaitement !** 
Tu es juste bloqué parce que tu utilises une carte test en production.

**Pour sortir :**
- Ferme l'onglet Stripe
- Retourne sur autoecolebreteuil.com/espace-eleve.html
