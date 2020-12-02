import {
  Query,
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  FieldResolver,
  Root
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import { User } from "../entities/User";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constant";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../untils/validateRegister";
import { sendEmail } from "../untils/sendEmail";
import { v4 } from "uuid"; // random string from uuid
import { getConnection } from "typeorm";

// @InputType()
// class LoginInput {
//   @Field()
//   username: string;

//   @Field()
//   password: string;
// }

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
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() {req}: MyContext) {
    //this is the current user so it's ok to show them their email
    if(req.session.userId === user.id) {
      return user.email
    }
    return ''
  }

  @Query(() => User, { nullable: true })
  loginMe(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("data", () => UsernamePasswordInput) data: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(data);
    if (errors) {
      return { errors };
    }
    let newUser;
    const hashedPassword = await argon2.hash(data.password);
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: data.username,
          password: hashedPassword,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName
        })
        .returning("*")
        .execute();
      newUser = result.raw[0];
    } catch (err) {
      console.log(err);
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already exist"
            }
          ]
        };
      }
    }

    //register user -> set a cookie on user and keep them logged in
    req.session.userId = newUser.id;
    return {
      user: newUser
    };
  }

  @Mutation(() => UserResponse)
  async login(
    // @Arg("data", () => LoginInput) data: LoginInput,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ) {
    const loginUser = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!loginUser) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "not exist"
          }
        ]
      };
    }
    const validPassword = await argon2.verify(loginUser.password, password);
    if (!validPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password"
          }
        ]
      };
    }
    req.session!.userId = loginUser.id;
    return {
      user: loginUser
    };
  }

  @Mutation(() => Boolean)
  logoutUser(@Ctx() { req, res }: MyContext) {
    return new Promise(result =>
      req.session.destroy(err => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          result(false);
          return;
        }
        result(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const findUserByEmail = await User.findOne({ where: { email } });
    if (!findUserByEmail) {
      return true;
    }
    const token = v4(); // random string
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      findUserByEmail.id,
      "ex",
      1000 * 60 * 60 * 3
    ); // 3days
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "new password 's length must be more than 2"
          }
        ]
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key); // got the user's id
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired"
          }
        ]
      };
    }

    const updatingUser = await User.findOne({ id: parseInt(userId) });
    if (!updatingUser) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists"
          }
        ]
      };
    }

    await User.update(
      { id: parseInt(userId) },
      { password: await argon2.hash(newPassword) }
    );
    await redis.del(key); // delete token
    // login user after changing password
    req.session.userId = updatingUser.id;
    return { user: updatingUser };
  }
}
