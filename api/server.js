const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'users.json');

app.use(cors());
app.use(express.json());

function readUsers() {
    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(data).users;
}

function writeUsers(users) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ users }, null, 2));
}

app.post('/api/register', async (req, res) => {
    try {
        const { prenom, nom, email, password, telephone, dateNaissance, adresse, codePostal, ville } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
        }

        const users = readUsers();

        const existing = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            prenom,
            nom,
            email,
            password: hashedPassword,
            telephone,
            dateNaissance,
            adresse,
            codePostal,
            ville,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ success: true, user: { id: newUser.id, email: newUser.email, prenom: newUser.prenom } });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, message: 'Compte introuvable.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                prenom: user.prenom
            }
        });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.listen(PORT, () => {
    console.log(`API Auto-Ecole en ligne sur http://localhost:${PORT}`);
});
