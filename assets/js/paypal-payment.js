// Gestion du paiement PayPal avec paiement en plusieurs fois

class PayPalPayment {
  constructor() {
    this.paypalLoaded = false;
    this.currentOrderId = null;
  }

  // Charger le SDK PayPal
  async loadPayPalSDK(clientId) {
    if (this.paypalLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=fr_FR&enable-funding=paylater&disable-funding=card`;
      script.onload = () => {
        this.paypalLoaded = true;
        console.log('✅ PayPal SDK chargé');
        resolve();
      };
      script.onerror = () => reject(new Error('Erreur de chargement du SDK PayPal'));
      document.head.appendChild(script);
    });
  }

  // Créer les boutons PayPal
  async renderButtons(containerId, amount, description, userEmail, userName, onSuccess, onError) {
    if (!this.paypalLoaded) {
      throw new Error('PayPal SDK non chargé');
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} introuvable`);
    }

    // Vider le container
    container.innerHTML = '';

    // Appliquer les frais de 3% pour le paiement en plusieurs fois
    const feeRate = 1.03;  // +3%
    const totalWithFees = Math.round(amount * feeRate);

    // Créer les boutons PayPal
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45,
      },

      // Créer la commande
      createOrder: async () => {
        try {
          const response = await fetch('/.netlify/functions/paypal-create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: parseFloat(totalWithFees),
              description: description,
              userEmail: userEmail,
              userName: userName,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la création de la commande');
          }

          this.currentOrderId = data.orderId;
          console.log('✅ Commande PayPal créée:', data.orderId);
          return data.orderId;
        } catch (error) {
          console.error('Erreur création commande:', error);
          if (onError) onError(error);
          throw error;
        }
      },

      // Approuver le paiement
      onApprove: async (data) => {
        try {
          console.log('💳 Paiement approuvé, capture en cours...');

          const response = await fetch('/.netlify/functions/paypal-capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });

          const captureData = await response.json();

          if (!response.ok) {
            throw new Error(captureData.error || 'Erreur lors de la capture du paiement');
          }

          console.log('✅ Paiement capturé:', captureData);

          if (onSuccess) {
            onSuccess({
              orderId: data.orderID,
              captureId: captureData.captureId,
              payerEmail: captureData.payerEmail,
              amount: captureData.amount,
              status: captureData.status,
            });
          }
        } catch (error) {
          console.error('Erreur capture:', error);
          if (onError) onError(error);
        }
      },

      // Annulation
      onCancel: (data) => {
        console.log('❌ Paiement annulé par l\'utilisateur');
        if (onError) {
          onError(new Error('Paiement annulé'));
        }
      },

      // Erreur
      onError: (err) => {
        console.error('❌ Erreur PayPal:', err);
        if (onError) onError(err);
      },
    }).render(`#${containerId}`);

    console.log('✅ Boutons PayPal rendus');
  }

  // Obtenir le Client ID depuis le serveur (pour ne pas l'exposer)
  async getClientId() {
    try {
      const response = await fetch('/.netlify/functions/paypal-config');
      const data = await response.json();
      return data.clientId;
    } catch (error) {
      console.error('Erreur récupération config PayPal:', error);
      throw error;
    }
  }
}

// Export pour utilisation
window.PayPalPayment = PayPalPayment;
