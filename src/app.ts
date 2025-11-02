import express, { NextFunction, Request, Response } from "express";
import cors from 'cors'
import router from "./routes";
import "dotenv/config";

const app = express();
//var session = require("express-session");

app.use(express.json());
app.use(cors());

app.use(router);

app.get('/', (req, res) => res.status(200).send('Rodando cadastro aqui!'));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  return res.status(500).json({ message: err.message});
  next();
})

export default app;