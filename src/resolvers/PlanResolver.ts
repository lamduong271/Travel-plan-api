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
    const queryBuilder = getConnection()
      .getRepository(Plan)
      .createQueryBuilder("plans")
      .orderBy("plans.createdAt", "DESC") // or ('"createdAt"')
      .take(realLimitPlusOne);
    if (cursor) {
      queryBuilder.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor))
      }); // return results where their's date is less than cursor
    }
    const allPlans = await queryBuilder.getMany();
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
}
