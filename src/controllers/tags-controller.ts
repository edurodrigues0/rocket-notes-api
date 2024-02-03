import { Request, Response } from "express"
import { knex } from "../database"
import { z } from "zod"


class TagsController {
  async index(request: Request, response: Response) {
    const indexQuerySchema = z.object({
      user_id: z.string().uuid()
    })

    const { user_id } = indexQuerySchema.parse(request.query)

    const tags = await knex("tags")
    .where({ user_id })

    return response.json(tags)
  }
}

export default TagsController