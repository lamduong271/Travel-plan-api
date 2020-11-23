import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Plan extends BaseEntity  {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  plan_id!: number;

  @Field(() => String, { nullable: false })
  @Column({nullable: false})
  destination!: string;

  @Field()
  @Column()
  numberOfDay!: number;

  @Field()
  @Column({ type: 'int', default: 0})
  voteUp!: number

  @Field()
  @Column({ type: 'int', default: 0})
  voteDown!: number

  @Field()
  @Column()
  plannerId!: number

  @ManyToOne(() => User, user => user.plans)
  planner!: User;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date;
}
