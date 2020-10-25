import { Entity , PrimaryKey, Property} from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Plan  {
  @Field(() => Int)
  @PrimaryKey()
  plan_id!: number;

  @Field(() => String)
  @Property()
  destination: string;

  @Field(() => String)
  @Property()
  numberOfDay: number;

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date;
}
