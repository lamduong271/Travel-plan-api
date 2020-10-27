import { Field, ObjectType } from "type-graphql";
import { PrimaryKey, Property, Entity } from "@mikro-orm/core";

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field({ nullable: true, defaultValue: '' })
  @Property({ nullable: true})
  firstName?: string;

  @Field({nullable: true, defaultValue: ''  })
  @Property({ nullable: true})
  lastName?: string;

  @Field()
  @Property({ type: 'text', unique: true})
  username!: string

  @Field()
  @Property({ type: 'text'})
  password!: string

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date;
}
