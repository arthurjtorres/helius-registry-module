import app from "./app";
import "dotenv/config";
import "./database/connection";

const PORT = +(process.env.PORT_API_CADASTRO || 3000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend 'CADASTRO' acessível em todas as interfaces na porta ${PORT}`);
});
