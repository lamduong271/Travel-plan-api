import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Plan } from "./Plan";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field({ nullable: true, defaultValue: '' })
  @Column({ nullable: true})
  firstName?: string;

  @Field({nullable: true, defaultValue: ''  })
  @Column({ nullable: true})
  lastName?: string;

  @Field()
  @Column({ unique: true})
  username!: string

  @Field()
  @Column()
  password!: string

  @Field()
  @Column({ unique: true, nullable: true})
  email!: string

  @OneToMany(() => Plan, plan => plan.planner)
  plans: Plan[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date;
}
