const mysql = require('mysql2/promise');
require('dotenv').config();

// Define se usará a URL completa ou os parâmetros individuais
const poolConfig = process.env.DATABASE_URL 
    ? { uri: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mata_mosquito_db',
        port: Number(process.env.DB_PORT) || 3306,
    };

// Criação do Pool com gerenciamento automático de conexões
const pool = mysql.createPool({
    ...poolConfig,
    waitForConnections: true,
    connectionLimit: 10,           // Máximo de conexões simultâneas no pool
    queueLimit: 0,                 // Sem limite de fila para requisições
    enableKeepAlive: true,         // Evita desconexão por tempo inativo
    keepAliveInitialDelay: 10000,   // Delay de keep-alive (10 segundos)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Teste de conexão executado na inicialização
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco MySQL estabelecida com sucesso!');
        connection.release();
    } catch (error) {
        console.error('❌ Falha ao conectar no banco de dados MySQL:');
        console.error(`   Detalhe: ${error.message}`);
        console.error('   Verifique se o MySQL está rodando e as credenciais no .env estão corretas.');
    }
})();

module.exports = pool;