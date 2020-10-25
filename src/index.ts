import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
import { PlanResolver } from "./resolvers/PlanResolver";
import { MikroORM } from '@mikro-orm/core'
import { ___prod___ } from "./constant";
import { Plan } from "./entities/Plan";
import microConfig from './mikro-orm.config'

  const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up()
    const plan = orm.em.create(Plan, { destination: 'Espoo', numberOfDay: 2})
    // // insert plan to database
    // await orm.em.persistAndFlush(plan)
    // const plans = await orm.em.find(Plan, {})


    const options = await getConnectionOptions(
      process.env.NODE_ENV || "development"
    );
    await createConnection({ ...options, name: "default" });
    //Express
    const app = express();
    //Apollo server

    const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PlanResolver, HelloWorldResolver ],
      validate: true
    }),
    context: ({ em: orm.em })
  });

  apolloServer.applyMiddleware({ app, cors: false });

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`server started at http://localhost:${port}/graphql`);
    });
  };


  main().catch((err) => {
    console.log(err)
  }) ;

  // const apolloServer = new ApolloServer({
  //   schema: await buildSchema({
  //     resolvers: [HelloWorldResolver, PlanResolver ],
  //     validate: true
  //   }),
  //   context: ({ req, res }) => ({ req, res })
  // });

  // apolloServer.applyMiddleware({ app, cors: false });

