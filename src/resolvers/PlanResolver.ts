import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { Plan } from "../entities/Plan";
import { MyContext } from "src/types";

// @InputType()
// class PlanInputType {
//   @Field()
//   destination: string

//   @Field(() => Int)
//   numberOfDay: number
// }

// @InputType()
// class PlanInputUpdateType {
//   @Field(() => String, { nullable: true })
//   destination?: string

//   @Field(() => Int, { nullable: true })
//   numberOfDay?: number
// }

@Resolver()
export class PlanResolver {
  // @Mutation(() => Plan)
  // async createPlan(
  //   @Arg('planParams', () => PlanInputType) planParams: PlanInputType,
  // ) {
  //   const plan = await Plan.create(planParams).save()
  //   return plan
  // }

  // @Mutation(()=> Plan)
  // async updatePlan(
  //   @Arg('id') id: number,
  //   @Arg('newParam', () => PlanInputUpdateType) newParams: PlanInputUpdateType
  // ) {
  //   await Plan.update({ id }, newParams)
  //   return Plan.findOne({id})
  // }

  // @Mutation(() => Plan)
  // async deletePlan(
  //   @Arg('id', () => Int) id: number
  // ) {
  //   await Plan.delete({id})
  //   return true
  // }

  @Query(() => [Plan])
  getAllPlans(
    //context
    @Ctx() { em }: MyContext
  ): Promise<Plan[]> {
    return em.find(Plan, {});
  }

  @Query(() => Plan)
  getPlanById (
    @Ctx() { em }: MyContext,
    @Arg('plan_id', () => Int ) plan_id: number,
  ): Promise<Plan | null> {
    return em.findOne(Plan, { plan_id });
  }

  @Mutation(() => Plan)
  async createPlan(
    @Ctx() { em }: MyContext,
    @Arg('destination', () => String) destination: string,
    @Arg('numberOfDay', () => Int) numberOfDay: number,
  ) {
    const newPlan = em.create(Plan, { destination, numberOfDay})
    await em.persistAndFlush(newPlan)
    return newPlan
  }
}
