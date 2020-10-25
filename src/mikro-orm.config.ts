import { ___prod___ } from "./constant";
import { Plan } from "./entities/Plan";
import { MikroORM } from '@mikro-orm/core'
import path from 'path'
export default {
  migrations: {
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Plan],
  user: 'lamduong271',
  password: 'lamduong271',
  dbName: 'travel_plan_database',
  host:'localhost',
  port:5432,
  debug: !___prod___,
  type:'postgresql',
} as Parameters<typeof MikroORM.init>[0];  // for type specific