import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType()
@Entity()
export class Plan extends BaseEntity  {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

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

  @Field(() => Int, { nullable: true })
  voteStatus: number | null; // 1 -1 or null

  @Field()
  @Column()
  plannerId!: number

  @Field()
  @ManyToOne(() => User, user => user.plans)
  planner!: User;

  @OneToMany(() => Updoot, updoot => updoot.plan)
  updoots: Updoot[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date;
}
