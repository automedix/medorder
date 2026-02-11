<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'carehome';
    
    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['role'] = 'admin';
            header('Location: admin.php');
            exit;
        }
    } else {
        $stmt = $pdo->prepare("SELECT * FROM care_homes WHERE email = ? AND is_active = true");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['role'] = 'carehome';
            header('Location: dashboard.php');
            exit;
        }
    }
    
    $error = 'Falsche Zugangsdaten';
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedOrder - Hausärzte im Grillepark</title>
    <link rel="stylesheet" href="custom.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #E8F4F8 0%, #F0F7FA 50%, #E0F0F5 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .login-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(139, 28, 63, 0.15);
            width: 100%;
            max-width: 450px;
            padding: 40px;
            border-top: 5px solid #8B1C3F;
        }
        
        .logo-section {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 2px solid #E8F4F8;
        }
        
        .logo-section h1 {
            color: #8B1C3F;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .logo-section .subtitle {
            color: #1E3A5F;
            font-size: 16px;
            font-weight: 400;
        }
        
        .logo-placeholder {
            width: 120px;
            height: 120px;
            background: #F0F4F8;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            border: 3px solid #8B1C3F;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #2C3E50;
            font-weight: 500;
            font-size: 14px;
        }
        
        input, select {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #E0E7EF;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s ease;
            background: #FAFBFC;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #8B1C3F;
            background: white;
            box-shadow: 0 0 0 3px rgba(139, 28, 63, 0.1);
        }
        
        button {
            width: 100%;
            padding: 16px;
            background: #8B1C3F;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }
        
        button:hover {
            background: #6B1530;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 28, 63, 0.3);
        }
        
        .error {
            background: #FDE8E8;
            color: #9B1C1C;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #9B1C1C;
            font-size: 14px;
        }
        
        .info-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid #E8F4F8;
            color: #6C757D;
            font-size: 13px;
        }
        
        .badge {
            display: inline-block;
            background: #1E3A5F;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 10px;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-section">
            <div class="logo-placeholder">🏥</div>
            <h1>Hausärzte im Grillepark</h1>
            <p class="subtitle">Bestellsystem für Verbandmaterial</p>
            <span class="badge">GESICHERTE VERBINDUNG</span>
        </div>
        
        <?php if (isset($error)): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label>Anmelden als</label>
                <select name="role" required>
                    <option value="carehome">Pflegeheim / Pflegedienst</option>
                    <option value="admin">Praxis-Admin</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>E-Mail-Adresse</label>
                <input type="email" name="email" placeholder="ihre@email.de" required>
            </div>
            
            <div class="form-group">
                <label>Passwort</label>
                <input type="password" name="password" placeholder="Ihr Passwort" required>
            </div>
            
            <button type="submit">Anmelden</button>
        </form>
        
        <div class="info-footer">
            <p>© 2025 Hausärzte im Grillepark</p>
            <p>Bei Problemen wenden Sie sich bitte an die Praxis</p>
        </div>
    </div>
</body>
</html>
