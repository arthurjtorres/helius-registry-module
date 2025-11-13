import app from "./app";
import "dotenv/config";
import './database/connection';

const PORT = process.env.PORT_API_CADASTRO || 2000;

app.listen(PORT, () => {
  console.log(`API Cadastro rodando na porta ${PORT}`);
});
