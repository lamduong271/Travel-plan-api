import {
  InputType,
  Field
} from "type-graphql";


@InputType()
export class UsernamePasswordInput {
  @Field({ nullable: true, defaultValue: "" })
  firstName?: string;

  @Field({ nullable: true, defaultValue: "" })
  lastName?: string;

  @Field()
  username: string;

  @Field()
  password: string;

  @Field()
  email: string;
}
