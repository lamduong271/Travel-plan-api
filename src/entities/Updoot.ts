import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Plan } from "./Plan";
import { User } from "./User";

// many to many (m to n)
//user <-> plan : many user can vote 1 plan, and many plan can be voted by same user
// user -> join table <- plans
// user -> updoots <- plans


@ObjectType()
@Entity()
export class Updoot extends BaseEntity  {
  @Column({ type: "int"})
  value: number;

  @PrimaryColumn()
  voterId!: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.updoots)
  voter!: User;

  @PrimaryColumn()
  planId!: number

  @ManyToOne(() => Plan, plan => plan.updoots)
  plan!: Plan;
}
