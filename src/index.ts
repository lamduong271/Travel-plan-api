import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
import { PlanResolver } from "./resolvers/PlanResolver";
import { ___prod___, COOKIE_NAME } from "./constant";
// import { Plan } from "./entities/Plan";
import { UserResolver } from "./resolvers/UserResolver";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Plan } from "./entities/Plan";
import { User } from "./entities/User";
import { Updoot } from "./entities/Updoot";
const main = async () => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  const connect = await createConnection({
    type: "postgres",
    database: "travel_plan_database",
    username: "postgres",
    password: "lamduong271",
    logging: true,
    synchronize: true,
    entities: [Plan, User, Updoot],
  });
  // const plan = orm.em.create(Plan, { destination: 'Espoo', numberOfDay: 2})
  // // insert plan to database
  // await orm.em.persistAndFlush(plan)
  // const plans = await orm.em.find(Plan, {})

  //Express
  const app = express();
  //Apollo server

  //Session save, session run before apollo middleware
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  const cors = require("cors");
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true // keep the session forever
      }), // telling express that we using redis
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true, // security reason, frontend code can not access
        secure: ___prod___, // cookie only work in https
        sameSite: "lax" // csrf
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PlanResolver, HelloWorldResolver, UserResolver],
      validate: false
    }),
    // access session inside resolver
    context: ({ req, res }) => ({ req, res, redis })
  });

  apolloServer.applyMiddleware({
    app,
    cors: false
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });
};

main().catch(err => {
  console.log(err);
});

// const apolloServer = new ApolloServer({
//   schema: await buildSchema({
//     resolvers: [HelloWorldResolver, PlanResolver ],
//     validate: true
//   }),
//   context: ({ req, res }) => ({ req, res })
// });

// apolloServer.applyMiddleware({ app, cors: false });
