import {
  Query,
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import { User } from "../entities/User";

@InputType()
class UsernamePasswordInput {
  @Field({ nullable: true, defaultValue: "" })
  firstName?: string;

  @Field({ nullable: true, defaultValue: "" })
  lastName?: string;

  @Field()
  username: string;

  @Field()
  password: string;
}

@InputType()
class LoginInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  error?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hi!";
  }

  @Query(() => User, { nullable: true })
  async loginMe(
    @Ctx() { req, em }: MyContext
  ) {
    if (!req.session.userId) {
      return null
    }

    const loginUser = await em.findOne(User, { id: req.session.userId})
    return loginUser
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("data", () => UsernamePasswordInput) data: UsernamePasswordInput,
    @Ctx() { req, em }: MyContext
  ): Promise<UserResponse> {
    // const existUser = await em.findOne(User, { username: data.username })
    // if(existUser) {
    //   return {
    //     error: [{
    //       field: 'username',
    //       message: 'username already exist'
    //     }]
    //   }
    // }
    if (data.username.length <= 2) {
      return {
        error: [
          {
            field: "username",
            message: "length must be more than 2"
          }
        ]
      };
    }
    if (data.password.length <= 2) {
      return {
        error: [
          {
            field: "password",
            message: "length must be more than 2"
          }
        ]
      };
    }
    const hashedPassword = await argon2.hash(data.password);
    const newUser = em.create(User, {
      username: data.username,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    try {
      await em.persistAndFlush(newUser);
    } catch (err) {
      if (err.code === "23505") {
        return {
          error: [
            {
              field: "username",
              message: "username already exist"
            }
          ]
        };
      }
    }

    //login user -> session
    req.session.userId = newUser.id
    return {
      user: newUser
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("data", () => LoginInput) data: LoginInput,
    @Ctx() { em, req }: MyContext
  ) {
    const loginUser = await em.findOne(User, { username: data.username });
    if (!loginUser) {
      return {
        error: [
          {
            field: "username",
            message: "not exist"
          }
        ]
      };
    }
    const validPassword = await argon2.verify(
      loginUser.password,
      data.password
    );
    if (!validPassword) {
      return {
        error: [
          {
            field: "password",
            message: "incorrect password"
          }
        ]
      };
    }
    req.session!.userId = loginUser.id
    return {
      user: loginUser
    };
  }
}
