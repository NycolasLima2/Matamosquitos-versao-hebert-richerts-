// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do frontend da pasta /public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 1. ENDPOINT GET /api/ranking
 * Retorna os 10 melhores pontuados (com filtro opcional por dificuldade)
 */
app.get('/api/ranking', async (req, res) => {
    try {
        const { dificuldade } = req.query;

        let query = `
            SELECT 
                id,
                nome_jogador,
                pontuacao,
                dificuldade,
                tempo_segundos,
                DATE_FORMAT(data_partida, '%d/%m/%Y %H:%i') AS data_formatada
            FROM ranking
        `;
        const queryParams = [];

        if (dificuldade && ['facil', 'normal', 'dificil', 'chuck_norris'].includes(dificuldade)) {
            query += ` WHERE dificuldade = ?`;
            queryParams.push(dificuldade);
        }

        query += ` ORDER BY pontuacao DESC, tempo_segundos DESC LIMIT 10`;

        const [rows] = await db.query(query, queryParams);

        res.json({
            sucesso: true,
            total: rows.length,
            dados: rows
        });
    } catch (error) {
        console.error('❌ Erro ao buscar ranking:', error.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno no servidor ao consultar o ranking.'
        });
    }
});

/**
 * 2. ENDPOINT POST /api/ranking
 * Registra a pontuação de uma nova partida jogada
 */
app.post('/api/ranking', async (req, res) => {
    try {
        const { nome_jogador, pontuacao, dificuldade, tempo_segundos } = req.body;

        if (!nome_jogador || pontuacao === undefined || !dificuldade || tempo_segundos === undefined) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Campos obrigatórios: nome_jogador, pontuacao, dificuldade, tempo_segundos.'
            });
        }

        const dificuldadesPermitidas = ['facil', 'normal', 'dificil', 'chuck_norris'];
        if (!dificuldadesPermitidas.includes(dificuldade)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Dificuldade inválida. Opções: ${dificuldadesPermitidas.join(', ')}.`
            });
        }

        const nomeSanitizado = String(nome_jogador).trim().substring(0, 50);
        const pontuacaoNum = parseInt(pontuacao, 10);
        const tempoNum = parseInt(tempo_segundos, 10);

        if (isNaN(pontuacaoNum) || isNaN(tempoNum) || pontuacaoNum < 0 || tempoNum < 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Valores numéricos inválidos.'
            });
        }

        const sql = `
            INSERT INTO ranking (nome_jogador, pontuacao, dificuldade, tempo_segundos)
            VALUES (?, ?, ?, ?)
        `;

        const [resultado] = await db.query(sql, [
            nomeSanitizado,
            pontuacaoNum,
            dificuldade,
            tempoNum
        ]);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Pontuação salva com sucesso!',
            id: resultado.insertId
        });
    } catch (error) {
        console.error('❌ Erro ao salvar pontuação:', error.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno ao salvar a pontuação.'
        });
    }
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor executando em: http://localhost:${PORT}`);
});