import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Plan } from "./Plan";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  age: number;

  @Field(() => [Plan])
  @Column()
  plan?: [Plan]
}
