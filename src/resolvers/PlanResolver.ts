import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Int,
  Mutation,
  UseMiddleware,
  InputType,
  Field,
  ObjectType
} from "type-graphql";
import { Plan } from "../entities/Plan";
import { MyContext } from "src/types";
import { isAuth } from "../database/middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";

@ObjectType()
class PaginatedPlans {
  @Field(() => [Plan])
  plans: Plan[];

  @Field()
  hasMore: boolean;
}

@InputType()
class PlanInputType {
  @Field()
  destination: string;

  @Field()
  numberOfDay: number;
}

@Resolver()
export class PlanResolver {
  @Query(() => PaginatedPlans)
  async getAllPlans(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null // cursor is to set results where there is some condition
  ): Promise<PaginatedPlans> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    // for example if user wanna ask for 10 plans but we actually fetching 11 plans
    //if we have more than 11 => more plans to show, less than 11, then no more to show

    const replacements : any[] = [realLimitPlusOne]
    if(cursor) {
      replacements.push(new Date(parseInt(cursor)))
    }
    const allPlans = await getConnection().query( //json. ... is to tell stuff I wanna be inside the object: planner: { username: 'lam1' }
      `
        select p.*,
        json_build_object(
          'username', u.username,
          'id', u.id,
          'email', u.email
        ) planner
        from plan p
        inner join public.user u on u.id = p."plannerId"
        ${cursor ? `where p."createdAt" < $2`: ''}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    )
    console.log("plannnn ", allPlans)

    // const queryBuilder = getConnection()
    //   .getRepository(Plan)
    //   .createQueryBuilder("plans")
    //   .innerJoinAndSelect(
    //     "plans.planner",
    //     "user",
    //     'user.id = plan."plannerId"'
    //   )
    //   .orderBy('plans."createdAt"', "DESC") // or ('"createdAt"')
    //   .take(realLimitPlusOne);
    // if (cursor) {
    //   queryBuilder.where('plans."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor))
    //   }); // return results where their's date is less than cursor
    // }
    // const allPlans = await queryBuilder.getMany();
    return {
      plans: allPlans.slice(0, realLimitPlusOne),
      hasMore: allPlans.length === realLimitPlusOne
    };
  }

  @Query(() => Plan)
  getPlanById(
    @Arg("id", () => Int) id: number
  ): Promise<Plan | undefined> {
    return Plan.findOne(id);
  }

  @Mutation(() => Plan)
  @UseMiddleware(isAuth)
  async createPlan(
    @Arg("inputPlan", () => PlanInputType) inputPlan: PlanInputType,
    @Ctx() { req }: MyContext
  ): Promise<Plan> {
    return Plan.create({
      ...inputPlan,
      plannerId: req.session.userId
    }).save();
  }

  @Mutation(() => Plan, { nullable: true })
  async updatePlan(
    @Arg("id", () => Int) id: number,
    @Arg("destination", () => String, { nullable: true }) destination: string,
    @Arg("numberOfDay", () => Int, { nullable: true }) numberOfDay: number
  ): Promise<Plan | null> {
    const updatedPlan = await Plan.findOne(id);
    if (!updatedPlan) {
      return null;
    }
    updatedPlan.destination = destination || updatedPlan.destination;
    updatedPlan.numberOfDay = numberOfDay || updatedPlan.numberOfDay;
    await Plan.update({ id }, updatedPlan);
    return updatedPlan;
  }

  @Mutation(() => Boolean)
  async deletePlan(
    @Arg("id", () => Int) id: number
  ): Promise<boolean> {
    const plan = await Plan.findOne(id);
    if (!plan) {
      return false;
    }
    try {
      await Plan.delete(id);
    } catch {
      return false;
    }
    return true;
  }

  // Updoot related mutation
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('planId', () => Int) planId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const voterId = req.session.userId
    const isUpdoot = value !== -1
    const realValue = isUpdoot ? 1 : -1
    // await Updoot.insert({
    //   voterId,
    //   planId,
    //   value: realValue,
    // })
    await getConnection().query(
      `
      START TRANSACTION;

      INSERT INTO updoot("voterId", "planId", "value") VALUES (${voterId}, ${planId}, ${realValue});

      update plan
      set "voteUp" = "voteUp" + ${realValue}
      where id = ${planId};

      COMMIT;
      `
    )
    return true
  }
}
