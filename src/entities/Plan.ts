import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Plan extends BaseEntity  {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  plan_id!: number;

  @Field(() => String)
  @Column()
  destination!: string;

  @Field(() => Int)
  @Column()
  numberOfDay!: number;

  @Field()
  @Column()
  plannerId: number

  @ManyToOne(() => User, user => user.plans)
  planner: User;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date;
}
