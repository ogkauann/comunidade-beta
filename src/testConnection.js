const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexão com MongoDB estabelecida com sucesso!');
    
    // Listar todas as coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nColeções existentes:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection(); 