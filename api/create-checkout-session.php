<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../vendor/autoload.php';

// Clé secrète Stripe
\Stripe\Stripe::setApiKey('sk_live_51SkVGxLjYD14AaLVmk_1T6yPJLjYD14AaLVWa7TI3kW');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $quantity = $input['quantity'] ?? 0;
    $amount = $input['amount'] ?? 0;
    $userEmail = $input['userEmail'] ?? '';
    $userName = $input['userName'] ?? '';
    $productName = $input['productName'] ?? 'Heures de conduite';
    
    if ($quantity <= 0 || $amount <= 0 || empty($userEmail)) {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }
    
    // Créer une session Stripe Checkout
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'eur',
                'product_data' => [
                    'name' => $productName,
                    'description' => "Achat de $quantity heure(s) de conduite supplémentaire(s)",
                ],
                'unit_amount' => $amount * 100, // Stripe utilise les centimes
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => 'https://autoecolebreteuil.com/espace-eleve.html?payment_success=true',
        'cancel_url' => 'https://autoecolebreteuil.com/espace-eleve.html?payment_success=false',
        'customer_email' => $userEmail,
        'metadata' => [
            'user_email' => $userEmail,
            'user_name' => $userName,
            'hours_quantity' => $quantity,
            'product_type' => 'additional_hours'
        ]
    ]);
    
    echo json_encode(['id' => $session->id]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
